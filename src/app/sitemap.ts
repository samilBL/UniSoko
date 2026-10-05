import type { MetadataRoute } from 'next';
import { MOCK_PRODUCTS } from '@/lib/mockData';
import { SITE_URL } from '@/lib/seo';

export default function sitemap(): MetadataRoute.Sitemap {
  const publicRoutes = [
    '',
    '/sell-device',
    '/winga',
    '/winga/login',
    '/winga/register',
    '/winga/leaderboard',
    '/bundles',
    '/hostels',
    '/grad-clearance',
    '/developer',
    '/privacy-policy',
    '/refund-policy',
    '/terms-of-service',
  ];

  return [
    ...publicRoutes.map((route) => ({
      url: `${SITE_URL}${route}`,
      changeFrequency: route === '' ? 'daily' as const : 'monthly' as const,
      priority: route === '' ? 1 : 0.5,
    })),
    ...MOCK_PRODUCTS.filter((product) => product.stockStatus !== 'Coming Soon').map((product) => ({
      url: `${SITE_URL}/product/${encodeURIComponent(product.id)}`,
      changeFrequency: 'weekly' as const,
      priority: product.featured ? 0.8 : 0.6,
    })),
  ];
}
