'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { Database, Globe, Dna, Clock } from 'lucide-react';

interface VirusWithCount {
  id: string;
  count: number;
}

export function StatsBar() {
  const t = useTranslations('home');
  const [stats, setStats] = useState({ sequences: 0, countries: 0, viruses: 28 });

  useEffect(() => {
    fetch('/api/viruses')
      .then(r => r.json())
      .then((data: VirusWithCount[]) => {
        if (!Array.isArray(data)) return;
        const totalSeq = data.reduce((s, v) => s + (v.count ?? 0), 0);
        setStats({ sequences: totalSeq, countries: 195, viruses: data.length });
      })
      .catch(() => {/* silently ignore if API not ready */});
  }, []);

  const items = [
    { icon: Dna,      value: stats.sequences.toLocaleString(), label: t('stats_sequences') },
    { icon: Globe,    value: stats.countries.toLocaleString(), label: t('stats_countries') },
    { icon: Database, value: stats.viruses.toLocaleString(),   label: t('stats_viruses') },
    { icon: Clock,    value: new Date().toISOString().slice(0, 10), label: t('stats_last_updated') },
  ];

  return (
    <div className="bg-white border-b border-gray-200">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-gray-100">
          {items.map(item => (
            <div key={item.label} className="flex items-center gap-3 px-6 py-5">
              <item.icon className="h-5 w-5 text-blue-500 shrink-0" />
              <div>
                <p className="text-xl font-bold text-gray-900">{item.value}</p>
                <p className="text-xs text-gray-500">{item.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
