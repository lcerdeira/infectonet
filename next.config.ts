import createNextIntlPlugin from 'next-intl/plugin';
import type { NextConfig } from 'next';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = {
  // Optimise images from external sources if needed
  images: {
    remotePatterns: [],
  },
};

export default withNextIntl(nextConfig);
