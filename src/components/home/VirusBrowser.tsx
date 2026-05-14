'use client';

import { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { VIRUSES, GROUP_COLORS } from '@/lib/viruses';
import type { VirusGroup } from '@/types/virus';
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const ALL_GROUPS: Array<{ key: VirusGroup | 'all'; label: string }> = [
  { key: 'all',              label: 'All' },
  { key: 'respiratory',      label: 'Respiratory' },
  { key: 'vector_borne',     label: 'Vector-borne' },
  { key: 'haemorrhagic',     label: 'Haemorrhagic Fever' },
  { key: 'zoonotic',         label: 'Zoonotic & Neurological' },
  { key: 'childhood',        label: 'Childhood / Vaccine-preventable' },
  { key: 'gastrointestinal', label: 'Gastrointestinal' },
  { key: 'retroviral',       label: 'Retroviruses' },
  { key: 'other',            label: 'Other & Emerging' },
];

export function VirusBrowser() {
  const [query, setQuery]   = useState('');
  const [group, setGroup]   = useState<VirusGroup | 'all'>('all');

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return VIRUSES.filter(v => {
      if (group !== 'all' && v.group !== group) return false;
      if (!q) return true;
      return (
        v.label.toLowerCase().includes(q) ||
        v.abbr.toLowerCase().includes(q) ||
        v.family.toLowerCase().includes(q)
      );
    });
  }, [query, group]);

  return (
    <div>
      {/* Search */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search virus name, abbreviation or family…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-white pl-10 pr-10 py-2.5 text-sm shadow-sm focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Group filter pills */}
      <div className="mb-6 flex flex-wrap gap-2">
        {ALL_GROUPS.map(g => (
          <button
            key={g.key}
            onClick={() => setGroup(g.key)}
            className={cn(
              'rounded-full px-3 py-1.5 text-xs font-medium transition-colors border',
              group === g.key
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300 hover:text-blue-600'
            )}
          >
            {g.label}
          </button>
        ))}
      </div>

      {/* Results count */}
      <p className="text-sm text-gray-400 mb-4">
        {filtered.length} virus{filtered.length !== 1 ? 'es' : ''}
      </p>

      {/* Virus grid */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filtered.map(v => (
          <Link
            key={v.id}
            href={`/dashboard/${v.id}`}
            className="group flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm hover:shadow-md hover:border-gray-300 transition-all"
          >
            {/* Coloured dot */}
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: v.color }}
            />
            {/* Info */}
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors truncate">
                {v.abbr}
              </p>
              <p className="text-xs text-gray-500 truncate">{v.family}</p>
            </div>
            <span
              className="ml-auto shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium"
              style={{ backgroundColor: `${v.color}18`, color: v.color }}
            >
              {v.genome}
            </span>
          </Link>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="py-16 text-center text-gray-400">
          No viruses match &quot;{query}&quot;
        </div>
      )}
    </div>
  );
}
