import type { Metadata } from 'next';

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://unisoko.co.tz').replace(/\/+$/, '');

export const NO_INDEX_METADATA: Metadata = {
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
};

export function publicPageMetadata(title: string, description: string, path: string): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: { type: 'website', siteName: 'UniSoko', locale: 'en_TZ', url: path, title, description },
    twitter: { card: 'summary', title, description },
  };
}

export function privatePageMetadata(title: string): Metadata {
  return { title, ...NO_INDEX_METADATA };
}
