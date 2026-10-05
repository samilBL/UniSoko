import Header from '@/components/Header';
import AdminSellerApplications from '@/components/AdminSellerApplications';

export const dynamic = 'force-dynamic';

export default function AdminSellersPage() {
  return <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100"><Header /><AdminSellerApplications /></div>;
}
