'use client';

import { useMemo, useState } from 'react';
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup,
} from 'react-simple-maps';
import { Tooltip } from './Tooltip';

const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';

interface CountryStat {
  count: number;
  genotypeCounts: Record<string, number>;
}

interface Props {
  countryStat: Record<string, CountryStat>;
}

function countToColor(count: number, max: number): string {
  if (count === 0 || max === 0) return '#e5e7eb';
  const ratio = Math.log1p(count) / Math.log1p(max);
  const r = Math.round(219 - ratio * (219 - 29));
  const g = Math.round(234 - ratio * (234 - 78));
  const b = Math.round(254 - ratio * (254 - 216));
  return `rgb(${r},${g},${b})`;
}

/** Top N genotypes sorted by count, collapsing the rest into "Other" */
function topGenotypes(counts: Record<string, number>, n = 5) {
  const entries = Object.entries(counts)
    .filter(([k]) => k !== 'Unknown')
    .sort((a, b) => b[1] - a[1]);
  const top = entries.slice(0, n);
  const otherCount = entries.slice(n).reduce((s, [, v]) => s + v, 0);
  if (otherCount > 0) top.push(['Other', otherCount]);
  const unknownCount = counts['Unknown'] ?? 0;
  if (unknownCount > 0 && top.length < n + 1) top.push(['Unknown', unknownCount]);
  return top;
}

const BAR_COLORS = ['#3B82F6','#10B981','#F59E0B','#EF4444','#8B5CF6','#6B7280'];

export function WorldMap({ countryStat }: Props) {
  const [tooltip, setTooltip] = useState<{
    name: string;
    count: number;
    genotypeCounts: Record<string, number>;
    x: number;
    y: number;
  } | null>(null);

  const maxCount = useMemo(
    () => Math.max(0, ...Object.values(countryStat).map(v => v.count)),
    [countryStat]
  );

  return (
    <div className="relative w-full rounded-lg overflow-hidden bg-blue-50" style={{ aspectRatio: '2/1' }}>
      <ComposableMap
        projectionConfig={{ scale: 145 }}
        style={{ width: '100%', height: '100%' }}
      >
        <ZoomableGroup>
          <Geographies geography={GEO_URL}>
            {({ geographies }) =>
              geographies.map(geo => {
                const name: string = (geo.properties.name as string) || '';
                const stat = countryStat[name];
                const count = stat?.count ?? 0;
                const fill = countToColor(count, maxCount);

                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill={fill}
                    stroke="#fff"
                    strokeWidth={0.4}
                    onMouseEnter={e => {
                      setTooltip({ name, count, genotypeCounts: stat?.genotypeCounts ?? {}, x: e.clientX, y: e.clientY });
                    }}
                    onMouseMove={e => {
                      setTooltip({ name, count, genotypeCounts: stat?.genotypeCounts ?? {}, x: e.clientX, y: e.clientY });
                    }}
                    onMouseLeave={() => setTooltip(null)}
                    style={{
                      default: { outline: 'none' },
                      hover:   { fill: '#2563EB', outline: 'none' },
                      pressed: { outline: 'none' },
                    }}
                  />
                );
              })
            }
          </Geographies>
        </ZoomableGroup>
      </ComposableMap>

      {tooltip && (
        <Tooltip x={tooltip.x} y={tooltip.y}>
          <p className="font-semibold text-sm">{tooltip.name}</p>
          <p className="text-xs text-gray-300 mb-1">{tooltip.count.toLocaleString()} sequences</p>
          {tooltip.count > 0 && Object.keys(tooltip.genotypeCounts).filter(k => k !== 'Unknown').length > 0 && (() => {
            const top = topGenotypes(tooltip.genotypeCounts);
            const total = top.reduce((s, [, v]) => s + v, 0);
            return (
              <div className="mt-1 space-y-0.5 min-w-[140px]">
                {top.map(([gt, cnt], i) => (
                  <div key={gt} className="flex items-center gap-1.5">
                    <div className="h-2 rounded-sm flex-1 bg-white/10 overflow-hidden">
                      <div
                        className="h-full rounded-sm"
                        style={{
                          width: `${Math.round((cnt / total) * 100)}%`,
                          backgroundColor: BAR_COLORS[i % BAR_COLORS.length],
                        }}
                      />
                    </div>
                    <span className="text-[10px] text-gray-300 truncate max-w-[80px]">{gt}</span>
                    <span className="text-[10px] text-gray-400 shrink-0">{cnt.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            );
          })()}
        </Tooltip>
      )}

      {/* Legend */}
      <div className="absolute bottom-3 left-3 flex items-center gap-2 rounded-lg bg-white/90 px-3 py-2 shadow text-xs text-gray-600 backdrop-blur-sm">
        <span>0</span>
        <div
          className="h-2 w-24 rounded"
          style={{ background: 'linear-gradient(to right, #DBEAFE, #1D4ED8)' }}
        />
        <span>{maxCount.toLocaleString()}</span>
        <span className="ml-1 text-gray-400">sequences</span>
      </div>
    </div>
  );
}
