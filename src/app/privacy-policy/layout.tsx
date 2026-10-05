import type { Metadata } from 'next';
import { publicPageMetadata } from '@/lib/seo';

export const metadata: Metadata = publicPageMetadata('Privacy Policy', 'Learn how UniSoko handles customer, order, and Winga information.', '/privacy-policy');

export default function PrivacyPolicyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
