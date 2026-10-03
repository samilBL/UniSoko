import type { Metadata } from 'next';
import { privatePageMetadata } from '@/lib/seo';

export const metadata: Metadata = privatePageMetadata('Winga Dashboard');

export default function WingaDashboardLayout({ children }: { children: React.ReactNode }) {
  return children;
}
