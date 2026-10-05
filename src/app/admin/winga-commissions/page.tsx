import Header from '@/components/Header';
import AdminWingaCommissions from '@/components/AdminWingaCommissions';

export const dynamic = 'force-dynamic';

export default function AdminWingaCommissionsPage() {
  return <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100"><Header/><AdminWingaCommissions/></div>;
}
