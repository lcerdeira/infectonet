Introduction
============

What is InfectoNET?
-------------------

InfectoNET is a **FAIR** (Findable, Accessible, Interoperable, Reusable) genomic
surveillance dashboard for viral pathogens of global public-health importance.
It consolidates sequence metadata from multiple international repositories into
a single, normalised database and exposes that data through an interactive web
interface and a public JSON API.

The platform is designed for:

* **Epidemiologists** — tracking genotype distributions and geographic spread
* **Public health laboratories** — benchmarking local sequencing output against
  global trends
* **Researchers** — accessing aggregated, cleaned sequence metadata without
  needing to query each upstream database separately
* **One Health practitioners** — monitoring zoonotic spillover events and
  animal-origin genotypes alongside human clinical cases

FAIR Principles
---------------

.. list-table::
   :widths: 20 80
   :header-rows: 1

   * - Principle
     - How InfectoNET applies it
   * - **Findable**
     - All pathogen dashboards are accessible from a single catalogue page;
       data are indexed by virus ID, country, year, and genotype.
   * - **Accessible**
     - Sequence metadata is available via a public REST API (no authentication
       required). Source records link back to NCBI, GISAID, and Nextstrain.
   * - **Interoperable**
     - API responses use standard JSON. Country names are normalised to
       Natural Earth canonical names. Genotype fields follow WHO/Nextstrain
       naming conventions.
   * - **Reusable**
     - Data provenance (``source_db``) is stored with every record.
       Collection date, host, and geographic information are preserved from
       the original submission.

Technology Stack
----------------

.. list-table::
   :widths: 30 70
   :header-rows: 0

   * - **Frontend**
     - Next.js 16 + React 19, Tailwind CSS, Plotly.js, react-simple-maps
   * - **API**
     - Next.js Route Handlers (server-side, TypeScript)
   * - **Database**
     - MongoDB — one database per pathogen, collection ``genomes``
   * - **i18n**
     - next-intl (English; additional locales planned)
   * - **Hosting**
     - AWS EC2 (production), Vercel-compatible

Data Sources
------------

InfectoNET aggregates data from four upstream repositories:

.. list-table::
   :widths: 25 75
   :header-rows: 1

   * - Source
     - Coverage
   * - **NCBI GenBank**
     - All organisms; sequences deposited by submitters worldwide
   * - **GISAID** (EpiFlu, EpiArbo, EpiCoV, EpiRSV, EpiPox)
     - Influenza A/B, avian flu, dengue, COVID-19, RSV, mpox and
       additional arboviruses; requires GISAID data-access agreement
   * - **Nextstrain**
     - COVID-19, RSV, mpox, measles, dengue — open-data distributions
       with curated clade annotations
   * - **Pathoplexus**
     - Emerging open-data repository; planned integration

Related Projects
----------------

* `AMRnet <https://www.amrnet.org>`_ — the antimicrobial-resistance
  surveillance platform that InfectoNET was forked from.
* `Nextstrain <https://nextstrain.org>`_ — phylodynamic analysis and
  open pathogen genomics.
* `GISAID <https://gisaid.org>`_ — global initiative on sharing all
  influenza data.
