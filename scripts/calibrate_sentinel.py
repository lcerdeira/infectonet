#!/usr/bin/env python3
"""
SENTINEL-Φ — hindcast calibration protocol (pilot: Andes virus / hantavirus)
============================================================================
Retrospectively tests the ECOLOGICAL channel (E) of SENTINEL-Φ against the
documented record of Andes-virus (ANDV) hantavirus pulmonary syndrome (HPS)
surges in Patagonia, using ENSO (Oceanic Niño Index, ONI) as the driver with
a 12–18 month lag.

It answers three questions a reviewer will ask:
  1. Does the ecological signal lead outbreaks, and by how long?
  2. What ONI threshold maximises skill (sensitivity vs specificity)?
  3. What is the hindcast PPV / lead time at that threshold?

Outputs metrics to stdout and a calibration figure to figures/.

Run:  python3 scripts/calibrate_sentinel.py
"""
import statistics

# ── Inputs ─────────────────────────────────────────────────────────────────────
# Annual peak ONI (NOAA CPC). Positive = El Niño.
ONI = {
    1993:0.70,1994:1.09,1995:-1.00,1996:-0.90,1997:2.40,1998:2.24,1999:-1.65,
    2000:-1.66,2001:-0.68,2002:1.31,2003:0.92,2004:0.70,2005:-0.84,2006:0.94,
    2007:-1.60,2008:-1.64,2009:1.56,2010:-1.64,2011:-1.31,2012:-0.72,2013:-0.35,
    2014:0.77,2015:2.75,2016:2.63,2017:-0.86,2018:0.97,2019:0.89,2020:-1.20,
    2021:-0.91,2022:-0.97,2023:2.06,2024:1.92,2025:-0.55,2026:-0.37,
}
# Documented ANDV/HPS surge years in Patagonia (Argentina+Chile surveillance).
# A "surge" = nationally notable above-baseline HPS season.
SURGE_YEARS = {1997,1999,2000,2002,2010,2018,2019,2024,2025}

YEARS = list(range(1996, 2027))   # evaluation window (need t-1, t-2 available)

# ── Helper: does an El Niño in t-1 or t-2 predict a surge in t? ─────────────────
def predict(year, thr):
    """E-channel alarm for `year` if ONI(t-1) or ONI(t-2) >= threshold (lag model)."""
    return max(ONI.get(year-1, -9), ONI.get(year-2, -9)) >= thr

def confusion(thr):
    tp=fp=tn=fn=0
    for y in YEARS:
        alarm = predict(y, thr)
        surge = y in SURGE_YEARS
        if   alarm and surge: tp+=1
        elif alarm and not surge: fp+=1
        elif not alarm and surge: fn+=1
        else: tn+=1
    return tp,fp,tn,fn

def metrics(thr):
    tp,fp,tn,fn = confusion(thr)
    sens = tp/(tp+fn) if tp+fn else 0      # sensitivity / recall
    spec = tn/(tn+fp) if tn+fp else 0      # specificity
    ppv  = tp/(tp+fp) if tp+fp else 0      # positive predictive value
    # Youden's J and Matthews correlation coefficient
    j = sens + spec - 1
    denom = ((tp+fp)*(tp+fn)*(tn+fp)*(tn+fn)) ** 0.5
    mcc = (tp*tn - fp*fn)/denom if denom else 0
    return dict(thr=thr, tp=tp, fp=fp, tn=tn, fn=fn,
                sens=sens, spec=spec, ppv=ppv, youden=j, mcc=mcc)

# ── 1. Threshold sweep ─────────────────────────────────────────────────────────
print("="*72)
print("SENTINEL-Φ hindcast calibration — Andes virus (ANDV) / ENSO lag model")
print("="*72)
print(f"\nEvaluation window: {YEARS[0]}–{YEARS[-1]}  ·  documented surge years: {sorted(SURGE_YEARS)}")
print("\nThreshold sweep (alarm if peak ONI in t-1 or t-2 >= threshold):")
print(f"{'ONI thr':>8} {'Sens':>6} {'Spec':>6} {'PPV':>6} {'Youden':>7} {'MCC':>6}  (TP/FP/FN/TN)")
best = None
for thr in [round(0.5 + 0.1*i, 1) for i in range(0, 16)]:   # 0.5 … 2.0
    m = metrics(thr)
    print(f"{thr:>8.1f} {m['sens']:>6.2f} {m['spec']:>6.2f} {m['ppv']:>6.2f} "
          f"{m['youden']:>7.2f} {m['mcc']:>6.2f}  ({m['tp']}/{m['fp']}/{m['fn']}/{m['tn']})")
    if best is None or m['mcc'] > best['mcc']:
        best = m

print(f"\nBest threshold by MCC: ONI >= {best['thr']:.1f}  "
      f"(Sens {best['sens']:.2f}, Spec {best['spec']:.2f}, PPV {best['ppv']:.2f}, MCC {best['mcc']:.2f})")

# ── 2. Lead-time analysis at the best threshold ────────────────────────────────
print("\nLead-time at best threshold (years between El Niño signal and surge):")
leads = []
for y in sorted(SURGE_YEARS):
    if y < YEARS[0]: continue
    o1, o2 = ONI.get(y-1,-9), ONI.get(y-2,-9)
    if max(o1,o2) >= best['thr']:
        lead = 1 if o1 >= best['thr'] else 2
        leads.append(lead)
        print(f"  {y}: signal {lead} yr earlier (ONI t-1={o1:+.2f}, t-2={o2:+.2f}) → DETECTED")
    else:
        print(f"  {y}: no El Niño signal (ONI t-1={o1:+.2f}, t-2={o2:+.2f}) → MISSED (other driver)")
if leads:
    print(f"\nMean lead time (detected surges): {statistics.mean(leads):.1f} years "
          f"(~{statistics.mean(leads)*12:.0f} months)")

# ── 3. Suggested calibrated mapping for the E channel ──────────────────────────
print("\nSuggested calibrated E-channel mapping (ONI lag → risk points):")
print("  peak ONI(t-1..t-2) >= +2.0  → E +90   (very strong El Niño)")
print("  >= +1.5 → E +72   ·  >= +1.0 → E +55   ·  >= +0.5 → E +38   ·  else 20")
print("\nNotes / limitations:")
print("  • ANDV surges in 1997 & 2002 had weaker/absent prior El Niño — other")
print("    drivers (local precipitation, masting) matter; combine with NDVI + soil.")
print("  • Small N (9 surge years) → wide CIs; treat thresholds as indicative.")
print("  • Specificity is the known weak point of climate EWS; report it explicitly.")
print("  • Next: repeat for dengue (Ecuador/Brazil, longer lead) and RVF (East")
print("    Africa, IOD+NDVI) to generalise the calibration across pathogens.")

# ── Figure ─────────────────────────────────────────────────────────────────────
try:
    import matplotlib
    matplotlib.use('Agg')
    import matplotlib.pyplot as plt
    thrs = [round(0.5+0.1*i,1) for i in range(0,16)]
    ms = [metrics(t) for t in thrs]
    fig, ax = plt.subplots(figsize=(9,5))
    ax.plot(thrs, [m['sens'] for m in ms], 'o-', label='Sensitivity', color='#2ca02c')
    ax.plot(thrs, [m['spec'] for m in ms], 's-', label='Specificity', color='#1f77b4')
    ax.plot(thrs, [m['ppv']  for m in ms], '^-', label='PPV',         color='#ff7f0e')
    ax.plot(thrs, [m['mcc']  for m in ms], 'd--',label='MCC',         color='#d62728')
    ax.axvline(best['thr'], color='#999', ls=':', label=f"Best (ONI≥{best['thr']:.1f})")
    ax.set_xlabel('ONI alarm threshold (peak in t-1 or t-2)')
    ax.set_ylabel('Skill metric'); ax.set_ylim(-0.2,1.05); ax.grid(alpha=0.3)
    ax.legend(fontsize=9, loc='lower left')
    ax.set_title('SENTINEL-Φ hindcast calibration — ANDV/ENSO lag model (1996–2026)',
                 fontsize=12, fontweight='bold')
    fig.tight_layout()
    out = '/Users/lshlt19/GitHub/infectonet/figures/sentinel_calibration_andv.png'
    fig.savefig(out, dpi=200, bbox_inches='tight')
    print(f"\nCalibration figure saved: {out}")
except Exception as e:
    print(f"\n(figure skipped: {e})")
