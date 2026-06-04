import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { VIRUS_MAP } from '@/lib/viruses';
import { VirusDashboard } from '@/components/dashboard/VirusDashboard';
import { VirusSidebar } from '@/components/dashboard/VirusSidebar';
import type { Metadata } from 'next';

interface Props {
  params: Promise<{ locale: string; virus: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { virus: virusId, locale } = await params;
  const virus = VIRUS_MAP.get(virusId);
  if (!virus) return {};

  const url = `https://infectonet.org/${locale}/dashboard/${virusId}`;
  const title = `${virus.label} — Genomic Surveillance & Outbreak Tracking`;
  const description =
    `Track ${virus.label} (${virus.family}, ${virus.genome}) genomic surveillance on InfectoNET: `
    + `geographic distribution, genotype/variant trends, sample timeline, and real-time outbreak `
    + `monitoring. Free open-access data from NCBI, GISAID and Nextstrain.`;

  return {
    title,
    description,
    keywords: [
      virus.label, virus.abbr, virus.family, 'genomic surveillance', 'outbreak',
      'epidemiology', 'variants', 'genotypes', `${virus.label} cases`,
      `${virus.label} map`, `${virus.label} tracker`,
    ],
    alternates: { canonical: url },
    openGraph: {
      type: 'article',
      title,
      description,
      url,
      siteName: 'InfectoNET',
      images: [{ url: `/organisms/${virusId}.svg`, alt: virus.label }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${virus.label} — InfectoNET`,
      description,
    },
  };
}

export function generateStaticParams() {
  return Array.from(VIRUS_MAP.keys()).map(id => ({ virus: id }));
}

export default async function VirusDashboardPage({ params }: Props) {
  const { virus: virusId, locale } = await params;
  const virus = VIRUS_MAP.get(virusId);
  if (!virus) notFound();

  await getTranslations('dashboard');

  const url = `https://infectonet.org/${locale}/dashboard/${virusId}`;
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'MedicalWebPage',
        name: `${virus.label} — Genomic Surveillance`,
        url,
        about: {
          '@type': 'MedicalCondition',
          name: virus.label,
        },
        description:
          `Genomic surveillance, geographic distribution, variant trends and outbreak `
          + `monitoring for ${virus.label} (${virus.family}).`,
        inLanguage: 'en',
        isPartOf: { '@type': 'WebSite', name: 'InfectoNET', url: 'https://infectonet.org' },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: `https://infectonet.org/${locale}` },
          { '@type': 'ListItem', position: 2, name: 'Pathogens', item: `https://infectonet.org/${locale}/viruses` },
          { '@type': 'ListItem', position: 3, name: virus.label, item: url },
        ],
      },
    ],
  };

  return (
    <div className="flex gap-8 items-start">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* Sidebar */}
      <div className="hidden lg:block sticky top-20 self-start">
        <VirusSidebar currentVirusId={virusId} />
      </div>

      {/* Main content */}
      <div className="flex-1 min-w-0">
        {/* Virus header */}
        <div className="flex items-center gap-5 mb-8 pb-6 border-b border-gray-200">
          {/* SVG in natural 4:3 ratio, fixed height */}
          <div className="shrink-0 rounded-2xl overflow-hidden shadow-sm" style={{ width: 96, height: 72 }}>
            <img
              src={`/organisms/${virusId}.svg`}
              alt={virus.label}
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span
                className="rounded-full px-2.5 py-0.5 text-xs font-semibold text-white"
                style={{ backgroundColor: virus.color }}
              >
                {virus.family}
              </span>
              <span className="text-xs text-gray-400 font-mono">{virus.genome}</span>
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">
              {virus.label}
            </h1>
          </div>
        </div>

        <VirusDashboard virusId={virusId} />
      </div>
    </div>
  );
}
