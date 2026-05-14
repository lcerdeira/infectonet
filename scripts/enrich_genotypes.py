#!/usr/bin/env python3
"""
InfectoNET — in-place genotype enrichment
==========================================
Reads existing MongoDB records and fills GENOTYPE from whichever field
contains the information. No re-download needed.

Run:
  python3 scripts/enrich_genotypes.py               # all viruses
  python3 scripts/enrich_genotypes.py --virus mumps # one virus

Only updates records where GENOTYPE is '' / null / 'Unknown'.
"""
import argparse, os, re
from pymongo import MongoClient, UpdateOne

MONGO_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017")

def log(msg): print(f"  {msg}", flush=True)

client = MongoClient(MONGO_URI)

def enrich(db_name: str, fn, label: str):
    col = client[db_name]["genomes"]
    ops = []
    n = 0
    for doc in col.find({}, no_cursor_timeout=True):
        geno = fn(doc)
        if geno and geno != "Unknown":
            current = str(doc.get("GENOTYPE", "")).strip()
            if not current or current == "Unknown":
                ops.append(UpdateOne({"_id": doc["_id"]}, {"$set": {"GENOTYPE": geno}}))
                n += 1
                if len(ops) >= 2000:
                    col.bulk_write(ops, ordered=False); ops.clear()
    if ops:
        col.bulk_write(ops, ordered=False)
    log(f"{label}: updated {n:,} / {col.count_documents({}):,} records")


# ── 1. NOROVIRUS ─────────────────────────────────────────────────────────────
def geno_norovirus(doc):
    # VP1_type is the gold standard (e.g. "GII.4")
    for f in ("VP1_type", "VP1_group", "genogroup", "RdRp_type", "ORF2_type"):
        v = str(doc.get(f, "")).strip()
        if v and v != "XXXX-XX-XX":
            return v
    # Fallback: parse GI/GII from strain name
    strain = str(doc.get("strain", "") or doc.get("title", "")).strip()
    m = re.search(r'\b(G(?:I{1,2})\.\d+|G(?:I{1,2})[IVX]*)\b', strain, re.I)
    if m:
        return m.group(1).upper()
    return None


# ── 2. AVIAN FLU ─────────────────────────────────────────────────────────────
def geno_avianflu(doc):
    # subtype field already has "h5n1" — just uppercase it
    for f in ("influenza_subtype", "subtype"):
        v = str(doc.get(f, "")).strip()
        if v:
            return v.upper()
    # Parse from strain "A/bird/Country/num/year" — subtype not in name, skip
    return None


# ── 3. ZIKA ──────────────────────────────────────────────────────────────────
def geno_zika(doc):
    for f in ("lineage", "LINEAGE", "clade", "CLADE", "genotype"):
        v = str(doc.get(f, "")).strip()
        if v:
            return v
    # Many Nextstrain Zika records have lineage in title
    title = str(doc.get("title", "")).lower()
    if "african" in title: return "African"
    if "asian" in title:   return "Asian"
    return None


# ── 4. MUMPS ─────────────────────────────────────────────────────────────────
_MUMPS_GENO = re.compile(r'\[([A-N])\]', re.I)

def geno_mumps(doc):
    # WHO format: "MuVs/Place.Country/yy.week/num[G]"
    for f in ("strain", "title"):
        v = str(doc.get(f, "")).strip()
        m = _MUMPS_GENO.search(v)
        if m:
            return f"Genotype {m.group(1).upper()}"
    # Also check dedicated field (NCBI sometimes stores it)
    for f in ("genotype", "GENOTYPE"):
        v = str(doc.get(f, "")).strip()
        if v and len(v) <= 2 and v.upper() in "ABCDEFGHIJKLMN":
            return f"Genotype {v.upper()}"
    return None


# ── 5. EBOLA ─────────────────────────────────────────────────────────────────
_EBOLA_SPECIES = {
    "zaire":       "EBOV (Zaire)",
    "sudan":       "SUDV (Sudan)",
    "bundibugyo":  "BDBV (Bundibugyo)",
    "reston":      "RESTV (Reston)",
    "tai forest":  "TAFV (Taï Forest)",
    "bombali":     "MLAV (Bombali)",
}

def geno_ebola(doc):
    # Nextstrain species field
    sp = str(doc.get("species", "")).strip().lower()
    for k, v in _EBOLA_SPECIES.items():
        if k in sp:
            return v
    # Check organism and title
    for f in ("organism", "title", "strain"):
        txt = str(doc.get(f, "")).lower()
        for k, v in _EBOLA_SPECIES.items():
            if k in txt:
                return v
    # Nextstrain EBOV data focuses almost entirely on Zaire ebolavirus
    src = str(doc.get("source_db", "")).lower()
    if src in ("nextstrain", "pathoplexus"):
        return "EBOV (Zaire)"
    return None


# ── 6. MARBURG ───────────────────────────────────────────────────────────────
def geno_marburg(doc):
    org = str(doc.get("organism", "") or doc.get("title", "")).lower()
    if "ravn" in org:
        return "RAVV (Ravn)"
    if "marburgvirus" in org or "marburg" in org:
        return "MARV (Marburg)"
    return None


# ── 7. MERS-SARS (SARS-CoV-1) ────────────────────────────────────────────────
def geno_merssars(doc):
    org = str(doc.get("organism", "") or doc.get("title", "")).lower()
    if "sars" in org or "severe acute" in org:
        return "SARS-CoV-1"
    return "SARS-CoV-1"   # all 14 records are SARS-CoV-1


# ── 8. MERS-COV ──────────────────────────────────────────────────────────────
_MERS_CLADE_A = re.compile(r'hcov-emc|bisha|bisha|emc[_-]?2012|emc201[23]', re.I)

def geno_merscov(doc):
    for f in ("strain", "title", "genotype"):
        v = str(doc.get(f, "")).strip()
        if _MERS_CLADE_A.search(v):
            return "Clade A"
        if v:
            pass
    # Host: camel-derived sequences are mostly clade B
    host = str(doc.get("host", "") or doc.get("HOST", "")).lower()
    if "camel" in host or "dromedary" in host:
        return "Clade B (Camel)"
    # Human cases: most post-2014 are clade B
    return "Clade B"


# ── 9. RABIES ─────────────────────────────────────────────────────────────────
_LYSSAVIRUS = {
    "australian bat": "ABLV",
    "european bat lyssavirus 1": "EBLV-1",
    "european bat lyssavirus 2": "EBLV-2",
    "lagos bat": "LBV",
    "mokola": "MOKV",
    "duvenhage": "DUVV",
    "irkut": "IRKV",
}

def geno_rabies(doc):
    for f in ("organism", "title"):
        txt = str(doc.get(f, "")).lower()
        for k, v in _LYSSAVIRUS.items():
            if k in txt:
                return v
    return "RABV"   # Rabies lyssavirus — the vast majority


# ── 10. CHIKUNGUNYA ───────────────────────────────────────────────────────────
_CHIKV_LINEAGE = [
    (r'west.afric|west afric|senegal|nigeria.*196|nigeria.*195', "West African"),
    (r'ecsa|east.*central.*south|indian ocean|la.r[eé]union|reunion|IOL', "ECSA / IOL"),
    (r'asian|india.*2006|india.*2005|singapore|thailand|mala[iy]sia', "Asian"),
]

def geno_chikungunya(doc):
    for f in ("lineage", "LINEAGE", "clade", "genotype"):
        v = str(doc.get(f, "")).strip()
        if v: return v
    txt = " ".join([
        str(doc.get(f, "")) for f in ("strain", "title", "organism", "country")
    ]).lower()
    for pattern, label in _CHIKV_LINEAGE:
        if re.search(pattern, txt, re.I):
            return label
    return None


# ── 11. NIPAH ─────────────────────────────────────────────────────────────────
def geno_nipah(doc):
    for f in ("strain", "title", "organism", "country", "COUNTRY"):
        txt = str(doc.get(f, "")).lower()
        if "bangladesh" in txt or "bd" == txt or "india" in txt:
            return "NiV-B (Bangladesh)"
        if "malaysia" in txt or "my" == txt or "singapore" in txt:
            return "NiV-M (Malaysia)"
    return None


# ── 12. LASSA ─────────────────────────────────────────────────────────────────
_LASSA_LINEAGE = [
    (r'josiah|sierra leone|sl', "Lineage IV (Sierra Leone)"),
    (r'nigeria|nigeria', "Lineage II (Nigeria)"),
    (r'mali|guinea|cote d|ivory', "Lineage V (Mali/Guinea)"),
    (r'benin|togo', "Lineage III"),
]

def geno_lassa(doc):
    for f in ("lineage", "LINEAGE", "clade", "genotype"):
        v = str(doc.get(f, "")).strip()
        if v: return v
    txt = " ".join([str(doc.get(f, "")) for f in ("strain", "title", "country", "COUNTRY")]).lower()
    for pattern, label in _LASSA_LINEAGE:
        if re.search(pattern, txt, re.I):
            return label
    return None


# ── 13. RIFT VALLEY FEVER ─────────────────────────────────────────────────────
_RVF_CLADE = [
    (r'kenya|1977|ZH501|ZH548', "Clade A"),
    (r'egypt|1977|ZH501', "Clade A"),
    (r'madagascar|madagascar', "Clade H"),
    (r'south africa|SA', "Clade C"),
]

def geno_riftvalley(doc):
    for f in ("lineage", "clade", "genotype"):
        v = str(doc.get(f, "")).strip()
        if v: return v
    txt = " ".join([str(doc.get(f, "")) for f in ("strain", "title", "country")]).lower()
    for pattern, label in _RVF_CLADE:
        if re.search(pattern, txt, re.I):
            return label
    return None


# ── 14. CCHF ──────────────────────────────────────────────────────────────────
_CCHF_GENO = [
    (r'europe.1|balkans|greece|turkey|TRS|kosova|kosovo|spain',    "Europe-1"),
    (r'europe.2|tajikistan|iran.*199|UZB',                          "Asia-2"),
    (r'africa.1|nigeria|senegal|CAR|DRC|congo',                     "Africa-1"),
    (r'africa.2|mauritania|SA.*africa|south africa',                "Africa-2"),
    (r'africa.3|uganda|kenya.*CCHF|kenya.*19',                      "Africa-3"),
    (r'asia.1|china|pakistan|afghanistan|AFG|CHN|KAZ',              "Asia-1"),
    (r'middle east|oman|UAE|saudi|kuwait',                           "Middle East"),
]

def geno_cchf(doc):
    for f in ("lineage", "clade", "genotype"):
        v = str(doc.get(f, "")).strip()
        if v: return v
    txt = " ".join([str(doc.get(f, "")) for f in ("strain", "title", "country", "COUNTRY")]).lower()
    for pattern, label in _CCHF_GENO:
        if re.search(pattern, txt, re.I):
            return label
    return None


# ── 15. OROPOUCHE ─────────────────────────────────────────────────────────────
def geno_oropouche(doc):
    for f in ("lineage", "clade", "genotype"):
        v = str(doc.get(f, "")).strip()
        if v: return v
    txt = " ".join([str(doc.get(f, "")) for f in ("strain", "title", "country")]).lower()
    if "peru" in txt:
        return "Lineage I (South America)"
    if "brazil" in txt or "brasil" in txt or "be" in str(doc.get("strain",""))[:2].lower():
        return "Lineage I (South America)"
    if "trinidad" in txt or "caribbean" in txt or "TRVL" in str(doc.get("strain","")):
        return "Lineage I (Caribbean)"
    return "OROV (Lineage I)"   # All currently known sequences are lineage I


# ── 16. SIV ───────────────────────────────────────────────────────────────────
_SIV_SPECIES = [
    (r'cpz|chimpanzee|pan troglodytes', "SIVcpz"),
    (r'mac|macaque|rhesus|cynomolgus', "SIVmac"),
    (r'agm|african.?green|vervet|chlorocebus', "SIVagm"),
    (r'sm|sooty.?mangabey|cercocebus', "SIVsm"),
    (r'col|colobine|colobus', "SIVcol"),
    (r'gor|gorilla', "SIVgor"),
    (r'rcm|red.?capped|mandrillus', "SIVrcm"),
    (r'lhoest|l\'hoest|cercopithecus', "SIVlhoest"),
    (r'mnd|mandrill', "SIVmnd"),
    (r'deb|deBrazza', "SIVdeb"),
    (r'SIV([a-z]+)', None),  # regex capture fallback
]

def geno_siv(doc):
    txt = " ".join([str(doc.get(f,"")) for f in ("organism","title","strain")]).lower()
    for pattern, label in _SIV_SPECIES:
        if label is None:
            m = re.search(pattern, txt, re.I)
            if m:
                return f"SIV{m.group(1).lower()}"
        elif re.search(pattern, txt, re.I):
            return label
    return None


# ── 17. FIV ───────────────────────────────────────────────────────────────────
def geno_fiv(doc):
    txt = " ".join([str(doc.get(f,"")) for f in ("organism","title","strain")]).lower()
    m = re.search(r'clade[_\-\s]?([a-e])\b|subtype[_\-\s]?([a-e])\b', txt, re.I)
    if m:
        clade = (m.group(1) or m.group(2)).upper()
        return f"Clade {clade}"
    return None


# ── 18. HERV ──────────────────────────────────────────────────────────────────
_HERV_FAM = [
    (r'HML-2|HERV-K.*HML|HERV\.?K',              "HERV-K (HML-2)"),
    (r'HERV-H\b|endogenous retrovirus H\b',        "HERV-H"),
    (r'HERV-W\b|syncytin.?1|MSRV',               "HERV-W"),
    (r'HERV-E\b|endogenous retrovirus E\b',        "HERV-E"),
    (r'HERV-I\b|endogenous retrovirus I\b',        "HERV-I"),
    (r'HERV-FRD|syncytin.?2',                     "HERV-FRD"),
    (r'HERV-9',                                    "HERV-9"),
    (r'HERV-([A-Z0-9]+)',                          None),  # catch-all
]

def geno_herv(doc):
    txt = " ".join([str(doc.get(f,"")) for f in ("organism","title","strain")])
    for pattern, label in _HERV_FAM:
        if label is None:
            m = re.search(pattern, txt, re.I)
            if m:
                return f"HERV-{m.group(1).upper()}"
        elif re.search(pattern, txt, re.I):
            return label
    return None


# ── 19. MLV ───────────────────────────────────────────────────────────────────
def geno_mlv(doc):
    org = str(doc.get("organism","") or doc.get("title","")).lower()
    if "xenotropic"   in org: return "Xenotropic MLV"
    if "amphotropic"  in org: return "Amphotropic MLV"
    if "ecotropic"    in org: return "Ecotropic MLV"
    if "polytropic"   in org: return "Polytropic MLV"
    if "mink cell"    in org: return "Polytropic MLV"
    if "gammaretro"   in org: return "Gammaretrovirus"
    return None


# ── dispatch table ─────────────────────────────────────────────────────────────
ENRICHERS = {
    "norovirus":    (geno_norovirus,  "Norovirus  → VP1_type/VP1_group"),
    "avianflu":     (geno_avianflu,   "Avian flu  → subtype"),
    "zika":         (geno_zika,       "Zika       → lineage"),
    "mumps":        (geno_mumps,      "Mumps      → [X] from strain"),
    "ebola":        (geno_ebola,      "Ebola      → species field"),
    "marburg":      (geno_marburg,    "Marburg    → organism → MARV"),
    "merssars":     (geno_merssars,   "MERS-SARS  → SARS-CoV-1"),
    "merscov":      (geno_merscov,    "MERS-CoV   → Clade A/B"),
    "rabies":       (geno_rabies,     "Rabies     → RABV (default)"),
    "chikungunya":  (geno_chikungunya,"CHIKV      → lineage/pattern"),
    "nipah":        (geno_nipah,      "Nipah      → NiV-M/NiV-B"),
    "lassa":        (geno_lassa,      "Lassa      → lineage pattern"),
    "riftvalley":   (geno_riftvalley, "RVF        → clade pattern"),
    "crimean":      (geno_cchf,       "CCHF       → genotype/country"),
    "oropouche":    (geno_oropouche,  "Oropouche  → OROV lineage"),
    "siv":          (geno_siv,        "SIV        → species from title"),
    "fiv":          (geno_fiv,        "FIV        → clade from title"),
    "herv":         (geno_herv,       "HERV       → family from title"),
    "mlv":          (geno_mlv,        "MLV        → ecotype"),
}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--virus", help="Single virus ID to enrich")
    args = parser.parse_args()

    targets = [args.virus] if args.virus else list(ENRICHERS.keys())
    for vid in targets:
        if vid not in ENRICHERS:
            print(f"Unknown virus: {vid}")
            continue
        fn, label = ENRICHERS[vid]
        print(f"[{vid}] {label}")
        enrich(vid, fn, label)

    print("\nDone.")


if __name__ == "__main__":
    main()
