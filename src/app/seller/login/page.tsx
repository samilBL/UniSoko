'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, Store } from 'lucide-react';
import Header from '@/components/Header';

const fieldClass = 'mt-1.5 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-3.5 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10 dark:border-slate-700 dark:bg-slate-950 dark:text-white';

export default function SellerLoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError('');
    try {
      const response = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ identifier, password, portal: 'seller' }) });
      const result = await response.json() as { error?: string; roles?: { seller?: string | null } };
      if (!response.ok) throw new Error(result.error || 'Could not sign in.');
      if (!result.roles?.seller) throw new Error('This account does not have a seller application. Start one to join the marketplace.');
      router.replace('/seller/dashboard'); router.refresh();
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not sign in.'); }
    finally { setBusy(false); }
  }

  return <div className="min-h-screen bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-white"><Header/><main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-16"><div className="mx-auto grid max-w-4xl overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-2xl shadow-slate-900/10 dark:border-slate-800 dark:bg-slate-900 md:grid-cols-[0.9fr_1.1fr]"><aside className="bg-emerald-950 p-7 text-white sm:p-10"><Store className="h-8 w-8 text-emerald-300"/><p className="mt-6 text-xs font-bold uppercase tracking-widest text-emerald-200">UniSoko seller portal</p><h1 className="mt-2 text-3xl font-black">Manage your student-facing shop.</h1><p className="mt-3 text-sm leading-6 text-emerald-50/85">Sign in with your email or phone and password. Seller product tools activate after your application is approved.</p></aside><section className="p-6 sm:p-10"><p className="text-xs font-bold uppercase tracking-widest text-emerald-700 dark:text-emerald-300">Seller portal</p><h2 className="mt-2 text-2xl font-black">Welcome back</h2><form onSubmit={submit} className="mt-6 space-y-4"><label className="block text-xs font-bold">Email or phone number<input className={fieldClass} required autoComplete="username" value={identifier} onChange={(e) => setIdentifier(e.target.value)} placeholder="name@example.com or 0712 345 678"/></label><label className="block text-xs font-bold">Password<input className={fieldClass} type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)}/></label>{error && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{error}{error.includes('does not have') && <Link className="ml-1 font-bold underline" href="/seller/apply">Create an account</Link>}</p>}<button disabled={busy} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 text-sm font-bold text-white hover:bg-emerald-800 disabled:opacity-60">{busy ? 'Signing in…' : 'Sign in to seller portal'}<ArrowRight className="h-4 w-4"/></button></form><p className="mt-3 text-center text-xs"><Link href="/auth/reset-password" className="font-semibold text-emerald-700 underline dark:text-emerald-300">Forgot or need to set your password?</Link></p><p className="mt-5 text-center text-sm text-slate-600 dark:text-slate-300">New seller? <Link href="/seller/apply" className="font-bold text-emerald-700 hover:underline dark:text-emerald-300">Create an account & apply</Link></p><p className="mt-3 text-center text-xs text-slate-500">Winga accounts use the <Link href="/winga/login" className="font-semibold text-slate-700 underline dark:text-slate-200">Winga portal</Link>.</p></section></div></main></div>;
}
