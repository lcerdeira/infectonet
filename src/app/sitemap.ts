import type { MetadataRoute } from 'next';
import { VIRUSES } from '@/lib/viruses';

const SITE_URL = 'https://infectonet.org';
const LOCALE = 'en';

/**
 * Dynamic sitemap — lists the home page, static pages, and every virus
 * dashboard so Google can discover and index all 50+ pathogen pages.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    { url: SITE_URL,                          changeFrequency: 'daily',   priority: 1.0, lastModified: now },
    { url: `${SITE_URL}/${LOCALE}`,            changeFrequency: 'daily',   priority: 1.0, lastModified: now },
    { url: `${SITE_URL}/${LOCALE}/viruses`,    changeFrequency: 'weekly',  priority: 0.9, lastModified: now },
    { url: `${SITE_URL}/${LOCALE}/about`,      changeFrequency: 'monthly', priority: 0.6, lastModified: now },
    { url: `${SITE_URL}/${LOCALE}/documentation`, changeFrequency: 'monthly', priority: 0.7, lastModified: now },
    { url: `${SITE_URL}/${LOCALE}/data-policy`, changeFrequency: 'monthly', priority: 0.5, lastModified: now },
  ];

  const virusPages: MetadataRoute.Sitemap = VIRUSES.map(v => ({
    url: `${SITE_URL}/${LOCALE}/dashboard/${v.id}`,
    changeFrequency: 'daily' as const,
    priority: 0.8,
    lastModified: now,
  }));

  return [...staticPages, ...virusPages];
}
