import type { Metadata } from 'next';
import { FileText, Download, Siren } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Reports — InfectoNET',
  description:
    'Downloadable InfectoNET reports and policy briefs: outbreak risk horizon scans, '
    + 'SENTINEL-Φ early-warning assessments, and methodology notes.',
  alternates: { canonical: 'https://infectonet.org/en/reports' },
};

const REPORTS = [
  {
    title: 'Outbreak Risk Horizon Scan — 2026',
    desc: 'A SENTINEL-Φ early-warning assessment of global viral spillover & amplification risk. '
        + 'Priority pathogens, driving mechanisms (ENSO, NDVI, conflict), and risk-reduction actions.',
    href: '/reports/InfectoNET_policy_brief_scenarios.pdf',
    size: '535 KB · PDF · 2 pages',
    date: 'June 2026',
    tag: 'Policy brief',
  },
];

export default function ReportsPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-16 space-y-10">
      <section>
        <div className="flex items-center gap-3 mb-3">
          <FileText className="h-8 w-8 text-blue-600" />
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900">Reports</h1>
        </div>
        <p className="text-gray-600 max-w-2xl">
          Downloadable policy briefs and early-warning assessments produced from the InfectoNET
          platform and its SENTINEL-Φ pilot engine.
        </p>
      </section>

      <section className="space-y-4">
        {REPORTS.map(r => (
          <a
            key={r.href}
            href={r.href}
            target="_blank"
            rel="noopener noreferrer"
            className="block rounded-2xl border border-gray-200 bg-white p-6 shadow-sm hover:border-blue-300 hover:shadow-md transition-all"
          >
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50">
                <Siren className="h-6 w-6 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-blue-700">
                    {r.tag}
                  </span>
                  <span className="text-[11px] text-gray-400">{r.date}</span>
                </div>
                <h2 className="text-lg font-semibold text-gray-900">{r.title}</h2>
                <p className="mt-1 text-sm text-gray-600 leading-relaxed">{r.desc}</p>
                <div className="mt-3 flex items-center gap-2 text-sm font-medium text-blue-600">
                  <Download className="h-4 w-4" />
                  Download <span className="text-xs font-normal text-gray-400">({r.size})</span>
                </div>
              </div>
            </div>
          </a>
        ))}
      </section>

      <section className="rounded-xl border border-gray-200 bg-gray-50 p-5">
        <h2 className="text-sm font-semibold text-gray-800 mb-1">About SENTINEL-Φ</h2>
        <p className="text-sm text-gray-600 leading-relaxed">
          SENTINEL-Φ fuses ecological forcing, genomic amplification, and event-based news into a
          single Spillover/Amplification Index with tiered alerts. It is a research pilot — not a
          substitute for official public-health alerts. See the{' '}
          <a href="https://infectonet.readthedocs.io/en/latest/early_warning.html"
             target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
            methodology documentation
          </a>{' '}or query the API at{' '}
          <code className="text-xs">/api/earlywarning?virus=&lt;id&gt;</code>.
        </p>
      </section>
    </div>
  );
}
