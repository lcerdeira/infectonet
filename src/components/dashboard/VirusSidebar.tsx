'use client';

import { useState } from 'react';
import { usePathname } from '@/i18n/navigation';
import { Link } from '@/i18n/navigation';
import { VIRUSES, GROUP_COLORS } from '@/lib/viruses';
import type { VirusGroup } from '@/types/virus';
import { Search, X, Wind, Bug, Droplets, Brain, Syringe, Biohazard, ChevronDown, ChevronRight, Dna, Utensils } from 'lucide-react';
import { cn } from '@/lib/utils';

const GROUP_META: Record<VirusGroup, { label: string; Icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }> }> = {
  respiratory:       { label: 'Respiratory',                 Icon: Wind },
  vector_borne:      { label: 'Vector-borne',                Icon: Bug },
  haemorrhagic:      { label: 'Haemorrhagic Fever',          Icon: Droplets },
  zoonotic:          { label: 'Zoonotic & Neurological',     Icon: Brain },
  childhood:         { label: 'Childhood / Vaccine-prev.',   Icon: Syringe },
  other:             { label: 'Other & Emerging',            Icon: Biohazard },
  retroviral:        { label: 'Retroviruses & Endogenous',   Icon: Dna },
  gastrointestinal:  { label: 'Gastrointestinal',            Icon: Utensils },
};

const GROUP_ORDER: VirusGroup[] = [
  'respiratory', 'vector_borne', 'haemorrhagic', 'zoonotic', 'childhood',
  'gastrointestinal', 'retroviral', 'other',
];

export function VirusSidebar({ currentVirusId }: { currentVirusId: string }) {
  const pathname = usePathname();
  const [query, setQuery] = useState('');
  const [collapsed, setCollapsed] = useState<Partial<Record<VirusGroup, boolean>>>({});

  const toggleGroup = (g: VirusGroup) =>
    setCollapsed(prev => ({ ...prev, [g]: !prev[g] }));

  return (
    <aside className="w-64 shrink-0 flex flex-col gap-3">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
        <input
          type="text"
          placeholder="Search…"
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="w-full rounded-xl border border-gray-200 bg-white pl-9 pr-8 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Groups */}
      <nav className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        {GROUP_ORDER.map(group => {
          const { label, Icon } = GROUP_META[group];
          const color = GROUP_COLORS[group];
          const groupViruses = VIRUSES.filter(v => v.group === group).filter(v =>
            !query || v.label.toLowerCase().includes(query.toLowerCase()) || v.abbr.toLowerCase().includes(query.toLowerCase())
          );

          if (groupViruses.length === 0) return null;
          const isCollapsed = collapsed[group];

          return (
            <div key={group} className="border-b border-gray-100 last:border-b-0">
              {/* Group header */}
              <button
                onClick={() => toggleGroup(group)}
                className="flex items-center gap-2.5 w-full px-4 py-2.5 text-left hover:bg-gray-50 transition-colors"
              >
                <Icon className="h-3.5 w-3.5 shrink-0" style={{ color }} />
                <span className="text-xs font-semibold text-gray-700 flex-1">{label}</span>
                {isCollapsed
                  ? <ChevronRight className="h-3.5 w-3.5 text-gray-400" />
                  : <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
                }
              </button>

              {/* Virus list */}
              {!isCollapsed && (
                <ul className="pb-1">
                  {groupViruses.map(v => {
                    const isActive = v.id === currentVirusId;
                    return (
                      <li key={v.id}>
                        <Link
                          href={`/dashboard/${v.id}`}
                          className={cn(
                            'flex items-center gap-2.5 px-3 py-1.5 text-sm transition-colors',
                            isActive
                              ? 'bg-blue-50 text-blue-700 font-semibold border-r-2 border-blue-600'
                              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                          )}
                        >
                          {/* Coloured dot instead of tiny SVG */}
                          <span
                            className="h-2 w-2 shrink-0 rounded-full"
                            style={{ backgroundColor: isActive ? '#2563EB' : color }}
                          />
                          <span className="truncate text-xs">{v.abbr}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
