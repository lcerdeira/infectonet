'use client';

import { useTranslations, useLocale } from 'next-intl';
import { Link, usePathname, useRouter } from '@/i18n/navigation';
import { useState, useEffect, useRef } from 'react';
import { Menu, X, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';
import { routing, type Locale } from '@/i18n/routing';

const LANG_LABELS: Record<string, string> = {
  'en':    'EN',
  'pt-BR': 'PT-BR',
  'fr':    'FR',
  'es':    'ES',
};

export function Header() {
  const t = useTranslations('nav');
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setLangOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const switchLocale = (loc: Locale) => {
    setLangOpen(false);
    router.replace(pathname, { locale: loc });
  };

  const navLinks = [
    { href: '/',              label: t('home') },
    { href: '/viruses',       label: 'Pathogens' },
    { href: '/about',         label: t('about') },
    { href: '/documentation', label: t('documentation') },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center shrink-0">
          <img
            src="/infectonet-logo.png"
            alt="InfectoNET"
            className="h-9 w-auto"
          />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-700">
          {navLinks.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'transition-colors hover:text-blue-600',
                pathname === link.href && 'text-blue-600 font-semibold'
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {/* Language switcher */}
          <div className="relative" ref={langRef}>
            <button
              onClick={() => setLangOpen(v => !v)}
              className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
              aria-label="Switch language"
            >
              <Globe className="h-4 w-4" />
              <span>{LANG_LABELS[locale]}</span>
            </button>
            {langOpen && (
              <div className="absolute right-0 mt-2 w-32 rounded-xl border border-gray-200 bg-white shadow-xl py-1 z-50">
                {routing.locales.map(loc => (
                  <button
                    key={loc}
                    onClick={() => switchLocale(loc)}
                    className={cn(
                      'w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors',
                      loc === locale
                        ? 'font-semibold text-blue-600 bg-blue-50'
                        : 'text-gray-700'
                    )}
                  >
                    {LANG_LABELS[loc]}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden rounded-md p-1 text-gray-600 hover:bg-gray-100"
            onClick={() => setMenuOpen(v => !v)}
            aria-label="Toggle menu"
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <nav className="md:hidden border-t border-gray-100 bg-white px-4 py-3 flex flex-col gap-3">
          {navLinks.map(link => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="text-sm font-medium text-gray-700 hover:text-blue-600"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
