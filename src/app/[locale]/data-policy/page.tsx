import type { Metadata } from 'next';
import { Shield, Database, AlertTriangle, Mail, ExternalLink } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Data Sources & Policy — InfectoNET',
  description:
    'Licensing terms, attribution requirements, GDPR compliance, and data usage policy for all data sources used by InfectoNET.',
};

const SOURCES = [
  {
    name: 'NCBI GenBank',
    license: 'Public domain (US Gov. / CC0)',
    restriction: 'None from NCBI. Individual records may carry submitter IP claims.',
    attribution: 'National Center for Biotechnology Information (NCBI), U.S. National Library of Medicine',
    url: 'https://www.ncbi.nlm.nih.gov/genbank/',
    badge: 'Open',
    badgeColor: 'bg-green-100 text-green-700',
  },
  {
    name: 'GISAID',
    license: 'GISAID Database Access Agreement (DAA)',
    restriction: 'Redistribution of underlying sequences and full metadata is prohibited. Aggregate statistics displayed under research use. EPI_SET acknowledgement required.',
    attribution: 'We gratefully acknowledge all data contributors — the Authors and their Originating laboratories responsible for obtaining specimens, and their Submitting laboratories for generating and uploading data to GISAID.',
    url: 'https://gisaid.org/terms-of-use/',
    badge: 'DAA',
    badgeColor: 'bg-amber-100 text-amber-700',
  },
  {
    name: 'Nextstrain',
    license: 'AGPL v3 (software) · Public domain / CC BY 4.0 (open data builds)',
    restriction: 'Open data builds sourced from INSDC (NCBI/ENA/DDBJ). Visualisations: CC BY 4.0.',
    attribution: 'Nextstrain (nextstrain.org). Bedford et al., Bioinformatics 2018.',
    url: 'https://nextstrain.org',
    badge: 'CC BY 4.0',
    badgeColor: 'bg-green-100 text-green-700',
  },
  {
    name: 'WHO News / Disease Outbreak News',
    license: 'CC BY-NC-SA 3.0 IGO',
    restriction: 'Non-commercial use only. Attribution and ShareAlike required. WHO logo requires written authorisation.',
    attribution: '© World Health Organization. Licensed under CC BY-NC-SA 3.0 IGO.',
    url: 'https://www.who.int',
    badge: 'CC BY-NC-SA',
    badgeColor: 'bg-blue-100 text-blue-700',
  },
  {
    name: 'PAHO',
    license: 'CC BY-NC-SA 3.0 IGO',
    restriction: 'Non-commercial use only. Attribution required.',
    attribution: '© Pan American Health Organization (PAHO/WHO). Licensed under CC BY-NC-SA 3.0 IGO.',
    url: 'https://www.paho.org',
    badge: 'CC BY-NC-SA',
    badgeColor: 'bg-blue-100 text-blue-700',
  },
  {
    name: 'ReliefWeb',
    license: 'Mixed — per original source',
    restriction: 'Attribute original publisher. Headline/link display only. Full content subject to each document\'s copyright.',
    attribution: 'ReliefWeb (reliefweb.int), a service of OCHA. Content owned by respective originating organisations.',
    url: 'https://reliefweb.int',
    badge: 'Mixed',
    badgeColor: 'bg-gray-100 text-gray-600',
  },
  {
    name: 'NOAA / Oceanic Niño Index (ONI)',
    license: 'Public domain (CC0 1.0)',
    restriction: 'No restrictions. Attribution recommended.',
    attribution: 'NOAA Climate Prediction Center, Oceanic Niño Index (cpc.ncep.noaa.gov).',
    url: 'https://www.cpc.ncep.noaa.gov',
    badge: 'CC0',
    badgeColor: 'bg-green-100 text-green-700',
  },
  {
    name: 'CHIRPS Rainfall Data',
    license: 'Public domain (CC BY 4.0)',
    restriction: 'No legal restrictions. Academic citation expected.',
    attribution: 'Funk et al. Climate Hazards InfraRed Precipitation with Station data (CHIRPS). UC Santa Barbara / USGS.',
    url: 'https://www.chc.ucsb.edu/data/chirps',
    badge: 'CC BY 4.0',
    badgeColor: 'bg-green-100 text-green-700',
  },
  {
    name: 'Global Forest Watch (GFW)',
    license: 'Per dataset — predominantly CC BY 4.0',
    restriction: 'Verify individual dataset licence via GFW Open Data Portal. Attribution required.',
    attribution: 'Source: Hansen/UMD/Google/USGS/NASA via Global Forest Watch (globalforestwatch.org).',
    url: 'https://data.globalforestwatch.org',
    badge: 'CC BY 4.0',
    badgeColor: 'bg-green-100 text-green-700',
  },
  {
    name: 'ACLED Armed Conflict Data',
    license: 'ACLED End User License Agreement (tiered)',
    restriction: 'Non-commercial, non-redistributable. Attribution mandatory. Commercial/public-sector use requires a specific licence. Contact: data@acleddata.com.',
    attribution: 'Source: ACLED (Armed Conflict Location & Event Data), acleddata.com.',
    url: 'https://acleddata.com/eula',
    badge: 'EULA',
    badgeColor: 'bg-amber-100 text-amber-700',
  },
];

const PRIORITY_ACTIONS = [
  {
    level: 'Critical',
    color: 'text-red-600 bg-red-50 border-red-200',
    items: [
      'Contact GISAID via gisaid.org/help to obtain written supplementary dashboard agreement before expanding GISAID-derived visualisations.',
      'Confirm ACLED access tier — publicly accessible academic dashboards may require a public-sector or research licence (data@acleddata.com).',
    ],
  },
  {
    level: 'High',
    color: 'text-orange-600 bg-orange-50 border-orange-200',
    items: [
      'Publish a full Privacy Notice covering IP address/server log processing (UK GDPR Article 13).',
      'Audit third-party scripts — if any analytics or CDN scripts set cookies, implement a consent mechanism per UK PECR.',
      'Add EPI_SET IDs and originating laboratory credits to all GISAID-derived content.',
    ],
  },
  {
    level: 'Medium',
    color: 'text-amber-600 bg-amber-50 border-amber-200',
    items: [
      'Verify individual GFW dataset licences in the GFW Open Data Portal metadata before display.',
      'Retain a record of NOAA ONI data access dates for citation purposes.',
    ],
  },
];

export default function DataPolicyPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-16 space-y-16">

      {/* Header */}
      <section>
        <div className="flex items-center gap-3 mb-4">
          <Shield className="h-8 w-8 text-blue-600" />
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900">
            Data Sources &amp; Policy
          </h1>
        </div>
        <p className="text-gray-600 leading-relaxed max-w-3xl">
          InfectoNET aggregates publicly available genomic surveillance data from multiple
          international repositories. This page describes the licensing terms, attribution
          requirements, and GDPR compliance framework for all data sources used by the platform.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {['GDPR Compliant', 'UK GDPR', 'No User Tracking', 'No Login Required'].map(tag => (
            <span key={tag}
              className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
              {tag}
            </span>
          ))}
        </div>
      </section>

      {/* GISAID acknowledgement — prominent */}
      <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <h2 className="text-base font-bold text-amber-900 mb-2">
              GISAID Data Acknowledgement
            </h2>
            <p className="text-sm text-amber-800 leading-relaxed">
              Sequence surveillance data for influenza, SARS-CoV-2, arboviruses, RSV, and mpox are
              sourced from{' '}
              <a href="https://gisaid.org" target="_blank" rel="noopener noreferrer"
                className="underline font-medium">GISAID</a>.
              We gratefully acknowledge all data contributors — the Authors and their{' '}
              <strong>Originating laboratories</strong> responsible for obtaining specimens, and their{' '}
              <strong>Submitting laboratories</strong> for generating and uploading data to GISAID.
              Access to GISAID data is governed by the{' '}
              <a href="https://gisaid.org/terms-of-use/" target="_blank" rel="noopener noreferrer"
                className="underline font-medium">GISAID Database Access Agreement</a>.
              InfectoNET displays aggregate statistics only — no raw sequences or full metadata records
              are downloadable from this platform. EPI_SET identifiers for data used in publications
              are cited in the relevant manuscript Materials &amp; Methods.
            </p>
          </div>
        </div>
      </section>

      {/* Data sources table */}
      <section>
        <div className="flex items-center gap-2 mb-6">
          <Database className="h-5 w-5 text-gray-500" />
          <h2 className="text-2xl font-bold text-gray-900">Data Sources</h2>
        </div>
        <div className="space-y-4">
          {SOURCES.map(source => (
            <div key={source.name}
              className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-gray-900">{source.name}</h3>
                  <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${source.badgeColor}`}>
                    {source.badge}
                  </span>
                </div>
                <a href={source.url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-blue-600 hover:underline shrink-0">
                  Terms <ExternalLink className="h-3 w-3" />
                </a>
              </div>
              <div className="mt-3 grid gap-1 sm:grid-cols-3 text-sm">
                <div>
                  <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">Licence</span>
                  <p className="text-gray-700 mt-0.5">{source.license}</p>
                </div>
                <div>
                  <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">Key Restriction</span>
                  <p className="text-gray-700 mt-0.5">{source.restriction}</p>
                </div>
                <div>
                  <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">Attribution</span>
                  <p className="text-gray-600 mt-0.5 text-xs italic">{source.attribution}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* GDPR / Privacy */}
      <section>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Privacy &amp; GDPR Compliance</h2>
        <div className="space-y-4">
          {[
            {
              title: 'No personal data collected from users',
              body: 'InfectoNET requires no login, registration, or form submission. The platform does not collect names, email addresses, or any information that directly identifies users.',
            },
            {
              title: 'Server access logs (IP addresses)',
              body: 'Web server access logs — which include IP addresses — are retained for security monitoring purposes only. IP addresses constitute personal data under UK GDPR and EU GDPR. Logs are not used for analytics, profiling, or shared with third parties. Retention period: 30 days.',
            },
            {
              title: 'No third-party tracking',
              body: 'InfectoNET does not embed third-party analytics scripts (e.g. Google Analytics), advertising pixels, or social media buttons that would result in cross-site tracking of users.',
            },
            {
              title: 'Cookies',
              body: 'InfectoNET uses only technically necessary cookies required for the Next.js application to function. These do not track user behaviour across sessions. No consent is required under the UK Data (Use and Access) Act 2025 for strictly necessary cookies.',
            },
            {
              title: 'Sequence data',
              body: 'Genomic sequence records processed by InfectoNET contain no personal data. Sequences are identified by accession numbers and epidemiological metadata (country, collection date, organism). Individual patient identifiers are not present in public sequence databases.',
            },
            {
              title: 'Legal basis (UK GDPR Article 6)',
              body: 'Processing of server access logs is based on Article 6(1)(f) — legitimate interests (security of the platform). The scientific research exemption (Article 89) applies to InfectoNET\'s core activity of processing aggregate sequence metadata for public health surveillance purposes.',
            },
            {
              title: 'Data controller',
              body: 'InfectoNET is operated by the London School of Hygiene & Tropical Medicine (LSHTM), Keppel Street, London WC1E 7HT, United Kingdom. LSHTM is the data controller for any personal data processed via this platform.',
            },
            {
              title: 'EU representative',
              body: 'InfectoNET is accessible to EU users. LSHTM\'s EU GDPR Article 27 representative obligations are under review. Users in the EU may lodge complaints with their national supervisory authority.',
            },
          ].map(item => (
            <div key={item.title} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-900 mb-1">{item.title}</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Outstanding compliance actions */}
      <section>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Outstanding Compliance Actions</h2>
        <div className="space-y-4">
          {PRIORITY_ACTIONS.map(group => (
            <div key={group.level} className={`rounded-xl border p-5 ${group.color}`}>
              <h3 className="text-sm font-bold uppercase tracking-wide mb-3">{group.level} Priority</h3>
              <ul className="space-y-2">
                {group.items.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-current" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Contact */}
      <section>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Contact</h2>
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm space-y-3 text-sm text-gray-700">
          <p>
            For data licensing enquiries, attribution requests, or GDPR/privacy questions:
          </p>
          <p className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-gray-400" />
            <a href="mailto:infectonet@gmail.com" className="text-blue-600 hover:underline">
              infectonet@gmail.com
            </a>
          </p>
          <p className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-gray-400" />
            LSHTM Data Protection Officer:{' '}
            <a href="mailto:dpo@lshtm.ac.uk" className="text-blue-600 hover:underline">
              dpo@lshtm.ac.uk
            </a>
          </p>
          <p className="text-gray-500 text-xs mt-2">
            London School of Hygiene &amp; Tropical Medicine · Keppel Street · London WC1E 7HT · United Kingdom
          </p>
        </div>
      </section>

      <p className="text-xs text-gray-400 text-center">
        Last reviewed: June 2026 · InfectoNET v0.1
      </p>
    </div>
  );
}
