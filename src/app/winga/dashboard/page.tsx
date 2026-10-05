import Link from 'next/link';
import { redirect } from 'next/navigation';
import { CheckCircle2, Clock3, ShieldCheck, XCircle } from 'lucide-react';
import Header from '@/components/Header';
import AccountSignOutButton from '@/components/AccountSignOutButton';
import WingaPasswordManager from '@/components/WingaPasswordManager';
import WingaMarketplaceEarnings from '@/components/WingaMarketplaceEarnings';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { getSupabaseServer } from '@/lib/supabaseServer';

export const dynamic = 'force-dynamic';

export default async function WingaAgentDashboardPage() {
  const authClient = await getSupabaseServer();
  const serviceClient = getSupabaseAdmin();
  if (!authClient || !serviceClient) {
    return <StatusPage title="Winga portal unavailable" message="Supabase Auth and application storage must be configured to access this portal." />;
  }

  const { data: { user }, error: authError } = await authClient.auth.getUser();
  if (authError || !user) redirect('/winga?auth=required');

  const { data: application, error } = await serviceClient
    .from('winga_applications')
    .select('email, full_name, phone, university, status, promo_code, submitted_at, reviewed_at')
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) {
    return <StatusPage title="Could not load your profile" message="Please try again later or contact UniSoko support." />;
  }
  if (!application) redirect('/winga?apply=1');

  const formattedSubmitted = new Date(application.submitted_at).toLocaleDateString('en-TZ', { dateStyle: 'medium' });
  const isApproved = application.status === 'Approved';
  const isRejected = application.status === 'Rejected';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <Header />
      <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
        <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-indigo-600">UniSoko Winga</p>
            <h1 className="mt-1 text-2xl font-extrabold text-slate-900 dark:text-white">Agent portal</h1>
          </div>
          <AccountSignOutButton returnTo="/winga/login" />
        </div>

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8">
          <div className="flex items-start gap-4">
            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${isApproved ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' : isRejected ? 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300' : 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300'}`}>
              {isApproved ? <ShieldCheck className="h-6 w-6" /> : isRejected ? <XCircle className="h-6 w-6" /> : <Clock3 className="h-6 w-6" />}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">{application.full_name}</h2>
                <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${isApproved ? 'bg-emerald-100 text-emerald-800' : isRejected ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-900'}`}>{application.status}</span>
              </div>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{application.university}</p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Verified email: {application.email}</p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Mobile-money contact (not verified): {application.phone}</p>
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Applied {formattedSubmitted}</p>
            </div>
          </div>

          {isApproved ? (
            <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-5 dark:border-emerald-900 dark:bg-emerald-950/40">
              <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-emerald-800 dark:text-emerald-200"><CheckCircle2 className="h-4 w-4" />UniSoko promo code</p>
              <p className="mt-2 font-mono text-2xl font-extrabold text-slate-900 dark:text-white">{application.promo_code}</p>
              <a className="mt-4 inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-emerald-700" href={`https://wa.me/?text=${encodeURIComponent(`Shop official UniSoko student deals. Use my Winga code ${application.promo_code}: https://unisoko.tz/?ref=${application.promo_code}`)}`} target="_blank" rel="noreferrer">Share UniSoko offer</a>
            </div>
          ) : isRejected ? (
            <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
              This application was not approved. Contact UniSoko support if you believe this decision needs review.
            </div>
          ) : (
            <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
              UniSoko is reviewing your application. Your agent access and promo code will appear here after approval.
            </div>
          )}

          <WingaPasswordManager />
        </section>

        {isApproved && <WingaMarketplaceEarnings />}

        <p className="mt-5 text-xs leading-5 text-slate-500 dark:text-slate-400">Your Winga portal is separate from seller accounts. Commission balances reflect orders marked payment verified and delivered; money transfers are still processed by UniSoko outside this portal.</p>
        <Link href="/" className="mt-5 inline-block text-sm font-semibold text-indigo-600 hover:text-indigo-800">Return to UniSoko</Link>
      </main>
    </div>
  );
}

function StatusPage({ title, message }: { title: string; message: string }) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <Header />
      <main className="mx-auto max-w-xl px-4 py-12 sm:px-6">
        <section className="rounded-2xl border border-slate-200 bg-white p-7 text-center dark:border-slate-800 dark:bg-slate-900">
          <h1 className="text-lg font-bold text-slate-900 dark:text-white">{title}</h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{message}</p>
          <Link href="/winga" className="mt-5 inline-block text-sm font-semibold text-indigo-600 hover:underline">Winga application</Link>
        </section>
      </main>
    </div>
  );
}
