import type { Metadata } from 'next';
import { Shield, Mail } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Privacy Notice — InfectoNET',
  description:
    'InfectoNET privacy notice: what data we process, the legal basis under UK/EU GDPR, '
    + 'retention, cookies, your rights, and how to contact the data controller (LSHTM).',
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
          This notice explains how InfectoNET processes personal data, in compliance with the
          UK General Data Protection Regulation (UK GDPR), the EU GDPR, and the UK Privacy and
          Electronic Communications Regulations (PECR). Last updated: {updated}.
        </p>
      </section>

      {[
        {
          h: '1. Who we are (data controller)',
          b: (
            <>
              InfectoNET is operated by the <strong>London School of Hygiene &amp; Tropical
              Medicine (LSHTM)</strong>, Keppel Street, London WC1E 7HT, United Kingdom. LSHTM
              is the data controller for personal data processed via this platform. Data
              protection enquiries: <a href="mailto:dpo@lshtm.ac.uk" className="text-blue-600 hover:underline">dpo@lshtm.ac.uk</a>.
            </>
          ),
        },
        {
          h: '2. What data we process',
          b: (
            <>
              InfectoNET requires <strong>no account, login, or registration</strong> to browse
              the dashboard or use the API. We do not ask for your name, email, or any directly
              identifying information. The only personal data processed are:
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li><strong>Server access logs</strong> — including IP address, timestamp,
                  requested URL, browser user-agent — generated automatically by the web server.</li>
                <li><strong>Strictly necessary cookies</strong> — set by the Next.js framework
                  for the application to function. These do not track you across sessions or sites.</li>
              </ul>
              The genomic sequence data displayed contain <strong>no personal data</strong>:
              records are identified by accession number and epidemiological metadata (country,
              collection date, organism), not by any identifiable individual.
            </>
          ),
        },
        {
          h: '3. Why we process it, and the legal basis',
          b: (
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Security &amp; integrity of the platform</strong> (access logs) —
                legal basis: <em>legitimate interests</em> (UK GDPR Art. 6(1)(f)).</li>
              <li><strong>Public-health research &amp; surveillance</strong> (the core activity of
                processing aggregate sequence metadata) — supported by the
                <em> scientific research</em> provisions (UK GDPR Art. 89), noting the underlying
                sequence data contain no personal data.</li>
              <li><strong>Application functionality</strong> (strictly necessary cookies) —
                exempt from consent under PECR / the UK Data (Use and Access) Act 2025.</li>
            </ul>
          ),
        },
        {
          h: '4. Retention',
          b: <>Server access logs are retained for <strong>30 days</strong> for security
             monitoring, then deleted or anonymised. We do not build long-term profiles of users.</>,
        },
        {
          h: '5. Cookies & tracking',
          b: (
            <>
              InfectoNET uses <strong>only strictly necessary cookies</strong> required for the
              application to run. We do <strong>not</strong> use Google Analytics, advertising
              pixels, social-media tracking buttons, or any third-party behavioural tracking.
              Because no non-essential cookies are set, no cookie-consent banner is required
              under PECR. The site does include a Google Search Console verification meta tag,
              which does not set cookies or track users.
            </>
          ),
        },
        {
          h: '6. Who we share data with',
          b: (
            <>
              We do <strong>not</strong> sell or share your personal data. Access logs are not
              disclosed to third parties except where legally required. The platform is hosted on
              Amazon Web Services (AWS, US region) under AWS&rsquo;s GDPR-compliant data-processing
              terms and Standard Contractual Clauses for any international transfer of log data.
            </>
          ),
        },
        {
          h: '7. International users & transfers',
          b: (
            <>
              InfectoNET is accessible worldwide. EU/EEA users&rsquo; data are protected under the
              EU GDPR; transfers to the AWS US region rely on Standard Contractual Clauses. EU
              users may lodge a complaint with their national supervisory authority; UK users may
              complain to the Information Commissioner&rsquo;s Office (ICO,
              {' '}<a href="https://ico.org.uk" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">ico.org.uk</a>).
            </>
          ),
        },
        {
          h: '8. Your rights',
          b: (
            <>
              Under UK/EU GDPR you have the right to access, rectify, erase, restrict, and object
              to the processing of your personal data, and to data portability. As we hold only
              short-lived access logs and operate no user accounts, the data we hold about any
              individual is minimal. To exercise your rights, contact the LSHTM Data Protection
              Officer at <a href="mailto:dpo@lshtm.ac.uk" className="text-blue-600 hover:underline">dpo@lshtm.ac.uk</a>.
            </>
          ),
        },
        {
          h: '9. Data sources & licensing',
          b: (
            <>
              For details of the third-party data sources InfectoNET aggregates (NCBI, GISAID,
              Nextstrain, WHO, NOAA, etc.) and their licensing, see our
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
          Privacy questions: <a href="mailto:dpo@lshtm.ac.uk" className="text-blue-600 hover:underline">dpo@lshtm.ac.uk</a>
          {' '}· General: <a href="mailto:infectonet@gmail.com" className="text-blue-600 hover:underline">infectonet@gmail.com</a>
        </p>
        <p className="text-xs text-gray-400 mt-2">
          London School of Hygiene &amp; Tropical Medicine · Keppel Street · London WC1E 7HT · UK
        </p>
      </section>
    </div>
  );
}
