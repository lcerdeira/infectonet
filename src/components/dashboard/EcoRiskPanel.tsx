'use client';

/**
 * EcoRiskPanel — Ecological Risk Intelligence panel.
 *
 * Four live data sources:
 *   1. ENSO/ONI (NOAA)        — climate driver; 12-18 month lag
 *   2. Rainfall anomaly (Open-Meteo ERA5) — local precip vs 30-yr baseline
 *   3. Forest loss trend (World Bank)     — deforestation in endemic country
 *   4. Regional SST anomaly (NOAA sstoi)  — ocean temperature for tropical vectors
 *
 * Powered by /api/ecorisk?virus=<id>
 */

import { useEffect, useState } from 'react';
import { AlertTriangle, TrendingUp, Zap, Shield, RefreshCw, Info,
         CloudRain, TreePine, Thermometer, Waves, Droplets } from 'lucide-react';
import { SafePlot } from './SafePlot';

interface AnnualOni {
  year:    number;
  maxOni:  number;
  phase:   string;
  color:   string;
}

interface RainfallMonth {
  month: string; actual: number; normal: number;
  anomaly: number; anomalyPct: number; phase: string;
}

interface ForestCountry {
  country: string; iso: string; latestYear: string; latestForest: number;
  change5yr: number; change5yrPct: number; trend: string;
}

interface SSTInfo {
  basin: string; value: number; phase: string; color: string; month: string | null; source: string;
}

interface EcoRiskData {
  virus:      string;
  riskScore:  number;
  riskLevel:  'HIGH' | 'ELEVATED' | 'MODERATE' | 'LOW';
  riskColor:  string;
  narrative:  string;
  drivers: {
    enso: boolean; conflict: boolean; rainfall: boolean; forest: boolean;
    sst: boolean; iod: boolean; climate: boolean;
  };
  enso: {
    currentOni: number; currentPhase: string;
    currentSeason: string | null; latestYear: number | null;
    annualSeries: AnnualOni[]; recentMax: number; lagNote: string | null;
  };
  rainfall: {
    region: string | null; months: RainfallMonth[]; source: string; note: string;
  } | null;
  sst:    SSTInfo | null;
  iod:    { value: number; phase: string; month: string | null; color: string; note: string; source: string } | null;
  climate: {
    temperature: number | null; humidity: number | null; soilMoisture: number | null;
    periodStart: string; humidityNote: string | null; source: string;
  } | null;
  forest: { countries: ForestCountry[]; source: string; note: string } | null;
  conflict: { score: number; note: string; sources: string[] } | null;
}

function phaseLabel(phase: string) {
  if (phase === 'el_nino')  return 'El Niño';
  if (phase === 'la_nina')  return 'La Niña';
  return 'Neutral';
}

function RiskBadge({ level, color }: { level: string; color: string }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide text-white"
      style={{ backgroundColor: color }}
    >
      {level === 'HIGH' && <Zap className="h-3 w-3" />}
      {level === 'ELEVATED' && <AlertTriangle className="h-3 w-3" />}
      {level === 'MODERATE' && <TrendingUp className="h-3 w-3" />}
      {level === 'LOW' && <Shield className="h-3 w-3" />}
      {level}
    </span>
  );
}

function RiskMeter({ score, color }: { score: number; color: string }) {
  return (
    <div className="w-full">
      <div className="flex justify-between text-[10px] text-gray-400 mb-1">
        <span>0</span>
        <span className="font-semibold text-gray-700" style={{ color }}>
          {score}/100
        </span>
        <span>100</span>
      </div>
      <div className="h-2.5 w-full rounded-full bg-gray-100 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${score}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

function EnsoSparkline({ series }: { series: AnnualOni[] }) {
  if (!series.length) return null;

  const data = [{
    type:   'bar' as const,
    x:      series.map(d => String(d.year)),
    y:      series.map(d => d.maxOni),
    marker: { color: series.map(d => d.color) },
    hovertemplate: '<b>%{x}</b><br>ONI: %{y:.2f}<extra></extra>',
  }];

  return (
    <SafePlot
      data={data}
      layout={{
        height: 120,
        margin: { l: 32, r: 8, t: 4, b: 28 },
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor:  'rgba(0,0,0,0)',
        xaxis: { tickfont: { size: 9 }, gridcolor: '#f0f0f0' },
        yaxis: {
          tickfont: { size: 9 }, gridcolor: '#f0f0f0',
          zeroline: true, zerolinecolor: '#999', zerolinewidth: 1,
          range: [-2.5, 3.5],
        },
        showlegend: false,
        shapes: [
          { type: 'line', x0: 0, x1: 1, xref: 'paper', y0: 0.5,  y1: 0.5,
            line: { color: '#d62728', width: 1, dash: 'dot' } },
          { type: 'line', x0: 0, x1: 1, xref: 'paper', y0: -0.5, y1: -0.5,
            line: { color: '#1f77b4', width: 1, dash: 'dot' } },
        ],
      }}
      config={{ displayModeBar: false, responsive: true }}
      style={{ width: '100%' }}
    />
  );
}

interface Props {
  virusId: string;
}

export function EcoRiskPanel({ virusId }: Props) {
  const [data,    setData]    = useState<EcoRiskData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(false);

  const load = () => {
    setLoading(true);
    setError(false);
    fetch(`/api/ecorisk?virus=${virusId}`)
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(d => setData(d))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [virusId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) return (
    <div className="flex items-center gap-2 py-6 text-gray-400 text-sm">
      <RefreshCw className="h-4 w-4 animate-spin" />
      Loading ecological risk data…
    </div>
  );

  if (error || !data) return (
    <div className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-700">
      Could not load ecological risk data. NOAA or conflict indices may be temporarily unavailable.
    </div>
  );

  const showEnso     = data.drivers.enso;
  const showConflict = data.drivers.conflict;

  return (
    <div className="space-y-5">

      {/* ── Risk summary bar ─────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex-1 min-w-[200px]">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-sm font-semibold text-gray-700">Ecological Risk Score</span>
            <RiskBadge level={data.riskLevel} color={data.riskColor} />
          </div>
          <RiskMeter score={data.riskScore} color={data.riskColor} />
        </div>
        <div className="flex gap-3">
          {showEnso && (
            <div className="rounded-xl border border-blue-100 bg-blue-50 px-3 py-2 text-center min-w-[80px]">
              <p className="text-[10px] text-blue-500 font-medium uppercase tracking-wide">ENSO</p>
              <p className="text-lg font-bold" style={{ color: data.enso.currentOni >= 0.5 ? '#d62728' : (data.enso.currentOni <= -0.5 ? '#1f77b4' : '#6b7280') }}>
                {data.enso.currentOni > 0 ? '+' : ''}{data.enso.currentOni.toFixed(2)}
              </p>
              <p className="text-[10px] text-gray-500">{phaseLabel(data.enso.currentPhase)}</p>
            </div>
          )}
          {showConflict && data.conflict && (
            <div className="rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-center min-w-[80px]">
              <p className="text-[10px] text-red-500 font-medium uppercase tracking-wide">Conflict</p>
              <p className="text-lg font-bold text-red-700">{data.conflict.score}</p>
              <p className="text-[10px] text-gray-500">/ 100</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Narrative ───────────────────────────────────────────────────── */}
      <div
        className="rounded-xl border px-4 py-4 text-sm leading-relaxed"
        style={{
          borderColor: `${data.riskColor}40`,
          backgroundColor: `${data.riskColor}08`,
          color: '#374151',
        }}
      >
        <div className="flex gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" style={{ color: data.riskColor }} />
          <p>{data.narrative}</p>
        </div>
      </div>

      {/* ── ENSO ONI sparkline ───────────────────────────────────────────── */}
      {showEnso && data.enso.annualSeries.length > 0 && (
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-sm font-semibold text-gray-800">
              ENSO / Oceanic Niño Index — 5-year history
            </h3>
            <span className="text-[10px] text-gray-400">
              Source: NOAA/CPC · {data.enso.currentSeason} {data.enso.latestYear}
            </span>
          </div>
          <EnsoSparkline series={data.enso.annualSeries} />
          <div className="flex flex-wrap gap-3 mt-2 text-[10px]">
            {[
              { color: '#d62728', label: 'El Niño (ONI ≥ +0.5)' },
              { color: '#1f77b4', label: 'La Niña (ONI ≤ −0.5)' },
              { color: '#aec7e8', label: 'Neutral' },
            ].map(item => (
              <span key={item.label} className="flex items-center gap-1 text-gray-500">
                <span className="h-2.5 w-2.5 rounded-sm inline-block" style={{ backgroundColor: item.color }} />
                {item.label}
              </span>
            ))}
          </div>
          {data.enso.lagNote && (
            <p className="mt-3 flex items-start gap-1.5 text-[10px] text-gray-400 italic">
              <Info className="h-3 w-3 shrink-0 mt-0.5" />
              {data.enso.lagNote}
            </p>
          )}
        </div>
      )}

      {/* ── Rainfall anomaly ─────────────────────────────────────────────── */}
      {data.rainfall && data.rainfall.months.length > 0 && (
        <div className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <CloudRain className="h-4 w-4 text-blue-500" />
            <h3 className="text-sm font-semibold text-gray-800">Rainfall Anomaly</h3>
            <span className="text-[10px] text-gray-400 ml-auto">{data.rainfall.region}</span>
          </div>
          <div className="flex gap-3 flex-wrap">
            {data.rainfall.months.map(m => {
              const bg = m.phase === 'wet' ? 'border-blue-200 bg-blue-50' :
                         m.phase === 'dry' ? 'border-amber-200 bg-amber-50' : 'border-gray-200 bg-gray-50';
              const col = m.phase === 'wet' ? '#1f77b4' : m.phase === 'dry' ? '#f59e0b' : '#6b7280';
              return (
                <div key={m.month} className={`rounded-xl border px-4 py-3 min-w-[130px] ${bg}`}>
                  <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">{m.month}</p>
                  <p className="text-xl font-bold mt-0.5" style={{ color: col }}>{m.actual} mm</p>
                  <p className="text-[10px] text-gray-500">Baseline: {m.normal} mm</p>
                  <p className="text-xs font-semibold mt-0.5" style={{ color: col }}>
                    {m.anomalyPct > 0 ? '+' : ''}{m.anomalyPct}%
                    {' '}<span className="font-normal capitalize">{m.phase}</span>
                  </p>
                </div>
              );
            })}
          </div>
          <p className="mt-3 text-[10px] text-gray-400 italic flex items-start gap-1.5">
            <Info className="h-3 w-3 shrink-0 mt-0.5" />
            {data.rainfall.note} · {data.rainfall.source}
          </p>
        </div>
      )}

      {/* ── SST regional ─────────────────────────────────────────────────── */}
      {data.sst && (
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Thermometer className="h-4 w-4 text-orange-500" />
            <h3 className="text-sm font-semibold text-gray-800">Sea Surface Temperature</h3>
            {data.sst.month && (
              <span className="text-[10px] text-gray-400 ml-auto">{data.sst.month}</span>
            )}
          </div>
          <div className="flex items-start gap-4">
            <div className="rounded-xl border px-4 py-3 text-center min-w-[110px]"
                 style={{ borderColor: `${data.sst.color}40`, backgroundColor: `${data.sst.color}10` }}>
              <p className="text-[10px] text-gray-500 font-medium">Anomaly (°C)</p>
              <p className="text-2xl font-bold mt-0.5" style={{ color: data.sst.color }}>
                {data.sst.value > 0 ? '+' : ''}{data.sst.value.toFixed(2)}
              </p>
              <p className="text-[10px] capitalize mt-0.5" style={{ color: data.sst.color }}>
                {data.sst.phase}
              </p>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-800">{data.sst.basin}</p>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                Warm SST anomaly increases evaporation and atmospheric moisture, driving
                elevated precipitation and enhanced vector breeding in downwind endemic regions.
                Cool anomaly (La Niña side) suppresses precipitation in tropical zones.
              </p>
              <p className="text-[10px] text-gray-400 mt-2 italic">{data.sst.source}</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Indian Ocean Dipole ──────────────────────────────────────────── */}
      {data.iod && (
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Waves className="h-4 w-4 text-cyan-600" />
            <h3 className="text-sm font-semibold text-gray-800">Indian Ocean Dipole (IOD)</h3>
            {data.iod.month && (
              <span className="text-[10px] text-gray-400 ml-auto">{data.iod.month}</span>
            )}
          </div>
          <div className="flex items-start gap-4">
            <div className="rounded-xl border px-4 py-3 text-center min-w-[110px]"
                 style={{ borderColor: `${data.iod.color}40`, backgroundColor: `${data.iod.color}10` }}>
              <p className="text-[10px] text-gray-500 font-medium">DMI Index</p>
              <p className="text-2xl font-bold mt-0.5" style={{ color: data.iod.color }}>
                {data.iod.value > 0 ? '+' : ''}{data.iod.value.toFixed(2)}
              </p>
              <p className="text-[10px] capitalize mt-0.5" style={{ color: data.iod.color }}>
                {data.iod.phase}
              </p>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-800">&ldquo;ENSO of the Indian Ocean&rdquo;</p>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">{data.iod.note}. A
                strong positive IOD has historically preceded Rift Valley Fever and East-African
                arbovirus outbreaks via flood-linked vector breeding.</p>
              <p className="text-[10px] text-gray-400 mt-2 italic">{data.iod.source}</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Local climate (temp / humidity / soil) ───────────────────────── */}
      {data.climate && (data.climate.temperature !== null || data.climate.humidity !== null) && (
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Droplets className="h-4 w-4 text-sky-500" />
            <h3 className="text-sm font-semibold text-gray-800">Local Climate (last 30 days)</h3>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Temperature', value: data.climate.temperature !== null ? `${data.climate.temperature}°C` : '—', color: '#f97316' },
              { label: 'Humidity',    value: data.climate.humidity !== null ? `${data.climate.humidity}%` : '—', color: '#0ea5e9' },
              { label: 'Soil moisture', value: data.climate.soilMoisture !== null ? `${data.climate.soilMoisture} m³/m³` : '—', color: '#65a30d' },
            ].map(item => (
              <div key={item.label} className="rounded-xl border border-gray-100 bg-gray-50 px-3 py-3 text-center">
                <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">{item.label}</p>
                <p className="text-lg font-bold mt-0.5" style={{ color: item.color }}>{item.value}</p>
              </div>
            ))}
          </div>
          {data.climate.humidityNote && (
            <p className="mt-3 text-[10px] text-gray-400 italic flex items-start gap-1.5">
              <Info className="h-3 w-3 shrink-0 mt-0.5" />
              {data.climate.humidityNote} · {data.climate.source}
            </p>
          )}
        </div>
      )}

      {/* ── Forest loss ──────────────────────────────────────────────────── */}
      {data.forest && data.forest.countries.length > 0 && (
        <div className="rounded-2xl border border-green-100 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <TreePine className="h-4 w-4 text-green-600" />
            <h3 className="text-sm font-semibold text-gray-800">Forest Cover Trend</h3>
            <span className="text-[10px] text-gray-400 ml-auto">5-year change in endemic countries</span>
          </div>
          <div className="space-y-2">
            {data.forest.countries.map(c => {
              const isLoss = c.change5yr < 0;
              const col = isLoss ? '#d62728' : c.trend === 'stable' ? '#6b7280' : '#2ca02c';
              const pct = Math.abs(Math.min(100, Math.abs(c.change5yrPct)));
              return (
                <div key={c.iso} className="flex items-center gap-3">
                  <span className="text-xs font-semibold text-gray-700 w-32 shrink-0">{c.country}</span>
                  <div className="flex-1 h-5 bg-gray-100 rounded-full overflow-hidden relative">
                    <div className="h-full rounded-full transition-all duration-700"
                         style={{ width: `${pct}%`, backgroundColor: col, opacity: 0.75 }} />
                  </div>
                  <span className="text-xs font-bold shrink-0 w-20 text-right" style={{ color: col }}>
                    {c.change5yr > 0 ? '+' : ''}{c.change5yr.toLocaleString()} km²
                  </span>
                  <span className="text-[10px] text-gray-400 w-10 text-right">
                    {c.change5yrPct > 0 ? '+' : ''}{c.change5yrPct.toFixed(1)}%
                  </span>
                </div>
              );
            })}
          </div>
          <p className="mt-3 text-[10px] text-gray-400 italic flex items-start gap-1.5">
            <Info className="h-3 w-3 shrink-0 mt-0.5" />
            {data.forest.note} · {data.forest.source}
          </p>
        </div>
      )}

      {/* ── Conflict structural risk ──────────────────────────────────────── */}
      {showConflict && data.conflict && (
        <div className="rounded-2xl border border-red-100 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-800 mb-3">Structural Risk Indicators</h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {[
              { label: 'Conflict Index', value: `${data.conflict.score}/100`, color: '#d62728',
                sub: 'Armed conflict density in endemic zone' },
              { label: 'Data Sources', value: data.conflict.sources.join(' · '), color: '#6b7280',
                sub: 'ACLED + World Bank Forest API' },
              { label: 'Risk Window', value: 'Dry season', color: '#f59e0b',
                sub: 'Bat–human contact peaks Jun–Sep' },
            ].map(item => (
              <div key={item.label} className="rounded-xl border border-gray-100 bg-gray-50 px-3 py-3">
                <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">{item.label}</p>
                <p className="text-sm font-bold mt-0.5" style={{ color: item.color }}>{item.value}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">{item.sub}</p>
              </div>
            ))}
          </div>
          <p className="mt-3 text-[10px] text-gray-400 italic flex items-start gap-1.5">
            <Info className="h-3 w-3 shrink-0 mt-0.5" />
            {data.conflict.note}
          </p>
        </div>
      )}

    </div>
  );
}
