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

   SAI = 0.50·E + 0.30·G + 0.20·N      (N capped; never alerts alone)

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

Hindcast calibration (ANDV pilot)
---------------------------------

The ecological channel was calibrated retrospectively against the documented
record of Andes-virus (ANDV) HPS surges in Patagonia (1996–2026), using ENSO
(Oceanic Niño Index) as the driver with a 12–18 month lag. Run it with::

   python3 scripts/calibrate_sentinel.py

**Key hindcast results** (pure ENSO lag model, 9 documented surge years):

.. list-table::
   :widths: 30 70
   :header-rows: 0

   * - Best threshold (by MCC)
     - peak ONI ≥ +1.5 in year t-1 or t-2
   * - Sensitivity / Specificity
     - 0.67 / 0.77
   * - Positive predictive value
     - 0.55
   * - Matthews correlation (MCC)
     - 0.42
   * - Mean lead time (detected surges)
     - ~19 months

5 of 9 surges were detected by the ENSO signal alone; the 4 misses (1997, 2002,
2010, 2019) had weak or absent prior El Niño — confirming that **local
precipitation, NDVI and soil moisture must be fused with ENSO**, which is
precisely SENTINEL-Φ's multi-channel design rationale. The deployed
``ensoRiskBase`` thresholds (≥2.0→90, ≥1.5→72, ≥1.0→55, ≥0.5→38) match this
calibration.

**Limitations (reported explicitly):** small N (9 surge years) → wide
confidence intervals; specificity is the known weak point of climate-driven
EWS. Next steps: repeat the protocol for dengue (Ecuador/Brazil, longer lead)
and RVF (East Africa, IOD+NDVI) to generalise calibration across pathogens.

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
