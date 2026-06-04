import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import '../globals.css';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

const geist = Geist({ subsets: ['latin'], variable: '--font-geist' });

const SITE_URL = 'https://infectonet.org';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'InfectoNET — Global Viral Genomic Surveillance Dashboard',
    template: '%s | InfectoNET',
  },
  description:
    'InfectoNET is a free, open-access genomic surveillance platform tracking 50+ viral '
    + 'pathogens worldwide — COVID-19, Ebola, dengue, avian influenza (H5N1/H5N5), mpox, '
    + 'hantavirus and more. Real-time outbreak monitoring, interactive maps, genotype trends '
    + 'and a public API, built at LSHTM.',
  applicationName: 'InfectoNET',
  authors: [{ name: 'InfectoNET Team, LSHTM', url: SITE_URL }],
  creator: 'London School of Hygiene & Tropical Medicine',
  publisher: 'InfectoNET / LSHTM',
  category: 'science',
  keywords: [
    'genomic surveillance', 'viral genomics', 'genomic epidemiology', 'outbreak monitoring',
    'infectious disease dashboard', 'pathogen surveillance', 'COVID-19 variants', 'Ebola',
    'avian influenza', 'H5N1', 'H5N5', 'dengue', 'mpox', 'monkeypox', 'hantavirus', 'Marburg',
    'Lassa fever', 'Nipah', 'RSV', 'influenza', 'one health', 'FAIR data', 'NCBI', 'GISAID',
    'Nextstrain', 'phylogenetics', 'public health', 'epidemic intelligence', 'LSHTM',
    'disease outbreak news', 'WHO', 'genotype trends', 'virus tracker',
  ],
  alternates: {
    canonical: SITE_URL,
    languages: { 'en': `${SITE_URL}/en`, 'x-default': SITE_URL },
  },
  openGraph: {
    type: 'website',
    siteName: 'InfectoNET',
    title: 'InfectoNET — Global Viral Genomic Surveillance Dashboard',
    description:
      'Free, open-access genomic surveillance of 50+ viral pathogens worldwide. Real-time '
      + 'outbreak monitoring, interactive maps, genotype trends and a public API.',
    url: SITE_URL,
    locale: 'en_GB',
    images: [
      {
        url: '/infectonet-logo.png',
        width: 1200,
        height: 630,
        alt: 'InfectoNET — Global Viral Genomic Surveillance',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'InfectoNET — Global Viral Genomic Surveillance',
    description:
      'Free, open-access genomic surveillance of 50+ viral pathogens — COVID-19, Ebola, '
      + 'dengue, avian flu, mpox and more. Built at LSHTM.',
    images: ['/infectonet-logo.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon.png', type: 'image/png', sizes: '32x32' },
    ],
    apple: '/icon-192.png',
  },
  verification: {
    // Reads the Google Search Console token from the GOOGLE_SITE_VERIFICATION
    // environment variable (set in .env.local on the server). Once registered,
    // add the token there and restart — no code change needed.
    google: process.env.GOOGLE_SITE_VERIFICATION || undefined,
    // Bing Webmaster Tools (optional):
    other: process.env.BING_SITE_VERIFICATION
      ? { 'msvalidate.01': process.env.BING_SITE_VERIFICATION }
      : {},
  },
};

export function generateStaticParams() {
  return routing.locales.map(locale => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
    notFound();
  }

  const messages = await getMessages();

  // Structured data (JSON-LD) for rich Google results
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${SITE_URL}/#organization`,
        name: 'InfectoNET',
        url: SITE_URL,
        logo: `${SITE_URL}/infectonet-logo.png`,
        description:
          'Open-access genomic surveillance platform for viral pathogens, developed at the '
          + 'London School of Hygiene & Tropical Medicine.',
        parentOrganization: {
          '@type': 'CollegeOrUniversity',
          name: 'London School of Hygiene & Tropical Medicine',
          url: 'https://www.lshtm.ac.uk',
        },
        sameAs: ['https://github.com/lcerdeira/infectonet'],
      },
      {
        '@type': 'WebSite',
        '@id': `${SITE_URL}/#website`,
        url: SITE_URL,
        name: 'InfectoNET',
        publisher: { '@id': `${SITE_URL}/#organization` },
        inLanguage: 'en',
        potentialAction: {
          '@type': 'SearchAction',
          target: { '@type': 'EntryPoint', urlTemplate: `${SITE_URL}/en/dashboard/{search_term_string}` },
          'query-input': 'required name=search_term_string',
        },
      },
      {
        '@type': 'Dataset',
        '@id': `${SITE_URL}/#dataset`,
        name: 'InfectoNET Viral Genomic Surveillance Dataset',
        description:
          'Aggregated, normalised genomic surveillance metadata for 50+ viral pathogens '
          + 'including COVID-19, Ebola, dengue, avian influenza, mpox and hantavirus. '
          + 'Sourced from NCBI GenBank, GISAID, and Nextstrain.',
        url: SITE_URL,
        keywords: ['genomic surveillance', 'viral genomics', 'epidemiology', 'public health'],
        license: 'https://infectonet.org/data-policy',
        creator: { '@id': `${SITE_URL}/#organization` },
        isAccessibleForFree: true,
        distribution: {
          '@type': 'DataDownload',
          encodingFormat: 'application/json',
          contentUrl: `${SITE_URL}/api/viruses`,
        },
      },
    ],
  };

  return (
    <html lang={locale} className={`${geist.variable} h-full`}>
      <body className="flex min-h-full flex-col bg-gray-50 font-sans antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <NextIntlClientProvider messages={messages}>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
