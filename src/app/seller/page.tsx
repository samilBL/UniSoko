import Link from 'next/link';
import Header from '@/components/Header';

export default function SellerLandingPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <Header />
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:py-16">
        <section className="overflow-hidden rounded-3xl bg-slate-950 px-6 py-10 text-white shadow-xl sm:px-10 sm:py-14">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-300">UniSoko Marketplace</p>
          <h1 className="mt-4 max-w-3xl text-3xl font-black tracking-tight sm:text-5xl">Build your student shop on campus.</h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">Apply through the seller portal. Our team reviews applications before activating a shop. Approved sellers can list products, offer Winga commissions, and open group buys from their dashboard.</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/seller/apply" className="inline-flex min-h-12 items-center justify-center rounded-xl bg-emerald-400 px-6 text-sm font-extrabold text-slate-950 transition hover:bg-emerald-300">Apply to become a seller</Link>
            <Link href="/seller/login" className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/20 px-6 text-sm font-bold text-white transition hover:bg-white/10">Seller sign in</Link>
            <Link href="/seller/dashboard" className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/20 px-6 text-sm font-bold text-white transition hover:bg-white/10">Open seller dashboard</Link>
          </div>
        </section>
        <section className="mt-8 grid gap-4 sm:grid-cols-3">
          {[['01', 'Use your account', 'Sign in with the same verified email account already used for UniSoko services.'], ['02', 'Apply for review', 'Tell us your seller name, university, campus, and how buyers can contact you.'], ['03', 'Manage your shop', 'Once approved, track your seller status and save private product drafts.']].map(([number, title, description]) => (
            <article key={number} className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
              <p className="text-xs font-black text-indigo-600">{number}</p><h2 className="mt-3 text-base font-bold">{title}</h2><p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{description}</p>
            </article>
          ))}
        </section>
        <p className="mt-6 text-xs leading-5 text-slate-500">No subscription payment is collected in this phase. Subscription and trial controls are planned for Phase 3.</p>
      </main>
    </div>
  );
}
