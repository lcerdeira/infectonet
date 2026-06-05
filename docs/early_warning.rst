Early Warning — SENTINEL-Φ
===========================

**SENTINEL-Φ** (*Spillover & Emergence Nowcasting Through INtegrated
EcoLogical–phylogenetic signals*) is InfectoNET's pilot multi-signal early-warning
algorithm. It fuses three orthogonal classes of signal into a single, per-pathogen
**Spillover/Amplification Index (SAI, 0–100)** with tiered alerting.

.. note::

   SENTINEL-Φ is a **research pilot**, not a substitute for official public-health
   alerts from WHO, PAHO, or national authorities.

Why it is novel
---------------

Operational early-warning systems today fall into three silos:

* **Event-based** (WHO EIOS, HealthMap, BlueDot, EPIWATCH) — mine news/text
* **Indicator-based forecasting** (CDC CFA, EpiNow2) — model case/Rt time series
* **Genomic** (Nextstrain, TFP Scanner) — track lineage growth

No operational system fuses **genomic lineage-growth + ecological spillover-risk +
event-based news** into one composite score, across many pathogens, openly.
SENTINEL-Φ treats the **ecological signal as the bifurcation driver** (after the
Rift Valley Fever NDVI models and the hantavirus–ENSO trophic cascade) and the
**genomic + case signal as the system response** (after critical-slowing-down theory
and the phylogenetic TFP Scanner) — a mechanistically coherent pairing not previously
published as an open, cross-pathogen alerting engine.

The three channels
------------------

.. list-table::
   :widths: 12 28 60
   :header-rows: 1

   * - Channel
     - Role
     - Source (already in InfectoNET)
   * - **E** — Ecological forcing
     - The *driver*
     - ``/api/ecorisk`` — ENSO/ONI, NDVI, rainfall, soil moisture, IOD,
       deforestation, conflict
   * - **G** — Genomic amplification
     - The *response*
     - ``/api/viruses/:id`` — recent sequencing rate vs long-run baseline
       (proxy for lineage growth / circulation)
   * - **N** — Event corroboration
     - *Corroboration only*
     - ``/api/outbreak/:virus`` — live WHO / PAHO / WOAH alerts. **N never
       triggers an alert on its own** (the Google Flu Trends lesson).

Fusion
------

The pilot uses a transparent weighted fusion::

   SAI = 0.45·E + 0.40·G + 0.15·N      (N never alerts alone)

**Specificity safeguards** (added after the first pilot over-alerted):

* **N is recency-gated** — only outbreak alerts from the **last 90 days** count
  as active corroboration. The WHO Disease Outbreak News API also returns
  historical items; counting those kept N permanently "elevated" and inflated
  most pathogens to WARNING. Stale alerts are now reported but do not raise the
  score. This is the single largest specificity improvement.
* **Genomic-led tiering** — WARNING requires the genomic response channel (a
  real sequencing/lineage surge) corroborated by ecology or recent news, OR a
  very strong ecological driver (E ≥ 80) with recent corroboration. The news
  channel can never trigger an alert on its own.

A production version would replace the fixed weights with a logistic model
calibrated by historical hindcasting, and add explicit **critical-slowing-down**
indicators (rising lag-1 autocorrelation and variance) on the genomic-diversity
and case time series.

Tiered alerts
-------------

Three tiers (deliberately few, to fight alert fatigue), mirroring the hurricane
*watch / warning* model:

.. list-table::
   :widths: 16 44 40
   :header-rows: 1

   * - Tier
     - Trigger
     - Channel
   * - **WATCH** (yellow)
     - One channel elevated (e.g. strong El Niño + NDVI anomaly)
     - Dashboard + opt-in email digest
   * - **ADVISORY** (orange)
     - ≥2 orthogonal channels elevated
     - Email + optional SMS to subscribers
   * - **WARNING** (red)
     - High SAI with multi-channel + event corroboration
     - Immediate signed SMS + email

Hysteresis (raise after N consecutive periods, clear after M), per-region rate
limits, and a minimum inter-alert interval prevent flapping.

Verifiable forecasts (cryptography)
-----------------------------------

Two cryptographic features give SENTINEL-Φ scientific accountability:

#. **Signed alerts (CAP).** Each alert is emitted in the OASIS *Common Alerting
   Protocol* format and signed (Ed25519). Recipients can verify an alert genuinely
   came from InfectoNET and was not tampered with.
#. **Tamper-evident prediction log.** Every SAI computation is hashed (SHA-256 over
   the CAP payload) and chained to the previous record; the Merkle root is anchored
   publicly. This *cryptographically proves what was predicted, when, and on what
   data* — no prediction can be silently edited after the fact. The pilot API
   already returns the per-prediction SHA-256 digest.

Federated / secure-MPC training across jurisdictions is noted as future work; it is
unnecessary while InfectoNET consumes only already-public data.

Hindcast calibration (multi-pathogen)
-------------------------------------

The ecological channel was calibrated retrospectively against the documented
outbreak record of three climate-sensitive pathogens, each with its own ENSO
lag structure. Run it with::

   python3 scripts/calibrate_sentinel.py

Each pathogen is scored by a threshold sweep (sensitivity, specificity, PPV,
Matthews correlation coefficient) over its evaluation window, with the ENSO
signal read at the pathogen-appropriate lag.

.. list-table:: Calibrated ENSO thresholds per pathogen
   :widths: 30 12 12 10 10 10 16
   :header-rows: 1

   * - Pathogen (region)
     - ENSO lag
     - Best ONI
     - Sens
     - Spec
     - PPV
     - Mean lead
   * - Andes virus / hantavirus (Patagonia)
     - 12–18 mo (t-1, t-2)
     - ≥ +1.5
     - 0.67
     - 0.77
     - 0.55
     - ~16 months
   * - Dengue (tropical Americas)
     - 0–12 mo (t, t-1)
     - ≥ +1.1
     - 0.75
     - 0.71
     - 0.46
     - ~2 months
   * - Rift Valley Fever (Horn of Africa)
     - 0–12 mo (t, t-1)
     - ≥ +0.9
     - 1.00
     - 0.43
     - 0.19
     - ~4 months

**What the calibration shows**

* **Each pathogen needs a different lag and threshold.** Hantavirus has the
  longest, cleanest lag (rodent irruption takes 12–18 months) — ideal for
  long-lead alerts. Dengue and RVF respond within the same or next rainy season;
  applying the hantavirus 2-year lag would mis-time them.
* **Hantavirus detail (at the deployed ONI ≥ +1.5):** 6 of 9 documented surges
  detected (1999, 2000, 2010, 2018, 2024, 2025); 3 missed (1997, 2002, 2019),
  all with a weak/absent prior El Niño — i.e. driven by local precipitation or
  masting rather than a basin-scale El Niño, which is exactly why the ecological
  channel must be fused with NDVI and soil moisture rather than used alone.
  These figures match ``scripts/calibrate_sentinel.py`` and the deployed
  ``ENSO_CAL`` thresholds (no discrepancy between docs, code, and the live API).
* **RVF: high sensitivity, low specificity.** El Niño caught all 3 documented
  East-African epizootics (sens 1.00) but with many false alarms (spec 0.43) —
  ENSO is *necessary but not sufficient*. This is the clearest demonstration
  that the ecological channel must be **fused with NDVI, soil moisture and the
  Indian Ocean Dipole** to be specific — exactly the SENTINEL-Φ design.
* **The deployed ``ensoRiskBase`` thresholds** (≥2.0→90, ≥1.5→72, ≥1.0→55,
  ≥0.5→38) align with the hantavirus/dengue optima.

A 3-panel calibration figure is written to
``figures/sentinel_calibration_multi.png``.

**Limitations (reported explicitly):** small N (3–9 surge years per pathogen)
→ wide confidence intervals; surge-year definitions are coarse (national
above-baseline seasons). Thresholds are indicative, not final. Next steps:
incorporate the pathogen-specific lags into the live E channel, and add the
critical-slowing-down indicators on case/genomic series.

Pilot scope
-----------

The pilot is live at::

   GET /api/earlywarning?virus=<id>

It is surfaced in the **Ecological Risk** tab of every pathogen with an ecological
profile. The recommended primary pilot pathogen is **Andes virus (ANDV) /
hantavirus**, because the ENSO → rainfall → rodent-irruption → spillover cascade is
peer-reviewed and predictive, and InfectoNET already ingests every input signal
(ONI, NDVI, rainfall, soil moisture). **Dengue** is the recommended secondary pilot
(richest climate-forecast literature, longest lead time).

Alerting infrastructure (planned)
---------------------------------

* **Email:** AWS SES (~US$0.0001/message)
* **SMS:** AWS SNS (~US$0.0075/SMS) — reserved for the WARNING tier only
* **Subscriptions:** one topic per (pathogen, region, tier); users self-select granularity

Key references
--------------

* Phylogenomic EWS / TFP Scanner — *Virus Evolution* (PMC10792554)
* Early-warning-signals review — (PMC8479360)
* Hantavirus–ENSO trophic cascade — Yates et al., *BioScience* 2002
* Rift Valley Fever NDVI prediction — Anyamba et al., *PNAS*
* Common Alerting Protocol — OASIS CAP v1.2
