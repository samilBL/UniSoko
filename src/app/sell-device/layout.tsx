import type { Metadata } from 'next';
import { publicPageMetadata } from '@/lib/seo';

export const metadata: Metadata = publicPageMetadata('Sell or Trade In a Device', 'Submit a used laptop, phone, or gadget to UniSoko for review and a direct offer.', '/sell-device');

export default function SellDeviceLayout({ children }: { children: React.ReactNode }) {
  return children;
}
