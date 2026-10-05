import type { Metadata } from 'next';
import WingaApplicationPage from '../page';
import { publicPageMetadata } from '@/lib/seo';

export const metadata: Metadata = publicPageMetadata('Join as Winga', 'Verify your email and apply to join UniSoko as a Campus Winga.', '/winga/register');

export default function WingaRegisterPage() {
  return <WingaApplicationPage />;
}
