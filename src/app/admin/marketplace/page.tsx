import Header from '@/components/Header';
import AdminMarketplaceControlCenter from '@/components/AdminMarketplaceControlCenter';

export const dynamic = 'force-dynamic';

export default function AdminMarketplacePage() {
  return <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100"><Header /><AdminMarketplaceControlCenter /></div>;
}
