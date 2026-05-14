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
  const { virus: virusId } = await params;
  const virus = VIRUS_MAP.get(virusId);
  if (!virus) return {};
  return {
    title: virus.label,
    description: `Genomic surveillance data for ${virus.label} — geographic distribution, variant trends, and sample timeline.`,
  };
}

export function generateStaticParams() {
  return Array.from(VIRUS_MAP.keys()).map(id => ({ virus: id }));
}

export default async function VirusDashboardPage({ params }: Props) {
  const { virus: virusId } = await params;
  const virus = VIRUS_MAP.get(virusId);
  if (!virus) notFound();

  await getTranslations('dashboard');

  return (
    <div className="flex gap-8 items-start">
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
