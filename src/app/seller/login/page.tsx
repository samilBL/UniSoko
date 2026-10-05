'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { getSupabaseBrowser } from '@/lib/supabaseBrowser';

export default function SellerLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const normalizedEmail = email.trim().toLowerCase();
  const goToSeller = () => { router.replace('/seller/dashboard'); router.refresh(); };
  const signIn = async (event: FormEvent) => {
    event.preventDefault(); setBusy(true); setError(''); setNotice('');
    const auth = getSupabaseBrowser();
    if (!auth) { setError('Seller sign-in is unavailable. Contact UniSoko support.'); setBusy(false); return; }
    const { data, error: signInError } = await auth.auth.signInWithPassword({ email: normalizedEmail, password });
    if (signInError) setError(signInError.message.toLowerCase().includes('invalid login credentials') ? 'Email or password is incorrect.' : signInError.message);
    else if (data.session) goToSeller();
    setBusy(false);
  };
  const sendCode = async (event: FormEvent) => {
    event.preventDefault(); setBusy(true); setError(''); setNotice('');
    const auth = getSupabaseBrowser();
    if (!auth) { setError('Seller sign-in is unavailable. Contact UniSoko support.'); setBusy(false); return; }
    const { error: otpError } = await auth.auth.signInWithOtp({ email: normalizedEmail });
    if (otpError) setError('Could not send a code. Check the email address and retry.');
    else { setOtpSent(true); setNotice(`A verification code was sent to ${normalizedEmail}.`); }
    setBusy(false);
  };
  const verifyCode = async (event: FormEvent) => {
    event.preventDefault(); setBusy(true); setError('');
    const auth = getSupabaseBrowser();
    if (!auth) { setError('Seller sign-in is unavailable. Contact UniSoko support.'); setBusy(false); return; }
    const { data, error: verifyError } = await auth.auth.verifyOtp({ email: normalizedEmail, token: otp.trim(), type: 'email' });
    if (verifyError) setError('That code is invalid or expired.');
    else if (data.session) goToSeller();
    setBusy(false);
  };
  return <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-white"><Header/><main className="mx-auto max-w-lg px-4 py-12"><section className="rounded-3xl border bg-white p-7 shadow-xl dark:border-slate-800 dark:bg-slate-900"><p className="text-xs font-bold uppercase tracking-widest text-emerald-700">Seller portal</p><h1 className="mt-2 text-2xl font-black">Sign in to your shop</h1><p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Seller sign-in returns to seller applications and shop management. Winga accounts use the separate Winga portal.</p>{error && <p role="alert" className="mt-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}{notice && <p role="status" className="mt-4 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</p>}
    {!otpSent ? <><form onSubmit={signIn} className="mt-6 space-y-3"><label className="block text-xs font-bold">Seller email<input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 block min-h-11 w-full rounded-xl border px-3 text-sm dark:bg-slate-950"/></label><label className="block text-xs font-bold">Password<input type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 block min-h-11 w-full rounded-xl border px-3 text-sm dark:bg-slate-950"/></label><button disabled={busy} className="min-h-11 w-full rounded-xl bg-indigo-600 text-sm font-bold text-white disabled:opacity-50">{busy ? 'Signing in…' : 'Sign in to seller portal'}</button></form><form onSubmit={sendCode} className="mt-3"><input type="hidden" value={email}/><button disabled={busy || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)} className="min-h-11 w-full rounded-xl border px-3 text-sm font-bold disabled:opacity-50">Send email sign-in code</button></form></> : <form onSubmit={verifyCode} className="mt-6 space-y-3"><label className="block text-xs font-bold">Email verification code<input required inputMode="numeric" maxLength={8} autoComplete="one-time-code" value={otp} onChange={(e) => setOtp(e.target.value)} className="mt-1 block min-h-11 w-full rounded-xl border px-3 text-sm dark:bg-slate-950"/></label><button disabled={busy} className="min-h-11 w-full rounded-xl bg-indigo-600 text-sm font-bold text-white disabled:opacity-50">{busy ? 'Checking…' : 'Verify and open seller portal'}</button><button type="button" onClick={() => setOtpSent(false)} className="w-full text-xs font-semibold text-slate-500">Use a different email</button></form>}
    <p className="mt-6 text-center text-xs text-slate-500">Need to apply? <Link className="font-bold text-indigo-600" href="/seller/apply">Start a seller application</Link></p><p className="mt-2 text-center text-xs text-slate-500">Are you a Winga? <Link className="font-bold text-indigo-600" href="/winga/login">Open Winga sign-in</Link></p></section></main></div>;
}
