'use client';

import { useEffect, useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { aggregateByCountry, aggregateGenotypeTrends } from '@/lib/utils';
import { WorldMap } from './WorldMap';
import { GenotypeTrends } from './GenotypeTrends';
import { SampleTimeline } from './SampleTimeline';
import { VirusInsights } from './VirusInsights';
import { OutbreakMonitor } from './OutbreakMonitor';
import { Loader2, Database, Radio } from 'lucide-react';

interface Props {
  virusId: string;
}

interface VirusData {
  id: string;
  total: number;
  records: Record<string, unknown>[];
}

interface CountriesData {
  id: string;
  total: number;
  countryStat: Record<string, { count: number; genotypeCounts: Record<string, number> }>;
}

/** Viruses that have an outbreak monitor panel */
const MONITOR_ENABLED = new Set([
  'hantavirus', 'ebola', 'marburg', 'mpox', 'lassa', 'crimean',
  'nipah', 'dengue', 'riftvalley', 'oropouche',
]);

export function VirusDashboard({ virusId }: Props) {
  const t = useTranslations('dashboard');
  const [data, setData] = useState<VirusData | null>(null);
  const [countriesData, setCountriesData] = useState<CountriesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<'genomic' | 'outbreak'>('genomic');
  const hasMonitor = MONITOR_ENABLED.has(virusId);

  useEffect(() => {
    setLoading(true);
    setError(null);
    setData(null);
    setCountriesData(null);
    setTab('genomic');

    // Fetch records (for timeline / genotype trends) and full country aggregation in parallel
    Promise.all([
      fetch(`/api/viruses/${virusId}?limit=10000`).then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json() as Promise<VirusData>;
      }),
      fetch(`/api/viruses/${virusId}/countries`).then(r =>
        r.ok ? (r.json() as Promise<CountriesData>) : null
      ).catch(() => null),
    ])
      .then(([d, cd]) => {
        setData(d);
        setCountriesData(cd);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [virusId]);

  // Use aggregated country data (covers ALL records) for the map;
  // fall back to computing from the sample records if the API failed.
  const countryStat = useMemo(() => {
    if (countriesData?.countryStat) return countriesData.countryStat;
    if (!data) return {};
    return aggregateByCountry(data.records);
  }, [countriesData, data]);

  const genotypeTrends = useMemo(() => {
    if (!data) return [];
    return aggregateGenotypeTrends(data.records);
  }, [data]);

  // Collect unique genotypes from aggregated country data (or fall back to sample records)
  // Must be called before any early returns to satisfy React hooks rules.
  const genotypes = useMemo(() => {
    if (countriesData?.countryStat) {
      const gts = new Set<string>();
      Object.values(countriesData.countryStat).forEach(s =>
        Object.keys(s.genotypeCounts).forEach(g => { if (g !== 'Unknown') gts.add(g); })
      );
      return [...gts];
    }
    if (!data) return [];
    return [...new Set(data.records.map(r => (r.GENOTYPE as string) || 'Unknown'))];
  }, [countriesData, data]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32 text-gray-400">
        <Loader2 className="h-8 w-8 animate-spin mr-3" />
        <span className="text-lg">{t('loading')}</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-xl border border-red-100 bg-red-50 px-6 py-10 text-center text-red-600">
        {t('no_data')}
        {error && <p className="mt-1 text-sm opacity-70">{error}</p>}
      </div>
    );
  }

  if (data.total === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
          <Database className="h-7 w-7 text-gray-400" />
        </div>
        <h3 className="text-base font-semibold text-gray-700">No sequences imported yet</h3>
        <p className="mt-2 max-w-sm mx-auto text-sm text-gray-400">
          This pathogen is catalogued in InfectoNET but its genomic sequence database has not been loaded.
          Data will appear here once sequences are imported from NCBI, GISAID or Nextstrain.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2 text-xs text-gray-400">
          {['NCBI GenBank', 'GISAID', 'Nextstrain', 'Pathoplexus'].map(src => (
            <span key={src} className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1">{src}</span>
          ))}
        </div>
      </div>
    );
  }

  const totalCountries = Object.keys(countryStat).length;

  return (
    <div className="space-y-6">
      {/* Tab switcher */}
      {hasMonitor && (
        <div className="flex gap-1 rounded-xl border border-gray-200 bg-gray-50 p-1 w-fit">
          <button
            onClick={() => setTab('genomic')}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              tab === 'genomic'
                ? 'bg-white shadow-sm text-gray-900'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Database className="h-4 w-4" />
            Genomic Data
          </button>
          <button
            onClick={() => setTab('outbreak')}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              tab === 'outbreak'
                ? 'bg-white shadow-sm text-gray-900'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Radio className="h-4 w-4 text-red-500" />
            Outbreak Monitor
            <span className="ml-0.5 h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
          </button>
        </div>
      )}

      {/* ── Outbreak Monitor tab ── */}
      {tab === 'outbreak' && <OutbreakMonitor virusId={virusId} />}

      {/* ── Genomic Data tab (default) ── */}
      {tab === 'genomic' && (
        <>
          {/* Summary chips */}
          <div className="flex flex-wrap gap-3">
            {[
              { value: (countriesData?.total ?? data.total).toLocaleString(), label: t('samples') },
              { value: totalCountries.toLocaleString(),  label: t('countries') },
              { value: genotypes.length.toLocaleString(), label: t('genotypes') },
            ].map(item => (
              <div
                key={item.label}
                className="rounded-xl border border-gray-200 bg-white px-5 py-3 text-center shadow-sm"
              >
                <p className="text-2xl font-bold text-gray-900">{item.value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{item.label}</p>
              </div>
            ))}
          </div>

          {/* Map */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('map_title')}</h2>
            <WorldMap countryStat={countryStat} />
          </div>

          {/* Genotype Trends */}
          {genotypeTrends.length > 0 && (
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('trends_title')}</h2>
              <GenotypeTrends trends={genotypeTrends} />
            </div>
          )}

          {/* Timeline */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('timeline_title')}</h2>
            <SampleTimeline records={data.records} />
          </div>

          {/* Auto-discovered additional insights */}
          <VirusInsights records={data.records} />
        </>
      )}
    </div>
  );
}
