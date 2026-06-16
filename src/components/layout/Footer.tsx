import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

export function Footer() {
  const t = useTranslations('footer');

  return (
    <footer className="border-t border-gray-200 bg-white py-10 mt-auto">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-start justify-between gap-8">
          {/* Brand */}
          <div>
            <img src="/infectonet-logo.png" alt="InfectoNET" className="h-8 w-auto" />
            <p className="mt-2 max-w-xs text-sm text-gray-500">{t('tagline')}</p>
            <p className="mt-3 text-xs text-gray-400">
              Powered by{' '}
              <a href="https://www.amrnet.org" className="underline hover:text-gray-600" target="_blank" rel="noopener noreferrer">
                AMRNET
              </a>
            </p>
          </div>

          {/* Links */}
          <div className="flex gap-16">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
                {t('links_title')}
              </h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><Link href="/" className="hover:text-blue-600">Home</Link></li>
                <li><Link href="/about" className="hover:text-blue-600">About</Link></li>
                <li><Link href="/reports" className="hover:text-blue-600">Reports</Link></li>
                <li><Link href="/documentation" className="hover:text-blue-600">Documentation</Link></li>
                <li>
                  <a href="https://infectonet.readthedocs.io" target="_blank" rel="noopener noreferrer"
                     className="hover:text-blue-600">Docs (ReadTheDocs) ↗</a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
                {t('legal_title')}
              </h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><Link href="/data-policy" className="hover:text-blue-600">Data Sources &amp; Policy</Link></li>
                <li><Link href="/privacy" className="hover:text-blue-600">Privacy Notice</Link></li>
                <li>
                  <a href="https://github.com/lcerdeira/infectonet" target="_blank" rel="noopener noreferrer"
                    className="hover:text-blue-600">Open Source (GitHub)</a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-gray-400">
            © {new Date().getFullYear()}{' '}InfectoNET · an independent open-science project
          </p>
          <p className="text-xs text-gray-400">
            Data sources: NCBI GenBank · GISAID · Nextstrain · WHO · PAHO · NOAA · CHIRPS · GFW ·{' '}
            <Link href="/data-policy" className="underline hover:text-gray-600">See full data policy</Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
