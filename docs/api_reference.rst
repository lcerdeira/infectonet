API Reference
=============

The InfectoNET public API is a REST API that returns **JSON**. No authentication
is required. The base URL is:

.. code-block:: text

   https://infectonet.org/api

All responses are cached server-side (``Cache-Control`` headers are set). If
you are running InfectoNET locally the base URL is ``http://localhost:3000/api``.

.. contents:: Endpoints
   :local:
   :depth: 1

----

.. _get-api-viruses:

GET /api/viruses
----------------

Returns the complete catalogue of pathogens with metadata and sequence counts.

**URL**::

   GET /api/viruses

**Query parameters:** none

**Response**

An array of pathogen objects.

.. code-block:: javascript

   [
     {
       "id":     "dengue",
       "label":  "Dengue virus",
       "abbr":   "Dengue",
       "family": "Flaviviridae",
       "genome": "ssRNA(+)",
       "group":  "vector_borne",
       "color":  "#10B981",
       "count":  9893
     },
     // ... one object per pathogen
   ]

.. list-table:: Response fields
   :widths: 20 15 65
   :header-rows: 1

   * - Field
     - Type
     - Description
   * - ``id``
     - string
     - Unique pathogen identifier (use in other API calls)
   * - ``label``
     - string
     - Full display name
   * - ``abbr``
     - string
     - Short abbreviation
   * - ``family``
     - string
     - Virus family (ICTV classification)
   * - ``genome``
     - string
     - Genome type (``ssRNA(+)``, ``ssRNA(-)``, ``dsDNA``, etc.)
   * - ``group``
     - string
     - Disease category (``respiratory``, ``vector_borne``, etc.)
   * - ``color``
     - string
     - Hex colour for the group (used in the UI)
   * - ``count``
     - integer
     - Total sequences in the InfectoNET database. ``0`` means data
       has not yet been loaded for this pathogen.

**Cache:** ``public, s-maxage=60, stale-while-revalidate=30``

**Example**

.. code-block:: bash

   $ curl https://infectonet.org/api/viruses | python3 -m json.tool | head -40

----

GET /api/viruses/:id
---------------------

Returns sequence records for a single pathogen. Records are paginated and
lightly normalised (country names, year extraction, genotype resolution).

**URL**::

   GET /api/viruses/{id}

**Path parameter**

.. list-table::
   :widths: 15 15 70
   :header-rows: 1

   * - Parameter
     - Type
     - Description
   * - ``id``
     - string
     - Pathogen identifier — must match a value from :ref:`get-api-viruses`

**Query parameters**

.. list-table::
   :widths: 15 15 10 60
   :header-rows: 1

   * - Parameter
     - Type
     - Default
     - Description
   * - ``page``
     - integer
     - ``1``
     - Page number (1-indexed)
   * - ``limit``
     - integer
     - ``5000``
     - Records per page. Maximum is **50 000**.
   * - ``fields``
     - string
     - —
     - *(Reserved — not yet active.)* Comma-separated list of fields
       to include in the projection.

**Response**

.. code-block:: javascript

   {
     "id":      "dengue",
     "total":   9893,
     "page":    1,
     "limit":   5000,
     "records": [
       {
         "COUNTRY":         "Brazil",
         "YEAR":            2023,
         "GENOTYPE":        "DENV-2",
         "collection_date": "2023-04-15",
         "host":            "Homo sapiens",
         "source_db":       "NCBI"
       }
       // ... up to <limit> records
     ]
   }

.. list-table:: Envelope fields
   :widths: 20 15 65
   :header-rows: 1

   * - Field
     - Type
     - Description
   * - ``id``
     - string
     - Pathogen ID echoed back
   * - ``total``
     - integer
     - Total records in the database (across all pages)
   * - ``page``
     - integer
     - Current page
   * - ``limit``
     - integer
     - Records per page (as requested, capped at 50 000)
   * - ``records``
     - array
     - Array of sequence record objects (see below)

.. list-table:: Common record fields
   :widths: 25 15 60
   :header-rows: 1

   * - Field
     - Type
     - Description
   * - ``COUNTRY``
     - string
     - Normalised country name (Natural Earth canonical)
   * - ``YEAR``
     - integer
     - Collection year extracted from ``collection_date``
   * - ``GENOTYPE``
     - string
     - Best available genotype / lineage / serotype label.
       Resolved from: ``GENOTYPE`` → ``genotype`` → ``pango_lineage``
       → ``hpv_type`` → ``hanta_species`` → ``LINEAGE`` → ``lineage``
       → ``clade`` → ``serotype`` → ``subtype``.
       Returns ``"Unknown"`` if none found.
   * - ``collection_date``
     - string
     - Original collection date string from the source database.
       Format varies (``YYYY-MM-DD``, ``YYYY-MM``, ``YYYY``).
   * - ``host``
     - string
     - Host organism (e.g. ``"Homo sapiens"``, ``"Gallus gallus"``)
   * - ``source_db``
     - string
     - Source repository: ``"NCBI"``, ``"GISAID"``, or ``"Nextstrain"``

Additional pathogen-specific fields may be present (see table below).

.. list-table:: Pathogen-specific fields
   :widths: 30 70
   :header-rows: 1

   * - Field
     - Present for
   * - ``pango_lineage``
     - COVID-19 (raw PANGO designation)
   * - ``clade``
     - COVID-19, RSV, dengue (Nextstrain clade)
   * - ``serotype``
     - Dengue (DENV-1 to DENV-4)
   * - ``hpv_type``
     - HPV (e.g. ``"HPV16"``)
   * - ``hanta_species`` / ``hanta_clade``
     - Hantavirus
   * - ``ebola_species``
     - Ebola (EBOV, SUDV …)
   * - ``lassa_lineage``
     - Lassa (I, II, III, IV)
   * - ``norovirus_genotype``
     - Norovirus (GI.1, GII.4 …)
   * - ``siv_species``
     - SIV
   * - ``hiv_type``
     - HIV (1 / 2)
   * - ``influenza_subtype``
     - Influenza A
   * - ``oseltamivir_susceptibility``
     - Influenza A/B (``"Susceptible"``, ``"Resistant"``)
   * - ``baloxavir_susceptibility``
     - Influenza A
   * - ``tecovirimat_susceptibility``
     - Mpox
   * - ``pi_susceptibility`` / ``nrti_susceptibility`` / ``nnrti_susceptibility`` / ``insti_susceptibility``
     - HIV

**Error responses**

.. list-table::
   :widths: 15 85
   :header-rows: 1

   * - Status
     - Meaning
   * - ``404``
     - Unknown pathogen ID (not in the virus catalogue — see :ref:`get-api-viruses`)
   * - ``503``
     - MongoDB is unavailable

**Cache:** ``public, s-maxage=300, stale-while-revalidate=60``

**Pagination example**

.. code-block:: bash

   # Page 1 — records 1–5000
   $ curl "https://infectonet.org/api/viruses/covid19?page=1&limit=5000"

   # Page 2 — records 5001–10000
   $ curl "https://infectonet.org/api/viruses/covid19?page=2&limit=5000"

**Python pagination helper**

.. code-block:: python

   import requests

   def fetch_all(virus_id, limit=5000):
       base = f"https://infectonet.org/api/viruses/{virus_id}"
       page, all_records = 1, []
       while True:
           r = requests.get(base, params={"page": page, "limit": limit})
           r.raise_for_status()
           data = r.json()
           all_records.extend(data["records"])
           if len(all_records) >= data["total"]:
               break
           page += 1
       return all_records

   records = fetch_all("dengue")
   print(f"Fetched {len(records)} records")

----

GET /api/viruses/:id/countries
--------------------------------

Returns country-level aggregates for a pathogen derived from **all** records
(not just the paginated sample). This is what powers the world map in the
dashboard.

**URL**::

   GET /api/viruses/{id}/countries

**Path parameter**

.. list-table::
   :widths: 15 15 70
   :header-rows: 1

   * - Parameter
     - Type
     - Description
   * - ``id``
     - string
     - Pathogen identifier

**Query parameters:** none

**Response**

.. code-block:: json

   {
     "id":    "dengue",
     "total": 9870,
     "countryStat": {
       "Brazil": {
         "count": 3241,
         "genotypeCounts": {
           "DENV-2": 1543,
           "DENV-1": 987,
           "DENV-3": 511,
           "Unknown": 200
         }
       },
       "Thailand": {
         "count": 1102,
         "genotypeCounts": {
           "DENV-1": 440,
           "DENV-2": 310,
           "DENV-3": 210,
           "DENV-4": 142
         }
       }
     }
   }

.. list-table:: Response fields
   :widths: 25 15 60
   :header-rows: 1

   * - Field
     - Type
     - Description
   * - ``id``
     - string
     - Pathogen ID echoed back
   * - ``total``
     - integer
     - Sum of all sequence counts across all countries
   * - ``countryStat``
     - object
     - Keys are normalised country names. Values are objects with
       ``count`` (integer) and ``genotypeCounts`` (object mapping
       genotype label → count).

Countries with missing or ambiguous location data (``"Unknown"``, ``"?"``,
``"N/A"``) are excluded. Up to 300 countries are returned, sorted by total
count descending.

**Cache:** ``public, s-maxage=300, stale-while-revalidate=60``

**Example — build a DataFrame of dengue country counts**

.. code-block:: python

   import requests, pandas as pd

   r = requests.get("https://infectonet.org/api/viruses/dengue/countries")
   stats = r.json()["countryStat"]

   rows = [
       {"country": c, "total": v["count"], **v["genotypeCounts"]}
       for c, v in stats.items()
   ]
   df = pd.DataFrame(rows).fillna(0).sort_values("total", ascending=False)
   print(df.head(10))

----

.. _get-api-outbreak:

GET /api/outbreak/:virus
-------------------------

Fetches and filters the WHO Disease Outbreak News and ReliefWeb RSS feeds for
a given virus. Returns up to 20 recent alerts sorted newest-first.

**URL**::

   GET /api/outbreak/{virus}

**Path parameter**

.. list-table::
   :widths: 15 15 70
   :header-rows: 1

   * - Parameter
     - Type
     - Description
   * - ``virus``
     - string
     - Pathogen identifier (same set as ``/api/viruses``)

**Query parameters:** none

**Response**

.. code-block:: json

   {
     "virus": "ebola",
     "items": [
       {
         "title":   "Ebola virus disease – Democratic Republic of the Congo",
         "link":    "https://www.who.int/emergencies/disease-outbreak-news/...",
         "pubDate": "2024-05-15T00:00:00Z",
         "summary": "WHO has been notified of a new Ebola virus disease ...",
         "source":  "WHO"
       }
     ]
   }

.. list-table:: Alert item fields
   :widths: 20 15 65
   :header-rows: 1

   * - Field
     - Type
     - Description
   * - ``title``
     - string
     - Article title (HTML stripped)
   * - ``link``
     - string
     - URL of the original article
   * - ``pubDate``
     - string
     - Publication date (ISO 8601 when available)
   * - ``summary``
     - string
     - First 300 characters of the article description (HTML stripped)
   * - ``source``
     - string
     - ``"WHO"`` or ``"ReliefWeb"``

**Supported virus IDs for outbreak monitoring**

``hantavirus``, ``ebola``, ``marburg``, ``mpox``, ``lassa``, ``crimean``,
``nipah``, ``dengue``, ``riftvalley``, ``oropouche``, ``covid19``,
``influenza``, ``influenzab``, ``avianflu``, ``rabies``, ``yellowfever``,
``chikungunya``, ``zika``, ``westnile``, ``measles``, ``mumps``,
``rubella``, ``varicella``, ``polio``, ``rotavirus``, ``adenovirus``,
``enterovirus``, ``norovirus``, ``hepatitisa``, ``hepatitisb``,
``hepatitisc``, ``hsv``, ``cmv``, ``piv``, ``rhinovirus``, ``hcov``,
``hmpv``, ``rsv``, ``parvovirus``, ``htlv``, ``hpv``, ``hiv``

**Cache:** ``public, s-maxage=1800, stale-while-revalidate=600`` (30 min)

**Example**

.. code-block:: bash

   $ curl https://infectonet.org/api/outbreak/mpox | python3 -m json.tool

----

Rate Limits & Fair Use
-----------------------

There are no enforced rate limits at this time. Please be considerate:

* For large bulk downloads, fetch pages sequentially rather than in parallel.
* Cache responses locally — the API sets ``s-maxage=300`` (5 min) on record
  endpoints and ``s-maxage=1800`` (30 min) on outbreak feeds.
* If you plan to mirror data or run automated jobs, please contact us at
  `infectonet@gmail.com <mailto:infectonet@gmail.com>`_ so we can ensure
  service availability.

Self-hosting
------------

You can run InfectoNET locally and point it at your own MongoDB instance:

.. code-block:: bash

   # Clone the repository
   $ git clone https://github.com/lcerdeira/infectonet.git
   $ cd infectonet

   # Install dependencies
   $ npm install

   # Set environment variables
   $ cp .env.example .env.local
   # Edit .env.local and set MONGODB_URI

   # Start the development server
   $ npm run dev
   # API is now available at http://localhost:3000/api
