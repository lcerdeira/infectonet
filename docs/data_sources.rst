Data Sources
============

InfectoNET integrates sequence metadata from four upstream repositories.
All data are stored in a local MongoDB instance; the original sequences
(FASTA) are **not** stored, only the metadata fields needed for
epidemiological analysis.

.. contents::
   :local:
   :depth: 1

NCBI GenBank
------------

**Website:** https://www.ncbi.nlm.nih.gov/genbank/

GenBank is the primary open-access nucleotide sequence repository maintained by
the National Center for Biotechnology Information (NCBI, USA). All viral
sequences submitted to GenBank are publicly available without login.

InfectoNET ingests GenBank records via the **NCBI Datasets** bulk download API.
Each record provides:

* Accession number (e.g. ``PP123456``)
* Collection date
* Geographic location (country / region)
* Host organism
* Virus name, type/subtype
* Isolate name

**Coverage:** All 50+ pathogens in the catalogue.

**Update frequency:** Periodic bulk downloads; frequency depends on pathogen
activity.

GISAID
------

**Website:** https://gisaid.org

GISAID (Global Initiative on Sharing All Influenza Data) provides the largest
curated database of influenza and emerging virus sequences. Data access requires
agreeing to the GISAID Data Access Agreement (DAA); redistribution of raw data
is prohibited.

InfectoNET reads GISAID metadata from **manually downloaded** XLS/XLSX/CSV
exports from the GISAID platform. Only metadata fields (no genome sequences)
are imported.

**GISAID databases used:**

.. list-table::
   :widths: 20 30 50
   :header-rows: 1

   * - Database
     - Abbreviation
     - Pathogens
   * - EpiFlu
     - —
     - Influenza A (all subtypes), Influenza B, Avian flu
   * - EpiArbo
     - —
     - Dengue, Zika, Chikungunya, West Nile, Yellow Fever, Oropouche,
       Rift Valley Fever
   * - EpiCoV
     - —
     - COVID-19 (SARS-CoV-2)
   * - EpiRSV
     - —
     - Respiratory Syncytial Virus (RSV)
   * - EpiPox
     - —
     - Mpox (monkeypox)

.. important::

   GISAID data is subject to the GISAID Data Access Agreement. It cannot be
   redistributed publicly. InfectoNET displays GISAID-derived **aggregated
   statistics** (counts per country, genotype trends) in compliance with the
   DAA; individual records from GISAID are not exposed via the public API in
   identifiable form.

**Import tool:** See :doc:`data_import` → :ref:`import-gisaid`.

Nextstrain
----------

**Website:** https://nextstrain.org / https://data.nextstrain.org

Nextstrain distributes open-data JSON files (``auspice`` format) for selected
pathogens. These files contain curated phylogenetic tree metadata with
Nextstrain clade annotations.

**Pathogens with Nextstrain open data:**

* COVID-19 (SARS-CoV-2) — Pango lineages + epoch clade names
* RSV-A, RSV-B — Nextstrain clades (A.1, B.1.1.1 …)
* Mpox — Clade I / Clade II
* Measles
* Dengue (DENV 1–4) — Nextstrain genotypes

Nextstrain records add a ``clade`` field used for genotype enrichment when
the ``pango_lineage`` is missing or unclassified.

Pathoplexus
-----------

**Website:** https://pathoplexus.org

Pathoplexus is a new open-access genomic database for outbreak pathogens,
operated by a consortium of public health institutions. Integration with
InfectoNET is **planned** but not yet implemented.

WHO Disease Outbreak News
--------------------------

**Website:** https://www.who.int/emergencies/disease-outbreak-news

The WHO DON RSS feed (``/csr/don/en/rss.xml``) is queried by the
:ref:`Outbreak Monitor <get-api-outbreak>` API endpoint.
This is a real-time news feed, not a sequence database; it is fetched
on-demand and cached for 30 minutes.

Field Normalisation
-------------------

When records arrive from different sources they use inconsistent field names
and value formats. InfectoNET applies the following normalisation steps at
import time (scripts) and at query time (API route handlers):

**Country names**
   Mapped to Natural Earth canonical names (e.g. ``"USA"`` → ``"United States of America"``,
   ``"UK"`` → ``"United Kingdom"``). This ensures the world map can join
   sequence data to map geometries correctly.

**Collection year**
   Extracted from whichever date field is present: ``collection_date``,
   ``DATE``, ``date``. GISAID dates can be ``"2024-05-21"``, ``"2024-05"``,
   ``"May-2024"``, or ``"2024"``; all are parsed to a 4-digit year.

**Genotype resolution**
   The API resolves the best available genotype label from a priority list
   of fields:
   ``GENOTYPE`` → ``genotype`` → ``pango_lineage`` → ``hpv_type`` →
   ``hanta_species`` → ``LINEAGE`` → ``lineage`` → ``clade`` →
   ``serotype`` → ``subtype``.
   Values of ``"Unknown"``, ``"unknown"``, ``"unclassifiable"`` are skipped.

**COVID-19 genotype enrichment**
   Run offline by ``scripts/enrich_covid19.py``. Maps 2,000+ raw PANGO
   lineages to 15 WHO variant-wave groups using prefix rules, with Nextstrain
   epoch clade names as fallback.

**RSV / Dengue enrichment**
   Run offline by ``scripts/enrich_rsv_dengue.py``. Resolves
   RSV-A/RSV-B from Nextstrain clade prefixes; maps DENV serotype + clade
   to DENV-1 through DENV-4 with genotype subgroups.
