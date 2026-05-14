import { getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  return { title: 'Documentation' };
}

export default async function DocumentationPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-16">
      <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 mb-4">Documentation</h1>
      <p className="text-gray-600 mb-10">API reference, data formats, and usage guides.</p>

      {/* Public API */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Public API</h2>
        <div className="space-y-4">
          {[
            {
              method: 'GET',
              endpoint: '/api/viruses',
              desc: 'Returns the catalogue of all 28 viruses with sequence counts.',
            },
            {
              method: 'GET',
              endpoint: '/api/viruses/:id',
              desc: 'Returns sequence records for a specific virus. Supports ?page and ?limit.',
            },
          ].map(route => (
            <div
              key={route.endpoint}
              className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm flex flex-col sm:flex-row sm:items-center gap-3"
            >
              <span className="inline-block rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-bold text-green-700 shrink-0">
                {route.method}
              </span>
              <code className="font-mono text-sm text-blue-700 shrink-0">{route.endpoint}</code>
              <span className="text-sm text-gray-600">{route.desc}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Data format */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Data Format</h2>
        <p className="text-gray-700 mb-4">
          Each sequence record contains the following fields where available:
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="py-2 pr-6 font-semibold text-gray-900">Field</th>
                <th className="py-2 font-semibold text-gray-900">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {[
                ['ACCESSION',       'GenBank / GISAID accession number'],
                ['COUNTRY',         'Country of sample collection'],
                ['COLLECTION_DATE', 'ISO 8601 collection date'],
                ['YEAR',            'Collection year (integer)'],
                ['GENOTYPE',        'Resolved genotype / clade / lineage'],
                ['LINEAGE',         'Lineage assignment (e.g. Pango for SARS-CoV-2)'],
                ['clade',           'Nextstrain clade assignment'],
                ['serotype',        'Serotype (e.g. DENV-1 to DENV-4 for Dengue)'],
                ['LATITUDE',        'Approximate latitude of collection location'],
                ['LONGITUDE',       'Approximate longitude of collection location'],
              ].map(([field, desc]) => (
                <tr key={field}>
                  <td className="py-2 pr-6 font-mono text-blue-700">{field}</td>
                  <td className="py-2 text-gray-600">{desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Data sources */}
      <section>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Data Sources &amp; Citation</h2>
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm space-y-3 text-sm text-gray-700">
          <p><strong>NCBI GenBank</strong> — Benson DA et al. (2018). Nucleic Acids Research.</p>
          <p><strong>GISAID</strong> — Khare S et al. (2021). Lancet Infectious Diseases.</p>
          <p><strong>Nextstrain</strong> — Hadfield J et al. (2018). Bioinformatics.</p>
          <p className="pt-2 text-xs text-gray-400">
            When using InfectoNET data, please cite the original data sources above as well as InfectoNET (preprint forthcoming).
          </p>
        </div>
      </section>
    </div>
  );
}
