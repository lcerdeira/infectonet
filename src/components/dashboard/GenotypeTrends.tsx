'use client';

import dynamic from 'next/dynamic';
import { useMemo } from 'react';
import type { GenotypeTrend } from '@/types/virus';

// Plotly has no SSR support — load client-side only
const Plot = dynamic(() => import('react-plotly.js'), { ssr: false });

interface Props {
  trends: GenotypeTrend[];
}

const PALETTE = [
  '#3B82F6','#10B981','#F59E0B','#EF4444','#8B5CF6',
  '#06B6D4','#F97316','#84CC16','#EC4899','#6B7280',
  '#14B8A6','#A855F7','#FB923C','#22D3EE','#4ADE80',
];

export function GenotypeTrends({ trends }: Props) {
  const genotypes = useMemo(() => {
    return [...new Set(trends.map(t => t.genotype))].sort();
  }, [trends]);

  const years = useMemo(() => {
    return [...new Set(trends.map(t => t.year))].sort((a, b) => a - b);
  }, [trends]);

  const traces = useMemo(() => {
    return genotypes.map((gt, i) => {
      const gtData = trends.filter(t => t.genotype === gt);
      const byYear = Object.fromEntries(gtData.map(t => [t.year, t.count]));
      return {
        type: 'bar' as const,
        name: gt,
        x: years,
        y: years.map(y => byYear[y] ?? 0),
        marker: { color: PALETTE[i % PALETTE.length] },
      };
    });
  }, [genotypes, years, trends]);

  const layout = {
    barmode: 'stack' as const,
    paper_bgcolor: 'rgba(0,0,0,0)',
    plot_bgcolor: 'rgba(0,0,0,0)',
    font: { family: 'var(--font-geist), sans-serif', size: 12, color: '#374151' },
    xaxis: { title: { text: '' }, gridcolor: '#f3f4f6', tickangle: -45 },
    yaxis: { title: { text: 'Sequences' }, gridcolor: '#f3f4f6' },
    legend: { orientation: 'h' as const, y: -0.3 },
    margin: { l: 50, r: 20, t: 10, b: 120 },
    height: 380,
  };

  return (
    <div className="w-full">
      <Plot
        data={traces}
        layout={layout}
        config={{ displayModeBar: false, responsive: true }}
        style={{ width: '100%' }}
      />
    </div>
  );
}
