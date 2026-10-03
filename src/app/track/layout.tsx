import type { Metadata } from 'next';
import { privatePageMetadata } from '@/lib/seo';

export const metadata: Metadata = privatePageMetadata('Order Tracking');

export default function TrackingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
