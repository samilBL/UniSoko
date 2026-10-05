import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/seo';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/api', '/checkout', '/order', '/track', '/winga/dashboard', '/group-buy'],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
