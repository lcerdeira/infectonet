#!/usr/bin/env python3
"""
InfectoNET — RSV and Dengue GENOTYPE enrichment
=================================================
RSV:
  - Nextstrain records → clade field (A.x.x = RSV-A, B.x.x = RSV-B) → "RSV-A (A.3.1)"
  - NCBI records → organism field → "RSV-A" or "RSV-B"

Dengue:
  - Nextstrain records → serotype + clade → "DENV-1 (Genotype III)"
  - NCBI records → organism field → "DENV-1", "DENV-2", etc.

Run:
  python3 scripts/enrich_rsv_dengue.py
"""
import os, re
from pymongo import MongoClient, UpdateOne

MONGO_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
client = MongoClient(MONGO_URI)


def bulk_write(col, ops):
    if ops:
        col.bulk_write(ops, ordered=False)
        ops.clear()


# ── RSV ───────────────────────────────────────────────────────────────────────

def geno_rsv(doc):
    """Return GENOTYPE string for an RSV record."""
    # 1. Nextstrain clade field (e.g. 'A.3.1', 'B.1.2')
    clade = str(doc.get('clade', '') or '').strip()
    if clade and clade not in ('unassigned', 'Unknown', 'unknown'):
        if clade.startswith('A'):
            return f"RSV-A ({clade})"
        elif clade.startswith('B'):
            return f"RSV-B ({clade})"
        else:
            return f"RSV ({clade})"

    # 2. NCBI organism field
    org = str(doc.get('organism', '') or '').lower()
    title = str(doc.get('title', '') or doc.get('TITLE', '') or '').lower()

    for text in (org, title):
        if 'syncytial virus a' in text or 'hrsv/a' in text or 'rsv-a' in text \
                or 'type a' in text or '/a/' in text:
            return 'RSV-A'
        if 'syncytial virus b' in text or 'hrsv/b' in text or 'rsv-b' in text \
                or 'type b' in text or '/b/' in text:
            return 'RSV-B'
        if 'respiratory syncytial' in text:
            # Generic RSV without type info in organism or title
            # Try strain field: hRSV/A/... or hRSV/B/...
            strain = str(doc.get('strain', '') or '').lower()
            if '/a/' in strain or strain.startswith('a/'):
                return 'RSV-A'
            if '/b/' in strain or strain.startswith('b/'):
                return 'RSV-B'
            return 'RSV'

    return None


def enrich_rsv():
    col = client['rsv']['genomes']
    total = col.count_documents({})
    print(f"[rsv] {total:,} total records")

    ops, updated, skipped = [], 0, 0

    for doc in col.find({}, no_cursor_timeout=True):
        current = str(doc.get('GENOTYPE', '') or '').strip()
        if current and current != 'Unknown':
            skipped += 1
            continue

        geno = geno_rsv(doc)
        if geno:
            ops.append(UpdateOne(
                {'_id': doc['_id']},
                {'$set': {'GENOTYPE': geno}}
            ))
            updated += 1
        else:
            skipped += 1

        if len(ops) >= 2000:
            bulk_write(col, ops)
            print(f"  ... {updated:,} updated", end='\r', flush=True)

    bulk_write(col, ops)
    print(f"\n[rsv] updated {updated:,}, skipped {skipped:,}")

    print("Top GENOTYPE groups:")
    for r in col.aggregate([
        {'$match': {'GENOTYPE': {'$nin': ['', None]}}},
        {'$group': {'_id': '$GENOTYPE', 'count': {'$sum': 1}}},
        {'$sort': {'count': -1}},
        {'$limit': 12},
    ]):
        print(f"  {r['_id']}: {r['count']:,}")


# ── DENGUE ────────────────────────────────────────────────────────────────────

_SEROTYPE_FROM_ORG = [
    (r'dengue virus type 1|denv.?1|dengue 1\b', 'DENV-1'),
    (r'dengue virus type 2|denv.?2|dengue 2\b', 'DENV-2'),
    (r'dengue virus type 3|denv.?3|dengue 3\b', 'DENV-3'),
    (r'dengue virus type 4|denv.?4|dengue 4\b', 'DENV-4'),
]

_CLADE_GENO_RE = re.compile(r'DENV\d+/([IVX\d]+)', re.I)


def geno_dengue(doc):
    """Return GENOTYPE string for a Dengue record."""
    # 1. Nextstrain serotype field
    serotype = str(doc.get('serotype', '') or '').strip().upper()
    clade    = str(doc.get('clade', '') or '').strip()

    stype_map = {'DENV1': 'DENV-1', 'DENV2': 'DENV-2',
                 'DENV3': 'DENV-3', 'DENV4': 'DENV-4'}
    stype = stype_map.get(serotype, '')

    if stype:
        # Try to add genotype from clade (e.g. 'DENV1/III' → 'Genotype III')
        if clade and clade not in ('unassigned', 'Unknown', 'unknown'):
            m = _CLADE_GENO_RE.match(clade)
            if m:
                return f"{stype} (Genotype {m.group(1)})"
        return stype

    # 2. NCBI organism / title
    for field in ('organism', 'title', 'TITLE'):
        txt = str(doc.get(field, '') or '').lower()
        for pattern, label in _SEROTYPE_FROM_ORG:
            if re.search(pattern, txt, re.I):
                return label

    return None


def enrich_dengue():
    col = client['dengue']['genomes']
    total = col.count_documents({})
    print(f"\n[dengue] {total:,} total records")

    ops, updated, skipped = [], 0, 0

    for doc in col.find({}, no_cursor_timeout=True):
        current = str(doc.get('GENOTYPE', '') or '').strip()
        if current and current != 'Unknown':
            skipped += 1
            continue

        geno = geno_dengue(doc)
        if geno:
            ops.append(UpdateOne(
                {'_id': doc['_id']},
                {'$set': {'GENOTYPE': geno}}
            ))
            updated += 1
        else:
            skipped += 1

        if len(ops) >= 2000:
            bulk_write(col, ops)
            print(f"  ... {updated:,} updated", end='\r', flush=True)

    bulk_write(col, ops)
    print(f"\n[dengue] updated {updated:,}, skipped {skipped:,}")

    print("Top GENOTYPE groups:")
    for r in col.aggregate([
        {'$match': {'GENOTYPE': {'$nin': ['', None]}}},
        {'$group': {'_id': '$GENOTYPE', 'count': {'$sum': 1}}},
        {'$sort': {'count': -1}},
        {'$limit': 15},
    ]):
        print(f"  {r['_id']}: {r['count']:,}")


if __name__ == '__main__':
    enrich_rsv()
    enrich_dengue()
    print("\nDone.")
