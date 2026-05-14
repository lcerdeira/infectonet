import { useTranslations } from 'next-intl';
import { VirusGroupGrid } from '@/components/home/VirusGroupGrid';
import { HeroSection } from '@/components/home/HeroSection';
import { StatsBar } from '@/components/home/StatsBar';

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <StatsBar />
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <VirusGroupGrid />
      </section>
    </>
  );
}
