#!/usr/bin/env python3
"""
VirNet sequence downloader v3
------------------------------
Sources:
  • Nextstrain TSV  — covid19, rsv, mpox, measles
  • Nextstrain JSON — dengue (v2 auspice tree)
  • NCBI E-utilities — all other new viruses (sequential, rate-limited)

Usage:
  python3 scripts/download_sequences.py               # all viruses
  python3 scripts/download_sequences.py --virus rsv   # one virus
"""
import argparse, gzip, io, json, os, random, sys, time
from datetime import datetime
import requests
from pymongo import MongoClient, UpdateOne

MONGO_URI  = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
NCBI_EMAIL = os.getenv("NCBI_EMAIL", "virnet@example.com")
BATCH = 500

def log(msg):
    print(f"[{datetime.now().strftime('%H:%M:%S')}] {msg}", flush=True)

def parse_year(raw):
    if not raw: return None
    try:
        y = int(str(raw).strip()[:4])
        return y if 1900 <= y <= 2100 else None
    except (ValueError, TypeError):
        return None

def flush_ops(col, ops):
    if ops:
        col.bulk_write(ops, ordered=False)
        ops.clear()

# ── 1. Nextstrain TSV ─────────────────────────────────────────────────────────
NEXTSTRAIN_TSV = {
    "covid19": (
        "https://data.nextstrain.org/files/ncov/open/metadata.tsv.gz",
        {"strain":"strain","date":"collection_date","country":"COUNTRY_ONLY",
         "division":"division","pango_lineage":"pango_lineage",
         "Nextstrain_clade":"clade","host":"host"},
        50_000,   # reservoir-sampled for global coverage
    ),
    "rsv": (
        "https://data.nextstrain.org/files/workflows/rsv/a/metadata.tsv.gz",
        {"strain":"strain","date":"collection_date","country":"COUNTRY_ONLY",
         "clade":"clade","host":"host"},
        10_000,
    ),
    "rsvb": (
        "https://data.nextstrain.org/files/workflows/rsv/b/metadata.tsv.gz",
        {"strain":"strain","date":"collection_date","country":"COUNTRY_ONLY",
         "clade":"clade","host":"host"},
        10_000,
    ),
    "mpox": (
        "https://data.nextstrain.org/files/workflows/mpox/metadata.tsv.gz",
        {"strain":"strain","date":"collection_date","country":"COUNTRY_ONLY",
         "clade":"clade","lineage":"lineage","host":"host","outbreak":"outbreak"},
        10_000,
    ),
    "measles": (
        "https://data.nextstrain.org/files/workflows/measles/metadata.tsv.gz",
        {"strain":"strain","date":"collection_date","country":"COUNTRY_ONLY",
         "clade":"clade","genotype":"genotype","host":"host"},
        10_000,
    ),
}

def _parse_tsv_row(row, fmap, vid):
    """Convert a TSV row dict to a MongoDB doc, or return None to skip."""
    acc = row.get("accession", row.get("strain","")).strip()
    if not acc or acc == "?": return None
    doc = {"accession":acc,"source_db":"Nextstrain","ORGANISM":vid}
    for src,dst in fmap.items():
        v = row.get(src,"").strip()
        if v and v not in ("?","N/A","unknown","Unknown","XXXX-XX-XX"):
            doc[dst] = v
    ctry = doc.pop("COUNTRY_ONLY","") or ""
    doc.update({"COUNTRY_ONLY":ctry,"country":ctry})
    yr = parse_year(doc.get("collection_date",""))
    if yr: doc.update({"YEAR":yr,"DATE":yr})
    return doc

def dl_nextstrain_tsv(vid, url, fmap, limit, col, reservoir=False):
    """Download Nextstrain metadata TSV and upsert into MongoDB.

    reservoir=True  → reservoir-sample `limit` records from the full file
                      (use for large files sorted alphabetically like ncov/open).
    reservoir=False → take the first `limit` valid records (fast, small files).
    """
    log(f"  GET {url}")
    resp = requests.get(url, timeout=300)
    resp.raise_for_status()
    log(f"  {len(resp.content)/1e6:.1f} MB, parsing TSV …")

    with gzip.open(io.BytesIO(resp.content), "rt", encoding="utf-8", errors="replace") as f:
        header = f.readline().rstrip("\n").split("\t")

        if not reservoir:
            # Fast path: first N valid records
            ops, n = [], 0
            for line in f:
                if n >= limit: break
                row = dict(zip(header, line.rstrip("\n").split("\t")))
                doc = _parse_tsv_row(row, fmap, vid)
                if doc is None: continue
                ops.append(UpdateOne({"accession":doc["accession"]},{"$set":doc},upsert=True))
                n += 1
                if len(ops) >= BATCH:
                    flush_ops(col, ops); sys.stdout.write(f"\r  {n:,} …"); sys.stdout.flush()
            flush_ops(col, ops)

        else:
            # Reservoir sampling (Algorithm R) — reads full file for uniform coverage
            reservoir_docs: list = []
            total_seen = 0
            for line in f:
                row = dict(zip(header, line.rstrip("\n").split("\t")))
                doc = _parse_tsv_row(row, fmap, vid)
                if doc is None: continue
                total_seen += 1
                if len(reservoir_docs) < limit:
                    reservoir_docs.append(doc)
                else:
                    j = random.randint(0, total_seen - 1)
                    if j < limit:
                        reservoir_docs[j] = doc
                if total_seen % 200_000 == 0:
                    sys.stdout.write(f"\r  scanned {total_seen:,} …"); sys.stdout.flush()
            log(f"\n  scanned {total_seen:,} rows, keeping {len(reservoir_docs):,}")
            n = 0
            ops = []
            for doc in reservoir_docs:
                ops.append(UpdateOne({"accession":doc["accession"]},{"$set":doc},upsert=True))
                n += 1
                if len(ops) >= BATCH:
                    flush_ops(col, ops); sys.stdout.write(f"\r  {n:,} written …"); sys.stdout.flush()
            flush_ops(col, ops)

    log(f"\n  ✓ {n:,} for {vid}")
    return n

# ── 2. Nextstrain v2 JSON (dengue) ────────────────────────────────────────────
NEXTSTRAIN_JSON = {
    "dengue": [
        "https://data.nextstrain.org/dengue_denv1.json",
        "https://data.nextstrain.org/dengue_denv2.json",
        "https://data.nextstrain.org/dengue_denv3.json",
        "https://data.nextstrain.org/dengue_denv4.json",
    ],
}

def _walk_tree(node, records, serotype):
    """Recursively extract leaf-node metadata from Nextstrain v2 JSON."""
    children = node.get("children", [])
    if not children:
        attrs = node.get("node_attrs", {})
        def attr(k):
            return attrs.get(k, {}).get("value", "") or ""
        records.append({
            "strain":          node.get("name",""),
            "country":         attr("country"),
            "date":            attr("num_date") or attr("date"),
            "clade":           attr("clade_membership") or attr("clade"),
            "serotype":        serotype,
            "host":            attr("host"),
            "division":        attr("division"),
        })
    for ch in children:
        _walk_tree(ch, records, serotype)

def dl_nextstrain_json(vid, urls, limit_per_url, col):
    ops, total = [], 0
    for url in urls:
        serotype = url.rsplit("_",1)[-1].replace(".json","").upper()
        try:
            log(f"  GET {url}")
            resp = requests.get(url, timeout=60)
            resp.raise_for_status()
            tree = resp.json()
        except Exception as e:
            log(f"  skip {url}: {e}"); continue
        records = []
        _walk_tree(tree.get("tree",{}), records, serotype)
        log(f"  {len(records)} leaves for {serotype}")
        n = 0
        for r in records[:limit_per_url]:
            ctry = r["country"]
            yr   = parse_year(r["date"])
            strain = r["strain"]
            if not strain: continue
            doc = {
                "accession":    strain,
                "strain":       strain,
                "source_db":    "Nextstrain",
                "ORGANISM":     vid,
                "COUNTRY_ONLY": ctry, "country": ctry,
                "collection_date": r["date"], "date": r["date"],
                "clade":        r["clade"],
                "serotype":     r["serotype"],
                "host":         r["host"],
                "division":     r["division"],
            }
            if yr: doc.update({"YEAR":yr,"DATE":yr})
            ops.append(UpdateOne({"accession":strain},{"$set":doc},upsert=True))
            n += 1
            if len(ops) >= BATCH:
                flush_ops(col, ops); sys.stdout.write(f"\r  {total+n:,} …"); sys.stdout.flush()
        total += n
    flush_ops(col, ops)
    log(f"\n  ✓ {total:,} for {vid}")
    return total

# ── 3. NCBI E-utilities (sequential) ─────────────────────────────────────────

import re as _re

def _enrich_genotype(vid, doc):
    """
    Attempt to fill doc["GENOTYPE"] (and any virus-specific sub-fields) from
    organism / strain / title fields already on the doc.
    Only sets values when GENOTYPE is absent or "Unknown".
    """
    if doc.get("GENOTYPE") and doc["GENOTYPE"] not in ("", "Unknown"):
        return  # already resolved

    org    = (doc.get("organism") or "").strip()
    strain = (doc.get("strain")   or doc.get("isolate") or "").strip()
    title  = (doc.get("title")    or "").strip()
    org_l  = org.lower()
    strain_l = strain.lower()

    def _set(gt, **extras):
        doc["GENOTYPE"] = gt
        for k, v in extras.items():
            if v:
                doc[k] = v

    # ── Ebola ──────────────────────────────────────────────────────────────
    if vid == "ebola":
        combined = org_l + " " + strain_l
        if "zaire" in combined or "ebola virus" in combined or "ebov" in combined:
            species = "EBOV"
        elif "sudan" in combined or "sudv" in combined:
            species = "SUDV"
        elif "bundibugyo" in combined or "bdbv" in combined:
            species = "BDBV"
        elif "tai forest" in combined or "cote d'ivoire" in combined or "tafv" in combined:
            species = "TAFV"
        elif "reston" in combined or "restv" in combined:
            species = "RESTV"
        elif "bombali" in combined or "mlav" in combined:
            species = "MLAV"
        else:
            species = "EBOV"  # default – most records are Zaire ebolavirus
        _set(species, ebola_species=species)

    # ── Marburg ────────────────────────────────────────────────────────────
    elif vid == "marburg":
        combined = org_l + " " + strain_l
        species = "RAVV" if "ravn" in combined else "MARV"
        _set(species)

    # ── Lassa ──────────────────────────────────────────────────────────────
    elif vid == "lassa":
        # Common reference strains → known lineages
        combined = strain_l + " " + org_l + " " + title.lower()
        lineage = None
        if "josiah" in combined:
            lineage = "IV"
        else:
            # Try to extract Roman numeral directly
            m = _re.search(r'\b(I{1,3}V?|IV|V?I{0,3})\b', strain)
            if m:
                candidate = m.group(1)
                if candidate in ("I","II","III","IV"):
                    lineage = candidate
        if lineage:
            _set(f"Lineage {lineage}", lassa_lineage=lineage)
        else:
            _set("Lassa", lassa_lineage="Unknown")

    # ── Nipah ──────────────────────────────────────────────────────────────
    elif vid == "nipah":
        combined = org_l + " " + strain_l + " " + title.lower()
        if "malaysia" in combined or "/my" in combined or "_my" in combined or "niv-m" in combined:
            _set("NiV-M")
        elif "bangladesh" in combined or "/bd" in combined or "_bd" in combined or "niv-b" in combined:
            _set("NiV-B")
        else:
            _set("NiV")  # unclassified

    # ── Rabies / Lyssavirus ────────────────────────────────────────────────
    elif vid == "rabies":
        LYSSA_MAP = [
            ("australian bat lyssavirus", "ABLV"),
            ("european bat lyssavirus 1", "EBLV-1"),
            ("european bat lyssavirus 2", "EBLV-2"),
            ("lagos bat virus",           "LBV"),
            ("mokola virus",              "MOKV"),
            ("duvenhage virus",           "DUVV"),
            ("irkut virus",               "IRKV"),
            ("west caucasian bat virus",  "WCBV"),
        ]
        gt = "RABV"
        for phrase, abbr in LYSSA_MAP:
            if phrase in org_l:
                gt = abbr
                break
        _set(gt)

    # ── Zika ───────────────────────────────────────────────────────────────
    elif vid == "zika":
        african_strains  = ("mr766","dak","ard","ibh")
        asian_strains    = ("prvabc59","h/pf","beh","flr","sph","yap")
        combined = strain_l + " " + title.lower()
        gt = None
        if any(s in combined for s in african_strains):
            gt = "African"
        elif any(s in combined for s in asian_strains):
            gt = "Asian"
        else:
            # Heuristic: African countries pre-2010 → African, else Asian
            africa_countries = {
                "uganda","nigeria","senegal","guinea","cameroon","gabon",
                "ivory coast","cote d'ivoire","kenya","tanzania","ethiopia",
            }
            ctry_l = (doc.get("COUNTRY_ONLY") or "").lower()
            yr     = doc.get("YEAR") or 9999
            if ctry_l in africa_countries and yr < 2010:
                gt = "African"
            else:
                gt = "Asian"
        _set(gt)

    # ── Chikungunya ────────────────────────────────────────────────────────
    elif vid == "chikungunya":
        combined = strain_l + " " + org_l + " " + title.lower()
        if "ecsa" in combined or "east/central/south" in combined or "east african" in combined:
            if "_iol" in combined or "indian ocean" in combined:
                gt = "IOL"
            else:
                gt = "ECSA"
        elif "west africa" in combined or "west african" in combined:
            gt = "West African"
        elif "asian" in combined:
            gt = "Asian"
        elif "_iol" in combined or "indian ocean" in combined:
            gt = "IOL"
        else:
            # Country-based fallback
            asia_countries = {
                "india","thailand","indonesia","malaysia","singapore",
                "philippines","sri lanka","myanmar","vietnam","china",
            }
            ctry_l = (doc.get("COUNTRY_ONLY") or "").lower()
            yr     = doc.get("YEAR") or 9999
            if ctry_l in asia_countries:
                gt = "Asian"
            elif yr >= 2005:
                gt = "ECSA"
            else:
                gt = "West African"
        _set(gt)

    # ── Norovirus ──────────────────────────────────────────────────────────
    elif vid == "norovirus":
        combined = org_l + " " + strain_l + " " + title.lower()
        # Detailed genotype e.g. GII.4, GI.1
        m = _re.search(r'(G(?:I{1,2})(?:\.\d+)?)', org + " " + strain + " " + title, _re.I)
        if m:
            detailed = m.group(1).upper()
            # Normalise: GII → correct case
            detailed = _re.sub(r'^GII', 'GII', _re.sub(r'^GI(?!I)', 'GI', detailed))
            genogroup = "GII" if detailed.upper().startswith("GII") else "GI"
            doc["genogroup"]         = genogroup
            doc["norovirus_genotype"] = detailed
            _set(detailed)
        elif "genogroup ii" in combined or "norovirus ii" in combined:
            doc["genogroup"] = "GII"
            _set("GII")
        elif "genogroup i" in combined or "norovirus i" in combined:
            doc["genogroup"] = "GI"
            _set("GI")

    # ── CCHF / Crimean-Congo ───────────────────────────────────────────────
    elif vid == "crimean":
        combined = org_l + " " + strain_l + " " + title.lower()
        CCHF_CLADES = [
            ("europe-1", "Europe-1"), ("europe-2", "Europe-2"),
            ("asia-1",   "Asia-1"),   ("asia-2",   "Asia-2"),
            ("africa-1", "Africa-1"), ("africa-2", "Africa-2"),
            ("africa-3", "Africa-3"),
            ("crimea",   "Europe-1"),  # historical "Crimean" isolates
        ]
        gt = None
        for kw, label in CCHF_CLADES:
            if kw in combined:
                gt = label
                break
        if gt:
            _set(gt)

    # ── SIV ────────────────────────────────────────────────────────────────
    elif vid == "siv":
        SIV_MAP = [
            (r'siv\s*cpz\b|chimpanzee',    "SIVcpz"),
            (r'siv\s*mac\b|macaque',        "SIVmac"),
            (r'siv\s*agm\b|african green',  "SIVagm"),
            (r'siv\s*sm\b|sooty mangabey',  "SIVsm"),
            (r'siv\s*col\b|colobus|colobine',"SIVcol"),
            (r'siv\s*gor\b|gorilla',         "SIVgor"),
            (r'siv\s*rcm\b|red.capped',      "SIVrcm"),
            (r'siv\s*mnd\b|mandrill',        "SIVmnd"),
            (r'siv\s*lho\b|lhoest',          "SIVlhoest"),
            (r'siv\s*sun\b|sun-tailed',      "SIVsun"),
        ]
        combined_for_siv = org_l + " " + strain_l
        species = None
        for pattern, label in SIV_MAP:
            if _re.search(pattern, combined_for_siv, _re.I):
                species = label
                break
        if not species:
            # Generic extraction: SIV<abbr> from organism
            m = _re.search(r'\bSIV([a-z]{2,5})\b', org, _re.I)
            if m:
                species = f"SIV{m.group(1).lower()}"
        if species:
            doc["siv_species"] = species
            _set(species)

    # ── FIV ────────────────────────────────────────────────────────────────
    elif vid == "fiv":
        combined = strain_l + " " + org_l + " " + title.lower()
        m = _re.search(r'clade[- ]?([a-eA-E])', combined, _re.I)
        if m:
            _set(f"Clade {m.group(1).upper()}")

    # ── HERV ───────────────────────────────────────────────────────────────
    elif vid == "herv":
        combined = org_l + " " + strain_l + " " + title.lower()
        HERV_MAP = [
            ("herv-k",                          "HERV-K"),
            ("endogenous retrovirus k",         "HERV-K"),
            ("herv-h",                          "HERV-H"),
            ("endogenous retrovirus h",         "HERV-H"),
            ("herv-w",                          "HERV-W"),
            ("syncytin",                        "HERV-W"),
            ("herv-e",                          "HERV-E"),
            ("herv-i",                          "HERV-I"),
        ]
        gt = None
        for kw, label in HERV_MAP:
            if kw in combined:
                gt = label
                break
        if not gt:
            m = _re.search(r'HERV-?([A-Z]+\d*)', org + " " + title, _re.I)
            if m:
                gt = f"HERV-{m.group(1).upper()}"
        if gt:
            _set(gt)

    # ── MLV ────────────────────────────────────────────────────────────────
    elif vid == "mlv":
        combined = org_l + " " + strain_l + " " + title.lower()
        if "ecotropic" in combined:
            _set("Ecotropic")
        elif "amphotropic" in combined:
            _set("Amphotropic")
        elif "xenotropic" in combined:
            _set("Xenotropic")
        elif "polytropic" in combined or "mink cell focus" in combined or "mcf" in combined:
            _set("Polytropic")

    # ── MERS-CoV ───────────────────────────────────────────────────────────
    elif vid == "merscov":
        combined = strain_l + " " + org_l + " " + title.lower()
        # Known clade A reference strains
        clade_a_markers = ("hcov-emc", "emc/2012", "bisha", "sa1", "bat-hku4", "bat-hku5")
        if any(m in combined for m in clade_a_markers):
            _set("Clade A")
        else:
            m = _re.search(r'clade[- ]?([ab])', combined, _re.I)
            if m:
                _set(f"Clade {m.group(1).upper()}")
            else:
                _set("Clade B")  # vast majority of MERS-CoV sequences

    # ── MERS-SARS (SARS-CoV-1) ────────────────────────────────────────────
    elif vid == "merssars":
        combined = strain_l + " " + org_l + " " + title.lower()
        early_markers  = ("urbani","gd01","bj01","bj02","cuhk","sin2500","sin2677","sin2679","sin2748")
        late_markers   = ("frankfurt","hanoi","tor2","twc","twh","hkc")
        if any(m in combined for m in early_markers):
            _set("Early (2002–2003)")
        elif any(m in combined for m in late_markers):
            _set("Late (2003)")
        else:
            _set("SARS-CoV-1")

    # ── Mumps ──────────────────────────────────────────────────────────────
    elif vid == "mumps":
        combined = strain_l + " " + org_l + " " + title.lower()
        # Genotype is a single letter A–N
        m = _re.search(r'\bgenotype[- ]?([a-nA-N])\b', combined)
        if not m:
            m = _re.search(r'\b([a-nA-N])\s*genotype\b', combined)
        if not m:
            # Try extracting from strain: letters that look like a standalone genotype tag
            m = _re.search(r'[/_]([A-N])(?:[/_]|$)', strain)
        if m:
            _set(f"Genotype {m.group(1).upper()}")

    # ── Avian flu ──────────────────────────────────────────────────────────
    elif vid == "avianflu":
        # Try to extract from organism name e.g. "Influenza A virus (H5N1)"
        if not doc.get("influenza_subtype"):
            m = _re.search(r'\(H(\d+)N(\d+)\)', org)
            if m:
                doc["influenza_subtype"] = f"H{m.group(1)}N{m.group(2)}"
        if doc.get("influenza_subtype"):
            _set(doc["influenza_subtype"])
        else:
            # Fallback: try title
            m = _re.search(r'H(\d+)N(\d+)', title)
            if m:
                sub = f"H{m.group(1)}N{m.group(2)}"
                doc["influenza_subtype"] = sub
                _set(sub)

    # ── Oropouche ──────────────────────────────────────────────────────────
    elif vid == "oropouche":
        combined = strain_l + " " + org_l + " " + title.lower()
        if "reassortant" in combined:
            _set("Reassortant")
        else:
            m = _re.search(r'clade[- ]?([a-bA-B])', combined, _re.I)
            if m:
                _set(f"Clade {m.group(1).upper()}")
            elif "lineage i" in combined or "lineage 1" in combined:
                _set("Lineage I")
            elif "lineage ii" in combined or "lineage 2" in combined:
                _set("Lineage II")

    # ── RVF (Rift Valley Fever) ────────────────────────────────────────────
    elif vid == "riftvalley":
        combined = strain_l + " " + org_l + " " + title.lower()
        # Clades A–K
        m = _re.search(r'\bclade[- ]?([a-kA-K])\b', combined, _re.I)
        if m:
            _set(f"Clade {m.group(1).upper()}")

    # ── Y. pestis ──────────────────────────────────────────────────────────
    elif vid == "yersinia":
        combined = org_l + " " + strain_l + " " + title.lower()
        PESTIS_MAP = [
            ("antiqua",    "Antiqua"),
            ("mediaevalis","Mediaevalis"),
            ("orientalis", "Orientalis"),
            ("microtus",   "Microtus"),
            ("pestoides",  "Pestoides"),
        ]
        for kw, label in PESTIS_MAP:
            if kw in combined:
                _set(label)
                break



NCBI_TERMS = {
    "influenzab": ('Influenza B virus[Organism]',                           15_000, {}),
    "adenovirus": ('Mastadenovirus[Organism]',                              10_000, {}),   # covers all human adenovirus A-G
    "varicella":  ('Varicellovirus[Organism] AND complete[Title]',          10_000, {}),
    "rotavirus":  ('Rotavirus A[Organism]',                                 10_000, {"genotype":"genotype"}),
    "enterovirus":('Enterovirus[Organism] AND complete genome[Title]',      10_000, {"genotype":"genotype"}),
    "polio":      ('Poliovirus[Organism]',                                   8_000, {"serotype":"serotype"}),
    "hepatitisa": ('Hepatitis A virus[Organism]',                            8_000, {"genotype":"genotype"}),
    "hepatitisb": ('Hepatitis B virus[Organism] AND complete genome[Title]', 10_000, {"genotype":"genotype"}),
    "hepatitisc": ('Hepacivirus C[Organism]',                               10_000, {"genotype":"genotype"}),
    "hsv":        ('(Human alphaherpesvirus 1[Organism] OR Human alphaherpesvirus 2[Organism])',
                                                                             8_000, {}),   # dropped "complete genome" filter — too restrictive
    "cmv":        ('Human cytomegalovirus[Organism]',                        8_000, {}),   # correct NCBI name (betaherpesvirus 5 → 364 records only)
    "piv":        ('(Human respirovirus 1[Organism] OR Human respirovirus 3[Organism] OR Human rubulavirus 2[Organism] OR Human rubulavirus 4[Organism])',
                                                                             8_000, {}),   # PIV-1,3 = respirovirus; PIV-2,4 = rubulavirus
    "rhinovirus": ('Rhinovirus[Organism]',                                   8_000, {"genotype":"genotype"}),
    "hcov":       ('(Human coronavirus OC43[Organism] OR Human coronavirus NL63[Organism] OR Human coronavirus 229E[Organism] OR Human coronavirus HKU1[Organism])',
                                                                             8_000, {}),
    "hmpv":       ('Human metapneumovirus[Organism]',                        8_000, {}),
    "westnile":   ('West Nile virus[Organism] AND complete genome[Title]',   8_000, {"clade":"clade"}),
    "parvovirus": ('Primate erythroparvovirus 1[Organism]',                  5_000, {"genotype":"genotype"}),
    "htlv":       ('Human T-lymphotropic virus 1[Organism] OR Human T-lymphotropic virus 2[Organism]',
                                                                             5_000, {}),
    "hiv":        ('Human immunodeficiency virus 1[Organism] AND complete genome[Title]',
                                                                            15_000, {"hiv_type":"genotype"}),
    # ── Haemorrhagic fever ────────────────────────────────────────────────────
    "ebola":      ('Ebolavirus[Organism]',                                   3_000, {}),   # species from organism field
    "marburg":    ('Marburgvirus[Organism]',                                   500, {}),   # all available
    "lassa":      ('Lassa mammarenavirus[Organism]',                         3_000, {}),   # lineage from strain
    "crimean":    ('Crimean-Congo hemorrhagic fever orthonairovirus[Organism]',
                                                                             3_000, {}),   # clade from organism/strain
    "riftvalley": ('Rift Valley fever phlebovirus[Organism]',                2_000, {}),   # clade from strain
    "nipah":      ('Nipah henipavirus[Organism]',                              500, {}),   # NiV-M / NiV-B from strain
    "rabies":     ('Lyssavirus rabies[Organism] OR Rabies lyssavirus[Organism]',
                                                                             5_000, {}),   # species from organism
    # ── Arboviruses ──────────────────────────────────────────────────────────
    "zika":       ('Zika virus[Organism]',                                   5_000, {}),   # lineage from strain / country
    "chikungunya":('Chikungunya virus[Organism]',                            5_000, {}),   # lineage from strain
    "oropouche":  ('Oropouche orthobunyavirus[Organism]',                    2_000, {}),   # clade from strain
    # ── Respiratory / other ──────────────────────────────────────────────────
    "norovirus":  ('Norovirus[Organism]',                                    5_000, {"subtype":"subtype"}),  # genogroup from subtype/title
    "mumps":      ('Mumps orthorubulavirus[Organism] OR Mumps virus[Organism]',
                                                                             3_000, {"subtype":"subtype"}),  # genotype letter from subtype
    "avianflu":   ('Influenza A virus[Organism] AND (H5N1 OR H5N2 OR H5N6 OR H5N8 OR H7N9 OR H9N2)',
                                                                             5_000, {"influenza_subtype":"subtype"}),
    # ── Coronaviruses ────────────────────────────────────────────────────────
    "merscov":    ('Middle East respiratory syndrome-related coronavirus[Organism]',
                                                                             3_000, {}),   # clade from strain
    "merssars":   ('Severe acute respiratory syndrome-related coronavirus[Organism]',
                                                                             2_000, {}),   # SARS-CoV-1 only
    # ── Retroviruses (animal / comparative) ──────────────────────────────────
    "siv":        ('Simian immunodeficiency virus[Organism]',                8_000, {"siv_host":"host"}),
    "fiv":        ('Feline immunodeficiency virus[Organism]',                3_000, {}),
    "mlv":        ('Murine leukemia virus[Organism]',                        2_000, {}),
    "herv":       ('Human endogenous retrovirus[Organism]',                  1_000, {}),
    # ── Bacterial ────────────────────────────────────────────────────────────
    "yersinia":   ('Yersinia pestis[Organism]',                              3_000, {}),   # biovar from organism/strain
    # ── Fungal ───────────────────────────────────────────────────────────────
    "cauris":     ('Candida auris[Organism]',                                5_000, {}),
    # ── Zoonotic / expanded ───────────────────────────────────────────────
    "hantavirus": ('Hantaviridae[Family]',                                  15_000, {}),  # species extracted from organism field
    "hpv":        ('Human papillomavirus[Organism]',                        15_000, {}),  # type extracted from organism field
}

def ncbi_search(term, retmax):
    r = requests.get("https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi",
        params={"db":"nucleotide","term":term,"retmax":retmax,
                "retmode":"json","email":NCBI_EMAIL}, timeout=30)
    r.raise_for_status()
    data = r.json()
    ids = data.get("esearchresult",{}).get("idlist",[])
    log(f"  {len(ids)} IDs from esearch")
    return ids

def ncbi_summaries(ids):
    all_recs = []
    for i in range(0, len(ids), 200):
        chunk = ids[i:i+200]
        for attempt in range(4):
            try:
                r = requests.get("https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi",
                    params={"db":"nucleotide","id":",".join(chunk),
                            "retmode":"json","email":NCBI_EMAIL}, timeout=60)
                r.raise_for_status()
                result = r.json().get("result", {})
                uids = result.get("uids", [])
                for uid in uids:
                    rec = result.get(uid, {})
                    if rec and "accessionversion" in rec:
                        all_recs.append(rec)
                break
            except Exception as e:
                if attempt == 3: log(f"  batch failed: {e}")
                time.sleep(1.5 ** attempt)
        time.sleep(0.35)   # 3 req/s limit
        sys.stdout.write(f"\r  {len(all_recs):,} summaries …"); sys.stdout.flush()
    print()
    return all_recs

def dl_ncbi(vid, term, limit, extra_fields, col):
    ids = ncbi_search(term, limit)
    if not ids: return 0
    summaries = ncbi_summaries(ids)
    ops, n = [], 0
    for s in summaries:
        acc = s.get("accessionversion","").strip()
        if not acc: continue
        subtype = s.get("subtype","")
        subname = s.get("subname","")
        pairs   = dict(zip(subtype.split("|"), subname.split("|"))) if subtype else {}
        # NCBI stores country as "Country: Region" — keep only the country part
        raw_ctry = pairs.get("country","").strip()
        ctry     = raw_ctry.split(":")[0].strip() if raw_ctry else ""
        col_dt  = pairs.get("collection_date","").strip()
        yr      = parse_year(col_dt)
        doc = {
            "accession":    acc,
            "title":        s.get("title",""),
            "organism":     s.get("organism",""),
            "length":       s.get("slen",0),
            "source_db":    "NCBI",
            "ORGANISM":     vid,
            "COUNTRY_ONLY": ctry, "country": ctry,
            "host":         pairs.get("host",""),
            "collection_date": col_dt, "date": col_dt,
        }
        if yr: doc.update({"YEAR":yr,"DATE":yr})
        for dst,src in extra_fields.items():
            v = pairs.get(src,"").strip()
            if v: doc[dst] = v
        # Virus-specific enrichment
        if vid == "hantavirus":
            org = doc.get("organism","").lower()
            isolate = pairs.get("isolate","").split("/")[0].strip().upper()
            HANTA_MAP = {
                "andesense":"ANDV","andes":"ANDV","andv":"ANDV",
                "hantaane":"HTNV","hantaan":"HTNV","htnv":"HTNV",
                "puumalaense":"PUUV","puumala":"PUUV","puuv":"PUUV",
                "seoulense":"SEOV","seoul":"SEOV","seov":"SEOV",
                "sin nombre":"SNV","sinombre":"SNV","snv":"SNV",
                "dobrava":"DOBV","belgrade":"DOBV","dobv":"DOBV",
                "fugongense":"FUGV","tula":"TULV","thailand":"THAIV",
            }
            species = None
            for k, abbr in HANTA_MAP.items():
                if k in org or k in isolate.lower():
                    species = abbr; break
            if species:
                doc["hanta_species"] = species
                doc["GENOTYPE"] = species

        if vid == "hpv":
            # Extract HPV type from isolate or organism (e.g., "Human papillomavirus 16")
            org = doc.get("organism","")
            m = _re.search(r'(?:HPV|papillomavirus)[- ]?(\d+[a-z]?)', org, _re.I)
            if m:
                doc["hpv_type"] = f"HPV{m.group(1).upper()}"
                doc["GENOTYPE"]  = doc["hpv_type"]

        # Store isolate/strain from pairs for genotype enrichment
        for _pf in ("isolate","strain"):
            _pv = pairs.get(_pf,"").strip()
            if _pv and not doc.get(_pf):
                doc[_pf] = _pv

        # Virus-specific genotype enrichment (covers all NCBI viruses)
        _enrich_genotype(vid, doc)

        if not doc.get("GENOTYPE"):
            for k in ("genotype","lineage","clade","serotype","type"):
                v = pairs.get(k,"")
                if v: doc["GENOTYPE"] = v; break
        ops.append(UpdateOne({"accession":acc},{"$set":doc},upsert=True))
        n += 1
        if len(ops) >= BATCH:
            flush_ops(col, ops); sys.stdout.write(f"\r  {n:,} …"); sys.stdout.flush()
    flush_ops(col, ops)
    log(f"\n  ✓ {n:,} for {vid}")
    return n

# ── main ───────────────────────────────────────────────────────────────────────
def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--virus")
    ap.add_argument("--limit", type=int)
    ap.add_argument("--source", choices=["nextstrain","ncbi","all"], default="all")
    args = ap.parse_args()

    client = MongoClient(MONGO_URI)
    log("MongoDB connected")
    total = 0

    def col(vid): return client[vid]["genomes"]

    # Viruses whose TSV is sorted alphabetically — need reservoir sampling
    RESERVOIR_VIRUSES = {"covid19"}
    # Map download key → target MongoDB database (for RSV-B → rsv)
    TSV_DB_MAP = {"rsvb": "rsv"}

    if args.source in ("nextstrain","all"):
        for vid,(url,fmap,lim) in NEXTSTRAIN_TSV.items():
            target = TSV_DB_MAP.get(vid, vid)   # e.g. rsvb → rsv
            if args.virus and args.virus not in (vid, target): continue
            log(f"\n── Nextstrain TSV: {vid} → db:{target}")
            use_reservoir = (vid in RESERVOIR_VIRUSES) and not args.limit
            try: total += dl_nextstrain_tsv(target, url, fmap, args.limit or lim, col(target),
                                             reservoir=use_reservoir)
            except Exception as e: log(f"  ERROR: {e}")

        for vid,urls in NEXTSTRAIN_JSON.items():
            if args.virus and args.virus != vid: continue
            log(f"\n── Nextstrain JSON: {vid}")
            try: total += dl_nextstrain_json(vid, urls, (args.limit or 5000)//4, col(vid))
            except Exception as e: log(f"  ERROR: {e}")

    if args.source in ("ncbi","all"):
        for vid,(term,lim,extra) in NCBI_TERMS.items():
            if args.virus and args.virus != vid: continue
            log(f"\n── NCBI: {vid}")
            try: total += dl_ncbi(vid, term, args.limit or lim, extra, col(vid))
            except Exception as e: log(f"  ERROR: {e}")

    log(f"\n✓ Total upserted: {total:,}")
    client.close()

if __name__ == "__main__":
    main()
