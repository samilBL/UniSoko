import type { Metadata } from 'next';
import WingaApplicationPage from '../page';
import { publicPageMetadata } from '@/lib/seo';

export const metadata: Metadata = publicPageMetadata('Join as Winga', 'Create a Winga account and submit your student ID for verification.', '/winga/register');

export default function WingaRegisterPage() {
  return <WingaApplicationPage />;
}
