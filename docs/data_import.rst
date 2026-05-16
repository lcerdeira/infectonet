Data Import
===========

This section describes how to import data into the InfectoNET MongoDB database.
All import scripts live in the ``scripts/`` directory of the repository.

.. contents::
   :local:
   :depth: 1

Prerequisites
-------------

* Python 3.10+
* MongoDB running locally (or ``MONGODB_URI`` set in your environment)
* Required Python packages:

  .. code-block:: bash

     $ pip install pymongo openpyxl xlrd

* For GISAID imports: a GISAID data-access account and downloaded metadata
  files.

MongoDB Layout
--------------

Each pathogen occupies its own MongoDB **database**, named by the pathogen
``id``. Within each database there is a single collection: ``genomes``.

::

   MongoDB
   ├── dengue        ← database
   │   └── genomes   ← collection
   ├── covid19
   │   └── genomes
   ├── avianflu
   │   └── genomes
   └── ...

All import scripts upsert records by ``accession`` field, so re-running an
import is idempotent (existing records are updated, new ones inserted).

.. _import-gisaid:

Importing GISAID Data
---------------------

GISAID does not provide a public API. Data must be downloaded manually from
the GISAID platform (https://gisaid.org) and imported with the provided
script.

**Step 1 — Download from GISAID**

Log into GISAID and download the metadata file for the relevant database:

* **EpiFlu** — Influenza A, Influenza B, Avian flu — XLS format
* **EpiArbo** — Dengue, Zika, Chikungunya, West Nile, Yellow Fever,
  Oropouche, Rift Valley Fever — XLS or CSV
* **EpiCoV** — COVID-19 — CSV or TSV
* **EpiRSV** — RSV — CSV
* **EpiPox** — Mpox — CSV

Place the downloaded file inside ``data/gisaid/`` (this directory is
gitignored to comply with the GISAID Terms of Service):

.. code-block:: bash

   $ ls data/gisaid/
   h5n1_2024.xls   dengue_2024.csv   covid_metadata.tsv

**Step 2 — Run the import script**

.. code-block:: bash

   $ python3 scripts/import_gisaid.py <file> --virus <id>

**Arguments:**

.. list-table::
   :widths: 20 80
   :header-rows: 1

   * - Argument
     - Description
   * - ``<file>``
     - Path to the downloaded GISAID file (.xls, .xlsx, .csv, .tsv)
   * - ``--virus``
     - Pathogen ID (see table below)

**Supported ``--virus`` values:**

``avianflu``, ``influenza``, ``influenzab``, ``dengue``, ``zika``,
``chikungunya``, ``westnile``, ``yellowfever``, ``oropouche``,
``riftvalley``, ``covid19``, ``rsv``, ``mpox``, ``hantavirus``, ``nipah``,
``crimean``, ``lassa``, ``ebola``, ``marburg``

**Examples:**

.. code-block:: bash

   # Avian flu H5N1 from EpiFlu XLS
   $ python3 scripts/import_gisaid.py data/gisaid/h5n1.xls --virus avianflu

   # Seasonal influenza A (H3N2) from EpiFlu XLSX
   $ python3 scripts/import_gisaid.py data/gisaid/h3n2.xlsx --virus influenza

   # Influenza B from EpiFlu XLS
   $ python3 scripts/import_gisaid.py data/gisaid/flu_b.xls --virus influenzab

   # Dengue from EpiArbo CSV
   $ python3 scripts/import_gisaid.py data/gisaid/dengue.csv --virus dengue

   # COVID-19 metadata TSV from EpiCoV
   $ python3 scripts/import_gisaid.py data/gisaid/covid.tsv --virus covid19

   # RSV from EpiRSV CSV
   $ python3 scripts/import_gisaid.py data/gisaid/rsv.csv --virus rsv

   # Mpox from EpiPox CSV
   $ python3 scripts/import_gisaid.py data/gisaid/mpox.csv --virus mpox

**What the script does:**

1. Reads the file (XLS via ``xlrd``, XLSX via ``openpyxl``, CSV/TSV via ``csv``)
2. Detects column names using a flexible alias table
   (``Isolate_Id`` / ``Accession_ID`` / ``gisaid_epi_isl`` → accession, etc.)
3. For influenza files (``avianflu``, ``influenza``, ``influenzab``), filters to
   Hemagglutinin (HA / segment 4) rows only
4. Extracts country from GISAID's ``"Continent / Country / Region"`` format
5. Resolves genotype (H subtype for flu, DENV serotype for dengue, etc.)
6. Upserts each record by ``accession`` into MongoDB, marking ``source_db: "GISAID"``
7. Prints progress and final counts

.. code-block:: text

   [10:23:41] Reading h5n1.xls ...
   [10:23:42]   84,312 rows, 18 columns
   [10:23:42]   Columns: Isolate_Id, Isolate_Name, Type, Passage, Collection_Date ...
     ... 12,847 upserted
   [10:23:55]
   avianflu: upserted 12,847, skipped 71,465 (segment filter + no accession)
   [10:23:55] avianflu: now 12,847 total records (12,847 from GISAID)

   Done. Run enrich_genotypes.py if you want to backfill any missing GENOTYPE values.

Enriching COVID-19 Genotypes
-----------------------------

After importing COVID-19 data, run the enrichment script to map raw PANGO
lineages to WHO variant-wave group labels:

.. code-block:: bash

   $ python3 scripts/enrich_covid19.py

This script:

* Maps PANGO lineage prefixes to 15 variant-wave groups
  (Alpha, Delta, Omicron BA.1/BA.2/XBB/JN.1/KP …)
* Falls back to Nextstrain epoch clade names for records where
  PANGO is ``"unclassifiable"`` or absent
* Skips records already classified to avoid overwriting good data

Example output:

.. code-block:: text

   Found 74,858 COVID-19 records
   Skipping 60,000 already-classified records
   Processing 14,858 unclassified records ...
   Updated 14,205 records
   Final distribution:
     Delta (B.1.617.2)   19,784
     Omicron XBB         14,833
     Omicron BA.1        10,269
     ...

Enriching RSV and Dengue Genotypes
------------------------------------

.. code-block:: bash

   $ python3 scripts/enrich_rsv_dengue.py

Maps RSV Nextstrain clade codes to RSV-A / RSV-B, and dengue serotypes to
DENV-1 through DENV-4 with genotype subgroups.

Verifying Imports
-----------------

Use the API to verify that data loaded correctly:

.. code-block:: bash

   # Check sequence count
   $ curl https://localhost:3000/api/viruses | python3 -c \
     "import sys,json; d=json.load(sys.stdin); \
      [print(v['id'], v['count']) for v in d if v['count']>0]"

   # Check country distribution
   $ curl localhost:3000/api/viruses/dengue/countries | python3 -m json.tool | head -30

Environment Variables
---------------------

.. list-table::
   :widths: 30 70
   :header-rows: 1

   * - Variable
     - Description
   * - ``MONGODB_URI``
     - MongoDB connection string.
       Default: ``mongodb://localhost:27017``.
       Example: ``mongodb://user:pass@host:27017``
   * - ``NODE_ENV``
     - Set to ``development`` for local runs.

Set variables in ``.env.local`` (Next.js) or export them in your shell
before running Python scripts:

.. code-block:: bash

   $ export MONGODB_URI="mongodb://localhost:27017"
   $ python3 scripts/import_gisaid.py data/gisaid/dengue.csv --virus dengue
