#!/usr/bin/env python3
"""
InfectoNET — COVID-19 / SARS-CoV-2 GENOTYPE enrichment
========================================================
Maps PANGO lineage → WHO variant-wave group and writes to GENOTYPE.

2,260 unique PANGO lineages are collapsed into ~10 meaningful display
categories (Alpha, Delta, Omicron BA.1, Omicron XBB, etc.) based on
WHO VOC/VOI designations and clade membership.

Raw PANGO lineage is preserved in the existing `pango_lineage` field.
GENOTYPE gets the human-readable variant group for chart display.

Run:
  python3 scripts/enrich_covid19.py
"""
import os, re
from pymongo import MongoClient, UpdateOne

MONGO_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
client = MongoClient(MONGO_URI)

# ── WHO VOC exact lineage → variant group ─────────────────────────────────────
EXACT_VOC = {
    'B.1.1.7':   'Alpha (B.1.1.7)',
    'B.1.351':   'Beta (B.1.351)',
    'P.1':       'Gamma (P.1)',
    'B.1.617.2': 'Delta (B.1.617.2)',
    'B.1.1.529': 'Omicron',
}

# ── Prefix / substring rules (checked in order, first match wins) ─────────────
# Each entry: (prefix_or_exact, group_label)
# The prefix matching is anchored: lineage must START WITH the given string.
PREFIX_RULES = [
    # ── Alpha descendants ────────────────────────────────────────────────────
    ('Q.',        'Alpha (B.1.1.7)'),

    # ── Beta descendants ─────────────────────────────────────────────────────
    ('B.1.351.',  'Beta (B.1.351)'),

    # ── Gamma / Lambda / Mu ──────────────────────────────────────────────────
    ('P.1.',      'Gamma (P.1)'),
    ('P.1',       'Gamma (P.1)'),   # catch bare P.1
    ('C.37',      'Lambda (C.37)'),
    ('B.1.621',   'Mu (B.1.621)'),

    # ── Delta and its AY.* sub-lineages ─────────────────────────────────────
    ('AY.',       'Delta (B.1.617.2)'),
    ('B.1.617.2', 'Delta (B.1.617.2)'),

    # ── Omicron BA.2.86 → JN.1 / KP / LP wave ───────────────────────────────
    # (must come BEFORE generic BA.2 prefix)
    ('BA.2.86',   'Omicron JN.1 / BA.2.86'),
    ('JN.',       'Omicron JN.1 / BA.2.86'),
    ('KP.',       'Omicron KP / JN.1'),
    ('KS.',       'Omicron KP / JN.1'),
    ('LP.',       'Omicron KP / JN.1'),
    ('LF.',       'Omicron KP / JN.1'),
    ('MC.',       'Omicron KP / JN.1'),
    ('ND.',       'Omicron KP / JN.1'),
    ('NB.',       'Omicron XEC'),
    ('XEC',       'Omicron XEC'),
    ('XEC.',      'Omicron XEC'),

    # ── Omicron XBB constellation ────────────────────────────────────────────
    # Core XBB aliases
    ('XBB',       'Omicron XBB'),
    # Named XBB sub-lineage aliases (from pango-designation)
    ('EG.',       'Omicron XBB'),   # EG  = XBB.1.9.2.*
    ('FD.',       'Omicron XBB'),   # FD  = XBB.1.5.15.*
    ('FU.',       'Omicron XBB'),   # FU  = XBB.1.16.1.*
    ('FY.',       'Omicron XBB'),   # FY  = XBB.1.22.1.*
    ('FT.',       'Omicron XBB'),   # FT  = XBB.1.5.39.*
    ('FL.',       'Omicron XBB'),   # FL  = XBB.1.9.1.*
    ('FM.',       'Omicron XBB'),
    ('FE.',       'Omicron XBB'),
    ('FG.',       'Omicron XBB'),
    ('FH.',       'Omicron XBB'),
    ('FJ.',       'Omicron XBB'),
    ('FK.',       'Omicron XBB'),
    ('FP.',       'Omicron XBB'),
    ('FR.',       'Omicron XBB'),
    ('FW.',       'Omicron XBB'),
    ('FZ.',       'Omicron XBB'),
    ('FA.',       'Omicron XBB'),
    ('FB.',       'Omicron XBB'),
    ('FC.',       'Omicron XBB'),
    ('GJ.',       'Omicron XBB'),
    ('GW.',       'Omicron XBB'),
    ('GY.',       'Omicron XBB'),
    ('GE.',       'Omicron XBB'),   # GE  = XBB descendant
    ('GK.',       'Omicron XBB'),   # GK  = XBB.1.5.70.*
    ('GN.',       'Omicron XBB'),
    ('GS.',       'Omicron XBB'),
    ('GU.',       'Omicron XBB'),
    ('GV.',       'Omicron XBB'),
    ('GZ.',       'Omicron XBB'),
    ('GC.',       'Omicron XBB'),
    ('GD.',       'Omicron XBB'),
    ('GF.',       'Omicron XBB'),
    ('GR.',       'Omicron XBB'),
    ('HK.',       'Omicron XBB'),
    ('HV.',       'Omicron XBB'),
    ('HF.',       'Omicron XBB'),
    ('HN.',       'Omicron XBB'),
    ('HH.',       'Omicron XBB'),
    ('HJ.',       'Omicron XBB'),
    ('HS.',       'Omicron XBB'),
    ('HT.',       'Omicron XBB'),
    ('HY.',       'Omicron XBB'),
    ('HZ.',       'Omicron XBB'),
    ('JG.',       'Omicron XBB'),
    ('JF.',       'Omicron XBB'),
    ('JD.',       'Omicron XBB'),
    ('JV.',       'Omicron XBB'),
    ('JJ.',       'Omicron XBB'),
    ('JQ.',       'Omicron XBB'),
    ('JR.',       'Omicron XBB'),
    ('JY.',       'Omicron XBB'),
    ('JZ.',       'Omicron XBB'),
    ('JC.',       'Omicron XBB'),
    ('JE.',       'Omicron XBB'),
    ('JM.',       'Omicron XBB'),
    # XFG = XBB descendant
    ('XFG.',      'Omicron XBB'),
    ('XFG',       'Omicron XBB'),
    ('XFB.',      'Omicron XBB'),
    ('XFH.',      'Omicron XBB'),
    ('XFJ.',      'Omicron XBB'),
    ('XFN.',      'Omicron XBB'),
    ('XFP',       'Omicron XBB'),
    ('XFQ',       'Omicron XBB'),
    ('XFR',       'Omicron XBB'),
    ('XFS',       'Omicron XBB'),
    ('XFT',       'Omicron XBB'),
    ('XFU',       'Omicron XBB'),
    ('XFV',       'Omicron XBB'),
    ('XFY',       'Omicron XBB'),
    ('XFZ',       'Omicron XBB'),
    ('XFC.',      'Omicron XBB'),
    # D.* = XBB.1.5.102.* descendants
    ('D.',        'Omicron XBB'),
    # Other late XBB aliases
    ('EF.',       'Omicron XBB'),
    ('EH.',       'Omicron XBB'),
    ('EJ.',       'Omicron XBB'),
    ('EK.',       'Omicron XBB'),
    ('EW.',       'Omicron XBB'),
    ('EA.',       'Omicron XBB'),
    ('EB.',       'Omicron XBB'),
    ('EC.',       'Omicron XBB'),
    ('ED.',       'Omicron XBB'),
    ('EE.',       'Omicron XBB'),

    # ── Omicron KP / JN.1 sub-lineages ───────────────────────────────────────
    # (JN.1 / BA.2.86 descendants — already matched above, these are further aliases)
    ('KP.',       'Omicron KP / JN.1'),
    ('KS.',       'Omicron KP / JN.1'),
    ('KR.',       'Omicron KP / JN.1'),
    ('KT.',       'Omicron KP / JN.1'),
    ('KU.',       'Omicron KP / JN.1'),
    ('KV.',       'Omicron KP / JN.1'),
    ('KW.',       'Omicron KP / JN.1'),
    ('KE.',       'Omicron KP / JN.1'),
    ('KB.',       'Omicron KP / JN.1'),
    ('KC.',       'Omicron KP / JN.1'),
    ('KQ.',       'Omicron KP / JN.1'),
    ('LA.',       'Omicron KP / JN.1'),
    ('LB.',       'Omicron KP / JN.1'),
    ('LC.',       'Omicron KP / JN.1'),
    ('LD.',       'Omicron KP / JN.1'),
    ('LE.',       'Omicron KP / JN.1'),
    ('LF.',       'Omicron KP / JN.1'),
    ('LQ.',       'Omicron KP / JN.1'),
    ('LU.',       'Omicron KP / JN.1'),
    ('LW.',       'Omicron KP / JN.1'),
    ('LY.',       'Omicron KP / JN.1'),
    ('LZ.',       'Omicron KP / JN.1'),
    ('MA.',       'Omicron KP / JN.1'),
    ('MB.',       'Omicron KP / JN.1'),
    ('MC.',       'Omicron KP / JN.1'),
    ('MG.',       'Omicron KP / JN.1'),
    ('MH.',       'Omicron KP / JN.1'),
    ('MK.',       'Omicron KP / JN.1'),
    ('MU.',       'Omicron KP / JN.1'),
    ('MV.',       'Omicron KP / JN.1'),
    ('NA.',       'Omicron KP / JN.1'),
    ('NB.',       'Omicron KP / JN.1'),
    ('NC.',       'Omicron KP / JN.1'),
    ('ND.',       'Omicron KP / JN.1'),
    ('NL.',       'Omicron KP / JN.1'),
    ('NN.',       'Omicron KP / JN.1'),
    ('NT.',       'Omicron KP / JN.1'),
    ('NW.',       'Omicron KP / JN.1'),
    ('NY.',       'Omicron KP / JN.1'),
    ('PA.',       'Omicron KP / JN.1'),
    ('PB.',       'Omicron KP / JN.1'),
    ('PC.',       'Omicron KP / JN.1'),
    ('PF.',       'Omicron KP / JN.1'),
    ('PG.',       'Omicron KP / JN.1'),
    ('PH.',       'Omicron KP / JN.1'),
    ('PL.',       'Omicron KP / JN.1'),
    ('PM.',       'Omicron KP / JN.1'),
    ('PP.',       'Omicron KP / JN.1'),
    ('PQ.',       'Omicron KP / JN.1'),
    ('PR.',       'Omicron KP / JN.1'),
    ('PY.',       'Omicron KP / JN.1'),
    ('PZ.',       'Omicron KP / JN.1'),
    ('QA.',       'Omicron KP / JN.1'),
    ('QB.',       'Omicron KP / JN.1'),
    ('QE.',       'Omicron KP / JN.1'),
    ('QF.',       'Omicron KP / JN.1'),
    ('QH.',       'Omicron KP / JN.1'),
    ('QK.',       'Omicron KP / JN.1'),
    ('QM.',       'Omicron KP / JN.1'),
    ('QR.',       'Omicron KP / JN.1'),
    ('QT.',       'Omicron KP / JN.1'),
    ('QU.',       'Omicron KP / JN.1'),
    ('QW.',       'Omicron KP / JN.1'),
    ('QY.',       'Omicron KP / JN.1'),
    ('RE.',       'Omicron KP / JN.1'),
    ('RG.',       'Omicron KP / JN.1'),
    ('RN.',       'Omicron KP / JN.1'),
    ('RR.',       'Omicron KP / JN.1'),
    # LP = KP descendant
    ('LP.',       'Omicron KP / JN.1'),

    # ── Omicron XEC constellation ─────────────────────────────────────────────
    ('XEC',       'Omicron XEC'),
    ('XED.',      'Omicron XEC'),
    ('XEH.',      'Omicron XEC'),
    ('XEK.',      'Omicron XEC'),
    ('XEL.',      'Omicron XEC'),
    ('XEM.',      'Omicron XEC'),
    ('XEN.',      'Omicron XEC'),
    ('XEQ.',      'Omicron XEC'),
    ('XEV.',      'Omicron XEC'),

    # ── Omicron BA.2.75 sub-constellation ───────────────────────────────────
    ('CH.',       'Omicron BA.2.75'),
    ('BN.',       'Omicron BA.2.75'),
    ('DV.',       'Omicron BA.2.75'),
    ('BU.',       'Omicron BA.2.75'),
    ('CJ.',       'Omicron BA.2.75'),

    # ── Omicron BA.4 / BA.5 / BQ.1 ──────────────────────────────────────────
    ('BF.',       'Omicron BA.5'),
    ('BQ.',       'Omicron BA.5 / BQ.1'),
    ('BG.',       'Omicron BA.5'),
    ('BK.',       'Omicron BA.5'),
    ('BL.',       'Omicron BA.5'),
    ('BM.',       'Omicron BA.5'),
    ('BT.',       'Omicron BA.5'),
    ('BV.',       'Omicron BA.5'),
    ('BW.',       'Omicron BA.5'),
    ('BZ.',       'Omicron BA.5'),
    ('BE.',       'Omicron BA.5'),
    ('BA.4',      'Omicron BA.4'),
    ('BA.5',      'Omicron BA.5'),

    # ── Omicron BA.1 ─────────────────────────────────────────────────────────
    ('BA.1',      'Omicron BA.1'),

    # ── Omicron BA.2 (remainder) ─────────────────────────────────────────────
    ('BA.2',      'Omicron BA.2'),

    # ── Omicron BA.3 ─────────────────────────────────────────────────────────
    ('BA.3',      'Omicron BA.3'),

    # ── Delta-era recombinants ────────────────────────────────────────────────
    ('XD.',       'Omicron recombinant'),   # Delta x BA.1

    # ── Other Omicron recombinants (X* lineages not caught above) ────────────
    ('XA',        'Omicron recombinant'),
    ('XB',        'Omicron recombinant'),
    ('XC',        'Omicron recombinant'),
    ('XF',        'Omicron recombinant'),
    ('XG',        'Omicron recombinant'),
    ('XH',        'Omicron recombinant'),
    ('XJ',        'Omicron recombinant'),
    ('XK',        'Omicron recombinant'),
    ('XL',        'Omicron recombinant'),
    ('XM',        'Omicron recombinant'),
    ('XN',        'Omicron recombinant'),
    ('XP',        'Omicron recombinant'),
    ('XQ',        'Omicron recombinant'),
    ('XR',        'Omicron recombinant'),
    ('XS',        'Omicron recombinant'),
    ('XT',        'Omicron recombinant'),
    ('XU',        'Omicron recombinant'),
    ('XV',        'Omicron recombinant'),
    ('XW',        'Omicron recombinant'),
    ('XY',        'Omicron recombinant'),
    ('XZ',        'Omicron recombinant'),

    # ── Pre-VOC B lineages ───────────────────────────────────────────────────
    ('B.1.1.',    'pre-VOC (B.1)'),
    ('B.1.',      'pre-VOC (B.1)'),
    ('B.1',       'pre-VOC (B.1)'),
    ('B.',        'pre-VOC'),
    ('B',         'pre-VOC'),          # bare 'B'
    ('C.',        'pre-VOC'),
    ('A.',        'pre-VOC'),
    ('A',         'pre-VOC'),
    ('N.',        'pre-VOC'),          # early N lineage
    ('V.',        'pre-VOC'),
    ('Z.',        'pre-VOC'),
    ('K.',        'pre-VOC'),
    ('L.',        'pre-VOC'),
    ('R.',        'pre-VOC'),

    # ── Explicitly unclassifiable ────────────────────────────────────────────
    ('unclassifiable', 'Unknown'),

    # ── P.2 etc (not Gamma) ──────────────────────────────────────────────────
    ('P.',        'pre-VOC'),
]


def classify_pango(pango: str) -> str:
    """Return variant group for a PANGO lineage string."""
    if not pango or pango.strip() in ('', 'Unknown', 'unknown'):
        return ''

    pango = pango.strip()

    # Exact VOC matches first
    if pango in EXACT_VOC:
        return EXACT_VOC[pango]

    # Prefix rules
    for prefix, group in PREFIX_RULES:
        if pango.startswith(prefix):
            return group

    # Catch-all: return the lineage itself (already a meaningful PANGO name)
    return pango


KNOWN_GROUPS = {
    'Alpha (B.1.1.7)', 'Beta (B.1.351)', 'Gamma (P.1)', 'Lambda (C.37)', 'Mu (B.1.621)',
    'Delta (B.1.617.2)',
    'Omicron BA.1', 'Omicron BA.2', 'Omicron BA.2.75', 'Omicron BA.3',
    'Omicron BA.4', 'Omicron BA.5', 'Omicron BA.5 / BQ.1',
    'Omicron XBB', 'Omicron JN.1 / BA.2.86', 'Omicron KP / JN.1',
    'Omicron XEC', 'Omicron recombinant', 'Omicron',
    'pre-VOC (B.1)', 'pre-VOC',
    'Unknown',
}


def run():
    col = client['covid19']['genomes']
    total = col.count_documents({})
    print(f"covid19: {total:,} total records")

    ops = []
    updated = 0
    skipped = 0

    # Process ALL records — re-classify any that have a raw PANGO lineage as GENOTYPE
    # (from the previous incomplete run) AND records with empty GENOTYPE.
    for doc in col.find({}, no_cursor_timeout=True):
        pango   = str(doc.get('pango_lineage', '') or '').strip()
        who     = str(doc.get('who_label', '') or '').strip()
        current = str(doc.get('GENOTYPE', '') or '').strip()

        # Skip records that already have a properly classified group AND pango matches
        if current in KNOWN_GROUPS:
            skipped += 1
            continue

        group = classify_pango(pango)

        # Fallback: use WHO label directly
        if not group and who:
            group = who

        if group:
            ops.append(UpdateOne(
                {'_id': doc['_id']},
                {'$set': {'GENOTYPE': group, 'LINEAGE': pango or group}}
            ))
            updated += 1
        else:
            skipped += 1

        if len(ops) >= 2000:
            col.bulk_write(ops, ordered=False)
            ops.clear()
            print(f"  ... {updated:,} updated so far", end='\r', flush=True)

    if ops:
        col.bulk_write(ops, ordered=False)

    print(f"\ncovid19: updated {updated:,}, skipped {skipped:,} (already classified or no lineage)")

    # Show resulting distribution
    print("\nTop GENOTYPE groups after enrichment:")
    for r in col.aggregate([
        { '$match': { 'GENOTYPE': { '$nin': ['', None] } } },
        { '$group': { '_id': '$GENOTYPE', 'count': { '$sum': 1 } } },
        { '$sort': { 'count': -1 } },
        { '$limit': 15 },
    ]):
        print(f"  {r['_id']}: {r['count']:,}")


if __name__ == '__main__':
    run()
    print("\nDone.")
