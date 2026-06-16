<div align="center">

![InfectoNET](/public/infectonet-logo.png)

# InfectoNET — Global Viral Genomic Surveillance Dashboard

**Free, open-access genomic surveillance of 50+ viral pathogens worldwide.**
Real-time outbreak monitoring · interactive maps · genotype trends · ecological risk intelligence · public API.

🌐 **[infectonet.org](https://infectonet.org)** · 📖 **[Documentation](https://infectonet.readthedocs.io)** · 🔬 An independent open-science project

![Version](https://img.shields.io/badge/version-1.0-red)
![License](https://img.shields.io/badge/license-GPLv3-blue)
![Last Commit](https://img.shields.io/github/last-commit/lcerdeira/infectonet)
[![DOI](https://zenodo.org/badge/DOI/10.5281/zenodo.20222821.svg)](https://doi.org/10.5281/zenodo.20222821)

</div>

---

## Overview

**InfectoNET** is an open-access **genomic epidemiology** and **outbreak surveillance** platform that
aggregates, standardises, and visualises publicly available viral sequence data for **50+ priority
pathogens** — including **COVID-19 (SARS-CoV-2)**, **Ebola**, **dengue**, **avian influenza (H5N1/H5N5)**,
**mpox (monkeypox)**, **hantavirus**, **Marburg**, **Lassa fever**, **Nipah**, **RSV**, **measles**,
**Zika**, **chikungunya** and more.

It is an **independent, non-commercial open-science side project** maintained by an individual
researcher — not affiliated with or endorsed by any institution — and follows the
**FAIR** principles (Findable, Accessible, Interoperable, Reusable).

> 🔗 **Live platform: [https://infectonet.org](https://infectonet.org)**

## Features

- 🗺️ **Interactive world map** — sequence counts and genotype breakdowns by country
- 📈 **Genotype / variant trends** — stacked time-series of lineage prevalence (e.g. SARS-CoV-2 WHO variants, dengue serotypes, RSV clades)
- 🦠 **Outbreak Monitor** — live alerts from WHO Disease Outbreak News, PAHO, WOAH and ReliefWeb
- 🌿 **Ecological Risk Intelligence (EcoRisk)** — climate (ENSO/ONI), rainfall anomaly, sea-surface temperature, deforestation and conflict indicators driving spillover risk
- 🧬 **Sub-national mapping** — province-level Ebola map of the DRC with bat-reservoir hotspots, Congo Basin rainforest overlay, rivers and Great Lakes
- 🔌 **Public JSON API** — no authentication required ([docs](https://infectonet.readthedocs.io))

## Pathogens covered

COVID-19 · MERS-CoV · Influenza A · **Avian influenza (H5N1/H5N5)** · Influenza B · RSV · Dengue ·
Zika · Chikungunya · Yellow Fever · West Nile · Oropouche · Rift Valley Fever · **Ebola** · Marburg ·
Lassa · Crimean-Congo HF · Rabies · Nipah · Hantavirus · Measles · Mumps · Rubella · HPV · Mpox ·
Hepatitis A/B/C · Norovirus · Rotavirus · Enterovirus · Polio · HIV · HTLV · HSV · CMV · and more.

## Data sources

| Source | Use |
|--------|-----|
| [NCBI GenBank](https://www.ncbi.nlm.nih.gov/genbank/) | Primary sequence metadata (all pathogens) |
| [GISAID](https://gisaid.org) | EpiFlu, EpiCoV, EpiArbo, EpiRSV, EpiPox |
| [Nextstrain](https://nextstrain.org) | Curated clade annotations |
| [NOAA](https://www.cpc.ncep.noaa.gov), [Open-Meteo](https://open-meteo.com), [World Bank](https://data.worldbank.org) | Ecological risk signals |
| WHO · PAHO · WOAH · ReliefWeb | Outbreak news feeds |

See the full [Data Sources & Policy](https://infectonet.org/en/data-policy) page for licensing and attribution.

## Public API

No authentication required. Base URL: `https://infectonet.org/api`

```bash
# List all pathogens with sequence counts
curl https://infectonet.org/api/viruses

# Sequence records for dengue
curl "https://infectonet.org/api/viruses/dengue?limit=100"

# Country-level aggregation for mpox
curl https://infectonet.org/api/viruses/mpox/countries

# Live outbreak alerts for avian flu
curl https://infectonet.org/api/outbreak/avianflu

# Ecological risk for hantavirus
curl "https://infectonet.org/api/ecorisk?virus=hantavirus"
```

Full API reference: **[infectonet.readthedocs.io](https://infectonet.readthedocs.io)**

## Tech stack

Next.js 16 · React 19 · TypeScript · Tailwind CSS · Plotly.js · MongoDB · next-intl

## Local development

```bash
git clone https://github.com/lcerdeira/infectonet.git
cd infectonet
npm install
cp .env.local.example .env.local   # set MONGODB_URI
npm run dev                         # http://localhost:3000
```

## Citation

If you use InfectoNET in your research, please cite:

> InfectoNET: a global viral genomic surveillance dashboard. 2026.
> https://infectonet.org · DOI: [10.5281/zenodo.20222821](https://doi.org/10.5281/zenodo.20222821)

## License

GPLv3 — see [LICENSE](LICENSE). Built on the open-source [AMRnet](https://www.amrnet.org) platform.

## Contact

📧 [infectonet@gmail.com](mailto:infectonet@gmail.com) — an independent open-science project.
