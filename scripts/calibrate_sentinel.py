#!/usr/bin/env python3
"""
SENTINEL-Φ — multi-pathogen hindcast calibration protocol
=========================================================
Retrospectively tests the ECOLOGICAL channel (E) of SENTINEL-Φ against the
documented outbreak record of three climate-sensitive pathogens, each with its
own ENSO lag structure:

  • Andes virus (ANDV) hantavirus — Patagonia. El Niño → rainfall → Nothofagus
    masting → rodent irruption → spillover.  Lag 12–18 months (t-1, t-2).
  • Dengue — Americas/global. El Niño → warmer/wetter → Aedes amplification.
    Lag ~0–12 months (t, t-1).
  • Rift Valley Fever (RVF) — East Africa. El Niño / +IOD → heavy short/long
    rains → floodwater-mosquito hatch → epizootic.  Lag ~0–12 months (t, t-1).

For each pathogen it computes a threshold sweep (sensitivity, specificity, PPV,
Youden's J, MCC), the best ONI threshold, and the mean lead time, then writes a
3-panel calibration figure to figures/.

Surge-year sources: WHO DON archive; PAHO; Anyamba et al. PNAS (RVF NDVI);
Yates et al. BioScience 2002 (hantavirus–ENSO); peer-reviewed dengue-ENSO reviews.

Run:  python3 scripts/calibrate_sentinel.py
"""
import statistics

# ── Annual peak ONI (NOAA CPC). Positive = El Niño. ─────────────────────────────
ONI = {
    1990:0.40,1991:1.30,1992:1.70,1993:0.70,1994:1.09,1995:-1.00,1996:-0.90,
    1997:2.40,1998:2.24,1999:-1.65,2000:-1.66,2001:-0.68,2002:1.31,2003:0.92,
    2004:0.70,2005:-0.84,2006:0.94,2007:-1.60,2008:-1.64,2009:1.56,2010:-1.64,
    2011:-1.31,2012:-0.72,2013:-0.35,2014:0.77,2015:2.75,2016:2.63,2017:-0.86,
    2018:0.97,2019:0.89,2020:-1.20,2021:-0.91,2022:-0.97,2023:2.06,2024:1.92,
    2025:-0.55,2026:-0.37,
}

# ── Per-pathogen configuration ──────────────────────────────────────────────────
#   surges : documented above-baseline outbreak years
#   lags   : which prior-year offsets the El Niño signal is read from
#   window : evaluation year range
PATHOGENS = {
    'Andes virus (hantavirus)': {
        'surges': {1997,1999,2000,2002,2010,2018,2019,2024,2025},
        'lags':   (1, 2),                 # 12–18 month lag
        'window': range(1996, 2027),
        'region': 'Patagonia (Argentina/Chile)',
        'op_thr': 1.5,                    # operational threshold deployed (ENSO_CAL)
    },
    'Dengue (Americas)': {
        # Major/record dengue epidemic years in the Americas
        'surges': {1998,2002,2010,2013,2016,2019,2023,2024},
        'lags':   (0, 1),                 # same year / following season
        'window': range(1995, 2027),
        'region': 'Tropical Americas',
        'op_thr': 1.1,
    },
    'Rift Valley Fever (E. Africa)': {
        # Canonical East-African RVF epizootics/epidemics
        'surges': {1998,2007,2018},
        'lags':   (0, 1),                 # within the post-El Niño rains
        'window': range(1995, 2021),
        'region': 'Horn of Africa',
        'op_thr': 0.9,
    },
}

def predict(year, thr, lags):
    """E-channel alarm if peak ONI at any configured lag >= threshold."""
    return max((ONI.get(year - L, -9) for L in lags), default=-9) >= thr

def metrics(cfg, thr):
    tp = fp = tn = fn = 0
    for y in cfg['window']:
        alarm = predict(y, thr, cfg['lags'])
        surge = y in cfg['surges']
        if   alarm and surge:     tp += 1
        elif alarm and not surge: fp += 1
        elif not alarm and surge: fn += 1
        else:                     tn += 1
    sens = tp/(tp+fn) if tp+fn else 0
    spec = tn/(tn+fp) if tn+fp else 0
    ppv  = tp/(tp+fp) if tp+fp else 0
    j    = sens + spec - 1
    den  = ((tp+fp)*(tp+fn)*(tn+fp)*(tn+fn)) ** 0.5
    mcc  = (tp*tn - fp*fn)/den if den else 0
    return dict(thr=thr, tp=tp, fp=fp, tn=tn, fn=fn, sens=sens, spec=spec, ppv=ppv, youden=j, mcc=mcc)

THRS = [round(0.5 + 0.1*i, 1) for i in range(0, 16)]   # 0.5 … 2.0
results = {}

print("="*74)
print("SENTINEL-Φ multi-pathogen hindcast calibration (ecological / ENSO channel)")
print("="*74)

for name, cfg in PATHOGENS.items():
    sweep = [metrics(cfg, t) for t in THRS]
    best = max(sweep, key=lambda m: m['mcc'])
    op   = metrics(cfg, cfg['op_thr'])          # metrics at the DEPLOYED threshold
    results[name] = (sweep, best, cfg)

    print(f"\n■ {name}  ·  {cfg['region']}  ·  lag {cfg['lags']}  ·  {len(cfg['surges'])} surge years")
    print(f"  {'ONIthr':>7} {'Sens':>5} {'Spec':>5} {'PPV':>5} {'MCC':>6}")
    for m in sweep:
        flags = []
        if m is best: flags.append('MCC-max')
        if abs(m['thr'] - cfg['op_thr']) < 1e-9: flags.append('DEPLOYED')
        mark = ('  <= ' + ', '.join(flags)) if flags else ''
        print(f"  {m['thr']:>7.1f} {m['sens']:>5.2f} {m['spec']:>5.2f} {m['ppv']:>5.2f} {m['mcc']:>6.2f}{mark}")
    print(f"  MCC-max:  ONI >= {best['thr']:.1f} → Sens {best['sens']:.2f} Spec {best['spec']:.2f} "
          f"PPV {best['ppv']:.2f} MCC {best['mcc']:.2f}")
    print(f"  DEPLOYED: ONI >= {cfg['op_thr']:.1f} → Sens {op['sens']:.2f} Spec {op['spec']:.2f} "
          f"PPV {op['ppv']:.2f} MCC {op['mcc']:.2f}  (operational; favours sensitivity)")

    # detected / missed + lead time AT THE DEPLOYED THRESHOLD (the reportable one)
    detected, missed, leads = [], [], []
    for y in sorted(cfg['surges']):
        if y not in cfg['window']: continue
        hit = [L for L in cfg['lags'] if ONI.get(y-L, -9) >= cfg['op_thr']]
        if hit:
            detected.append(y); leads.append(min(hit))
        else:
            missed.append(y)
    tot = len(detected) + len(missed)
    print(f"  At deployed ONI≥{cfg['op_thr']}: detected {len(detected)}/{tot} {detected}")
    print(f"                              missed {missed}")
    if leads:
        print(f"  Mean lead (detected): {statistics.mean(leads):.2f} yr (~{statistics.mean(leads)*12:.0f} mo)")

# ── Summary table ───────────────────────────────────────────────────────────────
print("\n" + "="*74)
print("DEPLOYED per-pathogen ENSO thresholds (wired into the live E channel):")
print(f"  {'Pathogen':<32} {'lag':<8} {'ONIthr':>7} {'Sens':>5} {'Spec':>5} {'PPV':>5}")
for name, (sweep, best, cfg) in results.items():
    op = metrics(cfg, cfg['op_thr'])
    print(f"  {name:<32} {str(cfg['lags']):<8} {cfg['op_thr']:>7.1f} "
          f"{op['sens']:>5.2f} {op['spec']:>5.2f} {op['ppv']:>5.2f}")

print("""
Interpretation
  • Hantavirus has the longest, cleanest lag (12–18 mo) — best for long-lead alerts.
  • Dengue & RVF respond faster (same/next season) and need the SHORTER lag window;
    using the hantavirus 2-yr lag would mis-time them.
  • RVF has very few events (small N) but a very tight ENSO link → high specificity.
  • All three confirm: ENSO alone is a useful DRIVER but must be fused with NDVI +
    soil moisture (+ IOD for RVF) to lift sensitivity — the SENTINEL-Φ design.
Limitations: small N (3–9 surge years each) → wide CIs; surge-year definitions are
coarse (national above-baseline seasons). Treat thresholds as indicative, not final.
""")

# ── 3-panel figure ───────────────────────────────────────────────────────────────
try:
    import matplotlib
    matplotlib.use('Agg')
    import matplotlib.pyplot as plt
    fig, axes = plt.subplots(1, 3, figsize=(15, 4.6))
    for ax, (name, (sweep, best, cfg)) in zip(axes, results.items()):
        ax.plot(THRS, [m['sens'] for m in sweep], 'o-', color='#2ca02c', label='Sensitivity', ms=4)
        ax.plot(THRS, [m['spec'] for m in sweep], 's-', color='#1f77b4', label='Specificity', ms=4)
        ax.plot(THRS, [m['ppv']  for m in sweep], '^-', color='#ff7f0e', label='PPV', ms=4)
        ax.plot(THRS, [m['mcc']  for m in sweep], 'd--',color='#d62728', label='MCC', ms=4)
        ax.axvline(best['thr'], color='#999', ls=':')
        ax.set_title(f"{name}\nbest ONI≥{best['thr']:.1f} · lag {cfg['lags']}", fontsize=10, fontweight='bold')
        ax.set_xlabel('ONI alarm threshold'); ax.set_ylim(-0.25, 1.05); ax.grid(alpha=0.3)
    axes[0].set_ylabel('Skill metric'); axes[0].legend(fontsize=8, loc='lower left')
    plt.suptitle('SENTINEL-Φ hindcast calibration — ENSO channel across three pathogens',
                 fontsize=13, fontweight='bold', y=1.04)
    fig.tight_layout()
    out = '/Users/lshlt19/GitHub/infectonet/figures/sentinel_calibration_multi.png'
    fig.savefig(out, dpi=200, bbox_inches='tight')
    print(f"Calibration figure saved: {out}")
except Exception as e:
    print(f"(figure skipped: {e})")
