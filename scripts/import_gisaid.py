#!/usr/bin/env python3
"""
InfectoNET — GISAID import script
===================================
Imports GISAID EpiFlu / EpiArbo / EpiCoV / EpiRSV / EpiPox downloads
into MongoDB, mapping GISAID's XLS/CSV/TSV metadata to our standard schema.

Usage:
  python3 scripts/import_gisaid.py <file> --virus <organism>

  <file>    Path to the downloaded GISAID file (.xls, .xlsx, .csv, .tsv)
  --virus   One of: avianflu, influenza, influenzab, zika, chikungunya,
            westnile, yellowfever, oropouche, crimean, riftvalley,
            covid19, rsv, mpox, dengue, hantavirus, nipah

Examples:
  python3 scripts/import_gisaid.py data/gisaid/h5n1.xls --virus avianflu
  python3 scripts/import_gisaid.py data/gisaid/h3n2.xls --virus influenza
  python3 scripts/import_gisaid.py data/gisaid/dengue.csv --virus dengue

File should be placed in:   data/gisaid/<anything>.<ext>
"""
import argparse, os, re, sys
from datetime import datetime
from pathlib import Path
import pymongo
from pymongo import MongoClient, UpdateOne

MONGO_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
client = MongoClient(MONGO_URI)


# ── helpers ───────────────────────────────────────────────────────────────────

def log(msg): print(f"[{datetime.now():%H:%M:%S}] {msg}", flush=True)

def parse_year(raw):
    if not raw: return None
    s = str(raw).strip()
    # GISAID dates: "2024-05-21", "2024-05", "2024", "May-2024", "21.05.2024"
    for pat in [r'^(\d{4})-', r'^(\d{4})$', r'(\d{4})$']:
        m = re.search(pat, s)
        if m:
            y = int(m.group(1))
            return y if 1900 <= y <= 2100 else None
    return None

def parse_month(raw):
    if not raw: return None
    s = str(raw).strip()
    m = re.search(r'^\d{4}-(\d{2})', s)
    if m:
        mo = int(m.group(1))
        return mo if 1 <= mo <= 12 else None
    return None

def coerce_str(v):
    return str(v).strip() if v is not None and str(v).strip() not in ('', 'nan', 'None', 'unknown', '-', 'N/A') else ''

# Column name aliases — GISAID changes column names across versions
# We try each alias in order and use the first one found.
COL_ALIASES = {
    # accession / isolate ID
    'accession': ['Isolate_Id', 'Accession_ID', 'accession_id', 'EPI_ISL',
                  'Virus_name', 'isolate_id', 'gisaid_epi_isl', 'accession'],
    # strain name
    'strain':    ['Isolate_Name', 'Virus_Name', 'strain', 'name',
                  'virus_name', 'isolate_name', 'Strain'],
    # collection date
    'date':      ['Collection_Date', 'collection_date', 'date', 'Date',
                  'Sampling_Date', 'sampling_date'],
    # geographic location
    'location':  ['Location', 'location', 'Country', 'country',
                  'geo_loc_name', 'Geographic_Location', 'geographic_location'],
    # host
    'host':      ['Host', 'host', 'Host_Species', 'host_species',
                  'Host_Common_Name', 'patient_status'],
    # subtype / serotype / lineage
    'subtype':   ['Subtype', 'subtype', 'H_N_Subtype', 'Serotype', 'serotype',
                  'Type_Subtype', 'Flu_Type'],
    'lineage':   ['Lineage', 'lineage', 'Clade', 'clade', 'Pango_lineage',
                  'pango_lineage', 'AA_Substitutions', 'NextClade_pango'],
    'type':      ['Type', 'type', 'Flu_Type', 'Influenza_Type'],
    'segment':   ['Segment', 'segment'],
}

def find_col(headers, field):
    """Return the actual header name for a logical field, or None."""
    for alias in COL_ALIASES.get(field, []):
        if alias in headers:
            return alias
        # case-insensitive fallback
        for h in headers:
            if h.lower() == alias.lower():
                return h
    return None

def extract_country(location_str: str) -> str:
    """
    GISAID location format: "North America / USA / California"
    or                       "Asia / China / Guangdong"
    We want the second token (country), or the whole string if only one part.
    """
    if not location_str:
        return ''
    parts = [p.strip() for p in location_str.split('/')]
    if len(parts) >= 2:
        return parts[1]
    return parts[0]


# ── file reader ───────────────────────────────────────────────────────────────

def read_file(path: Path) -> tuple[list[str], list[dict]]:
    """Return (headers, rows) from XLS/XLSX/CSV/TSV file."""
    ext = path.suffix.lower()
    if ext in ('.xls', '.xlsx'):
        import openpyxl
        # openpyxl for .xlsx; xlrd for .xls
        if ext == '.xlsx':
            wb = openpyxl.load_workbook(path, read_only=True, data_only=True)
            ws = wb.active
            rows_iter = ws.iter_rows(values_only=True)
        else:
            import xlrd
            wb = xlrd.open_workbook(str(path))
            ws = wb.sheet_by_index(0)
            rows_iter = (tuple(ws.row_values(i)) for i in range(ws.nrows))

        raw = list(rows_iter)
        if not raw:
            return [], []
        # Find header row (first row with >3 non-empty string cells)
        header_idx = 0
        for i, row in enumerate(raw[:10]):
            non_empty = sum(1 for c in row if c and str(c).strip())
            if non_empty >= 3:
                header_idx = i
                break
        headers = [str(c).strip() for c in raw[header_idx]]
        rows = []
        for row in raw[header_idx + 1:]:
            d = {headers[j]: (row[j] if j < len(row) else '') for j in range(len(headers))}
            rows.append(d)
        return headers, rows

    elif ext in ('.csv', '.tsv', '.txt'):
        import csv
        delim = '\t' if ext in ('.tsv', '.txt') else ','
        with open(path, encoding='utf-8-sig', newline='') as f:
            reader = csv.DictReader(f, delimiter=delim)
            headers = reader.fieldnames or []
            rows = list(reader)
        return list(headers), rows

    else:
        sys.exit(f"Unsupported file format: {ext}")


# ── per-organism GENOTYPE logic ───────────────────────────────────────────────

def genotype_for(vid: str, row: dict, col: dict) -> str:
    sub  = coerce_str(row.get(col.get('subtype', ''), ''))
    lin  = coerce_str(row.get(col.get('lineage', ''), ''))
    typ  = coerce_str(row.get(col.get('type', ''), ''))

    if vid == 'avianflu':
        if sub: return sub.upper()              # H5N1, H5N6, H7N9 …
        return 'Unknown'

    if vid == 'influenza':
        if sub: return sub.upper()              # H3N2, H1N1pdm09 …
        if typ: return f"Influenza {typ.upper()}"
        return 'Unknown'

    if vid == 'influenzab':
        if lin: return lin                       # Victoria, Yamagata …
        return 'Influenza B'

    if vid == 'dengue':
        sero_map = {'denv1':'DENV-1','denv2':'DENV-2','denv3':'DENV-3','denv4':'DENV-4',
                    'dengue1':'DENV-1','dengue2':'DENV-2','dengue3':'DENV-3','dengue4':'DENV-4'}
        s = sub.lower().replace(' ','').replace('-','')
        return sero_map.get(s, sub or lin or 'Unknown')

    if vid in ('zika', 'chikungunya', 'westnile', 'yellowfever',
               'oropouche', 'crimean', 'riftvalley', 'hantavirus', 'nipah'):
        return lin or sub or vid.capitalize()

    if vid == 'covid19':
        return lin or sub or 'Unknown'

    if vid == 'rsv':
        if sub:
            if 'a' in sub.lower(): return f"RSV-A ({sub})"
            if 'b' in sub.lower(): return f"RSV-B ({sub})"
        return lin or 'Unknown'

    if vid == 'mpox':
        return lin or sub or 'Mpox'

    return lin or sub or 'Unknown'


# ── main import ───────────────────────────────────────────────────────────────

# Map virus ID → MongoDB db name (most match 1:1, a few differ)
DB_NAME = {
    'avianflu':    'avianflu',
    'influenza':   'influenza',
    'influenzab':  'influenzab',
    'dengue':      'dengue',
    'zika':        'zika',
    'chikungunya': 'chikungunya',
    'westnile':    'westnile',
    'yellowfever': 'yellowfever',
    'oropouche':   'oropouche',
    'crimean':     'crimean',
    'riftvalley':  'riftvalley',
    'hantavirus':  'hantavirus',
    'nipah':        'nipah',
    'covid19':     'covid19',
    'rsv':         'rsv',
    'mpox':        'mpox',
    'lassa':       'lassa',
    'ebola':       'ebola',
    'marburg':     'marburg',
}

# Organisms where we only import whole-genome / complete records
PREFER_COMPLETE = {'avianflu', 'influenza', 'influenzab'}

# Segment filter: for flu, skip non-HA segments unless no segment column
HA_ONLY = {'avianflu', 'influenza', 'influenzab'}
HA_LABELS = {'4', 'HA', 'Hemagglutinin', 'hemagglutinin'}


def import_file(path: Path, vid: str):
    if vid not in DB_NAME:
        sys.exit(f"Unknown virus ID: {vid}\nValid IDs: {', '.join(DB_NAME)}")

    log(f"Reading {path.name} ...")
    headers, rows = read_file(path)
    if not rows:
        log("No data rows found — check the file.")
        return

    log(f"  {len(rows):,} rows, {len(headers)} columns")
    log(f"  Columns: {', '.join(headers[:12])}{'...' if len(headers)>12 else ''}")

    # Resolve column names
    col = {field: find_col(headers, field) for field in COL_ALIASES}

    if not col['accession']:
        log("WARNING: could not find accession column. First 5 headers:")
        for h in headers[:5]:
            log(f"  '{h}'")

    col_db   = DB_NAME[vid]
    coll     = client[col_db]['genomes']
    ops      = []
    imported = 0
    skipped  = 0

    for row in rows:
        # ── segment filter (flu only) ──────────────────────────────────────
        if vid in HA_ONLY and col['segment']:
            seg = coerce_str(row.get(col['segment'], ''))
            if seg and seg not in HA_LABELS:
                skipped += 1
                continue

        # ── accession ─────────────────────────────────────────────────────
        acc = coerce_str(row.get(col['accession'] or '', ''))
        if not acc:
            # try to build from strain name
            acc = coerce_str(row.get(col['strain'] or '', ''))
        if not acc:
            skipped += 1
            continue

        # Normalise EPI_ISL-style IDs
        if acc.startswith('EPI_') or acc.startswith('EPI'):
            pass  # keep as-is
        else:
            acc = acc.strip()

        # ── date & year ────────────────────────────────────────────────────
        raw_date = coerce_str(row.get(col['date'] or '', ''))
        year  = parse_year(raw_date)
        month = parse_month(raw_date)

        # ── location / country ─────────────────────────────────────────────
        raw_loc  = coerce_str(row.get(col['location'] or '', ''))
        country  = extract_country(raw_loc)

        # ── host ──────────────────────────────────────────────────────────
        host = coerce_str(row.get(col['host'] or '', ''))

        # ── strain ────────────────────────────────────────────────────────
        strain = coerce_str(row.get(col['strain'] or '', ''))

        # ── genotype ──────────────────────────────────────────────────────
        genotype = genotype_for(vid, row, col)

        # ── title (reconstruct from strain) ───────────────────────────────
        title = strain or acc

        doc = {
            'accession':   acc,
            'strain':      strain,
            'title':       title,
            'TITLE':       title,
            'NAME':        acc,
            'collection_date': raw_date,
            'country':     country,
            'COUNTRY_ONLY': country,
            'DATE':        year,
            'YEAR':        year,
            'MONTH':       month,
            'HOST':        host,
            'host':        host,
            'ORGANISM':    vid,
            'GENOTYPE':    genotype,
            'LINEAGE':     coerce_str(row.get(col['lineage'] or '', '')),
            'source_db':   'GISAID',
            'SOURCE_DB':   'GISAID',
        }

        # Remove None / empty values from the doc so we don't overwrite good data
        doc = {k: v for k, v in doc.items() if v not in (None, '')}

        ops.append(UpdateOne(
            {'accession': acc},
            {'$set': doc,
             '$setOnInsert': {'_id': pymongo.collection.ObjectId() if False else None}},
            upsert=True,
        ))
        imported += 1

        if len(ops) >= 2000:
            coll.bulk_write(ops, ordered=False)
            ops.clear()
            print(f"  ... {imported:,} upserted", end='\r', flush=True)

    if ops:
        coll.bulk_write(ops, ordered=False)

    log(f"\n{vid}: upserted {imported:,}, skipped {skipped:,} (segment filter + no accession)")

    # Final count
    total = coll.count_documents({})
    gisaid_count = coll.count_documents({'source_db': 'GISAID'})
    log(f"{vid}: now {total:,} total records ({gisaid_count:,} from GISAID)")


# ── CLI ───────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(
        description='Import a GISAID metadata download into InfectoNET MongoDB',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python3 scripts/import_gisaid.py data/gisaid/h5n1.xls      --virus avianflu
  python3 scripts/import_gisaid.py data/gisaid/h3n2.xlsx     --virus influenza
  python3 scripts/import_gisaid.py data/gisaid/flu_b.xls     --virus influenzab
  python3 scripts/import_gisaid.py data/gisaid/dengue.csv    --virus dengue
  python3 scripts/import_gisaid.py data/gisaid/zika.xls      --virus zika
  python3 scripts/import_gisaid.py data/gisaid/chikv.xls     --virus chikungunya
  python3 scripts/import_gisaid.py data/gisaid/wnv.xls       --virus westnile
  python3 scripts/import_gisaid.py data/gisaid/orov.xls      --virus oropouche
  python3 scripts/import_gisaid.py data/gisaid/yfv.xls       --virus yellowfever

For EpiFlu (flu) files: only Hemagglutinin (HA/segment 4) rows are imported.
Place all downloaded files inside data/gisaid/ (gitignored).
""")
    parser.add_argument('file',  help='Path to GISAID download file (.xls/.xlsx/.csv/.tsv)')
    parser.add_argument('--virus', required=True,
                        help='Dashboard organism ID (e.g. avianflu, influenza, dengue)')
    args = parser.parse_args()

    path = Path(args.file)
    if not path.exists():
        sys.exit(f"File not found: {path}")

    import_file(path, args.virus.lower().strip())
    print("\nDone. Run enrich_genotypes.py if you want to backfill any missing GENOTYPE values.")


if __name__ == '__main__':
    main()
