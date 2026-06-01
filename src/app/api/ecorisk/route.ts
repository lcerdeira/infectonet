/**
 * GET /api/ecorisk?virus=<id>
 *
 * Returns ecological risk context for a given virus combining four live signals:
 *
 *  1. ENSO/ONI (NOAA CPC)        — rodent/vector irruption driver; 12–18 month lag
 *  2. Rainfall anomaly (Open-Meteo ERA5) — local precipitation vs 30-yr baseline
 *  3. Forest loss trend (World Bank API) — deforestation in endemic country
 *  4. Regional SST anomaly (NOAA sstoi) — ocean temperature for tropical vectors
 *
 * All sources free, no API key required. Cache: 6 hours.
 */
import { NextRequest, NextResponse } from 'next/server';

// ── ENSO thresholds ───────────────────────────────────────────────────────────
const EL_NINO  =  0.5;
const LA_NINA  = -0.5;

// ── Virus classification ──────────────────────────────────────────────────────
const ENSO_DRIVEN     = new Set(['hantavirus','riftvalley','dengue','zika','chikungunya','westnile','oropouche','yellowfever']);
const CONFLICT_DRIVEN = new Set(['ebola','marburg','lassa','crimean','mpox']);
const DUAL_DRIVEN     = new Set(['nipah']);

// ── Per-virus geographic config ───────────────────────────────────────────────
interface VirusGeo {
  lat: number; lon: number;          // endemic region centroid
  regionName: string;                // display name
  forestCountries: string[];         // World Bank ISO2 codes
  sstIndex: 'nino34' | 'nino4' | 'nino12' | 'none'; // relevant SST basin
  monthlyNormals: number[];          // 30-yr ERA5 precip normals (mm/month) Jan–Dec
}

const VIRUS_GEO: Record<string, VirusGeo> = {
  hantavirus: {
    lat: -40.0, lon: -70.0,
    regionName: 'Patagonia, Argentina/Chile',
    forestCountries: ['AR','CL'],
    sstIndex: 'nino12',   // eastern Pacific → Patagonian rainfall
    monthlyNormals: [30,25,22,18,15,12,10,12,18,22,28,32],
  },
  riftvalley: {
    lat: 0.5, lon: 37.5,
    regionName: 'East Africa (Kenya/Tanzania)',
    forestCountries: ['KE','TZ'],
    sstIndex: 'nino34',
    monthlyNormals: [50,45,80,130,110,40,25,30,50,90,120,70],
  },
  dengue: {
    lat: -3.0, lon: -60.0,
    regionName: 'Amazon Basin / Southeast Asia',
    forestCountries: ['BR','PH','ID'],
    sstIndex: 'nino4',    // western Pacific → SE Asia dengue
    monthlyNormals: [250,220,250,230,180,100,80,90,110,150,200,250],
  },
  zika: {
    lat: -3.0, lon: -60.0,
    regionName: 'Tropical Americas',
    forestCountries: ['BR','CO'],
    sstIndex: 'nino34',
    monthlyNormals: [250,220,250,230,180,100,80,90,110,150,200,250],
  },
  chikungunya: {
    lat: 13.0, lon: 80.0,
    regionName: 'South/Southeast Asia',
    forestCountries: ['IN','TH'],
    sstIndex: 'nino34',
    monthlyNormals: [30,10,5,15,45,100,120,110,120,120,35,25],
  },
  westnile: {
    lat: 41.0, lon: 12.0,
    regionName: 'Mediterranean / Southern Europe',
    forestCountries: ['IT','GR'],
    sstIndex: 'nino34',
    monthlyNormals: [70,65,70,70,55,30,15,18,50,90,110,80],
  },
  oropouche: {
    lat: -3.0, lon: -60.0,
    regionName: 'Amazon / Tropical Americas',
    forestCountries: ['BR','PE'],
    sstIndex: 'nino34',
    monthlyNormals: [250,220,250,230,180,100,80,90,110,150,200,250],
  },
  yellowfever: {
    lat: 6.0, lon: 20.0,
    regionName: 'Central/West Africa & South America',
    forestCountries: ['CD','NG','BR'],
    sstIndex: 'nino34',
    monthlyNormals: [50,70,110,150,160,100,50,60,120,160,130,70],
  },
  ebola: {
    lat: 0.5, lon: 25.0,
    regionName: 'Central Africa (DRC/Congo Basin)',
    forestCountries: ['CD','CG'],
    sstIndex: 'none',
    monthlyNormals: [100,110,130,160,160,80,30,50,100,150,170,110],
  },
  marburg: {
    lat: 1.0, lon: 32.0,
    regionName: 'Albertine Rift (Uganda/DRC)',
    forestCountries: ['UG','CD'],
    sstIndex: 'none',
    monthlyNormals: [65,80,115,150,125,55,45,60,90,130,140,75],
  },
  lassa: {
    lat: 8.0, lon: 12.0,
    regionName: 'West Africa (Nigeria/Sierra Leone)',
    forestCountries: ['NG','SL','GN'],
    sstIndex: 'none',
    monthlyNormals: [10,20,50,100,160,200,280,300,250,160,50,15],
  },
  crimean: {
    lat: 45.0, lon: 35.0,
    regionName: 'Eurasia / Middle East',
    forestCountries: ['TR','KZ'],
    sstIndex: 'none',
    monthlyNormals: [40,35,35,35,40,35,25,25,30,40,50,45],
  },
  mpox: {
    lat: 0.5, lon: 25.0,
    regionName: 'Central Africa (DRC/Congo Basin)',
    forestCountries: ['CD','CF'],
    sstIndex: 'none',
    monthlyNormals: [100,110,130,160,160,80,30,50,100,150,170,110],
  },
  nipah: {
    lat: 24.0, lon: 90.0,
    regionName: 'Bangladesh / South Asia',
    forestCountries: ['BD','MY'],
    sstIndex: 'nino34',
    monthlyNormals: [10,20,40,100,200,350,380,330,250,120,25,10],
  },
};

// ── Static conflict risk scores (0–100) ──────────────────────────────────────
const CONFLICT_RISK: Record<string, number> = {
  ebola: 88, marburg: 72, lassa: 65, crimean: 58, mpox: 75, nipah: 40,
};

// ══════════════════════════════════════════════════════════════════════════════
// 1. NOAA ONI — ENSO
// ══════════════════════════════════════════════════════════════════════════════
async function fetchONI() {
  const res = await fetch('https://www.cpc.ncep.noaa.gov/data/indices/oni.ascii.txt', {
    next: { revalidate: 21600 },
    headers: { 'User-Agent': 'InfectoNET/1.0' },
  });
  if (!res.ok) throw new Error(`ONI fetch ${res.status}`);
  const text = await res.text();
  const records: { year: number; season: string; oni: number }[] = [];
  for (const line of text.split('\n').slice(1)) {
    const p = line.trim().split(/\s+/);
    if (p.length < 4) continue;
    const year = parseInt(p[1], 10), oni = parseFloat(p[3]);
    if (!isNaN(year) && !isNaN(oni)) records.push({ year, season: p[0], oni });
  }
  return records;
}

// ══════════════════════════════════════════════════════════════════════════════
// 2. NOAA Regional SST (sstoi.indices) — Tropical Pacific basins
// ══════════════════════════════════════════════════════════════════════════════
async function fetchSST() {
  const res = await fetch('https://www.cpc.ncep.noaa.gov/data/indices/sstoi.indices', {
    next: { revalidate: 21600 },
    headers: { 'User-Agent': 'InfectoNET/1.0' },
  });
  if (!res.ok) throw new Error(`SST fetch ${res.status}`);
  const text = await res.text();

  // Columns: YR MON NINO1+2 ANOM NINO3 ANOM NINO4 ANOM NINO3.4 ANOM
  const rows: { year: number; month: number; nino12: number; nino3: number; nino4: number; nino34: number }[] = [];
  for (const line of text.split('\n').slice(1)) {
    const p = line.trim().split(/\s+/);
    if (p.length < 9) continue;
    const year = parseInt(p[0], 10), month = parseInt(p[1], 10);
    if (isNaN(year) || isNaN(month)) continue;
    rows.push({
      year, month,
      nino12: parseFloat(p[3]),  // NINO1+2 anomaly
      nino3:  parseFloat(p[5]),  // NINO3   anomaly
      nino4:  parseFloat(p[7]),  // NINO4   anomaly
      nino34: parseFloat(p[9] ?? p[8]), // NINO3.4 anomaly
    });
  }
  return rows;
}

// ══════════════════════════════════════════════════════════════════════════════
// 3. Open-Meteo (ERA5 reanalysis) — Rainfall anomaly vs 30-yr baseline
// ══════════════════════════════════════════════════════════════════════════════
async function fetchRainfall(lat: number, lon: number, monthlyNormals: number[]) {
  // Fetch last 3 months of daily precipitation
  const now = new Date();
  const end   = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
  const start = new Date(now); start.setMonth(now.getMonth() - 2);
  const startStr = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2,'0')}-01`;

  const url = `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lon}&start_date=${startStr}&end_date=${end}&daily=precipitation_sum&timezone=GMT`;
  const res = await fetch(url, { next: { revalidate: 21600 }, headers: { 'User-Agent': 'InfectoNET/1.0' } });
  if (!res.ok) throw new Error(`Open-Meteo ${res.status}`);
  const data = await res.json() as { daily: { time: string[]; precipitation_sum: (number | null)[] } };

  // Sum by month
  const monthly: Record<string, number> = {};
  for (let i = 0; i < data.daily.time.length; i++) {
    const mo = data.daily.time[i].substring(0, 7);
    const v = data.daily.precipitation_sum[i];
    if (v !== null) monthly[mo] = (monthly[mo] ?? 0) + v;
  }

  // Most recent complete month
  const months = Object.keys(monthly).sort().slice(-2); // last 2 months
  const results = months.map(mo => {
    const moIdx = parseInt(mo.split('-')[1], 10) - 1; // 0-based
    const normal = monthlyNormals[moIdx] ?? 50;
    const actual = monthly[mo];
    const anomaly = actual - normal;
    const anomalyPct = normal > 0 ? (anomaly / normal) * 100 : 0;
    return {
      month: mo,
      actual: Math.round(actual * 10) / 10,
      normal: Math.round(normal * 10) / 10,
      anomaly: Math.round(anomaly * 10) / 10,
      anomalyPct: Math.round(anomalyPct),
      phase: anomalyPct >= 25 ? 'wet' : anomalyPct <= -25 ? 'dry' : 'normal' as const,
    };
  });

  return results;
}

// ══════════════════════════════════════════════════════════════════════════════
// 4. World Bank API — Forest area trend (deforestation proxy)
// ══════════════════════════════════════════════════════════════════════════════
async function fetchForestLoss(iso2Codes: string[]) {
  if (!iso2Codes.length) return null;
  const codes = iso2Codes.join(';');
  const url = `https://api.worldbank.org/v2/country/${codes}/indicator/AG.LND.FRST.K2?format=json&mrv=8&per_page=50`;
  const res = await fetch(url, { next: { revalidate: 86400 }, headers: { 'User-Agent': 'InfectoNET/1.0' } });
  if (!res.ok) throw new Error(`WorldBank ${res.status}`);
  const data = await res.json() as [unknown, { countryiso3code: string; country: { value: string }; date: string; value: number | null }[]];
  const rows = data[1] ?? [];

  // Group by country, compute 5-year trend
  const byCountry: Record<string, { country: string; iso: string; years: [string, number][] }> = {};
  for (const r of rows) {
    if (!r.value || !r.countryiso3code) continue;
    if (!byCountry[r.countryiso3code]) {
      byCountry[r.countryiso3code] = { country: r.country.value, iso: r.countryiso3code, years: [] };
    }
    byCountry[r.countryiso3code].years.push([r.date, r.value]);
  }

  const result: {
    country: string; iso: string;
    latestYear: string; latestForest: number;
    change5yr: number; change5yrPct: number;
    trend: 'increasing' | 'stable' | 'decreasing';
  }[] = [];

  for (const v of Object.values(byCountry)) {
    const sorted = v.years.sort(([a], [b]) => b.localeCompare(a)); // newest first
    if (sorted.length < 2) continue;
    const newest = sorted[0], oldest = sorted[Math.min(4, sorted.length - 1)];
    const change = newest[1] - oldest[1]; // negative = loss
    const changePct = oldest[1] > 0 ? (change / oldest[1]) * 100 : 0;
    result.push({
      country: v.country, iso: v.iso,
      latestYear: newest[0], latestForest: Math.round(newest[1]),
      change5yr: Math.round(change),
      change5yrPct: Math.round(changePct * 10) / 10,
      trend: changePct <= -5 ? 'decreasing' : changePct >= 5 ? 'increasing' : 'stable',
    });
  }
  return result.length ? result : null;
}

// ══════════════════════════════════════════════════════════════════════════════
// Risk score & narrative helpers
// ══════════════════════════════════════════════════════════════════════════════
function oniPhase(v: number) { return v >= EL_NINO ? 'el_nino' : v <= LA_NINA ? 'la_nina' : 'neutral'; }
function oniColor(p: string) { return p === 'el_nino' ? '#d62728' : p === 'la_nina' ? '#1f77b4' : '#aec7e8'; }

function sstLabel(idx: string, val: number) {
  if (idx === 'none') return null;
  const basin = { nino34: 'Central Pacific (NINO3.4)', nino4: 'Western Pacific (NINO4)', nino12: 'Eastern Pacific (NINO1+2)', nino3: 'Eastern-Central Pacific (NINO3)' }[idx] ?? idx;
  const phase = val >= 0.5 ? 'warm (El Niño)' : val <= -0.5 ? 'cool (La Niña)' : 'neutral';
  return { basin, value: val, phase, color: val >= 0.5 ? '#d62728' : val <= -0.5 ? '#1f77b4' : '#6b7280' };
}

function rainfallRiskBonus(rain: { anomalyPct: number; phase: string }[] | null, vid: string): number {
  if (!rain?.length) return 0;
  const latest = rain.at(-1);
  if (!latest) return 0;
  if (vid === 'riftvalley' && latest.phase === 'wet') return latest.anomalyPct >= 50 ? 20 : 10;
  if (vid === 'hantavirus' && latest.phase === 'wet') return latest.anomalyPct >= 30 ? 15 : 8;
  if (['dengue','zika','chikungunya','oropouche'].includes(vid) && latest.phase === 'wet') return 10;
  if (['ebola','marburg'].includes(vid) && latest.phase === 'dry') return 8; // dry → bat stress → spillover
  return 0;
}

function forestRiskBonus(forest: { change5yrPct: number }[] | null | undefined, vid: string): number {
  if (!forest?.length) return 0;
  const worst = forest.reduce((a, b) => (a.change5yrPct < b.change5yrPct ? a : b));
  if (worst.change5yrPct <= -10) return CONFLICT_DRIVEN.has(vid) ? 15 : 10;
  if (worst.change5yrPct <= -5)  return CONFLICT_DRIVEN.has(vid) ? 8  : 5;
  return 0;
}

function ensoRiskBase(recentMax: number): number {
  if (recentMax >= 2.0) return 90;
  if (recentMax >= 1.5) return 72;
  if (recentMax >= 1.0) return 55;
  if (recentMax >= 0.5) return 38;
  return 20;
}

function buildNarrative(
  vid: string, oni: number, phase: string, recentMax: number,
  rain: { month: string; actual: number; normal: number; anomalyPct: number; phase: string }[] | null,
  forest: { country: string; change5yrPct: number; trend: string }[] | null,
  sstInfo: { basin: string; value: number; phase: string } | null
): string {
  const parts: string[] = [];

  // ENSO narrative
  if (ENSO_DRIVEN.has(vid) || DUAL_DRIVEN.has(vid)) {
    if (phase === 'el_nino' && oni >= 1.5) {
      parts.push(`⚠️ Strong El Niño (ONI +${oni.toFixed(2)}) — high risk window for ${vid} in coming 12–18 months.`);
    } else if (recentMax >= 1.5 && (phase === 'neutral' || phase === 'la_nina')) {
      parts.push(`⚠️ El Niño lag active (peak ONI +${recentMax.toFixed(2)}) — elevated ${vid} risk persists through the current season.`);
    } else if (phase === 'el_nino') {
      parts.push(`Moderate El Niño (ONI +${oni.toFixed(2)}) — monitor reservoir/vector populations over next 12 months.`);
    } else if (phase === 'la_nina') {
      parts.push(`La Niña (ONI ${oni.toFixed(2)}) — suppressed risk from ENSO signal for most regions.`);
    } else {
      parts.push(`Neutral ENSO conditions (ONI ${oni > 0 ? '+' : ''}${oni.toFixed(2)}).`);
    }
  }

  // Rainfall narrative
  if (rain?.length) {
    const r = rain.at(-1)!;
    if (r.phase === 'wet') {
      parts.push(`Precipitation in endemic zone ${r.month}: ${r.actual}mm — ${r.anomalyPct > 0 ? '+' : ''}${r.anomalyPct}% vs 30-yr baseline (${r.normal}mm). Above-normal rainfall elevates ${vid === 'riftvalley' ? 'RVF vector breeding risk' : vid === 'hantavirus' ? 'vegetation/rodent habitat' : 'vector breeding habitat'}.`);
    } else if (r.phase === 'dry') {
      parts.push(`Precipitation ${r.month}: ${r.actual}mm (${r.anomalyPct}% vs baseline ${r.normal}mm). Below-normal rainfall ${CONFLICT_DRIVEN.has(vid) ? 'may concentrate bat foraging near human settlements' : 'reduces vector habitat but may concentrate animal-human contact at water sources'}.`);
    } else {
      parts.push(`Rainfall near baseline in endemic zone (${r.actual}mm vs ${r.normal}mm normal).`);
    }
  }

  // Deforestation narrative
  if (forest?.length) {
    const worst = forest.reduce((a, b) => a.change5yrPct < b.change5yrPct ? a : b);
    if (worst.trend === 'decreasing') {
      parts.push(`Forest cover in ${worst.country}: ${worst.change5yrPct.toFixed(1)}% in 5 years — increased bat/rodent–human interface risk.`);
    }
  }

  // SST narrative
  if (sstInfo && Math.abs(sstInfo.value) >= 0.5) {
    parts.push(`${sstInfo.basin} SST anomaly: ${sstInfo.value > 0 ? '+' : ''}${sstInfo.value.toFixed(2)}°C (${sstInfo.phase}) — influences regional vector activity.`);
  }

  // Conflict narrative (static)
  if (CONFLICT_DRIVEN.has(vid)) {
    const score = CONFLICT_RISK[vid] ?? 50;
    if (score >= 75) parts.push(`⚠️ HIGH conflict risk in endemic zone — health surveillance severely impaired, contact tracing compromised.`);
    else if (score >= 50) parts.push(`Elevated conflict/fragility in endemic zone — early case detection may be delayed.`);
  }

  return parts.join(' ') || 'Baseline ecological risk — routine surveillance recommended.';
}

// ══════════════════════════════════════════════════════════════════════════════
// Route handler
// ══════════════════════════════════════════════════════════════════════════════
export async function GET(req: NextRequest) {
  const virus = req.nextUrl.searchParams.get('virus') ?? '';
  const geo   = VIRUS_GEO[virus];

  const useEnso     = ENSO_DRIVEN.has(virus) || DUAL_DRIVEN.has(virus);
  const useConflict = CONFLICT_DRIVEN.has(virus) || DUAL_DRIVEN.has(virus);

  // Parallel fetch — all sources simultaneously
  const [oniSeries, sstRows, rainfallData, forestData] = await Promise.all([
    fetchONI().catch(() => [] as Awaited<ReturnType<typeof fetchONI>>),
    fetchSST().catch(() => [] as Awaited<ReturnType<typeof fetchSST>>),
    geo ? fetchRainfall(geo.lat, geo.lon, geo.monthlyNormals).catch(() => null) : Promise.resolve(null),
    geo ? fetchForestLoss(geo.forestCountries).catch(() => null) : Promise.resolve(null),
  ]);

  // ── ENSO ──────────────────────────────────────────────────────────────────
  const currentYear = new Date().getFullYear();
  const annualOni = Array.from({ length: 6 }, (_, i) => currentYear - 5 + i).map(y => {
    const recs = oniSeries.filter(r => r.year === y);
    if (!recs.length) return null;
    const vals = recs.map(r => r.oni);
    const extreme = Math.abs(Math.max(...vals)) >= Math.abs(Math.min(...vals)) ? Math.max(...vals) : Math.min(...vals);
    const phase = oniPhase(extreme);
    return { year: y, maxOni: parseFloat(extreme.toFixed(2)), phase, color: oniColor(phase) };
  }).filter(Boolean) as { year: number; maxOni: number; phase: string; color: string }[];

  const latest       = oniSeries.at(-1);
  const currentOni   = latest?.oni ?? 0;
  const currentPhase = oniPhase(currentOni);
  const recentMax    = Math.max(...oniSeries.filter(r => r.year >= currentYear - 2).map(r => r.oni), 0);

  // ── SST ───────────────────────────────────────────────────────────────────
  const sstLatest = sstRows.at(-1);
  const sstIndex  = geo?.sstIndex ?? 'none';
  const sstVal    = sstLatest && sstIndex !== 'none' ? (sstLatest[sstIndex as keyof typeof sstLatest] as number) : null;
  const sstInfo   = (sstVal !== null && sstVal !== undefined) ? sstLabel(sstIndex, sstVal) : null;

  // ── Risk score ────────────────────────────────────────────────────────────
  let riskScore = 20;
  if (useEnso)     riskScore = Math.max(riskScore, ensoRiskBase(recentMax));
  if (useConflict) riskScore = Math.max(riskScore, CONFLICT_RISK[virus] ?? 50);
  riskScore = Math.min(100, riskScore
    + rainfallRiskBonus(rainfallData, virus)
    + forestRiskBonus(forestData, virus));

  const riskLevel =
    riskScore >= 75 ? 'HIGH' : riskScore >= 50 ? 'ELEVATED' : riskScore >= 30 ? 'MODERATE' : 'LOW';
  const riskColor =
    riskLevel === 'HIGH' ? '#d62728' : riskLevel === 'ELEVATED' ? '#ff7f0e' :
    riskLevel === 'MODERATE' ? '#f5c518' : '#2ca02c';

  const narrative = buildNarrative(virus, currentOni, currentPhase, recentMax, rainfallData, forestData, sstInfo);

  return NextResponse.json({
    virus, riskScore, riskLevel, riskColor, narrative,
    drivers: { enso: useEnso, conflict: useConflict, rainfall: !!geo, forest: !!geo, sst: sstIndex !== 'none' },
    enso: {
      currentOni: parseFloat(currentOni.toFixed(2)),
      currentPhase,
      currentSeason: latest?.season ?? null,
      latestYear:    latest?.year   ?? null,
      annualSeries:  annualOni,
      recentMax:     parseFloat(recentMax.toFixed(2)),
      lagNote: useEnso ? 'ENSO signal has a 12–18 month lag before affecting reservoir/vector populations' : null,
    },
    rainfall: rainfallData ? {
      region: geo?.regionName ?? null,
      months: rainfallData,
      source: 'Open-Meteo ERA5 reanalysis',
      note:   'Monthly totals vs ERA5/CHIRPS 30-year baseline (1991–2020)',
    } : null,
    sst: sstInfo ? {
      ...sstInfo,
      month: sstLatest ? `${sstLatest.year}-${String(sstLatest.month).padStart(2,'0')}` : null,
      source: 'NOAA SST Oceanic Indices (sstoi.indices)',
    } : null,
    forest: forestData ? {
      countries: forestData,
      source:    'World Bank — Forest area (AG.LND.FRST.K2)',
      note:      'Forest area km² — negative 5-yr change indicates deforestation',
    } : null,
    conflict: useConflict ? {
      score:   CONFLICT_RISK[virus] ?? 50,
      note:    'Based on ACLED conflict event density and GFW trend in endemic zones (2024–2025)',
      sources: ['ACLED', 'World Bank Forest API'],
    } : null,
  }, { headers: { 'Cache-Control': 'public, s-maxage=21600, stale-while-revalidate=3600' } });
}
