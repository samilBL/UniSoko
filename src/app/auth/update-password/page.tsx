'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import { getSupabaseBrowser } from '@/lib/supabaseBrowser';
import PasswordInput from '@/components/PasswordInput';

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState('');
  const [sessionReady, setSessionReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    void (async () => {
      const supabase = getSupabaseBrowser();
      if (!supabase) { if (active) setError('Password recovery is not configured.'); return; }
      try {
        const { data } = await supabase.auth.getUser();
        if (!active) return;
        if (data.user) setSessionReady(true);
        else setError('This password link is invalid or expired. Request a new link.');
      } catch { if (active) setError('Could not verify this password link. Request a new one.'); }
    })();
    return () => { active = false; };
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(''); setMessage('');
    const supabase = getSupabaseBrowser();
    if (!supabase) { setError('Password recovery is not configured.'); setBusy(false); return; }
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (updateError) setError(updateError.message);
    else setMessage('Password updated. You can now sign in using your email or phone and this password.');
  }

  return <div className="min-h-screen bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-white"><Header/><main className="mx-auto max-w-lg px-4 py-12 sm:px-6"><section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900 sm:p-8"><p className="text-xs font-bold uppercase tracking-widest text-indigo-700 dark:text-indigo-300">Secure account recovery</p><h1 className="mt-2 text-2xl font-black">Choose a new password</h1>{sessionReady && !message && <form onSubmit={submit} className="mt-6 space-y-4"><label className="block text-xs font-bold">New password<PasswordInput required minLength={8} maxLength={128} autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} className="min-h-12 w-full rounded-xl border border-slate-300 bg-white px-3.5 text-sm text-slate-950 outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/10 dark:border-slate-700 dark:bg-slate-950 dark:text-white"/></label><button disabled={busy} className="min-h-12 w-full rounded-xl bg-indigo-700 px-4 text-sm font-bold text-white hover:bg-indigo-800 disabled:opacity-60">{busy ? 'Saving…' : 'Update password'}</button></form>}{error && <p role="alert" className="mt-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}{message && <p role="status" className="mt-4 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-900">{message}</p>}<div className="mt-5 flex justify-center gap-4 text-sm font-bold"><Link href="/winga/login" className="text-indigo-700 hover:underline dark:text-indigo-300">Winga sign in</Link><Link href="/seller/login" className="text-emerald-700 hover:underline dark:text-emerald-300">Seller sign in</Link></div></section></main></div>;
}
