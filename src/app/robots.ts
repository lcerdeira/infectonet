import type { MetadataRoute } from 'next';

const SITE_URL = 'https://infectonet.org';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // Don't waste crawl budget on API JSON endpoints
        disallow: ['/api/'],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
