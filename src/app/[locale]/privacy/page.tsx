import type { Metadata } from 'next';
import { Shield, Mail } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Privacy Notice — InfectoNET',
  description:
    'InfectoNET privacy notice: what data we process, the legal basis under UK/EU GDPR, '
    + 'InfectoNET is an independent project that collects no personal data: no accounts, '
    + 'no analytics, no tracking.',
  alternates: { canonical: 'https://infectonet.org/en/privacy' },
};

export default function PrivacyPage() {
  const updated = 'June 2026';

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-16 space-y-10">
      <section>
        <div className="flex items-center gap-3 mb-3">
          <Shield className="h-8 w-8 text-blue-600" />
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900">Privacy Notice</h1>
        </div>
        <p className="text-gray-600">
          InfectoNET is an independent, non-commercial open-science project that is designed to
          collect no personal data. This notice explains what that means in practice.
          Last updated: {updated}.
        </p>
      </section>

      {[
        {
          h: '1. Who operates InfectoNET',
          b: (
            <>
              InfectoNET is an <strong>independent, non-commercial, open-science side project</strong>
              {' '}maintained by an individual researcher. It is <strong>not</strong> affiliated with,
              operated by, or endorsed by any university, institution, or employer, and is not
              covered by any institutional policy or governance arrangement. Enquiries:{' '}
              <a href="mailto:infectonet@gmail.com" className="text-blue-600 hover:underline">infectonet@gmail.com</a>.
            </>
          ),
        },
        {
          h: '2. We do not collect personal data',
          b: (
            <>
              InfectoNET is designed to collect <strong>no personal data</strong>. There is no
              account, login, or registration, and no form that asks for your name, email, or any
              identifying information. The platform uses <strong>no analytics, advertising, or
              tracking</strong> technologies, and server request logging that would record IP
              addresses is disabled. The genomic sequence data displayed also contain no personal
              data: records are identified by accession number and epidemiological metadata
              (country, collection date, organism), not by any identifiable individual.
            </>
          ),
        },
        {
          h: '3. Cookies',
          b: (
            <>
              InfectoNET uses <strong>only strictly necessary cookies</strong> required for the
              web application to run; these do not track you across sessions or sites and are
              exempt from consent under PECR. We do not use Google Analytics, advertising pixels,
              or social-media tracking buttons. The site includes a Google Search Console
              verification meta tag, which sets no cookies and tracks no users.
            </>
          ),
        },
        {
          h: '4. Hosting',
          b: (
            <>
              The platform is hosted on Amazon Web Services. Because InfectoNET collects no
              personal data, there is no personal-data transfer associated with using the site.
            </>
          ),
        },
        {
          h: '5. Your rights',
          b: (
            <>
              Because InfectoNET collects no personal data, there is normally nothing to access,
              rectify, or erase. If you believe the project holds any data about you, or have any
              privacy question, contact{' '}
              <a href="mailto:infectonet@gmail.com" className="text-blue-600 hover:underline">infectonet@gmail.com</a>{' '}
              and it will be addressed promptly.
            </>
          ),
        },
        {
          h: '6. Data sources & licensing',
          b: (
            <>
              For details of the third-party data sources InfectoNET aggregates (NCBI, GISAID,
              Nextstrain, WHO, NOAA, etc.) and their licensing, see the
              {' '}<a href="/en/data-policy" className="text-blue-600 hover:underline">Data Sources &amp; Policy</a> page.
            </>
          ),
        },
      ].map(s => (
        <section key={s.h}>
          <h2 className="text-lg font-bold text-gray-900 mb-2">{s.h}</h2>
          <div className="text-sm text-gray-700 leading-relaxed">{s.b}</div>
        </section>
      ))}

      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
          <Mail className="h-4 w-4 text-gray-400" /> Contact
        </h2>
        <p className="text-sm text-gray-700">
          Privacy questions:{' '}
          <a href="mailto:infectonet@gmail.com" className="text-blue-600 hover:underline">infectonet@gmail.com</a>
        </p>
        <p className="text-xs text-gray-400 mt-2">
          InfectoNET — an independent open-science project.
        </p>
      </section>
    </div>
  );
}
