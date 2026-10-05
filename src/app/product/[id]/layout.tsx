import type { Metadata } from 'next';
import { MOCK_PRODUCTS } from '@/lib/mockData';
import { SITE_URL } from '@/lib/seo';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const product = MOCK_PRODUCTS.find((item) => item.id === id);
  if (!product) {
    return { title: 'Product unavailable', robots: { index: false, follow: false } };
  }

  const path = `/product/${encodeURIComponent(product.id)}`;
  return {
    title: product.title,
    description: product.description.slice(0, 160),
    alternates: { canonical: path },
    openGraph: {
      type: 'website',
      siteName: 'UniSoko',
      title: product.title,
      description: product.description.slice(0, 160),
      url: path,
      images: product.images[0] ? [{ url: product.images[0], alt: product.title }] : undefined,
    },
    twitter: { card: 'summary_large_image', title: product.title, description: product.description.slice(0, 160) },
    robots: product.stockStatus === 'Coming Soon' ? { index: false, follow: true } : { index: true, follow: true },
  };
}

export default async function ProductLayout({ children, params }: { children: React.ReactNode; params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = MOCK_PRODUCTS.find((item) => item.id === id);
  if (!product) return children;

  const productStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title,
    description: product.description,
    sku: product.id,
    image: product.images,
    category: product.category,
    offers: {
      '@type': 'Offer',
      url: `${SITE_URL}/product/${encodeURIComponent(product.id)}`,
      priceCurrency: 'TZS',
      price: product.priceRetail,
      availability: product.stockStatus === 'Coming Soon' ? 'https://schema.org/OutOfStock' : 'https://schema.org/InStock',
      seller: { '@type': 'Organization', name: 'UniSoko' },
    },
  };

  return <>{children}<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productStructuredData).replace(/</g, '\\u003c') }} /></>;
}
