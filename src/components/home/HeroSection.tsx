'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { ArrowRight, FlaskConical } from 'lucide-react';

export function HeroSection() {
  const t = useTranslations('home');

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 text-white">
      {/* Decorative grid */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.6) 1px, transparent 0)',
          backgroundSize: '32px 32px',
        }}
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24 md:py-32">
        <div className="max-w-3xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-sm font-medium backdrop-blur-sm">
            <FlaskConical className="h-4 w-4" />
            <span>Open-access · FAIR principles · 28 viruses</span>
          </div>

          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight">
            {t('hero_title')}
          </h1>

          <p className="mt-6 max-w-2xl text-lg md:text-xl text-blue-100 leading-relaxed">
            {t('hero_subtitle')}
          </p>

          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              href="/#groups"
              className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-blue-700 shadow-sm hover:bg-blue-50 transition-colors"
            >
              {t('explore_button')}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/about"
              className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-6 py-3 text-sm font-semibold text-white hover:bg-white/20 transition-colors backdrop-blur-sm"
            >
              {t('about_button')}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
