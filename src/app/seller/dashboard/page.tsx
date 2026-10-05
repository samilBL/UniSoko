import { redirect } from 'next/navigation';
import Header from '@/components/Header';
import SellerDashboard from '@/components/SellerDashboard';
import { getSellerProfile } from '@/lib/sellerAuth';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { getSupabaseServer } from '@/lib/supabaseServer';

export const dynamic = 'force-dynamic';

export default async function SellerDashboardPage() {
  const authClient = await getSupabaseServer();
  if (!authClient) return <Unavailable />;
  const { data: { user }, error } = await authClient.auth.getUser();
  if (error || !user || !user.email_confirmed_at) redirect('/seller/login');
  const serviceClient = getSupabaseAdmin();
  if (!serviceClient) return <Unavailable />;
  const { data: profile, error: profileError } = await getSellerProfile(serviceClient, user.id);
  if (profileError) return <Unavailable />;
  if (!profile) redirect('/seller/apply');

  return <><Header /><SellerDashboard email={user.email || ''} initialProfile={profile} /></>;
}

function Unavailable() {
  return <div className="min-h-screen bg-slate-50 dark:bg-slate-950"><Header /><main className="mx-auto max-w-xl px-4 py-12"><section className="rounded-2xl border border-amber-200 bg-white p-6 dark:border-amber-900 dark:bg-slate-900"><h1 className="text-lg font-bold">Seller dashboard unavailable</h1><p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Seller storage is not configured. Apply the Phase 1 and Phase 2 Supabase migrations, then try again.</p></section></main></div>;
}
