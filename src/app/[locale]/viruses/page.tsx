import type { Metadata } from 'next';
import { VirusBrowser } from '@/components/home/VirusBrowser';

export const metadata: Metadata = {
  title: 'Pathogens',
  description: 'Browse all pathogens tracked by InfectoNET genomic surveillance.',
};

export default function VirusesPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 mb-2">
        Pathogen Database
      </h1>
      <p className="text-gray-500 mb-8">
        Browse and search all pathogens in the InfectoNET surveillance network.
      </p>
      <VirusBrowser />
    </div>
  );
}
