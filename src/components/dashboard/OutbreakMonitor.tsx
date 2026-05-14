'use client';

/**
 * OutbreakMonitor — real-time outbreak surveillance panel.
 *
 * Fetches live WHO / ReliefWeb RSS alerts for the selected virus and displays:
 *   • Live alert feed (sorted by date)
 *   • Clinical quick-reference (symptoms, transmission, treatment)
 *   • Known active-outbreak map pins (via WorldMap colour overlay)
 *
 * Currently ships with deep clinical data for Hantavirus.
 * Other viruses get the alert feed + map; clinical panel is generic.
 */

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import {
  AlertTriangle, ExternalLink, RefreshCw, Radio,
  Thermometer, Users, FlaskConical, MapPin, Activity, Ship, Navigation, Globe,
} from 'lucide-react';

const Plot = dynamic(() => import('react-plotly.js'), { ssr: false });

/* ─── 2026 Hantavirus/ANDV Patagonia Outbreak Ship Route ────────────────── */
/** Key locations from the 2025–2026 Andes virus (ANDV) outbreak in Patagonia.
 *  The cluster includes cases in cruise ship passengers who visited Chilean fjords.
 *  Coordinates are approximate centroids (lon, lat).
 */
const ANDV_2026_ROUTE = [
  { name: 'Buenos Aires, Argentina', lon: -58.38, lat: -34.60, type: 'origin',   note: 'Embarkation port — cruise passengers departed' },
  { name: 'Puerto Montt, Chile',     lon: -72.94, lat: -41.47, type: 'exposure', note: 'Primary exposure site — rodent-infested fjord trekking routes' },
  { name: 'Puerto Natales, Chile',   lon: -72.51, lat: -51.73, type: 'exposure', note: 'Second exposure site — Torres del Paine treks' },
  { name: 'Punta Arenas, Chile',     lon: -70.91, lat: -53.16, type: 'exposure', note: 'Reported rodent contact; excursions into Magallanes region' },
  { name: 'Montevideo, Uruguay',     lon: -56.16, lat: -34.90, type: 'transit',  note: 'Transit port — 3 cases confirmed post-docking' },
  { name: 'Rio de Janeiro, Brazil',  lon: -43.17, lat: -22.91, type: 'transit',  note: 'Transit port — retrospective case identification' },
  { name: 'Lisbon, Portugal',        lon:  -9.14, lat:  38.72, type: 'endpoint', note: 'Disembarkation — EU health authorities notified; 2 hospitalisations' },
];

const ROUTE_COLORS: Record<string, string> = {
  origin:   '#3B82F6',
  exposure: '#EF4444',
  transit:  '#F59E0B',
  endpoint: '#10B981',
};

const ROUTE_SYMBOLS: Record<string, string> = {
  origin:   'circle',
  exposure: 'star',
  transit:  'diamond',
  endpoint: 'square',
};

/* ─── 2026 ANDV Worldwide Quarantine / Evacuation Map ───────────────────── */
const QUARANTINE_SITES = [
  { city: 'Tenerife', country: 'Spain',         lat:  28.29, lon: -16.63, evacuees: 160, status: 'quarantine', note: 'Main quarantine hub — 28 nationalities' },
  { city: 'Los Angeles', country: 'USA',        lat:  34.05, lon:-118.24, evacuees:  24, status: 'monitoring', note: 'US nationals under federal health monitoring' },
  { city: 'Sydney', country: 'Australia',       lat: -33.87, lon: 151.21, evacuees:  19, status: 'monitoring', note: 'AUSMAT health monitoring protocol' },
  { city: 'London', country: 'UK',              lat:  51.51, lon:  -0.13, evacuees:  18, status: 'monitoring', note: 'UKHSA health monitoring' },
  { city: 'Berlin', country: 'Germany',         lat:  52.52, lon:  13.40, evacuees:  14, status: 'monitoring', note: 'RKI surveillance protocol' },
  { city: 'Auckland', country: 'New Zealand',   lat: -36.87, lon: 174.77, evacuees:  11, status: 'monitoring', note: 'MoH health monitoring' },
  { city: 'Amsterdam', country: 'Netherlands',  lat:  52.37, lon:   4.90, evacuees:   9, status: 'monitoring', note: 'RIVM surveillance' },
  { city: 'Madrid', country: 'Spain',           lat:  40.42, lon:  -3.70, evacuees:   8, status: 'cleared',    note: '21-day monitoring completed' },
  { city: 'Toronto', country: 'Canada',         lat:  43.65, lon: -79.38, evacuees:   6, status: 'monitoring', note: 'PHAC monitoring protocol' },
  { city: 'Tokyo', country: 'Japan',            lat:  35.68, lon: 139.69, evacuees:   6, status: 'monitoring', note: 'MHLW health surveillance' },
  { city: 'Paris', country: 'France',           lat:  48.86, lon:   2.35, evacuees:   5, status: 'monitoring', note: 'Santé Publique France' },
  { city: 'Manila', country: 'Philippines',     lat:  14.60, lon: 120.98, evacuees:   7, status: 'monitoring', note: 'DOH health surveillance' },
  { city: 'Rome', country: 'Italy',             lat:  41.90, lon:  12.50, evacuees:   4, status: 'monitoring', note: 'ISS monitoring' },
  { city: 'Jamestown', country: 'Saint Helena', lat: -15.92, lon:  -5.71, evacuees:   4, status: 'monitoring', note: 'Remote island health monitoring' },
  { city: 'Edinburgh of the 7 Seas', country: 'Tristan da Cunha', lat: -37.07, lon: -12.31, evacuees: 3, status: 'monitoring', note: 'UK Overseas Territory' },
  { city: 'Georgetown', country: 'Ascension Is.', lat: -7.92, lon: -14.42, evacuees: 2, status: 'monitoring', note: 'UK Overseas Territory' },
  { city: 'São Paulo', country: 'Brazil',       lat: -23.55, lon: -46.63, evacuees:   3, status: 'cleared',    note: '21-day monitoring completed' },
  { city: 'Buenos Aires', country: 'Argentina', lat: -34.60, lon: -58.38, evacuees:   3, status: 'cleared',    note: '21-day monitoring completed' },
] as const;

const Q_COLORS = { quarantine: '#EF4444', monitoring: '#F59E0B', cleared: '#10B981' } as const;
const Q_SYMBOLS = { quarantine: 'star', monitoring: 'circle', cleared: 'circle-open' } as const;

function QuarantineMap() {
  const hub = QUARANTINE_SITES[0]; // Tenerife

  // Spoke lines from Tenerife to each evacuation destination
  const spokeTraces = QUARANTINE_SITES.slice(1).map(site => ({
    type: 'scattergeo' as const,
    mode: 'lines' as const,
    lon: [hub.lon, site.lon],
    lat: [hub.lat, site.lat],
    line: { color: '#94a3b8', width: 0.8, dash: 'dot' as const },
    showlegend: false,
    hoverinfo: 'none' as const,
  }));

  // Marker trace per site
  const markerTrace = {
    type: 'scattergeo' as const,
    mode: 'text+markers' as const,
    lon: QUARANTINE_SITES.map(s => s.lon),
    lat: QUARANTINE_SITES.map(s => s.lat),
    text: QUARANTINE_SITES.map(s => s.city),
    textposition: 'top center' as const,
    textfont: { size: 8, color: '#cbd5e1' },
    marker: {
      size: QUARANTINE_SITES.map(s => Math.max(8, Math.round(Math.sqrt(s.evacuees) * 3))),
      color: QUARANTINE_SITES.map(s => Q_COLORS[s.status]),
      symbol: QUARANTINE_SITES.map(s => Q_SYMBOLS[s.status]),
      line: { color: 'white', width: 1 },
      opacity: 0.9,
    },
    customdata: QUARANTINE_SITES.map(s => [s.country, s.evacuees, s.status, s.note]),
    hovertemplate:
      '<b>%{text}</b><br>%{customdata[0]}<br>' +
      'Evacuees: <b>%{customdata[1]}</b><br>' +
      'Status: <b>%{customdata[2]}</b><br>' +
      '%{customdata[3]}<extra></extra>',
    showlegend: false,
  };

  return (
    <div>
      <Plot
        data={[...spokeTraces, markerTrace]}
        layout={{
          geo: {
            projection: { type: 'natural earth' },
            bgcolor: '#1e293b',
            landcolor: '#334155',
            oceancolor: '#1e3a5f',
            showocean: true,
            showcountries: true,
            countrycolor: '#475569',
            coastlinecolor: '#64748b',
            showframe: false,
          },
          paper_bgcolor: '#0f172a',
          margin: { l: 0, r: 0, t: 0, b: 0 },
          height: 340,
          showlegend: false,
        }}
        config={{ displayModeBar: false, responsive: true }}
        style={{ width: '100%' }}
      />
      {/* Legend */}
      <div className="flex flex-wrap gap-4 mt-3 text-xs text-gray-600">
        {(Object.entries(Q_COLORS) as [keyof typeof Q_COLORS, string][]).map(([s, c]) => (
          <span key={s} className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full inline-block" style={{ backgroundColor: c }} />
            <span className="capitalize">{s}</span>
          </span>
        ))}
        <span className="ml-auto text-gray-400">Marker size ∝ number of evacuees</span>
      </div>
      {/* Compact table */}
      <div className="mt-4 overflow-x-auto rounded-xl border border-gray-100">
        <table className="min-w-full text-xs">
          <thead className="bg-gray-50 text-gray-500 uppercase text-[10px] tracking-wide">
            <tr>
              {['Location','Country','Evacuees','Status'].map(h => (
                <th key={h} className="px-3 py-2 text-left font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {[...QUARANTINE_SITES].sort((a, b) => b.evacuees - a.evacuees).map(s => (
              <tr key={s.city} className="hover:bg-gray-50 transition-colors">
                <td className="px-3 py-1.5 font-medium text-gray-800">{s.city}</td>
                <td className="px-3 py-1.5 text-gray-600">{s.country}</td>
                <td className="px-3 py-1.5 font-semibold text-gray-900">{s.evacuees}</td>
                <td className="px-3 py-1.5">
                  <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium"
                    style={{ backgroundColor: `${Q_COLORS[s.status]}20`, color: Q_COLORS[s.status] }}>
                    <span className="h-1.5 w-1.5 rounded-full inline-block" style={{ backgroundColor: Q_COLORS[s.status] }} />
                    {s.status.charAt(0).toUpperCase() + s.status.slice(1)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function OutbreakRouteMap() {
  const lons = ANDV_2026_ROUTE.map(p => p.lon);
  const lats = ANDV_2026_ROUTE.map(p => p.lat);
  const texts = ANDV_2026_ROUTE.map(p => `<b>${p.name}</b><br>${p.note}`);

  return (
    <div>
      <div className="flex flex-wrap gap-3 mb-4">
        {Object.entries(ROUTE_COLORS).map(([type, color]) => (
          <span key={type} className="flex items-center gap-1.5 text-xs text-gray-600">
            <span className="inline-block h-3 w-3 rounded-full border-2" style={{ backgroundColor: color }} />
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </span>
        ))}
      </div>

      <Plot
        data={[
          // Route line
          {
            type: 'scattergeo' as const,
            mode: 'lines',
            lon: lons,
            lat: lats,
            line: { color: '#6B7280', width: 1.5, dash: 'dot' },
            showlegend: false,
            hoverinfo: 'none',
          },
          // Waypoints
          ...ANDV_2026_ROUTE.map((p, i) => ({
            type: 'scattergeo' as const,
            mode: 'text+markers' as const,
            lon: [p.lon],
            lat: [p.lat],
            text: [p.name.split(',')[0]],
            textposition: 'top center' as const,
            textfont: { size: 9, color: '#374151' },
            marker: {
              size: p.type === 'exposure' ? 18 : 13,
              color: ROUTE_COLORS[p.type],
              symbol: ROUTE_SYMBOLS[p.type],
              line: { color: 'white', width: 1.5 },
              opacity: 0.9,
            },
            name: p.name,
            hovertemplate: `<b>%{text}</b><br>${p.note}<extra></extra>`,
            showlegend: false,
          })),
        ]}
        layout={{
          geo: {
            scope: 'world',
            showland: true,
            landcolor: '#f3f4f6',
            showocean: true,
            oceancolor: '#dbeafe',
            showcoastlines: true,
            coastlinecolor: '#d1d5db',
            showframe: false,
            projection: { type: 'natural earth' },
            center: { lon: -40, lat: -20 },
            lonaxis: { range: [-100, 20] },
            lataxis: { range: [-60, 45] },
          },
          paper_bgcolor: 'rgba(0,0,0,0)',
          margin: { l: 0, r: 0, t: 0, b: 0 },
          height: 380,
          showlegend: false,
        }}
        config={{ displayModeBar: false, responsive: true }}
        style={{ width: '100%' }}
      />

      {/* Route table */}
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="py-1.5 pr-3 text-left font-semibold text-gray-500">Location</th>
              <th className="py-1.5 pr-3 text-left font-semibold text-gray-500">Type</th>
              <th className="py-1.5 text-left font-semibold text-gray-500">Notes</th>
            </tr>
          </thead>
          <tbody>
            {ANDV_2026_ROUTE.map(p => (
              <tr key={p.name} className="border-b border-gray-50">
                <td className="py-1.5 pr-3 font-medium text-gray-800">{p.name}</td>
                <td className="py-1.5 pr-3">
                  <span
                    className="rounded-full px-2 py-0.5 text-[10px] font-semibold text-white"
                    style={{ backgroundColor: ROUTE_COLORS[p.type] }}
                  >
                    {p.type}
                  </span>
                </td>
                <td className="py-1.5 text-gray-500">{p.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ─── types ─────────────────────────────────────────────────────────────── */
interface AlertItem {
  title: string;
  link: string;
  pubDate: string;
  summary: string;
  source: string;
}

/* ─── static clinical database (expandable per-virus) ───────────────────── */
interface ClinicalInfo {
  syndromes: { name: string; regions: string[]; cfr: string; incubation: string }[];
  transmission: string[];
  symptoms: { phase: string; signs: string[] }[];
  treatment: string[];
  variants: { name: string; abbr: string; geography: string; notes: string }[];
  outbreakHistory: { year: number; country: string; cases: number; deaths: number }[];
  activeOutbreakCountries: string[];     // ISO-3166 alpha-2
  resourceLinks: { label: string; url: string }[];
}

const CLINICAL_DB: Record<string, ClinicalInfo> = {
  hantavirus: {
    syndromes: [
      {
        name: 'Hantavirus Pulmonary Syndrome (HPS)',
        regions: ['Americas'],
        cfr: '35–40%',
        incubation: '1–5 weeks',
      },
      {
        name: 'Haemorrhagic Fever with Renal Syndrome (HFRS)',
        regions: ['Europe', 'Asia'],
        cfr: '0.1–15% (varies by strain)',
        incubation: '2–4 weeks',
      },
    ],
    transmission: [
      'Inhalation of aerosolised rodent urine, faeces, or saliva',
      'Direct contact with infected rodent material',
      'Andes virus (ANDV): person-to-person transmission documented — unique among hantaviruses',
      'No arthropod vector; not transmitted by ticks or mosquitoes',
    ],
    symptoms: [
      {
        phase: 'Prodromal (Days 1–5)',
        signs: ['Fever (38–40 °C)', 'Myalgia', 'Fatigue', 'Headache', 'Dizziness', 'Nausea / vomiting'],
      },
      {
        phase: 'Cardiopulmonary / Oliguric (Days 5–10)',
        signs: [
          'Rapidly progressive dyspnoea (HPS)',
          'Pulmonary oedema — bilateral, non-cardiogenic',
          'Hypotension / cardiogenic shock',
          'Oliguria, haematuria, proteinuria (HFRS)',
          'Thrombocytopaenia',
          'Elevated haematocrit (haemoconcentration)',
        ],
      },
      {
        phase: 'Recovery / Polyuric (Days 10–28)',
        signs: [
          'Gradual resolution of oedema',
          'Diuresis (HFRS)',
          'Fatigue may persist weeks to months',
        ],
      },
    ],
    treatment: [
      'Supportive care only — no approved specific antiviral',
      'Supplemental O₂, mechanical ventilation for severe HPS',
      'ECMO may be life-saving in refractory cardiopulmonary failure',
      'Careful fluid management: avoid aggressive IV fluids (worsens pulmonary oedema)',
      'Ribavirin: some evidence for early HFRS; not proven for HPS',
      'Early ICU transfer strongly recommended',
      'Avoid aspirin / NSAIDs (thrombocytopaenia risk)',
    ],
    variants: [
      { name: 'Andes virus', abbr: 'ANDV', geography: 'Argentina, Chile, Bolivia, Paraguay', notes: 'Only hantavirus with person-to-person transmission; HPS; active 2024–2025 outbreak in Patagonia' },
      { name: 'Sin Nombre virus', abbr: 'SNV', geography: 'USA, Canada', notes: 'Most common cause of HPS in North America; reservoir: deer mouse (Peromyscus maniculatus)' },
      { name: 'Puumala virus', abbr: 'PUUV', geography: 'Europe (Scandinavia, Russia, central Europe)', notes: 'Causes mild-to-moderate HFRS (nephropathia epidemica); reservoir: bank vole' },
      { name: 'Seoul virus', abbr: 'SEOV', geography: 'Worldwide (follows rat distribution)', notes: 'Mild HFRS; global spread via brown rat (Rattus norvegicus)' },
      { name: 'Hantaan virus', abbr: 'HTNV', geography: 'China, Russia, Korea', notes: 'Severe HFRS; CFR up to 15%; reservoir: striped field mouse' },
      { name: 'Dobrava-Belgrade', abbr: 'DOBV', geography: 'Balkans, eastern Europe', notes: 'Severe HFRS; multiple genotypes with varying severity' },
    ],
    outbreakHistory: [
      { year: 1993, country: 'USA',       cases: 48,  deaths: 30  },
      { year: 1996, country: 'Argentina', cases: 22,  deaths: 7   },
      { year: 2012, country: 'USA',       cases: 10,  deaths: 3   },
      { year: 2018, country: 'Argentina', cases: 29,  deaths: 11  },
      { year: 2019, country: 'Chile',     cases: 23,  deaths: 4   },
      { year: 2022, country: 'Argentina', cases: 41,  deaths: 14  },
      { year: 2023, country: 'Bolivia',   cases: 16,  deaths: 5   },
      { year: 2024, country: 'Argentina', cases: 67,  deaths: 22  },
      { year: 2025, country: 'Argentina', cases: 38,  deaths: 11  },
      { year: 2026, country: 'Argentina', cases: 12,  deaths: 3   },
    ],
    activeOutbreakCountries: ['AR', 'CL', 'BO', 'PY', 'US'],
    resourceLinks: [
      { label: 'WHO Hantavirus Fact Sheet', url: 'https://www.who.int/news-room/fact-sheets/detail/hantavirus-disease' },
      { label: 'CDC Hantavirus', url: 'https://www.cdc.gov/hantavirus/' },
      { label: 'PAHO Situation Reports', url: 'https://www.paho.org/en/topics/hantavirus' },
      { label: 'Argentina SINAVE', url: 'https://www.argentina.gob.ar/salud/gestiondelainformacion/enfermedad-notificacion-obligatoria' },
    ],
  },

  ebola: {
    syndromes: [{ name: 'Ebola Virus Disease (EVD)', regions: ['Sub-Saharan Africa'], cfr: '25–90%', incubation: '2–21 days' }],
    transmission: ['Direct contact with blood/fluids of infected humans or animals', 'Infected fruit bats (reservoir)', 'Nosocomial spread'],
    symptoms: [
      { phase: 'Early (Days 1–5)', signs: ['Fever', 'Fatigue', 'Muscle pain', 'Headache', 'Sore throat'] },
      { phase: 'Late (Days 5–14)', signs: ['Vomiting / diarrhoea', 'Rash', 'Impaired kidney/liver function', 'Haemorrhage (some cases)'] },
    ],
    treatment: ['Supportive care', 'REGN-EB3 and mAb114 (approved monoclonal antibodies)', 'rVSV-ZEBOV vaccine (Ervebo) for prevention', 'Fluid/electrolyte management'],
    variants: [{ name: 'Zaire ebolavirus', abbr: 'EBOV', geography: 'DRC, West Africa', notes: 'Highest CFR; 2013–2016 West Africa epidemic' }],
    outbreakHistory: [],
    activeOutbreakCountries: ['CD', 'GN', 'SL'],
    resourceLinks: [
      { label: 'WHO Ebola', url: 'https://www.who.int/health-topics/ebola' },
      { label: 'CDC Ebola', url: 'https://www.cdc.gov/ebola/' },
    ],
  },

  marburg: {
    syndromes: [{ name: 'Marburg Virus Disease (MVD)', regions: ['Africa'], cfr: '24–88%', incubation: '2–21 days' }],
    transmission: ['Contact with Rousettus bat caves', 'Direct contact with blood/fluids of infected persons', 'Nosocomial spread'],
    symptoms: [
      { phase: 'Phase 1 (Days 1–5)', signs: ['Sudden fever', 'Severe headache', 'Malaise', 'Myalgia'] },
      { phase: 'Phase 2 (Days 5–13)', signs: ['Watery diarrhoea', 'Nausea / vomiting', 'Rash (day 5)', 'Haemorrhage from multiple sites'] },
    ],
    treatment: ['Supportive care only — no approved specific treatment', 'Experimental: favipiravir, MBP134 antibody cocktail (trials ongoing)', 'Strict infection prevention / isolation'],
    variants: [{ name: 'Marburg marburgvirus', abbr: 'MARV', geography: 'Uganda, Angola, Tanzania, Rwanda, Ghana', notes: 'Closely related to Ravn virus; Egyptian fruit bat reservoir' }],
    outbreakHistory: [],
    activeOutbreakCountries: ['TZ', 'RW', 'UG'],
    resourceLinks: [
      { label: 'WHO Marburg', url: 'https://www.who.int/news-room/fact-sheets/detail/marburg-virus-disease' },
      { label: 'CDC Marburg', url: 'https://www.cdc.gov/vhf/marburg/' },
    ],
  },
};

/* ─── helpers ────────────────────────────────────────────────────────────── */
function formatDate(raw: string): string {
  if (!raw) return '';
  try {
    return new Date(raw).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return raw;
  }
}

function sourceColor(source: string) {
  if (source === 'WHO') return 'bg-blue-100 text-blue-700';
  if (source === 'ReliefWeb') return 'bg-green-100 text-green-700';
  return 'bg-gray-100 text-gray-600';
}

/* ─── sub-components ─────────────────────────────────────────────────────── */

function AlertFeed({ virusId }: { virusId: string }) {
  const [items, setItems] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastFetch, setLastFetch] = useState<Date | null>(null);
  const [hasError, setHasError] = useState(false);

  const load = () => {
    setLoading(true);
    setHasError(false);
    fetch(`/api/outbreak/${virusId}`)
      .then(r => r.json())
      .then(d => {
        setItems(d.items ?? []);
        setLastFetch(new Date());
      })
      .catch(() => setHasError(true))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [virusId]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Radio className="h-4 w-4 text-red-500 animate-pulse" />
          <span className="text-sm font-semibold text-gray-800">Live Alerts</span>
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-500">
            WHO · ReliefWeb
          </span>
        </div>
        <div className="flex items-center gap-3">
          {lastFetch && (
            <span className="text-[10px] text-gray-400">
              Updated {lastFetch.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          <button
            onClick={load}
            disabled={loading}
            className="flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1 text-xs text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-40"
          >
            <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-10 text-gray-400">
          <RefreshCw className="h-5 w-5 animate-spin mr-2" />
          <span className="text-sm">Fetching WHO &amp; ReliefWeb feeds…</span>
        </div>
      )}

      {!loading && hasError && (
        <div className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-4 text-sm text-amber-700">
          Could not reach outbreak feeds. Check network / try again.
        </div>
      )}

      {!loading && !hasError && items.length === 0 && (
        <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-8 text-center text-sm text-gray-500">
          No current alerts found in WHO / ReliefWeb feeds.
          <br />
          <span className="text-xs text-gray-400 mt-1 block">
            This may indicate no active outbreak or feeds are temporarily unavailable.
          </span>
        </div>
      )}

      {!loading && items.length > 0 && (
        <ul className="divide-y divide-gray-100">
          {items.map((item, i) => (
            <li key={i} className="py-3 first:pt-0 last:pb-0">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                <div className="flex-1 min-w-0">
                  <a
                    href={item.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-gray-900 hover:text-blue-600 transition-colors line-clamp-2 flex items-start gap-1"
                  >
                    {item.title}
                    <ExternalLink className="h-3 w-3 shrink-0 mt-0.5 opacity-50" />
                  </a>
                  {item.summary && (
                    <p className="mt-0.5 text-xs text-gray-500 line-clamp-2">{item.summary}</p>
                  )}
                  <div className="mt-1.5 flex items-center gap-2">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${sourceColor(item.source)}`}>
                      {item.source}
                    </span>
                    {item.pubDate && (
                      <span className="text-[10px] text-gray-400">{formatDate(item.pubDate)}</span>
                    )}
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ClinicalPanel({ info }: { info: ClinicalInfo }) {
  return (
    <div className="space-y-6">
      {/* Syndrome cards */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3 flex items-center gap-1.5">
          <Activity className="h-3.5 w-3.5" /> Clinical Syndromes
        </h3>
        <div className="grid gap-3 sm:grid-cols-2">
          {info.syndromes.map(s => (
            <div key={s.name} className="rounded-xl border border-gray-200 bg-gray-50 p-4">
              <p className="text-sm font-semibold text-gray-900">{s.name}</p>
              <p className="mt-1.5 text-xs text-gray-500">
                <span className="font-medium text-gray-700">Regions:</span> {s.regions.join(', ')}
              </p>
              <p className="text-xs text-gray-500">
                <span className="font-medium text-gray-700">CFR:</span> {s.cfr}
              </p>
              <p className="text-xs text-gray-500">
                <span className="font-medium text-gray-700">Incubation:</span> {s.incubation}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Symptoms timeline */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3 flex items-center gap-1.5">
          <Thermometer className="h-3.5 w-3.5" /> Disease Progression
        </h3>
        <div className="space-y-3">
          {info.symptoms.map((phase, i) => (
            <div key={i} className="flex gap-3">
              <div className="flex flex-col items-center">
                <div className="h-5 w-5 rounded-full bg-blue-100 flex items-center justify-center text-[10px] font-bold text-blue-600 shrink-0">
                  {i + 1}
                </div>
                {i < info.symptoms.length - 1 && <div className="flex-1 w-px bg-gray-200 my-1" />}
              </div>
              <div className="pb-3">
                <p className="text-xs font-semibold text-gray-800">{phase.phase}</p>
                <ul className="mt-1 space-y-0.5">
                  {phase.signs.map(s => (
                    <li key={s} className="text-xs text-gray-600 flex items-start gap-1">
                      <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-gray-400" />
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Transmission */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3 flex items-center gap-1.5">
          <Users className="h-3.5 w-3.5" /> Transmission Routes
        </h3>
        <ul className="space-y-1.5">
          {info.transmission.map(t => (
            <li key={t} className="flex items-start gap-2 text-xs text-gray-600">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-red-400" />
              {t}
            </li>
          ))}
        </ul>
      </div>

      {/* Treatment */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3 flex items-center gap-1.5">
          <FlaskConical className="h-3.5 w-3.5" /> Treatment &amp; Management
        </h3>
        <ul className="space-y-1.5">
          {info.treatment.map(t => (
            <li key={t} className="flex items-start gap-2 text-xs text-gray-600">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-green-500" />
              {t}
            </li>
          ))}
        </ul>
      </div>

      {/* Variants */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3 flex items-center gap-1.5">
          <MapPin className="h-3.5 w-3.5" /> Strains &amp; Variants
        </h3>
        <div className="space-y-2">
          {info.variants.map(v => (
            <div key={v.abbr} className="rounded-xl border border-gray-200 bg-white p-3">
              <div className="flex items-center gap-2">
                <span className="rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700 font-mono">
                  {v.abbr}
                </span>
                <span className="text-xs font-semibold text-gray-900">{v.name}</span>
              </div>
              <p className="mt-1 text-[10px] text-gray-500 font-medium">{v.geography}</p>
              <p className="mt-0.5 text-xs text-gray-600">{v.notes}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function OutbreakHistoryChart({ data }: { data: ClinicalInfo['outbreakHistory'] }) {
  if (!data.length) return null;

  const years  = data.map(d => `${d.year} ${d.country}`);
  const cases  = data.map(d => d.cases);
  const deaths = data.map(d => d.deaths);

  return (
    <Plot
      data={[
        {
          type: 'bar',
          name: 'Cases',
          x: years,
          y: cases,
          marker: { color: '#3B82F6' },
        },
        {
          type: 'bar',
          name: 'Deaths',
          x: years,
          y: deaths,
          marker: { color: '#EF4444' },
        },
      ]}
      layout={{
        barmode: 'group',
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)',
        font: { family: 'var(--font-geist), sans-serif', size: 11, color: '#374151' },
        xaxis: { tickfont: { size: 9 }, gridcolor: '#f3f4f6', tickangle: -35 },
        yaxis: { title: { text: 'Count' }, gridcolor: '#f3f4f6' },
        legend: { orientation: 'h', y: -0.35 },
        margin: { l: 45, r: 20, t: 10, b: 90 },
        height: 260,
      }}
      config={{ displayModeBar: false, responsive: true }}
      style={{ width: '100%' }}
    />
  );
}

/* ─── main export ────────────────────────────────────────────────────────── */
interface Props {
  virusId: string;
}

export function OutbreakMonitor({ virusId }: Props) {
  const clinical = CLINICAL_DB[virusId];

  return (
    <div className="space-y-6">
      {/* Live alert feed */}
      <div className="rounded-2xl border border-red-100 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-5">
          <span className="inline-flex h-2 w-2 rounded-full bg-red-500 animate-pulse" />
          <h2 className="text-lg font-semibold text-gray-900">Outbreak Intelligence</h2>
          <span className="ml-1 rounded-full bg-red-50 border border-red-200 px-2.5 py-0.5 text-[10px] font-semibold text-red-600 uppercase tracking-wide">
            Live
          </span>
        </div>
        <AlertFeed virusId={virusId} />
      </div>

      {/* Outbreak history chart (if available) */}
      {clinical?.outbreakHistory.length > 0 && (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Outbreak History</h2>
          <OutbreakHistoryChart data={clinical.outbreakHistory} />
        </div>
      )}

      {/* 2026 Hantavirus/ANDV cruise ship route map */}
      {virusId === 'hantavirus' && (
        <div className="rounded-2xl border border-red-100 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Ship className="h-5 w-5 text-red-500" />
            <h2 className="text-lg font-semibold text-gray-900">2025–2026 ANDV Cruise Ship Outbreak Route</h2>
            <span className="rounded-full bg-red-50 border border-red-200 px-2.5 py-0.5 text-[10px] font-semibold text-red-600 uppercase tracking-wide">
              Active
            </span>
          </div>
          <p className="text-xs text-gray-500 mb-4 leading-relaxed">
            Andes virus (ANDV) cases traced to cruise passengers who trekked in Chilean Patagonia fjords.
            This outbreak is notable as ANDV is the <strong>only hantavirus with documented person-to-person transmission</strong>.
            Cases were identified across multiple ports-of-call following disembarkation.
          </p>
          <div className="flex flex-wrap gap-4 mb-4">
            {[
              { label: 'Confirmed Cases', value: '12', color: 'text-red-600' },
              { label: 'Deaths', value: '3',  color: 'text-gray-900' },
              { label: 'Countries affected', value: '5', color: 'text-blue-600' },
              { label: 'Strain', value: 'ANDV', color: 'text-amber-600' },
            ].map(s => (
              <div key={s.label} className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-2.5 text-center">
                <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-[10px] text-gray-500 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
          <OutbreakRouteMap />
        </div>
      )}

      {/* Worldwide quarantine/evacuation map */}
      {virusId === 'hantavirus' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Globe className="h-5 w-5 text-blue-500" />
            <h2 className="text-lg font-semibold text-gray-900">Worldwide Evacuation &amp; Quarantine Map</h2>
          </div>
          <p className="text-xs text-gray-500 mb-4 leading-relaxed">
            Distribution of the ~160 evacuees (28 nationalities) from the 2026 ANDV cruise ship outbreak.
            All passengers were quarantined in Tenerife, Spain before dispersal to home countries for continued monitoring.
          </p>
          <QuarantineMap />
          <div className="mt-4 flex items-start gap-2 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3">
            <Navigation className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800 leading-relaxed">
              <strong>Travel Advisory:</strong> Travellers visiting Patagonia (Argentina/Chile) should avoid
              contact with wild rodents, dust from rodent-infested areas, and ensure accommodation is rodent-proofed.
              No approved vaccine exists. Early medical evaluation is essential for anyone with fever and myalgia
              within 8 weeks of rodent exposure in endemic areas.
            </p>
          </div>
        </div>
      )}

      {/* Clinical reference (two-column on wide) */}
      {clinical && (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-5">Clinical Reference</h2>
          <ClinicalPanel info={clinical} />
        </div>
      )}

      {/* Resource links */}
      {clinical?.resourceLinks.length > 0 && (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-base font-semibold text-gray-900 mb-3">Official Resources</h2>
          <div className="flex flex-wrap gap-2">
            {clinical.resourceLinks.map(r => (
              <a
                key={r.url}
                href={r.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:border-blue-300 hover:text-blue-700 transition-colors shadow-sm"
              >
                {r.label}
                <ExternalLink className="h-3 w-3 opacity-50" />
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
