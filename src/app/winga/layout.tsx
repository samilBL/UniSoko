import type { Metadata } from 'next';
import { publicPageMetadata } from '@/lib/seo';

export const metadata: Metadata = publicPageMetadata('Become Campus Winga', 'Apply to promote UniSoko products and support campus fulfillment across Tanzania.', '/winga');

export default function WingaLayout({ children }: { children: React.ReactNode }) {
  return children;
}
