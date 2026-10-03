import type { Metadata } from 'next';
import { publicPageMetadata } from '@/lib/seo';

export const metadata: Metadata = publicPageMetadata('Terms of Service', 'Read the terms for shopping with UniSoko and using its campus services.', '/terms-of-service');

export default function TermsOfServiceLayout({ children }: { children: React.ReactNode }) {
  return children;
}
