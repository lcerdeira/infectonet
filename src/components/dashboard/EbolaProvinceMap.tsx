'use client';

/**
 * EbolaProvinceMap — DRC-focused sub-national Ebola map.
 *
 * Combines:
 *   1. Genomic sequence counts per province (from /api/viruses/ebola/divisions)
 *   2. Documented historical outbreak sites (from drcOutbreaks.ts)
 * Rendered as a scattergeo map zoomed to the DRC + Albertine Rift.
 */

import { useEffect, useState, useMemo } from 'react';
import { RefreshCw, MapPin, Info, Move } from 'lucide-react';
import { SafePlot } from './SafePlot';
import {
  DRC_PROVINCES, DRC_OUTBREAKS, SPECIES_COLOR, matchProvince,
  REGION_COUNTRIES, type EbolaSpecies,
} from '@/lib/drcOutbreaks';

interface DivisionsData {
  id: string;
  country: string | null;
  total: number;
  withDivision: number;
  coverage: number;
  divisions: Record<string, { count: number; genotypes: string[] }>;
}

export function EbolaProvinceMap() {
  const [data, setData] = useState<DivisionsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = () => {
    setLoading(true);
    setError(false);
    fetch('/api/viruses/ebola/divisions?country=congo')
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(d => setData(d))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  // Aggregate genomic counts onto province centroids
  const provinceSeqCounts = useMemo(() => {
    const out: Record<string, number> = {};
    if (!data) return out;
    for (const [div, info] of Object.entries(data.divisions)) {
      const prov = matchProvince(div);
      if (prov) out[prov.name] = (out[prov.name] ?? 0) + info.count;
    }
    return out;
  }, [data]);

  const traces = useMemo(() => {
    // Trace 1: province sequence bubbles (blue)
    const provWithSeq = DRC_PROVINCES.filter(p => provinceSeqCounts[p.name] > 0);
    const seqTrace = {
      type: 'scattergeo' as const,
      mode: 'markers' as const,
      name: 'Genomic sequences',
      lon: provWithSeq.map(p => p.lon),
      lat: provWithSeq.map(p => p.lat),
      text: provWithSeq.map(p => `${p.name}: ${provinceSeqCounts[p.name]} sequences`),
      marker: {
        size: provWithSeq.map(p => Math.max(10, Math.min(45, Math.sqrt(provinceSeqCounts[p.name]) * 6))),
        color: '#3B82F6',
        opacity: 0.35,
        line: { color: '#1d4ed8', width: 1 },
      },
      hovertemplate: '%{text}<extra></extra>',
    };

    // Trace 0: country context labels (grey, behind everything)
    const countryTrace = {
      type: 'scattergeo' as const,
      mode: 'text' as const,
      name: 'Countries',
      lon: REGION_COUNTRIES.map(c => c.lon),
      lat: REGION_COUNTRIES.map(c => c.lat),
      text: REGION_COUNTRIES.map(c => c.name),
      textfont: { size: 9, color: '#94a3b8', family: 'sans-serif' },
      textposition: 'middle center' as const,
      hoverinfo: 'skip' as const,
      showlegend: false,
    };

    // Trace 2+: outbreak sites by species — now with place-name labels
    const bySpecies: Record<EbolaSpecies, typeof DRC_OUTBREAKS> = { EBOV: [], SUDV: [], BDBV: [] };
    for (const o of DRC_OUTBREAKS) bySpecies[o.species].push(o);

    const outbreakTraces = (Object.keys(bySpecies) as EbolaSpecies[])
      .filter(sp => bySpecies[sp].length > 0)
      .map(sp => {
        const list = bySpecies[sp];
        return {
          type: 'scattergeo' as const,
          mode: 'text+markers' as const,
          name: `${sp} outbreak`,
          lon: list.map(o => o.lon),
          lat: list.map(o => o.lat),
          // Short label on the map: place + year
          text: list.map(o => `${o.place.split('/')[0].split('(')[0].trim()} '${String(o.year).slice(2)}`),
          textposition: 'top center' as const,
          textfont: { size: 8, color: SPECIES_COLOR[sp] },
          customdata: list.map(o =>
            `<b>${o.place} (${o.year})</b><br>${sp} · ${o.province}<br>` +
            (o.cases > 0 ? `Cases: ${o.cases} · Deaths: ${o.deaths}` : 'Active — counts pending') +
            (o.note ? `<br><i>${o.note}</i>` : '')
          ),
          marker: {
            size: list.map(o => o.cases > 0 ? Math.max(9, Math.min(38, Math.sqrt(o.cases) * 2.2)) : 16),
            color: SPECIES_COLOR[sp],
            symbol: 'circle',
            opacity: 0.85,
            line: { color: 'white', width: 1.2 },
          },
          hovertemplate: '%{customdata}<extra></extra>',
        };
      });

    return [countryTrace, seqTrace, ...outbreakTraces];
  }, [provinceSeqCounts]);

  if (loading) return (
    <div className="flex items-center gap-2 py-10 text-gray-400 text-sm">
      <RefreshCw className="h-4 w-4 animate-spin" /> Loading DRC province map…
    </div>
  );

  if (error || !data) return (
    <div className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-700">
      Could not load province-level data.
    </div>
  );

  const totalOutbreaks = DRC_OUTBREAKS.length;
  const totalCases = DRC_OUTBREAKS.reduce((s, o) => s + o.cases, 0);

  return (
    <div className="space-y-4">
      {/* Summary chips */}
      <div className="flex flex-wrap gap-3">
        {[
          { value: totalOutbreaks.toString(), label: 'Documented outbreaks' },
          { value: totalCases.toLocaleString(), label: 'Total historical cases' },
          { value: data.withDivision.toLocaleString(), label: 'Geolocated sequences' },
          { value: `${data.coverage}%`, label: 'Province coverage' },
        ].map(c => (
          <div key={c.label} className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-center shadow-sm">
            <p className="text-xl font-bold text-gray-900">{c.value}</p>
            <p className="text-[10px] text-gray-500 mt-0.5">{c.label}</p>
          </div>
        ))}
      </div>

      {/* Map */}
      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        {/* Zoom hint banner */}
        <div className="mb-2 flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 rounded-lg bg-blue-50 border border-blue-100 px-3 py-1.5 text-[11px] text-blue-700">
            <Move className="h-3.5 w-3.5" />
            <span>
              <strong>Interactive map:</strong> scroll or use the +/− buttons to zoom · drag to pan ·
              hover any point for details · double-click to reset
            </span>
          </div>
        </div>
        <SafePlot
          data={traces}
          layout={{
            geo: {
              scope: 'africa',
              projection: { type: 'mercator' },
              center: { lon: 24, lat: -2 },
              lonaxis: { range: [12, 33] },
              lataxis: { range: [-13, 6] },
              showland: true,
              landcolor: '#f3f4f6',
              showocean: true,
              oceancolor: '#dbeafe',
              showcountries: true,
              countrycolor: '#6b7280',
              countrywidth: 1.2,
              subunitcolor: '#d1d5db',
              showframe: false,
              resolution: 50,
            },
            margin: { l: 0, r: 0, t: 0, b: 0 },
            height: 540,
            legend: {
              orientation: 'h', y: -0.05, x: 0.5, xanchor: 'center',
              font: { size: 11 },
              bgcolor: 'rgba(255,255,255,0.7)',
            },
            paper_bgcolor: 'rgba(0,0,0,0)',
            dragmode: 'pan' as const,
          }}
          config={{
            displayModeBar: true,
            displaylogo: false,
            scrollZoom: true,
            responsive: true,
            modeBarButtonsToRemove: ['select2d', 'lasso2d', 'toImage'],
          }}
        />
        <div className="mt-2 flex items-start gap-1.5 text-[10px] text-gray-400">
          <Info className="h-3 w-3 shrink-0 mt-0.5" />
          <span>
            Blue bubbles = genomic sequences per province (size ∝ √count, {data.coverage}% of DRC
            sequences carry province metadata). Coloured dots = documented outbreak sites by species,
            labelled with place &amp; year (size ∝ √cases). Grey labels = countries. Map covers the
            DRC and the Albertine Rift border with Uganda.
          </span>
        </div>
      </div>

      {/* Outbreak history table */}
      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm overflow-x-auto">
        <div className="flex items-center gap-2 mb-3">
          <MapPin className="h-4 w-4 text-red-500" />
          <h3 className="text-sm font-semibold text-gray-800">DRC Ebola outbreaks by province</h3>
        </div>
        <table className="min-w-full text-xs">
          <thead className="text-gray-500 uppercase text-[10px] tracking-wide border-b border-gray-100">
            <tr>
              {['Year', 'Location', 'Province', 'Species', 'Cases', 'Deaths', 'CFR'].map(h => (
                <th key={h} className="px-3 py-2 text-left font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {[...DRC_OUTBREAKS].sort((a, b) => b.year - a.year).map((o, i) => (
              <tr key={i} className="hover:bg-gray-50">
                <td className="px-3 py-1.5 font-medium text-gray-800">{o.year}</td>
                <td className="px-3 py-1.5 text-gray-700">{o.place}</td>
                <td className="px-3 py-1.5 text-gray-600">{o.province}</td>
                <td className="px-3 py-1.5">
                  <span className="rounded-full px-2 py-0.5 text-[10px] font-bold text-white"
                    style={{ backgroundColor: SPECIES_COLOR[o.species] }}>
                    {o.species}
                  </span>
                </td>
                <td className="px-3 py-1.5 font-semibold text-gray-900">{o.cases > 0 ? o.cases.toLocaleString() : '—'}</td>
                <td className="px-3 py-1.5 text-gray-700">{o.deaths > 0 ? o.deaths.toLocaleString() : '—'}</td>
                <td className="px-3 py-1.5 text-gray-600">
                  {o.cases > 0 ? `${Math.round((o.deaths / o.cases) * 100)}%` : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
