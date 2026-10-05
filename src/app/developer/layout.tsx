import type { Metadata } from 'next';
import { publicPageMetadata } from '@/lib/seo';

export const metadata: Metadata = publicPageMetadata('Developer', 'Meet the creator of UniSoko and contact the official developer.', '/developer');

export default function DeveloperLayout({ children }: { children: React.ReactNode }) {
  return children;
}
