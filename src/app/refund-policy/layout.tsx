import type { Metadata } from 'next';
import { publicPageMetadata } from '@/lib/seo';

export const metadata: Metadata = publicPageMetadata('Refund and Warranty Policy', 'Review UniSoko return, refund, and warranty terms for customer purchases.', '/refund-policy');

export default function RefundPolicyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
