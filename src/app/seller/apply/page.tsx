'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, CheckCircle2, Store } from 'lucide-react';
import Header from '@/components/Header';
import PasswordInput from '@/components/PasswordInput';

const fieldClass = 'mt-1.5 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-3.5 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10 dark:border-slate-700 dark:bg-slate-950 dark:text-white';

export default function SellerApplyPage() {
  const router = useRouter();
  const [form, setForm] = useState({ fullName: '', email: '', phone: '', password: '', displayName: '', university: '', campus: '', description: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError('');
    try {
      const response = await fetch('/api/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, accountType: 'seller' }) });
      const result = await response.json() as { error?: string; destination?: string; needsLogin?: boolean };
      if (!response.ok) throw new Error(result.error || 'Could not create your seller account.');
      if (result.needsLogin) { router.replace('/seller/login?application=pending'); return; }
      router.replace(result.destination || '/seller/dashboard'); router.refresh();
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not create your seller account.'); }
    finally { setBusy(false); }
  }

  return <div className="min-h-screen bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-white"><Header/><main className="mx-auto grid max-w-6xl gap-8 px-4 py-8 sm:px-6 sm:py-12 lg:grid-cols-[0.92fr_1.08fr] lg:items-center lg:gap-14"><section className="rounded-[2rem] bg-emerald-950 p-7 text-white shadow-2xl sm:p-10"><span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-300/15 text-emerald-200"><Store className="h-6 w-6"/></span><p className="mt-6 text-xs font-bold uppercase tracking-widest text-emerald-200">UniSoko seller network</p><h1 className="mt-2 text-3xl font-black leading-tight sm:text-5xl">Build your shop where students already buy.</h1><p className="mt-4 text-sm leading-6 text-emerald-50/85">Create a standard account and send your shop application for review. Your seller tools and product listings unlock when an admin approves your application.</p><div className="mt-8 space-y-3 text-sm text-emerald-50"><p className="flex items-center gap-3"><CheckCircle2 className="h-5 w-5 text-emerald-300"/>One password for sign-in by email or phone.</p><p className="flex items-center gap-3"><CheckCircle2 className="h-5 w-5 text-emerald-300"/>No email verification code or SMS code.</p><p className="flex items-center gap-3"><CheckCircle2 className="h-5 w-5 text-emerald-300"/>Admin review before seller features are enabled.</p></div></section>
    <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-xl shadow-slate-900/5 dark:border-slate-800 dark:bg-slate-900 sm:p-8"><p className="text-xs font-bold uppercase tracking-widest text-emerald-700 dark:text-emerald-300">Seller account</p><h2 className="mt-2 text-2xl font-black">Create account & apply</h2><p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Your contact information stays with your account. The shop name and university are part of your application.</p><form onSubmit={submit} className="mt-6 grid gap-4 sm:grid-cols-2">
      <label className="text-xs font-bold sm:col-span-2">Full name<input className={fieldClass} required minLength={2} maxLength={120} autoComplete="name" value={form.fullName} onChange={(e) => setForm({...form, fullName:e.target.value})}/></label>
      <label className="text-xs font-bold">Email address<input className={fieldClass} type="email" required autoComplete="email" value={form.email} onChange={(e) => setForm({...form, email:e.target.value})} placeholder="you@example.com"/></label>
      <label className="text-xs font-bold">Phone number<input className={fieldClass} type="tel" required autoComplete="tel" value={form.phone} onChange={(e) => setForm({...form, phone:e.target.value})} placeholder="0712 345 678"/></label>
      <label className="text-xs font-bold">Shop name<input className={fieldClass} required minLength={2} maxLength={120} autoComplete="organization" value={form.displayName} onChange={(e) => setForm({...form, displayName:e.target.value})}/></label>
      <label className="text-xs font-bold">University<input className={fieldClass} required minLength={2} maxLength={160} value={form.university} onChange={(e) => setForm({...form, university:e.target.value})} placeholder="Your university"/></label>
      <label className="text-xs font-bold">Campus (optional)<input className={fieldClass} maxLength={160} value={form.campus} onChange={(e) => setForm({...form, campus:e.target.value})}/></label>
      <label className="text-xs font-bold">Password<PasswordInput className={fieldClass.replace('mt-1.5 ', '')} required minLength={8} maxLength={128} autoComplete="new-password" value={form.password} onChange={(e) => setForm({...form, password:e.target.value})} placeholder="At least 8 characters"/></label>
      <label className="text-xs font-bold sm:col-span-2">What will you sell? (optional)<textarea className={`${fieldClass} min-h-24 resize-y py-3`} maxLength={2000} value={form.description} onChange={(e) => setForm({...form, description:e.target.value})} placeholder="Tell students and reviewers about your shop."/></label>
      {error && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800 sm:col-span-2">{error}</p>}
      <button disabled={busy} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 text-sm font-bold text-white transition hover:bg-emerald-800 disabled:opacity-60 sm:col-span-2">{busy ? 'Creating account…' : 'Create account & submit shop application'}<ArrowRight className="h-4 w-4"/></button>
    </form><p className="mt-5 text-center text-sm text-slate-600 dark:text-slate-300">Already have a seller account? <Link href="/seller/login" className="font-bold text-emerald-700 hover:underline dark:text-emerald-300">Sign in</Link></p></section>
  </main></div>;
}
