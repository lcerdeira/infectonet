Getting Started
===============

Accessing InfectoNET
--------------------

InfectoNET is freely available at **https://infectonet.org** — no account or
login is required to browse dashboards or query the API.

Navigating the Home Page
------------------------

The home page presents a **pathogen browser** organised by disease category:

.. list-table::
   :widths: 30 70
   :header-rows: 1

   * - Category
     - Colour
   * - Respiratory
     - Blue
   * - Vector-borne
     - Emerald
   * - Viral haemorrhagic fever
     - Red
   * - Zoonotic / neurological
     - Amber
   * - Childhood / vaccine-preventable
     - Violet
   * - Gastrointestinal
     - Orange
   * - Retroviral
     - Pink
   * - Other / emerging
     - Grey

Clicking any pathogen card opens its dedicated dashboard. Each card also shows
the total number of genomic sequences currently loaded in InfectoNET.

Opening a Pathogen Dashboard
-----------------------------

Navigate to::

   https://infectonet.org/en/dashboard/<virus-id>

Replace ``<virus-id>`` with one of the identifiers listed in :doc:`pathogens`.

**Example** — COVID-19 dashboard::

   https://infectonet.org/en/dashboard/covid19

Internationalisation
--------------------

The platform supports locale prefixes in the URL. The current supported locale
is ``en`` (English). Additional locales are planned.

::

   /en/dashboard/dengue   ← English

API Quick Start
---------------

No authentication is required. All endpoints return JSON.

**List all pathogens and their sequence counts:**

.. code-block:: bash

   $ curl https://infectonet.org/api/viruses

**Fetch sequence records for dengue:**

.. code-block:: bash

   $ curl "https://infectonet.org/api/viruses/dengue?limit=100"

**Get country-level aggregates for mpox:**

.. code-block:: bash

   $ curl https://infectonet.org/api/viruses/mpox/countries

**Check WHO outbreak alerts for Ebola:**

.. code-block:: bash

   $ curl https://infectonet.org/api/outbreak/ebola

For full parameter details see :doc:`api_reference`.

Python Quick Start
------------------

.. code-block:: python

   import requests, pandas as pd

   BASE = "https://infectonet.org/api"

   # Fetch the first 5,000 dengue records
   r = requests.get(f"{BASE}/viruses/dengue", params={"limit": 5000})
   r.raise_for_status()
   data = r.json()

   print(f"Total sequences: {data['total']}")
   df = pd.DataFrame(data["records"])
   print(df[["COUNTRY", "YEAR", "GENOTYPE"]].value_counts().head(20))

R Quick Start
-------------

.. code-block:: r

   library(httr2)
   library(dplyr)

   req  <- request("https://infectonet.org/api/viruses/dengue") |>
             req_url_query(limit = 5000)
   resp <- req_perform(req)
   data <- resp_body_json(resp, simplifyVector = TRUE)

   cat("Total sequences:", data$total, "\n")
   records <- as.data.frame(data$records)
   records |>
     count(COUNTRY, YEAR, GENOTYPE, sort = TRUE) |>
     head(20)
