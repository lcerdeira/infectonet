'use client';

import dynamic from 'next/dynamic';
import { useMemo } from 'react';

const Plot = dynamic(() => import('react-plotly.js'), { ssr: false });

interface Props {
  records: Record<string, unknown>[];
}

export function SampleTimeline({ records }: Props) {
  const trace = useMemo(() => {
    const yearCounts: Record<number, number> = {};

    for (const r of records) {
      const year = r.YEAR as number | undefined;
      if (!year || year < 1950 || year > 2100) continue;
      yearCounts[year] = (yearCounts[year] ?? 0) + 1;
    }

    const years = Object.keys(yearCounts).map(Number).sort((a, b) => a - b);

    return {
      type: 'scatter' as const,
      mode: 'lines+markers' as const,
      x: years,
      y: years.map(y => yearCounts[y]),
      fill: 'tozeroy' as const,
      line: { color: '#3B82F6', width: 2 },
      fillcolor: 'rgba(59,130,246,0.1)',
      marker: { color: '#3B82F6', size: 5 },
    };
  }, [records]);

  const layout = {
    paper_bgcolor: 'rgba(0,0,0,0)',
    plot_bgcolor: 'rgba(0,0,0,0)',
    font: { family: 'var(--font-geist), sans-serif', size: 12, color: '#374151' },
    xaxis: { title: { text: 'Year' }, gridcolor: '#f3f4f6' },
    yaxis: { title: { text: 'Sequences' }, gridcolor: '#f3f4f6' },
    margin: { l: 50, r: 20, t: 10, b: 50 },
    height: 260,
  };

  // Stable key based on the year range — forces Plotly to remount rather than
  // patch when the timeline data changes completely (e.g. switching viruses).
  const plotKey = `${trace.x[0] ?? 'empty'}-${trace.x[trace.x.length - 1] ?? 'empty'}`;

  return (
    <div className="w-full">
      <Plot
        key={plotKey}
        data={[trace]}
        layout={layout}
        config={{ displayModeBar: false, responsive: true }}
        style={{ width: '100%' }}
      />
    </div>
  );
}
