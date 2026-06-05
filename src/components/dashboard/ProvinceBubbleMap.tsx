'use client';

/**
 * ProvinceBubbleMap — generic sub-national sequence map for any pathogen with
 * a configured admin-1 gazetteer (Brazil, Nigeria …). Fetches the divisions
 * aggregation, matches the free-text `division` field to state centroids, and
 * plots bubbles sized by sequence count. Honestly reports the placed fraction.
 */

import { useEffect, useState, useMemo } from 'react';
import { RefreshCw, Info, Move } from 'lucide-react';
import { SafePlot } from './SafePlot';
import { matchAdmin } from '@/lib/adminCentroids';

export interface ProvinceMapCfg {
  country: string;                         // gazetteer key: 'brazil' | 'nigeria'
  countryLabel: string;
  scope: 'south america' | 'africa' | 'world';
  bounds: { lon: [number, number]; lat: [number, number] };
  center: { lon: number; lat: number };
  color: string;
}

export const PROVINCE_MAP_CFG: Record<string, ProvinceMapCfg> = {
  oropouche:   { country: 'brazil',  countryLabel: 'Brazil',  scope: 'south america', bounds: { lon: [-75, -33], lat: [-34, 6] },  center: { lon: -52, lat: -12 }, color: '#0d9488' },
  yellowfever: { country: 'brazil',  countryLabel: 'Brazil',  scope: 'south america', bounds: { lon: [-75, -33], lat: [-34, 6] },  center: { lon: -52, lat: -12 }, color: '#ca8a04' },
  zika:        { country: 'brazil',  countryLabel: 'Brazil',  scope: 'south america', bounds: { lon: [-75, -33], lat: [-34, 6] },  center: { lon: -52, lat: -12 }, color: '#0ea5e9' },
  dengue:      { country: 'brazil',  countryLabel: 'Brazil',  scope: 'south america', bounds: { lon: [-75, -33], lat: [-34, 6] },  center: { lon: -52, lat: -12 }, color: '#e11d48' },
  lassa:       { country: 'nigeria', countryLabel: 'Nigeria', scope: 'africa',        bounds: { lon: [2, 15], lat: [3, 14] },      center: { lon: 8, lat: 9 },    color: '#dc2626' },
};

interface DivData { divisions: Record<string, { count: number }>; coverage: number; withDivision: number; total: number; }

export function ProvinceBubbleMap({ virusId }: { virusId: string }) {
  const cfg = PROVINCE_MAP_CFG[virusId];
  const [data, setData] = useState<DivData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!cfg) return;
    setLoading(true);
    fetch(`/api/viruses/${virusId}/divisions`)
      .then(r => r.ok ? r.json() : null)
      .then(d => setData(d))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [virusId, cfg]);

  const { points, placed, unplaced } = useMemo(() => {
    const acc: Record<string, { lon: number; lat: number; name: string; count: number }> = {};
    let placed = 0, unplaced = 0;
    if (data?.divisions) {
      for (const [div, info] of Object.entries(data.divisions)) {
        const u = cfg ? matchAdmin(div, cfg.country) : undefined;
        if (u) {
          placed += info.count;
          if (!acc[u.name]) acc[u.name] = { lon: u.lon, lat: u.lat, name: u.name, count: 0 };
          acc[u.name].count += info.count;
        } else {
          unplaced += info.count;
        }
      }
    }
    return { points: Object.values(acc), placed, unplaced };
  }, [data, cfg]);

  if (!cfg) return null;
  if (loading) return (
    <div className="flex items-center gap-2 py-6 text-gray-400 text-sm">
      <RefreshCw className="h-4 w-4 animate-spin" /> Loading {cfg.countryLabel} province map…
    </div>
  );
  if (!points.length) return null;

  const maxCount = Math.max(...points.map(p => p.count));
  const trace = {
    type: 'scattergeo' as const,
    mode: 'text+markers' as const,
    lon: points.map(p => p.lon),
    lat: points.map(p => p.lat),
    text: points.map(p => p.count >= maxCount * 0.15 ? p.name : ''),
    textposition: 'top center' as const,
    textfont: { size: 8, color: '#374151' },
    customdata: points.map(p => `<b>${p.name}</b><br>${p.count} sequences`),
    marker: {
      size: points.map(p => Math.max(8, Math.min(46, Math.sqrt(p.count / maxCount) * 46))),
      color: cfg.color,
      opacity: 0.55,
      line: { color: 'white', width: 1 },
    },
    hovertemplate: '%{customdata}<extra></extra>',
  };

  const placedPct = placed + unplaced > 0 ? Math.round((placed / (placed + unplaced)) * 100) : 0;

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm mt-4">
      <div className="flex items-center gap-2 mb-1">
        <span className="h-3 w-3 rounded-full" style={{ backgroundColor: cfg.color }} />
        <h3 className="text-sm font-semibold text-gray-800">
          Sub-national sequences — {cfg.countryLabel}
        </h3>
        <span className="ml-auto text-[10px] text-gray-400">
          {points.length} states · {placed.toLocaleString()} sequences placed ({placedPct}%)
        </span>
      </div>

      <div className="mb-2 flex items-center gap-1.5 rounded-lg bg-blue-50 border border-blue-100 px-3 py-1.5 text-[11px] text-blue-700 w-fit">
        <Move className="h-3.5 w-3.5" />
        <span>Scroll / +− to zoom · drag to pan · bubble size ∝ √(sequences)</span>
      </div>

      <SafePlot
        data={[trace]}
        layout={{
          geo: {
            scope: cfg.scope,
            projection: { type: 'mercator' },
            center: cfg.center,
            lonaxis: { range: cfg.bounds.lon },
            lataxis: { range: cfg.bounds.lat },
            showland: true, landcolor: '#eef2e9',
            showocean: true, oceancolor: '#cfe3f7',
            showcountries: true, countrycolor: '#9ca3af', countrywidth: 1,
            subunitcolor: '#cbd5e1', showsubunits: true,
            showframe: false, resolution: 50,
          },
          margin: { l: 0, r: 0, t: 0, b: 0 },
          height: 440,
          paper_bgcolor: 'rgba(0,0,0,0)',
          dragmode: 'pan' as const,
        }}
        config={{ displayModeBar: true, displaylogo: false, scrollZoom: true, responsive: true,
                  modeBarButtonsToRemove: ['select2d', 'lasso2d', 'toImage'] }}
      />
      <p className="mt-2 flex items-start gap-1.5 text-[10px] text-gray-400">
        <Info className="h-3 w-3 shrink-0 mt-0.5" />
        <span>
          Sequences geolocated to {cfg.countryLabel} states from the Nextstrain
          <code> division </code> field ({placedPct}% of geolocated records matched a state
          centroid; city-level and unmatched entries are not shown). Bubble size ∝
          √(sequence count).
        </span>
      </p>
    </div>
  );
}
