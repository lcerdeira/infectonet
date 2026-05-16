Dashboard
=========

Each pathogen in InfectoNET has a dedicated dashboard reachable at
``/en/dashboard/<virus-id>``. The dashboard is split into two tabs for
pathogens that have outbreak-monitoring support.

Overview
--------

When you open a dashboard you will see three summary chips at the top:

* **Total sequences** — the number of genome records in the database for this
  pathogen (counts ALL records, not just the sample shown in charts)
* **Countries** — number of distinct countries with at least one sequence
* **Genotypes / lineages** — number of distinct genotype or lineage labels

Genomic Data Tab
----------------

This is the default view. It contains four panels.

World Map
~~~~~~~~~

An interactive choropleth showing how many sequences have been collected per
country, coloured from light to dark by sequence count. Hovering over a country
shows:

* Country name
* Total sequences
* Genotype breakdown (top genotypes by count)

The map uses MongoDB aggregation over **all** records (not the 10,000-record
sample), so the counts are always complete.

Genotype Trends
~~~~~~~~~~~~~~~

A stacked area chart (Plotly) showing how the proportion of each genotype
has changed over time. The X-axis is year; the Y-axis is sequence count per
genotype per year. This chart helps identify:

* Replacement of one genotype by another (e.g. Omicron displacing Delta)
* Seasonal patterns
* Years with high sequencing activity

.. tip::

   Click a genotype label in the legend to toggle it on or off.
   Double-click to isolate a single genotype.

Sample Timeline
~~~~~~~~~~~~~~~

A bar chart showing total sequences submitted per year across all genotypes.
This reflects global sequencing capacity and effort, independent of genotype
composition.

Virus-Specific Insights
~~~~~~~~~~~~~~~~~~~~~~~

Automatically generated panels that appear when the records contain
virus-specific fields. Examples:

.. list-table::
   :widths: 30 70
   :header-rows: 1

   * - Field
     - Shown for
   * - Antiviral susceptibility
     - Influenza A/B, HIV, SARS-CoV-2, RSV
   * - Outbreak / cluster label
     - Ebola, Marburg, Lassa, Crimean-Congo
   * - Host type
     - Avian flu, hantavirus, nipah, rabies
   * - Clinical syndrome
     - Dengue (DHF vs. classical dengue)
   * - Oncogenic risk
     - HPV

Outbreak Monitor Tab
--------------------

Available for high-consequence pathogens (hantavirus, Ebola, Marburg, mpox,
Lassa, CCHF, Nipah, dengue, Rift Valley Fever, Oropouche).

The Outbreak Monitor aggregates the latest alerts from:

* **WHO Disease Outbreak News** — ``https://www.who.int/feeds/entity/csr/don/en/rss.xml``
* **ReliefWeb** — ``https://reliefweb.int/updates/rss.xml``

Alerts are filtered by pathogen-specific keywords, deduplicated by title, and
sorted newest-first. Up to 20 alerts are shown. The feed is cached for 30
minutes server-side.

.. note::

   The Outbreak Monitor shows *news articles*, not sequence data. It is
   intended to provide epidemiological context alongside the genomic panels.

Filtering and Interaction
--------------------------

The dashboard does not currently support interactive filters (country, year
range, genotype) in the UI. To obtain filtered data programmatically, use
the :doc:`api_reference`.

Switching Pathogens
-------------------

Use the left-hand sidebar (on desktop) or the mobile menu to switch between
pathogens. The sidebar lists all pathogens grouped by disease category. The
current pathogen is highlighted.
