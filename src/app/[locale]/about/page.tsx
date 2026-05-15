import { getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';
import { CheckCircle } from 'lucide-react';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('about');
  return { title: t('title') };
}

export default async function AboutPage() {
  const t = await getTranslations('about');

  const fairItems = [
    { key: 'fair_findable',       label: t('fair_findable') },
    { key: 'fair_accessible',     label: t('fair_accessible') },
    { key: 'fair_interoperable',  label: t('fair_interoperable') },
    { key: 'fair_reusable',       label: t('fair_reusable') },
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-16 space-y-16">
      {/* Mission */}
      <section>
        <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 mb-6">{t('title')}</h1>
        <div className="rounded-2xl border border-blue-100 bg-blue-50 p-8">
          <h2 className="text-xl font-bold text-blue-900 mb-3">{t('mission_title')}</h2>
          <p className="text-gray-700 leading-relaxed">{t('mission_text')}</p>
        </div>
      </section>

      {/* FAIR */}
      <section>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">{t('fair_title')}</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {fairItems.map(item => (
            <div
              key={item.key}
              className="flex items-start gap-3 rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
            >
              <CheckCircle className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
              <p className="text-sm text-gray-700">{item.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Data sources */}
      <section>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('data_title')}</h2>
        <p className="text-gray-700 leading-relaxed">{t('data_text')}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          {['NCBI GenBank', 'GISAID', 'Nextstrain', 'WHO GLASS'].map(src => (
            <span
              key={src}
              className="rounded-full border border-gray-200 bg-white px-4 py-1.5 text-sm font-medium text-gray-700 shadow-sm"
            >
              {src}
            </span>
          ))}
        </div>
      </section>

      {/* Team */}
      <section>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('team_title')}</h2>
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-gray-700">
            InfectoNET builds on the{' '}
            <a href="https://www.amrnet.org" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">
              AMRnet
            </a>{' '}
            platform from the{' '}
            <a href="https://www.lshtm.ac.uk" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">
              London School of Hygiene &amp; Tropical Medicine (LSHTM)
            </a>.
          </p>
          <p className="mt-3 text-gray-700">
            Source code is available on{' '}
            <a href="https://github.com/lcerdeira/infectonet" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">
              GitHub (lcerdeira/infectonet)
            </a>.
          </p>
        </div>
      </section>

      {/* Contact */}
      <section>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('contact_title')}</h2>
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-gray-700">
            For questions, data requests, or collaboration enquiries, please contact us at{' '}
            <a href="mailto:infectonet@gmail.com" className="text-blue-600 hover:underline">
              infectonet@gmail.com
            </a>
          </p>
        </div>
      </section>
    </div>
  );
}
