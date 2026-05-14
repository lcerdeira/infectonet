'use client';

/**
 * VirusInsights — auto-renders additional charts based on available data fields.
 *
 * Detects (per virus) which metadata columns are present and renders:
 *  - Antiviral susceptibility (influenza, avianflu, hiv, hantavirus, mpox, crimean, lassa, covid19)
 *  - Serotype / species breakdown (dengue, hantavirus, hpv, norovirus)
 *  - Host distribution (norovirus, rabies)
 *  - WHO Region distribution (all with `region` field)
 *  - Outbreak breakdown (ebola, mpox)
 *  - Clinical syndrome (hantavirus)
 *  - Oncogenic risk (hpv)
 */

import dynamic from 'next/dynamic';
import { useMemo } from 'react';

const Plot = dynamic(() => import('react-plotly.js'), { ssr: false });

const PALETTE = [
  '#3B82F6','#10B981','#F59E0B','#EF4444','#8B5CF6',
  '#06B6D4','#F97316','#84CC16','#EC4899','#6B7280',
  '#14B8A6','#A855F7','#FB923C','#22D3EE','#4ADE80',
];

type Rec = Record<string, unknown>;

/* ─── helpers ─────────────────────────────────────────────────────────────── */
function countBy(records: Rec[], field: string) {
  const counts: Record<string, number> = {};
  for (const r of records) {
    const val = String(r[field] ?? '').trim();
    if (!val || val === 'Unknown' || val === '-' || val === 'n/a' || val === 'none') continue;
    counts[val] = (counts[val] ?? 0) + 1;
  }
  return Object.entries(counts).sort((a, b) => b[1] - a[1]);
}

function hasField(records: Rec[], field: string, minPct = 5) {
  if (!records.length) return false;
  const nonEmpty = records.filter(r => {
    const v = String(r[field] ?? '').trim();
    return v && v !== '-' && v !== 'Unknown' && v !== 'none' && v !== 'n/a';
  }).length;
  return (nonEmpty / records.length) * 100 >= minPct;
}

function horizontalBar(
  entries: [string, number][],
  title: string,
  color: string
) {
  const top = entries.slice(0, 15);
  return (
    <Plot
      data={[{
        type: 'bar',
        orientation: 'h',
        x: top.map(e => e[1]),
        y: top.map(e => e[0]),
        marker: { color },
        text: top.map(e => String(e[1])),
        textposition: 'outside',
      }]}
      layout={{
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)',
        font: { family: 'var(--font-geist), sans-serif', size: 11, color: '#374151' },
        xaxis: { title: { text: 'Sequences' }, gridcolor: '#f3f4f6' },
        yaxis: { automargin: true, tickfont: { size: 10 } },
        margin: { l: 10, r: 60, t: 10, b: 40 },
        height: Math.max(200, top.length * 22 + 60),
      }}
      config={{ displayModeBar: false, responsive: true }}
      style={{ width: '100%' }}
    />
  );
}

function donut(entries: [string, number][], title: string) {
  return (
    <Plot
      data={[{
        type: 'pie',
        hole: 0.45,
        labels: entries.map(e => e[0]),
        values: entries.map(e => e[1]),
        marker: { colors: PALETTE },
        textinfo: 'label+percent',
        textposition: 'outside',
        automargin: true,
      }]}
      layout={{
        paper_bgcolor: 'rgba(0,0,0,0)',
        showlegend: false,
        margin: { l: 20, r: 20, t: 10, b: 10 },
        height: 260,
      }}
      config={{ displayModeBar: false, responsive: true }}
      style={{ width: '100%' }}
    />
  );
}

/* ─── susceptibility chart ─────────────────────────────────────────────────── */
const SUSCEPT_FIELDS: Record<string, string> = {
  oseltamivir_susceptibility: 'Oseltamivir',
  baloxavir_susceptibility:   'Baloxavir',
  adamantane_susceptibility:  'Adamantane',
  ribavirin_susceptibility:   'Ribavirin',
  tecovirimat_susceptibility: 'Tecovirimat',
  cidofovir_susceptibility:   'Cidofovir',
  molnupiravir_susceptibility:'Molnupiravir',
  pi_susceptibility:          'PI (HIV)',
  nrti_susceptibility:        'NRTI (HIV)',
  nnrti_susceptibility:       'NNRTI (HIV)',
  insti_susceptibility:       'INSTI (HIV)',
};

function AntiviralChart({ records }: { records: Rec[] }) {
  const data = useMemo(() => {
    const active = Object.entries(SUSCEPT_FIELDS).filter(([field]) => hasField(records, field, 50));
    return active.map(([field, label]) => {
      const counts = countBy(records, field);
      return { label, counts };
    });
  }, [records]);

  if (!data.length) return null;

  // Stacked bar: drug × susceptibility category
  const categories = [...new Set(data.flatMap(d => d.counts.map(c => c[0])))];
  const catColors: Record<string, string> = {
    susceptible:  '#10B981',
    resistant:    '#EF4444',
    intermediate: '#F59E0B',
    reduced:      '#F97316',
    unknown:      '#6B7280',
  };

  const traces = categories.map(cat => ({
    type: 'bar' as const,
    name: cat,
    x: data.map(d => d.label),
    y: data.map(d => d.counts.find(c => c[0] === cat)?.[1] ?? 0),
    marker: { color: catColors[cat] ?? '#6B7280' },
  }));

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Antiviral Susceptibility</h2>
      <Plot
        data={traces}
        layout={{
          barmode: 'stack',
          paper_bgcolor: 'rgba(0,0,0,0)',
          plot_bgcolor: 'rgba(0,0,0,0)',
          font: { family: 'var(--font-geist), sans-serif', size: 11, color: '#374151' },
          xaxis: { title: { text: '' }, gridcolor: '#f3f4f6' },
          yaxis: { title: { text: 'Sequences' }, gridcolor: '#f3f4f6' },
          legend: { orientation: 'h', y: -0.25 },
          margin: { l: 50, r: 20, t: 10, b: 80 },
          height: 280,
        }}
        config={{ displayModeBar: false, responsive: true }}
        style={{ width: '100%' }}
      />
    </div>
  );
}

/* ─── main component ────────────────────────────────────────────────────────── */
interface Props {
  records: Rec[];
}

export function VirusInsights({ records }: Props) {
  if (!records.length) return null;

  const charts: React.ReactNode[] = [];

  // 1. Antiviral susceptibility
  charts.push(<AntiviralChart key="antiviral" records={records} />);

  // 2. WHO region distribution
  if (hasField(records, 'region', 10)) {
    const entries = countBy(records, 'region');
    charts.push(
      <div key="region" className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">WHO Region Distribution</h2>
        {horizontalBar(entries, 'WHO Region', '#3B82F6')}
      </div>
    );
  }

  // 3. Outbreak breakdown (ebola, mpox) — bar chart is more readable than donut
  if (hasField(records, 'outbreak', 10)) {
    const entries = countBy(records, 'outbreak');
    charts.push(
      <div key="outbreak" className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Outbreak Breakdown</h2>
        {horizontalBar(entries, 'Outbreak', '#EF4444')}
      </div>
    );
  }

  // 4. Serotype (dengue DENV1-4, polio, etc.) — horizontal bar is more readable
  if (hasField(records, 'serotype', 10)) {
    const entries = countBy(records, 'serotype');
    charts.push(
      <div key="serotype" className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Serotype Distribution</h2>
        {horizontalBar(entries, 'Serotype', '#10B981')}
      </div>
    );
  }

  // 5. Hantavirus species / clade
  if (hasField(records, 'hanta_species', 10)) {
    const entries = countBy(records, 'hanta_species');
    charts.push(
      <div key="hanta_species" className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Hantavirus Species</h2>
        {horizontalBar(entries, 'Species', '#F59E0B')}
      </div>
    );
  }

  // 6. Clinical syndrome (hantavirus)
  if (hasField(records, 'clinical_syndrome', 10)) {
    const entries = countBy(records, 'clinical_syndrome');
    charts.push(
      <div key="syndrome" className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Clinical Syndrome</h2>
        {donut(entries, 'Syndrome')}
      </div>
    );
  }

  // 7. Oncogenic risk (HPV)
  if (hasField(records, 'oncogenic_risk', 10)) {
    const entries = countBy(records, 'oncogenic_risk');
    charts.push(
      <div key="oncogenic" className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Oncogenic Risk Classification</h2>
        {donut(entries, 'Oncogenic Risk')}
      </div>
    );
  }

  // 8. HPV type breakdown
  if (hasField(records, 'hpv_type', 10)) {
    const entries = countBy(records, 'hpv_type');
    charts.push(
      <div key="hpv_type" className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">HPV Type Distribution</h2>
        {horizontalBar(entries.slice(0, 15), 'HPV Type', '#8B5CF6')}
      </div>
    );
  }

  // 9. Host distribution — horizontal bar is better than donut for many host labels
  const hostField = hasField(records, 'host_type', 10) ? 'host_type'
    : hasField(records, 'host', 10) ? 'host'
    : null;
  if (hostField) {
    const entries = countBy(records, hostField);
    charts.push(
      <div key="host" className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Host Distribution</h2>
        {horizontalBar(entries, 'Host', '#F59E0B')}
      </div>
    );
  }

  // 10. Norovirus genogroup
  if (hasField(records, 'genogroup', 10)) {
    const entries = countBy(records, 'genogroup');
    charts.push(
      <div key="genogroup" className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Genogroup Distribution</h2>
        {donut(entries, 'Genogroup')}
      </div>
    );
  }

  // 11. Avian influenza subtype / genoflu
  if (hasField(records, 'subtype', 10)) {
    const entries = countBy(records, 'subtype');
    charts.push(
      <div key="subtype" className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Influenza Subtype</h2>
        {horizontalBar(entries, 'Subtype', '#06B6D4')}
      </div>
    );
  }

  // Filter out nulls
  const rendered = charts.filter(Boolean);
  if (!rendered.length) return null;

  return <>{rendered}</>;
}
