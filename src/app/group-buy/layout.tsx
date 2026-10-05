import type { Metadata } from 'next';
import { privatePageMetadata } from '@/lib/seo';

export const metadata: Metadata = privatePageMetadata('Group Buy');

export default function GroupBuyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
