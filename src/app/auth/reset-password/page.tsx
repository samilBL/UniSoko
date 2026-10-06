'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import { getSupabaseBrowser } from '@/lib/supabaseBrowser';

export default function RequestPasswordResetPage() {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(''); setMessage('');
    const supabase = getSupabaseBrowser();
    if (!supabase) { setError('Password recovery is not configured. Contact UniSoko support.'); setBusy(false); return; }
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), { redirectTo: `${window.location.origin}/auth/callback?next=/auth/update-password` });
    setBusy(false);
    if (resetError) setError('Could not send the password link. Please try again later.');
    else setMessage('If an account exists for this email, a password reset link has been sent. It contains a link, not a sign-in code.');
  }

  return <div className="min-h-screen bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-white"><Header/><main className="mx-auto max-w-lg px-4 py-12 sm:px-6"><section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900 sm:p-8"><p className="text-xs font-bold uppercase tracking-widest text-indigo-700 dark:text-indigo-300">Password recovery</p><h1 className="mt-2 text-2xl font-black">Set or reset your password</h1><p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">For an older OTP-created account, request a secure email link to set your password. Afterward, sign in with your email or saved phone number.</p><form onSubmit={submit} className="mt-6 space-y-4"><label className="block text-xs font-bold">Account email<input type="email" required autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-1.5 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-3.5 text-sm text-slate-950 outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/10 dark:border-slate-700 dark:bg-slate-950 dark:text-white"/></label>{error && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}{message && <p role="status" className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-900">{message}</p>}<button disabled={busy} className="min-h-12 w-full rounded-xl bg-indigo-700 px-4 text-sm font-bold text-white hover:bg-indigo-800 disabled:opacity-60">{busy ? 'Sending link…' : 'Email me a password link'}</button></form><p className="mt-5 text-center text-sm text-slate-600 dark:text-slate-300"><Link href="/winga/login" className="font-bold text-indigo-700 hover:underline dark:text-indigo-300">Winga sign in</Link><span className="mx-2">·</span><Link href="/seller/login" className="font-bold text-emerald-700 hover:underline dark:text-emerald-300">Seller sign in</Link></p></section></main></div>;
}
