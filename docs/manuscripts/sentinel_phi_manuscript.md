# SENTINEL-Φ: an open, multi-signal, cross-pathogen early-warning algorithm fusing ecological forcing, genomic amplification, and event corroboration into a cryptographically-verifiable spillover index

*First-draft manuscript — target: The Lancet Digital Health; fallback: eLife / PLOS Digital Health. Article type: Health Policy / Methods (Articles).*

---

## Title options

1. **SENTINEL-Φ: an open, cross-pathogen early-warning algorithm fusing ecological, genomic, and event signals into a cryptographically-verifiable spillover index** *(primary)*
2. **Fusing the driver and the response: a multi-signal, tiered, tamper-evident outbreak early-warning system for 50+ viral pathogens (SENTINEL-Φ)**
3. **From climate forcing to lineage growth: an open ecological–phylogenetic nowcasting engine for viral spillover and amplification**

**Running title:** SENTINEL-Φ multi-signal viral early warning

---

## Abstract

**Background.** Operational outbreak early-warning systems remain siloed: event-based systems mine news and travel data, indicator-based systems forecast case time-series, genomic systems track lineage growth, and climate-driven models predict single climate-sensitive pathogens. No operational, openly available system fuses genomic lineage-growth, ecological spillover-risk, and event-based corroboration into one composite, cross-pathogen, tiered score with verifiable provenance. We describe SENTINEL-Φ, the early-warning engine of the open InfectoNET genomic-surveillance platform.

**Methods.** SENTINEL-Φ computes a per-pathogen 0–100 Spillover/Amplification Index (SAI) by fusing three orthogonal signal classes: ecological forcing (E; ENSO/Oceanic Niño Index, Indian Ocean Dipole, MODIS NDVI, rainfall, soil moisture and humidity from ERA5, forest loss, conflict), genomic amplification (G; recent sequencing/lineage growth versus a long-run baseline), and event corroboration (N; WHO, PAHO, WOAH and ReliefWeb alerts, gated to the last 90 days). Fusion is a transparent weighted sum (SAI = 0.45·E + 0.40·G + 0.15·N), with specificity-favouring, genomic-led tiering (WATCH / ADVISORY / WARNING) in which the event channel never alerts alone. We treat ecology as the bifurcation *driver* and genomics/cases as the system *response*, after critical-slowing-down theory. The ecological channel was calibrated by retrospective hindcasting against the documented outbreak record of three climate-sensitive pathogens, each with its own ENSO lag. Every prediction is emitted as an OASIS Common Alerting Protocol (CAP) object, hashed (SHA-256), and appended to a tamper-evident, hash-chained prediction log verifiable through the public API.

**Findings.** Per-pathogen calibration confirmed that each pathogen requires a distinct ENSO lag and threshold: Andes virus (hantavirus, Patagonia) at a 12–18-month lag and ONI ≥ +1.5 achieved sensitivity 0.67, specificity 0.77, positive predictive value (PPV) 0.55, Matthews correlation coefficient (MCC) 0.42, with ~19-month mean lead; dengue (tropical Americas, 0–12-month lag, ONI ≥ +1.1) achieved sensitivity 0.75, specificity 0.71, PPV 0.46, MCC 0.40; Rift Valley fever (Horn of Africa, 0–12-month lag, ONI ≥ +0.9) achieved perfect sensitivity (1.00) but low specificity (0.43, PPV 0.19), demonstrating that ENSO is necessary but not sufficient and motivating multi-signal fusion. A live June 2026 cross-pathogen sweep returned WARNING for avian influenza H5, chikungunya, Oropouche, and Crimean-Congo haemorrhagic fever (genomic surges) plus Ebola virus disease (active outbreak corroboration); ADVISORY for hantavirus; and WATCH for dengue, mpox, and Rift Valley fever, among others.

**Interpretation.** SENTINEL-Φ shows that an open, mechanistically-grounded fusion of climate, genomic, and event signals can produce a tiered, cross-pathogen early-warning score whose specificity is achieved through corroboration rather than any single channel, and whose every forecast is cryptographically attributable. The system is a research instrument requiring prospective validation; it is not a substitute for official public-health alerts.

**Funding.** [VERIFY: funder(s) — e.g. LSHTM internal; any grant numbers].

*~300 words.*

---

## Research in context

**Evidence before this study.** We searched PubMed, medRxiv, and Google Scholar (1990–2026) for "early warning", "outbreak forecasting", "genomic surveillance", "climate-driven disease prediction", "ENSO outbreak", and "spillover prediction", together with the names of the major operational systems (EIOS, HealthMap, BlueDot, EPIWATCH, Nextstrain, TFP Scanner, CDC Center for Forecasting and Outbreak Analytics, EpiNow2). Three traditions are mature but disjoint: (i) event-based biosurveillance that mines news and informal text [CITE: HealthMap — Brownstein et al., PLoS Med 2008]; (ii) indicator-based statistical forecasting of cases and the reproduction number [CITE: EpiNow2 — Abbott et al., Wellcome Open Res 2020]; and (iii) genomic surveillance tracking lineage logistic growth, exemplified by Nextstrain and the phylogenomic Transmission Fitness Polymorphism (TFP) Scanner [CITE: TFP Scanner, Virus Evolution PMC10792554; Nextstrain — Hadfield et al., Bioinformatics 2018]. Climate-driven models predict individual climate-sensitive pathogens well — Rift Valley fever from NDVI and rainfall [CITE: Anyamba et al., PNAS 2009], hantavirus from the ENSO trophic cascade [CITE: Yates et al., BioScience 2002], dengue from ENSO and temperature [CITE: dengue–ENSO review]. The theory of generic early-warning signals for critical transitions (rising autocorrelation and variance near a bifurcation) is well developed [CITE: EWS review PMC8479360; Scheffer et al., Nature 2009]. The hazards of relying on a single, uncalibrated data stream are equally well documented — most prominently the failure of Google Flu Trends ("big data hubris") [CITE: Lazer et al., Science 2014].

**Added value of this study.** To our knowledge, SENTINEL-Φ is the first openly available, operational system to fuse all three signal classes — genomic amplification, ecological spillover-risk, and event corroboration — into a single, per-pathogen, tiered early-warning score across 50+ viral pathogens. It is distinguished by four design choices: (1) an explicit *driver–response* architecture, treating ecology as the bifurcation forcing and genomics/cases as the response, rather than treating all inputs as exchangeable predictors; (2) a specificity-favouring, genomic-led tiering rule in which event news can corroborate but never alert alone, directly encoding the Google Flu Trends lesson; (3) per-pathogen ENSO lag and threshold calibration by transparent hindcasting; and (4) cryptographic forecast provenance — every prediction is a signed CAP object hashed into a tamper-evident chain, so what was predicted, when, and on what data cannot be silently revised.

**Implications of all the available evidence.** A composite that corroborates a validated long-lead ecological driver against a real-time genomic response, gated by recent event news, offers a path to early warning that is both earlier (months of lead from the ecological channel) and more specific (multi-channel corroboration) than any single stream. Building it openly, on already-public data, with verifiable provenance, makes the forecasts auditable and the method reproducible. SENTINEL-Φ now requires prospective, multi-pathogen validation against outcomes; until then it should complement, not replace, official public-health alerting.

---

## Introduction

The interval between the emergence of a pathogen signal and the confirmation of an outbreak is the window in which public-health action is cheapest and most effective. A decade after the 2014–16 West African Ebola epidemic prompted calls for systems that "predict and prevent" rather than merely "detect and respond" [CITE: Morse et al., Lancet 2012], the operational early-warning landscape remains fragmented along the lines of the data each community knows best. Event-based intelligence systems excel at rapid detection of reported events but are, by construction, lagging indicators of transmission already underway and are vulnerable to media and reporting bias. Statistical case-forecasting systems quantify near-term trajectory and uncertainty but require a case time-series that, for spillover and emergence events, does not yet exist. Genomic surveillance can detect the logistic growth of a fitter lineage before clinical signals saturate, but it is blind to the ecological conditions that determine *whether and where* spillover will occur, and it is hostage to where sequencing happens. Climate-driven mechanistic models predict the ecological preconditions for specific climate-sensitive pathogens with impressive lead times, but each is bespoke to one pathogen and one region.

These strengths are complementary, and their weaknesses are largely orthogonal. The ecological conditions that drive zoonotic spillover and arboviral amplification — El Niño–Southern Oscillation (ENSO) phase, rainfall, vegetation greenness, soil moisture, deforestation, and conflict — are observable months *ahead* of transmission for several priority pathogens, and they are the upstream *cause*. The genomic and case signals are the downstream *response*: they appear later but are far more specific to a real epidemiological event. Event-based news is later still, but provides independent corroboration that something is genuinely happening on the ground. A system that explicitly couples a validated, long-lead ecological driver to a real-time genomic response, and gates the result on recent event corroboration, should in principle deliver alerts that are simultaneously earlier and more specific than any single stream — provided it resists the temptation, fatal to Google Flu Trends, to let a single noisy proxy drive decisions [CITE: Lazer et al., Science 2014].

This framing is mechanistically natural. The theory of critical transitions holds that a system approaching a bifurcation exhibits critical slowing down — rising lag-1 autocorrelation and variance — and that the transition itself is precipitated by a change in an external forcing parameter [CITE: Scheffer et al., Nature 2009; EWS review PMC8479360]. In the epidemiology of climate-sensitive zoonoses and arboviruses, the ecological signal *is* that forcing parameter, and the genomic/case dynamics *are* the responding system. The hantavirus literature provides the canonical example: a strong El Niño drives above-normal rainfall in arid Patagonia, triggering Nothofagus masting and a 12–18-month rodent irruption that culminates in spillover of Andes virus to humans [CITE: Yates et al., BioScience 2002]. Rift Valley fever follows an analogous, faster cascade in East Africa, where El Niño and a positive Indian Ocean Dipole drive heavy rains, floodwater-mosquito hatching, and epizootics detectable by NDVI anomaly [CITE: Anyamba et al., PNAS 2009]. Dengue amplification tracks ENSO-modulated temperature and rainfall on a sub-annual lag [CITE: dengue–ENSO review].

Here we describe SENTINEL-Φ (*Spillover & Emergence Nowcasting Through INtegrated EcoLogical–phylogenetic signals*), the early-warning engine of InfectoNET, an open-access genomic-surveillance platform developed at the London School of Hygiene & Tropical Medicine that already aggregates sequence metadata for 50+ viral pathogens from NCBI GenBank, GISAID, and Nextstrain into a public JSON API. SENTINEL-Φ fuses ecological forcing, genomic amplification, and event corroboration into a single per-pathogen Spillover/Amplification Index with tiered alerting, calibrates the ecological channel by retrospective hindcasting, and emits every prediction as a cryptographically verifiable, hash-chained Common Alerting Protocol object. We report the algorithm, its multi-pathogen calibration, a live cross-pathogen sweep, and an honest appraisal of its limitations.

---

## Methods

### Overview and platform

SENTINEL-Φ is implemented as a server-side composition layer over InfectoNET's existing public API. For a requested pathogen it computes three independent channel scores on a common 0–100 scale, fuses them into the Spillover/Amplification Index (SAI), assigns an alert tier, emits a Common Alerting Protocol (CAP) object, and appends the prediction to a tamper-evident log. The engine is exposed at `GET /api/earlywarning?virus=<id>` and is surfaced in the Ecological Risk tab of every pathogen with an ecological profile. All inputs are already-public data; no protected or person-level data are used.

### Data sources

**Table 1. Data sources by channel.**

| Channel | Signal | Source | Endpoint / provider | Cadence |
|---|---|---|---|---|
| E (driver) | ENSO / Oceanic Niño Index (ONI) | NOAA CPC | `oni.ascii.txt` | seasonal |
| E | Tropical-Pacific SST (NINO1+2/3/4/3.4) | NOAA CPC | `sstoi.indices` | monthly |
| E | Indian Ocean Dipole (DMI) | NOAA PSL (HadISST) | `dmi.had.long.data` | monthly |
| E | Vegetation greenness (NDVI) | NASA MODIS MOD13Q1 | ORNL DAAC REST API | 16-day |
| E | Rainfall, soil moisture, humidity, temperature | ERA5 reanalysis | Open-Meteo archive API | daily |
| E | Forest area (deforestation proxy) | World Bank | `AG.LND.FRST.K2` | annual |
| E | Conflict / fragility | ACLED-derived index | static per-pathogen score [VERIFY: refresh cadence] | static |
| G (response) | Sequencing / lineage growth | NCBI GenBank, GISAID, Nextstrain (in InfectoNET MongoDB) | `/api/viruses/:id` | continuous |
| N (corroboration) | Outbreak event news | WHO, PAHO, WOAH, ReliefWeb | `/api/outbreak/:virus` | 30-min cache |

All ecological sources are free and require no API key; the WHO News feed is used in place of the now-Cloudflare-blocked Disease Outbreak News RSS, with PAHO and ReliefWeb (humanitarian alert type) as additional sources. WOAH is included for animal-health signals. [VERIFY: current WOAH ingestion route — confirm whether via dedicated feed or ReliefWeb.] GISAID data are used in accordance with the GISAID EpiCoV/EpiFlu Database Access Agreement [CITE: GISAID — Khare et al., Global Challenges 2021].

### Channel E — ecological forcing (the driver)

The ecological channel returns a 0–100 risk score (`/api/ecorisk`). Pathogens are classified as ENSO-driven, conflict-driven, or dual-driven, and each ENSO-driven pathogen carries a calibrated lag window and alarm threshold (see *Calibration*). The base score is a graded function of the peak ONI observed within the pathogen's lag window relative to its calibrated threshold *thr*:

```
ensoBase(oniPeak, thr) =
    90  if oniPeak ≥ thr + 0.5
    72  if oniPeak ≥ thr
    55  if oniPeak ≥ thr − 0.4
    38  if oniPeak ≥ thr − 0.9
    20  otherwise
```

so that pathogens with lower thresholds (dengue, Rift Valley fever) fire earlier than hantavirus, as the calibration requires. For conflict-driven pathogens, the base is a static conflict/fragility score (e.g. Ebola 88, mpox 75, Lassa 65). Additive bonuses, capped at 100, are then applied for corroborating local signals, each pathogen-appropriate:

- **Rainfall anomaly** (ERA5 monthly total vs a 30-year baseline): +10 to +20 for above-normal rainfall in Rift Valley fever and hantavirus zones; +10 for arboviruses; +8 for *dry* conditions in Ebola/Marburg zones (bat-foraging stress proxy).
- **Indian Ocean Dipole**: +6 to +12 for a positive DMI in East-Africa/South-Asia pathogens (wetter East Africa).
- **NDVI**: +5 to +10 for moderate-to-lush vegetation in arbovirus zones (vector habitat).
- **Soil moisture**: +5 to +10 for saturated soil in floodwater-mosquito pathogens (RVF, West Nile, dengue).
- **Humidity**: +5 to +10 for low humidity in respiratory pathogens (influenza, avian influenza).
- **Forest loss**: +5 to +15 for ≥5–10% five-year forest decline (reservoir–human interface).

Each pathogen's endemic centroid, relevant SST basin, and 30-year monthly rainfall normals are configured a priori. The channel also returns a human-readable narrative explaining which drivers are active. E is judged *elevated* at a value ≥ 50.

### Channel G — genomic amplification (the response)

The genomic channel is a transparent proxy for lineage logistic growth (cf. TFP Scanner [CITE: PMC10792554]): the ratio of the recent two-year sequencing rate to the long-run annual mean. From the pathogen's sequence metadata we tabulate genome counts by year, take the two most recent years' mean annual count, and divide by the mean annual count over all observed years:

```
ratio   = ( (count[maxYear] + count[maxYear−1]) / 2 ) / mean_over_all_years(count)
G.value = clamp( round( (ratio − 1) · 60 + 30 ), 0, 100 )
```

calibrated so that a ratio of 1 (recent rate equal to baseline) maps to 30, and a ~2.2-fold surge saturates at 100. G is computed only when ≥ 3 years of data are available and is judged elevated at ≥ 50 (ratio ≈ 1.33). G is deliberately a *circulation/response* proxy: a surge reflects either genuine lineage amplification or a surge in sequencing effort in response to an event, both of which are epidemiologically informative but neither of which is, on its own, proof of an outbreak — hence its role as one of two quantitative channels rather than a standalone trigger. A production version would replace this proxy with an explicit logistic-growth estimate and add critical-slowing-down indicators (rising lag-1 autocorrelation and variance) on the genomic-diversity and case series [CITE: EWS review PMC8479360].

### Channel N — event corroboration (corroboration only)

The event channel counts outbreak alerts for the pathogen from WHO, PAHO, WOAH, and ReliefWeb. **It is recency-gated**: only items published in the last 90 days count as *active* corroboration. The pilot's single largest specificity improvement came from this gate — the underlying feeds return historical items, and counting those kept N permanently elevated and inflated most pathogens to WARNING. Stale alerts are still reported to the user but do not raise the score. N scores 25 points per recent alert (capped at 100) and is judged elevated at ≥ 1 recent alert. Crucially, **N can never trigger an alert on its own** — the explicit encoding of the Google Flu Trends lesson [CITE: Lazer et al., Science 2014].

### Fusion — the Spillover/Amplification Index

The three channels are fused by a transparent weighted sum:

```
SAI = clamp( round( 0.45·E + 0.40·G + 0.15·N ), 0, 100 )
```

The weights reflect the driver–response logic: E (0.45) is the validated long-lead driver; G (0.40) is the most discriminating real-time signal; N (0.15) is down-weighted corroboration that cannot dominate the score. The weights are pilot defaults, chosen a priori for interpretability; a production version would replace them with a logistic model whose coefficients are fitted by historical hindcasting against labelled outbreak outcomes.

### Tiering — specificity-favouring, genomic-led

SAI alone does not determine the alert tier; the *pattern* of elevated channels does, following a hurricane watch/warning analogy with deliberately few tiers to fight alert fatigue. Let *eHigh* = (E ≥ 80) and let the number of elevated quantitative channels be the count of {E elevated, G elevated}. Then:

- **WARNING** (red): G elevated AND (E elevated OR N recent), OR (eHigh AND N recent). *A genomic surge corroborated by ecology or recent news, or a very strong ecological driver with recent corroboration.*
- **ADVISORY** (orange): ≥ 2 quantitative channels elevated, OR (E elevated AND N recent). *Multi-signal corroboration.*
- **WATCH** (yellow): E elevated OR G elevated (one quantitative channel). *Conditions favourable.*
- **NONE** (green): routine surveillance.

N never triggers an alert on its own at any tier. In production, hysteresis (raise after *n* consecutive periods, clear after *m*), per-region rate limits, and a minimum inter-alert interval prevent flapping; these are specified but not exercised in the pilot results reported here. [VERIFY: confirm whether hysteresis is active in the deployed June 2026 build.]

### Calibration protocol

We calibrated the ecological channel retrospectively against the documented outbreak record of three climate-sensitive pathogens, each evaluated at its own ENSO lag (`scripts/calibrate_sentinel.py`). Annual peak ONI (NOAA CPC) for 1990–2026 was the predictor. For each pathogen we defined a set of documented above-baseline surge years and an evaluation window, then swept the ONI alarm threshold from +0.5 to +2.0 in 0.1 steps. At each threshold an alarm was raised in year *t* if the peak ONI at any configured lag (*t*−L for L in the pathogen's lag set) met the threshold. We computed sensitivity, specificity, PPV, Youden's J, and the Matthews correlation coefficient (MCC), selected the MCC-maximising threshold, and computed the mean lead time as the smallest qualifying lag across detected surges.

Lag sets and surge definitions were taken from the peer-reviewed and grey-literature record: hantavirus lags 1–2 years (12–18 months, the rodent-irruption cascade [CITE: Yates et al., BioScience 2002]); dengue and Rift Valley fever lags 0–1 years (same or following rainy season); surge years from WHO Disease Outbreak News and PAHO archives, Anyamba et al. for RVF [CITE: PNAS 2009], and dengue–ENSO reviews. The MCC-optimal thresholds were then wired into the live E channel as per-pathogen `(lag, threshold)` pairs.

### Cryptographic provenance, CAP, and alerting

**Common Alerting Protocol.** Each prediction is emitted as an OASIS CAP-shaped object [CITE: OASIS CAP v1.2] carrying the identifier, sender, timestamp, event, urgency, severity, certainty, headline (with SAI), per-channel description, and recommended action. Production alerts are signed (Ed25519) so recipients can verify origin and integrity. [VERIFY: confirm Ed25519 signing is wired in the deployed build vs specified.]

**Tamper-evident prediction log.** Every prediction is hashed and appended to an append-only MongoDB collection forming a hash chain. For each record the payload hash is `SHA-256(CAP)`, and the record hash is `SHA-256(payloadHash ‖ prevHash)`, with the genesis predecessor being 64 zero hex characters. Appends are idempotent per (pathogen, UTC day). The chain is verifiable at `GET /api/earlywarning/log`, which recomputes every record hash in sequence and returns `verified`, the sequence index of any break, and the current **chain head** — a Merkle-root analogue that fixes the entire history. Any retroactive edit to any past prediction breaks the chain and is detectable, giving the forecasts certificate-transparency-style accountability: what was predicted, when, and on what data cannot be silently revised after the fact. [VERIFY: public anchoring of the chain head — confirm whether the head is externally timestamped/anchored or only API-exposed.]

**Alert delivery.** Alerts are dispatched via AWS SES (email) and AWS SNS (SMS), the latter reserved for the WARNING tier only to limit fatigue and cost. Subscriptions are per (pathogen, region, tier). Delivery is **dry-run by default**: real sends occur only when an explicit environment flag is set and valid credentials are present; in dry-run mode intended sends are reported but nothing is transmitted, and subscriber addresses are masked in logs.

### Implementation and availability

InfectoNET is a Next.js/TypeScript application backed by MongoDB. SENTINEL-Φ composes the platform's own routes over loopback and caches aggressively (E: 6 h; N: 30 min; G: per-request over cached sequence metadata). The engine, the eco-risk service, the prediction-log library, the alert-dispatch library, and the calibration script are open source under [VERIFY: GPLv3 per repository badge] at `github.com/lcerdeira/infectonet`. The live API is documented at `infectonet.org` and `infectonet.readthedocs.io`; a Zenodo DOI archives releases [CITE: Zenodo 10.5281/zenodo.20222821].

---

## Results

### Multi-pathogen hindcast calibration of the ecological channel

Calibration confirmed the central design hypothesis that each pathogen requires a *different* ENSO lag and threshold, and that ENSO alone is a useful but imperfect driver whose specificity must come from fusion (Table 2; calibration figure `figures/sentinel_calibration_multi.png`).

**Table 2. Calibrated ENSO thresholds per pathogen (ecological channel, MCC-optimal).**

| Pathogen (region) | ENSO lag | Best ONI | Sens | Spec | PPV | MCC | Mean lead | Surges detected |
|---|---|---|---|---|---|---|---|---|
| Andes virus / hantavirus (Patagonia) | 12–18 mo (t−1, t−2) | ≥ +1.5 | 0.67 | 0.77 | 0.55 | 0.42 | ~19 mo | 5/9 |
| Dengue (tropical Americas) | 0–12 mo (t, t−1) | ≥ +1.1 | 0.75 | 0.71 | 0.46 | 0.40 | ~2 mo | 6/8 |
| Rift Valley fever (Horn of Africa) | 0–12 mo (t, t−1) | ≥ +0.9 | 1.00 | 0.43 | 0.19 | 0.29 | ~4 mo | 3/3 |

Three findings follow.

**Each pathogen needs its own lag.** Hantavirus has the longest and cleanest lag — the rodent irruption takes 12–18 months — making it the best candidate for genuinely long-lead alerts (~19-month mean lead). Dengue and Rift Valley fever respond within the same or next rainy season; applying the hantavirus two-year lag would systematically mis-time them. The deployed graded thresholds (ONI ≥ 2.0 → 90, ≥ 1.5 → 72, ≥ 1.0 → 55, ≥ 0.5 → 38) align with the hantavirus and dengue optima.

**Hantavirus misses point to fusion.** ENSO alone detected 5 of 9 documented Patagonian surges; the misses (notably 1997, 2002, 2010, 2019 [VERIFY: reconcile against the surge set {1997,1999,2000,2002,2010,2018,2019,2024,2025} in the calibration script — confirm exactly which years were detected vs missed]) occurred when the prior El Niño was weak, precisely the cases where the NDVI and soil-moisture channels are expected to recover sensitivity.

**The Rift Valley fever specificity finding.** El Niño caught all three documented East-African RVF epizootics (sensitivity 1.00) but with many false alarms (specificity 0.43, PPV 0.19). This is the clearest empirical demonstration in our data that the ecological channel is *necessary but not sufficient*: ENSO must be fused with NDVI, soil moisture, and the Indian Ocean Dipole to be specific — exactly the SENTINEL-Φ architecture. It also illustrates why SAI tiering is genomic-led and corroboration-gated rather than ENSO-led: a system that alerted on the ecological channel alone would, for RVF, over-warn unacceptably.

A small number of surge years (3–9 per pathogen) means wide, unreported confidence intervals; these thresholds are indicative, not final (see *Limitations*).

### Live cross-pathogen sweep (June 2026)

After wiring the per-pathogen lags and thresholds into the live E channel, a cross-pathogen sweep returned a tier distribution consistent with the design intent of few, specific, multiply-corroborated alerts (Table 3).

**Table 3. Live SENTINEL-Φ tiers, June 2026 sweep (illustrative selection).**

| Tier | Pathogens | Dominant signal |
|---|---|---|
| WARNING | Avian influenza (H5), chikungunya, Oropouche, Crimean-Congo haemorrhagic fever | Genomic surge (G elevated) with corroboration |
| WARNING | Ebola virus disease | Active outbreak (DRC/Uganda Bundibugyo) — recent event corroboration with driver/response [VERIFY: confirm Ebola met the genomic-led rule vs a strong-driver+recent-N path; current sweep cites an active PHEIC] |
| ADVISORY | Hantavirus | Ecological driver + multi-signal |
| WATCH | Dengue, mpox, Rift Valley fever (and others) | One quantitative channel elevated |

The pattern is informative: the WARNING tier was dominated by pathogens with a genuine recent sequencing surge (the genomic response channel), not by the ecological channel alone, and Ebola — where the genomic surge is muted by sequencing gaps but the event is unambiguous and active — reached WARNING through the corroboration path. Hantavirus, with a strong lagged ecological driver but no current genomic surge, correctly sat at ADVISORY rather than WARNING. [VERIFY: regenerate the full sweep table from the live API at submission time, with per-channel values, so all tier assignments are exactly reproducible.]

### Lead time

The ecological channel supplies the lead time. Across calibrated pathogens, mean lead ranged from ~2 months (dengue) through ~4 months (Rift Valley fever) to ~19 months (hantavirus), tracking the biology of each cascade. The genomic channel adds little lead but high specificity; the event channel adds none but provides corroboration. The composite therefore inherits the long lead of the ecological driver while gating the alert on the more specific response and corroboration channels.

### Worked example — Andes virus, 2023–24 El Niño into 2024–26

The 2023–24 event illustrates the engine end to end. The strong El Niño peaked at ONI ≈ +2.06 in 2023 and ≈ +1.92 in 2024, both above the calibrated hantavirus threshold of +1.5. Read at the pathogen's 12–18-month lag, this drives the ecological channel high through 2024–25 (the rodent-irruption window), with corroborating above-normal Patagonian rainfall and elevated NDVI in the endemic zone. The ecological channel therefore issues a long-lead WATCH for Andes virus from late 2024. If, during 2025–26, the genomic channel detects a recent sequencing surge for Andes virus, or a recent WHO/PAHO hantavirus alert appears, the engine escalates: G elevated + E elevated → WARNING; E elevated + recent N → ADVISORY. In the June 2026 sweep, hantavirus sat at ADVISORY — the lagged ecological driver remained elevated but no current genomic surge had materialised, exactly the behaviour the tiering is designed to produce. Each of these daily predictions is emitted as a CAP object, hashed, and appended to the verifiable chain, so the full sequence of escalations is auditable after the fact. [VERIFY: confirm observed ONI lag values and that the 2024–26 hantavirus narrative matches the deployed `/api/ecorisk?virus=hantavirus` output at submission.]

---

## Discussion

SENTINEL-Φ demonstrates that the three mature but siloed traditions of outbreak early warning — ecological/climate modelling, genomic surveillance, and event-based intelligence — can be fused into a single, open, cross-pathogen, tiered score whose specificity is achieved through corroboration rather than through any single channel, and whose every forecast is cryptographically attributable.

**Novelty.** The contribution is not a new climate model, a new phylogenetic method, or a new news-mining engine; each channel uses established science. The novelty is the *fusion architecture* and its operationalisation: an explicit driver–response coupling, applied uniformly across 50+ pathogens, with calibrated per-pathogen lags, a specificity-favouring genomic-led tiering rule, and tamper-evident provenance — delivered openly on already-public data. We are not aware of another operational system that combines all of these properties. Existing systems are single-family or closed: EIOS, HealthMap, BlueDot, and EPIWATCH are event/travel systems [CITE: HealthMap — Brownstein et al., PLoS Med 2008]; CDC's Center for Forecasting and Outbreak Analytics and EpiNow2 forecast cases [CITE: EpiNow2 — Abbott et al. 2020]; Nextstrain and TFP Scanner are genomic [CITE: PMC10792554]; and RVF/dengue climate models are ecology-only and pathogen-specific [CITE: Anyamba et al., PNAS 2009].

**The driver–response framing.** Treating ecology as the bifurcation forcing and genomics/cases as the responding system is more than a metaphor. It dictates the weights (the driver leads but is less specific; the response lags but is more specific), the tiering (a real response surge, corroborated, is the strongest signal), and the roadmap (explicit critical-slowing-down indicators on the response series). It also clarifies why the ecological channel should never alert alone, and why the event channel — the most lagging and most bias-prone stream — is confined to corroboration.

**Specificity via fusion.** The Rift Valley fever calibration is the empirical heart of the argument. A perfectly sensitive but poorly specific ecological signal (sensitivity 1.00, specificity 0.43) would be operationally useless as a standalone alarm. By requiring a corroborating channel — and, for the highest tier, a genomic response — SENTINEL-Φ converts a sensitive driver into a specific alert. This is the structural answer to the Google Flu Trends failure: no single proxy, however appealing, is permitted to drive a warning [CITE: Lazer et al., Science 2014].

**Verifiable forecasts.** Forecasting systems are rarely held to account for what they actually predicted before an event, because predictions can be quietly revised. The hash-chained CAP log makes SENTINEL-Φ's record immutable and publicly checkable: the chain head fixes the entire prediction history, and any post-hoc edit is detectable. This is, to our knowledge, an unusual property for a public-health early-warning system and a precondition for honest prospective evaluation.

**One Health alignment.** By coupling animal, environmental, and human signals (WOAH animal-health alerts, ecological forcing, human genomic surveillance), the system is operationally One Health [CITE: Zinsstag et al., One Health], and directly serves the "predict and prevent" agenda articulated for emerging zoonoses [CITE: Morse et al., Lancet 2012].

---

## Limitations

SENTINEL-Φ is a research instrument with substantial limitations, which we state plainly.

1. **Small calibration N.** Each pathogen has only 3–9 documented surge years, yielding wide and currently unreported confidence intervals on every skill metric. The thresholds in Table 2 are indicative, not definitive, and could shift materially with one or two reclassified years. We have not yet bootstrapped confidence intervals or performed out-of-sample cross-validation. [VERIFY: add bootstrap CIs and leave-one-out validation before submission.]
2. **Coarse surge-year definitions.** Surge years are national, above-baseline annual seasons drawn from heterogeneous sources (WHO/PAHO archives, primary literature). They lack sub-national resolution and consistent case thresholds, and may embed reporting bias — the very bias the event channel is designed to corroborate rather than depend on.
3. **The genomic channel depends on sequencing coverage.** The G channel is a circulation/sequencing-rate proxy, and is structurally blind where sequencing is sparse or delayed — notably Brazil, Central Africa, and other under-resourced settings that are also high-spillover regions. Ebola reaching WARNING via the corroboration path rather than a genomic surge is a symptom of exactly this gap. A surge in *sequencing effort* (e.g. a reactive campaign) can also masquerade as a surge in *circulation*; the proxy does not distinguish them.
4. **News recency and feed fragility.** The 90-day gate trades sensitivity for specificity and will miss slow-burning events whose only news predates the window; conversely the underlying feeds are brittle (the WHO DON RSS became Cloudflare-blocked, forcing a switch to the WHO News feed), and keyword matching can both miss and over-match.
5. **Fixed, a priori weights and thresholds.** Fusion weights (0.45/0.40/0.15), the channel-elevation cut-off (50), and the per-signal bonuses are interpretable but not learned. They have not been optimised against outcomes, and the tiering rule has not been tuned to a target false-alarm budget.
6. **No prospective validation.** All quantitative results are retrospective (ecological calibration) or a single live snapshot (the June 2026 sweep). We have not yet evaluated whether SENTINEL-Φ alerts precede real outbreaks prospectively, with what lead, sensitivity, specificity, or false-alarm rate. This is the single most important outstanding piece of work.
7. **Not a substitute for official alerts.** SENTINEL-Φ is a complementary research signal, not an authoritative public-health warning. Operational decisions must rest with WHO, PAHO, WOAH, and national authorities.
8. **Implementation maturity.** Some accountability and anti-fatigue features (Ed25519 signing, hysteresis, external anchoring of the chain head) are specified and partially implemented; their deployment status must be confirmed before publication [VERIFY across the items flagged in Methods].

---

## Conclusion

Early warning for viral spillover and emergence has been held back less by a shortage of data than by the separation of the communities that own it. SENTINEL-Φ shows that an open, mechanistically-grounded fusion — ecology as the long-lead driver, genomics as the specific response, event news as recency-gated corroboration — can produce a tiered, cross-pathogen early-warning score that is plausibly both earlier and more specific than any single stream, and whose every forecast is cryptographically auditable. Retrospective calibration confirms that the ecological driver is informative but pathogen-specific in its timing and, for some pathogens, only specific in combination with corroborating signals, validating the fusion design. The decisive test is prospective: whether SENTINEL-Φ alerts reliably precede real outbreaks, with acceptable false-alarm rates, across many pathogens and settings. Built openly and verifiably, the system is structured so that this test can be conducted honestly, in the open, by anyone.

---

## Data sharing and code availability

All InfectoNET data are derived from already-public sources and exposed through a free JSON API. The early-warning engine (`/api/earlywarning`), ecological-risk service (`/api/ecorisk`), outbreak-event service (`/api/outbreak/:virus`), prediction-log endpoint (`/api/earlywarning/log`), and the multi-pathogen calibration script (`scripts/calibrate_sentinel.py`) are open source at **github.com/lcerdeira/infectonet** [VERIFY: license — GPLv3 per repository badge]. The live platform and API documentation are at **infectonet.org** and **infectonet.readthedocs.io**; releases are archived on Zenodo [CITE: 10.5281/zenodo.20222821]. The hash-chained prediction log is publicly verifiable through the API. Sequence-level metadata are subject to the access terms of the originating repositories; GISAID-sourced records are used under the GISAID Database Access Agreement and acknowledge originating and submitting laboratories.

---

## Contributors

[VERIFY: fill author roles per CRediT.] LC conceived InfectoNET and SENTINEL-Φ, designed the fusion architecture and tiering, implemented the platform and engine, and drafted the manuscript. [Add: calibration analysis, domain input, supervision, etc.]

## Declaration of interests

[VERIFY] The authors declare no competing interests.

## Acknowledgements

We thank the data contributors and infrastructure providers whose open resources make SENTINEL-Φ possible: GISAID and its originating/submitting laboratories, NCBI GenBank, and Nextstrain for genomic data; NOAA (CPC and PSL) for ENSO/ONI, SST, and Indian Ocean Dipole indices; NASA and the ORNL DAAC for MODIS NDVI; Open-Meteo and ECMWF ERA5 for meteorological reanalysis; the World Bank for forest-area data; ACLED for conflict data; and WHO, PAHO, WOAH, and ReliefWeb for outbreak-event reporting. SENTINEL-Φ is developed at the London School of Hygiene & Tropical Medicine. [VERIFY: funding statement and any individual acknowledgements.]

---

## References

*Use journal house style at submission; key references below with identifiers where known. Bracketed `[CITE: …]` markers in the text map to these.*

1. [TFP Scanner — phylogenomic early-warning / transmission-fitness polymorphism scanner. *Virus Evolution*. PMC10792554.] [VERIFY: full author list, year, volume.]
2. [Early-warning signals for critical transitions — review. PMC8479360.] [VERIFY: authors, journal, year.]
3. Yates TL, Mills JN, Parmenter CA, et al. The ecology and evolutionary history of an emergent disease: hantavirus pulmonary syndrome. *BioScience*. 2002;52(11):989–998. [VERIFY: pages.]
4. Anyamba A, Chretien J-P, Small J, et al. Prediction of a Rift Valley fever outbreak. *Proc Natl Acad Sci USA*. 2009;106(3):955–959. [VERIFY: exact pages/year.]
5. Lazer D, Kennedy R, King G, Vespignani A. The parable of Google Flu: traps in big data analysis. *Science*. 2014;343(6176):1203–1205.
6. OASIS. Common Alerting Protocol (CAP) Version 1.2. OASIS Standard. 2010. [VERIFY: exact citation.]
7. Morse SS, Mazet JAK, Woolhouse M, et al. Prediction and prevention of the next pandemic zoonosis. *Lancet*. 2012;380(9857):1956–1965.
8. Zinsstag J, Schelling E, Waltner-Toews D, Tanner M. From "one medicine" to "one health" and systemic approaches to health and well-being. *Prev Vet Med*. 2011;101(3–4):148–156. [VERIFY: choose the canonical One Health reference for the target journal.]
9. [Dengue–ENSO review — e.g. a systematic review of ENSO and dengue transmission.] [VERIFY: select the specific review, authors, journal, year.]
10. Hadfield J, Megill C, Bell SM, et al. Nextstrain: real-time tracking of pathogen evolution. *Bioinformatics*. 2018;34(23):4121–4123. [optional]
11. Brownstein JS, Freifeld CC, Reis BY, Mandl KD. Surveillance Sans Frontières: internet-based emerging infectious disease intelligence and the HealthMap project. *PLoS Med*. 2008;5(7):e151. [optional]
12. Abbott S, Hellewell J, Thompson RN, et al. Estimating the time-varying reproduction number of SARS-CoV-2 (EpiNow2). *Wellcome Open Res*. 2020;5:112. [optional]
13. Scheffer M, Bascompte J, Brock WA, et al. Early-warning signals for critical transitions. *Nature*. 2009;461:53–59. [optional]
14. Khare S, Gurry C, Freitas L, et al. GISAID's role in pandemic response. *China CDC Wkly* / *Global Challenges*. 2021. [VERIFY: correct GISAID citation.]

---

*End of first draft. All `[CITE: …]` markers require a verified reference; all `[VERIFY]` markers require confirmation against the deployed system or the literature before submission. Body length ≈ 4,200 words (excluding tables, abstract, and references).*
