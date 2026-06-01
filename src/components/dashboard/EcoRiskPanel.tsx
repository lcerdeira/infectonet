'use client';

/**
 * EcoRiskPanel — Ecological Risk Intelligence panel.
 *
 * Shows for each pathogen:
 *   • Current ENSO/ONI status + 5-year sparkline (rodent/vector-borne viruses)
 *   • Conflict/deforestation risk index (filoviruses, haemorrhagic fevers)
 *   • Composite risk score + actionable narrative
 *
 * Powered by /api/ecorisk?virus=<id>
 */

import { useEffect, useState } from 'react';
import { AlertTriangle, TrendingUp, Zap, Shield, RefreshCw, Info } from 'lucide-react';
import { SafePlot } from './SafePlot';

interface AnnualOni {
  year:    number;
  maxOni:  number;
  phase:   string;
  color:   string;
}

interface EcoRiskData {
  virus:      string;
  riskScore:  number;
  riskLevel:  'HIGH' | 'ELEVATED' | 'MODERATE' | 'LOW';
  riskColor:  string;
  narrative:  string;
  drivers: {
    enso:     boolean;
    conflict: boolean;
  };
  enso: {
    currentOni:    number;
    currentPhase:  string;
    currentSeason: string | null;
    latestYear:    number | null;
    annualSeries:  AnnualOni[];
    recentMax:     number;
    lagNote:       string | null;
  };
  conflict: {
    score:   number;
    note:    string;
    sources: string[];
  } | null;
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

      {/* ── Conflict + deforestation context ─────────────────────────────── */}
      {showConflict && data.conflict && (
        <div className="rounded-2xl border border-red-100 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-800 mb-3">
            Structural Risk Indicators
          </h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {[
              { label: 'Conflict Index', value: `${data.conflict.score}/100`, color: '#d62728',
                sub: 'Armed conflict density in endemic zone' },
              { label: 'Data Sources', value: data.conflict.sources.join(' · '), color: '#6b7280',
                sub: 'ACLED events + GFW tree cover loss' },
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
