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
