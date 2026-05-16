Changelog
=========

All notable changes to InfectoNET are documented here.

v0.1 — 2026-05
--------------

Initial public release.

**Platform**

* Next.js 16 + React 19 dashboard with interactive world map, genotype
  trends chart, sample timeline, and pathogen-specific insight panels
* 50+ viral pathogens catalogued across 8 disease groups
* Outbreak Monitor with live WHO and ReliefWeb RSS integration
* Internationalisation (next-intl) with English locale

**API**

* ``GET /api/viruses`` — pathogen catalogue with sequence counts
* ``GET /api/viruses/:id`` — paginated sequence records (up to 50,000/page)
* ``GET /api/viruses/:id/countries`` — full country aggregation via
  MongoDB pipeline
* ``GET /api/outbreak/:virus`` — live outbreak alerts

**Data**

* NCBI GenBank import for all catalogued pathogens
* GISAID import script (``scripts/import_gisaid.py``) supporting XLS,
  XLSX, CSV, and TSV formats
* COVID-19 PANGO lineage → WHO variant-wave group enrichment
  (``scripts/enrich_covid19.py``)
* RSV-A/B and dengue DENV-1–4 enrichment
  (``scripts/enrich_rsv_dengue.py``)
* Country name normalisation to Natural Earth canonical names
* ``_scrollZoom`` race-condition fix in Plotly charts (``SafePlot``
  component with ``revision`` prop)

**Infrastructure**

* MongoDB: one database per pathogen, collection ``genomes``
* AWS EC2 production deployment (us-east-1)
* ``data/gisaid/`` gitignored to comply with GISAID ToS
