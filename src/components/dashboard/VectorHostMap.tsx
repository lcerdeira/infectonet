'use client';

/**
 * VectorHostMap — generic reservoir/vector hotspot map.
 *
 * Config-driven (src/lib/vectorHostMaps.ts). Renders, per pathogen:
 *   - reservoir/vector hotspots drawn with an emoji glyph (🦇 🐀 🦟 🐕 …)
 *   - optional documented outbreak sites
 *   - toggleable layers + interactive zoom/pan
 */

import { useMemo, useState } from 'react';
import { Info, Move, Eye, EyeOff } from 'lucide-react';
import { SafePlot } from './SafePlot';
import { VECTOR_HOST_MAPS } from '@/lib/vectorHostMaps';

type LayerKey = 'hosts' | 'outbreaks';

export function VectorHostMap({ virusId }: { virusId: string }) {
  const cfg = VECTOR_HOST_MAPS[virusId];

  const [active, setActive] = useState<Record<LayerKey, boolean>>({
    hosts: true, outbreaks: true,
  });
  const toggle = (k: LayerKey) => setActive(a => ({ ...a, [k]: !a[k] }));

  const traces = useMemo(() => {
    if (!cfg) return [];

    // Host / vector hotspots — emoji glyph + halo
    const hostTrace = (active.hosts && cfg.hotspots.length) ? {
      type: 'scattergeo' as const,
      mode: 'text+markers' as const,
      name: cfg.layerLabel,
      lon: cfg.hotspots.map(h => h.lon),
      lat: cfg.hotspots.map(h => h.lat),
      text: cfg.hotspots.map(() => cfg.icon),
      textposition: 'middle center' as const,
      textfont: { size: 17 },
      customdata: cfg.hotspots.map(h => `<b>${cfg.icon} ${h.name}</b><br><i>${h.species}</i><br>${h.note}`),
      marker: {
        size: 24,
        color: `${cfg.color}1f`,
        line: { color: cfg.color, width: 1.2 },
        symbol: 'circle',
      },
      hovertemplate: '%{customdata}<extra></extra>',
    } : null;

    // Outbreak sites
    const outbreakTrace = (active.outbreaks && cfg.outbreaks?.length) ? {
      type: 'scattergeo' as const,
      mode: 'text+markers' as const,
      name: 'Notable outbreaks',
      lon: cfg.outbreaks.map(o => o.lon),
      lat: cfg.outbreaks.map(o => o.lat),
      text: cfg.outbreaks.map(o => `${o.place.split('(')[0].trim()} '${String(o.year).slice(2)}`),
      textposition: 'top center' as const,
      textfont: { size: 8, color: '#374151' },
      customdata: cfg.outbreaks.map(o =>
        `<b>${o.place} (${o.year})</b>`
        + (o.cases ? `<br>Cases: ${o.cases}${o.deaths ? ` · Deaths: ${o.deaths}` : ''}` : '')
        + (o.note ? `<br><i>${o.note}</i>` : '')
      ),
      marker: {
        size: cfg.outbreaks.map(o => o.cases ? Math.max(10, Math.min(34, Math.sqrt(o.cases) * 1.6)) : 12),
        color: '#111827',
        opacity: 0.55,
        symbol: 'x',
        line: { color: 'white', width: 1 },
      },
      hovertemplate: '%{customdata}<extra></extra>',
    } : null;

    return [hostTrace, outbreakTrace].filter((t): t is NonNullable<typeof t> => t != null);
  }, [cfg, active]);

  if (!cfg) return null;

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-lg">{cfg.icon}</span>
        <h3 className="text-sm font-semibold text-gray-800">
          {cfg.kind === 'vector' ? 'Vector distribution'
            : cfg.kind === 'both' ? 'Vector & host distribution'
            : 'Reservoir host distribution'}
        </h3>
        <span className="ml-auto rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white"
              style={{ backgroundColor: cfg.color }}>
          {cfg.kind === 'vector' ? 'Vector' : cfg.kind === 'both' ? 'Vector + Host' : 'Reservoir'}
        </span>
      </div>
      <p className="text-xs text-gray-500 mb-3 leading-relaxed">{cfg.blurb}</p>

      {/* Zoom hint */}
      <div className="mb-2 flex items-center gap-1.5 rounded-lg bg-blue-50 border border-blue-100 px-3 py-1.5 text-[11px] text-blue-700 w-fit">
        <Move className="h-3.5 w-3.5" />
        <span>Scroll / +− to zoom · drag to pan · hover a {cfg.icon} for the species &amp; note</span>
      </div>

      {/* Toggles */}
      <div className="mb-3 flex flex-wrap gap-1.5">
        {([
          { key: 'hosts' as const, label: cfg.layerLabel, color: cfg.color, show: true },
          { key: 'outbreaks' as const, label: 'Notable outbreaks', color: '#111827', show: !!cfg.outbreaks?.length },
        ]).filter(l => l.show).map(l => {
          const on = active[l.key];
          return (
            <button key={l.key} onClick={() => toggle(l.key)}
              className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors ${
                on ? 'border-gray-300 bg-white text-gray-700 shadow-sm' : 'border-gray-200 bg-gray-50 text-gray-400'
              }`}>
              <span className="h-2.5 w-2.5 rounded-full inline-block" style={{ backgroundColor: on ? l.color : '#d1d5db' }} />
              {l.label}
              {on ? <Eye className="h-3 w-3 opacity-50" /> : <EyeOff className="h-3 w-3 opacity-50" />}
            </button>
          );
        })}
      </div>

      <SafePlot
        data={traces}
        layout={{
          geo: {
            scope: cfg.scope,
            projection: { type: cfg.scope === 'world' ? 'natural earth' : 'mercator' },
            center: cfg.center,
            lonaxis: { range: cfg.bounds.lon },
            lataxis: { range: cfg.bounds.lat },
            showland: true,
            landcolor: '#eef2e9',
            showocean: true,
            oceancolor: '#cfe3f7',
            showcountries: true,
            countrycolor: '#9ca3af',
            countrywidth: 0.8,
            showrivers: !!cfg.showHydro,
            rivercolor: '#3b82f6',
            showlakes: !!cfg.showHydro,
            lakecolor: '#7cb8e8',
            showframe: false,
            resolution: 50,
          },
          margin: { l: 0, r: 0, t: 0, b: 0 },
          height: 500,
          legend: { orientation: 'h', y: -0.05, x: 0.5, xanchor: 'center', font: { size: 11 } },
          paper_bgcolor: 'rgba(0,0,0,0)',
          dragmode: 'pan' as const,
        }}
        config={{
          displayModeBar: true, displaylogo: false, scrollZoom: true, responsive: true,
          modeBarButtonsToRemove: ['select2d', 'lasso2d', 'toImage'],
        }}
      />
      <p className="mt-2 flex items-start gap-1.5 text-[10px] text-gray-400">
        <Info className="h-3 w-3 shrink-0 mt-0.5" />
        <span>
          {cfg.icon} markers = curated reservoir/vector hotspots (hover for species and
          epidemiological note). Hotspot locations are approximate, based on WHO/CDC/WOAH
          and peer-reviewed reservoir-ecology literature. Not a substitute for entomological
          or sero-surveillance maps.
        </span>
      </p>
    </div>
  );
}
