'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { VIRUSES, GROUP_COLORS, getVirusesByGroup } from '@/lib/viruses';
import type { VirusGroup } from '@/types/virus';
import { Wind, Bug, Droplets, Brain, Syringe, Biohazard, Dna, Utensils, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const GROUP_ICONS: Record<VirusGroup, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  respiratory:      Wind,
  vector_borne:     Bug,
  haemorrhagic:     Droplets,
  zoonotic:         Brain,
  childhood:        Syringe,
  other:            Biohazard,
  retroviral:       Dna,
  gastrointestinal: Utensils,
};

const GROUPS: VirusGroup[] = [
  'respiratory',
  'vector_borne',
  'haemorrhagic',
  'zoonotic',
  'childhood',
  'gastrointestinal',
  'retroviral',
  'other',
];

export function VirusGroupGrid() {
  const t = useTranslations();

  return (
    <div id="groups">
      <div className="mb-10">
        <h2 className="text-3xl font-bold tracking-tight text-gray-900">
          {t('home.groups_title')}
        </h2>
        <p className="mt-2 text-gray-500 max-w-2xl">{t('home.groups_subtitle')}</p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {GROUPS.map(group => {
          const Icon = GROUP_ICONS[group];
          const viruses = getVirusesByGroup(group);
          const color = GROUP_COLORS[group];

          return (
            <div
              key={group}
              className="group rounded-2xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow overflow-hidden"
            >
              {/* Color accent strip */}
              <div className="h-1.5 w-full" style={{ backgroundColor: color }} />

              <div className="p-5">
                {/* Group header */}
                <div className="flex items-center gap-2.5 mb-4">
                  <Icon className="h-5 w-5 shrink-0" style={{ color }} />
                  <div>
                    <p className="text-sm font-bold text-gray-900">{t(`groups.${group}`)}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{t(`groups.${group}_desc`)}</p>
                  </div>
                </div>

                {/* Virus chips (text only — clean & readable) */}
                <div className="flex flex-wrap gap-1.5 mt-4">
                  {viruses.map(v => (
                    <Link
                      key={v.id}
                      href={`/dashboard/${v.id}`}
                      className="rounded-full border border-gray-200 bg-white px-2.5 py-0.5 text-xs font-medium text-gray-700 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-colors"
                    >
                      {v.abbr}
                    </Link>
                  ))}
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <p className="text-xs text-gray-400">
                    {viruses.length} virus{viruses.length !== 1 ? 'es' : ''}
                  </p>
                  <Link
                    href="/viruses"
                    className="text-xs font-medium flex items-center gap-1 hover:gap-2 transition-all"
                    style={{ color }}
                  >
                    View all <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
