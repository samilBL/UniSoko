'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, CheckCircle2, GraduationCap, ShieldCheck } from 'lucide-react';
import Header from '@/components/Header';
import CartDrawer from '@/components/CartDrawer';
import PasswordInput from '@/components/PasswordInput';
import { ALL_UNIVERSITIES, OTHER_TANZANIA_UNIVERSITY } from '@/lib/mockData';

const fieldClass = 'mt-1.5 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-3.5 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/10 dark:border-slate-700 dark:bg-slate-950 dark:text-white';

export default function WingaLandingPage() {
  const router = useRouter();
  const [form, setForm] = useState({ fullName: '', email: '', phone: '', password: '', university: ALL_UNIVERSITIES[0]?.name || '', otherUniversity: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountType: 'winga',
          fullName: form.fullName,
          email: form.email,
          phone: form.phone,
          password: form.password,
          university: form.university === OTHER_TANZANIA_UNIVERSITY.name ? form.otherUniversity : form.university,
        }),
      });
      const result = await response.json() as { error?: string; destination?: string; needsLogin?: boolean };
      if (!response.ok) throw new Error(result.error || 'Could not create your Winga account.');
      if (result.needsLogin) { router.replace('/winga/login?application=pending'); return; }
      router.replace(result.destination || '/winga/dashboard');
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not create your Winga account.');
    } finally {
      setBusy(false);
    }
  }

  return <div className="min-h-screen bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-white"><Header/><main className="mx-auto grid max-w-6xl gap-8 px-4 py-8 sm:px-6 sm:py-12 lg:grid-cols-[0.92fr_1.08fr] lg:items-center lg:gap-14">
    <section className="rounded-[2rem] bg-slate-950 p-7 text-white shadow-2xl sm:p-10"><span className="inline-flex items-center gap-2 rounded-full border border-emerald-300/30 bg-emerald-300/10 px-3 py-1.5 text-xs font-bold text-emerald-200"><ShieldCheck className="h-4 w-4"/>Campus Winga</span><h1 className="mt-6 text-3xl font-black leading-tight sm:text-5xl">Turn your campus network into opportunity.</h1><p className="mt-4 max-w-lg text-sm leading-6 text-slate-300">Create one account, apply once, and track approval here. UniSoko reviews every application before enabling Winga tools and commissions.</p><div className="mt-8 space-y-4 text-sm text-slate-200"><p className="flex items-center gap-3"><CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-300"/>Sign in later with email or phone and your password.</p><p className="flex items-center gap-3"><CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-300"/>No email or SMS code during signup.</p><p className="flex items-center gap-3"><CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-300"/>Your dashboard unlocks when your application is approved.</p></div></section>
    <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-xl shadow-slate-900/5 dark:border-slate-800 dark:bg-slate-900 sm:p-8"><div className="mb-6"><p className="text-xs font-bold uppercase tracking-widest text-indigo-700 dark:text-indigo-300">Winga account</p><h2 className="mt-2 text-2xl font-black">Create your account</h2><p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Use the name shown on your student ID. Your application will be sent for admin review.</p></div><form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
      <label className="text-xs font-bold sm:col-span-2">Full name as shown on student ID<input className={fieldClass} required minLength={2} maxLength={120} autoComplete="name" value={form.fullName} onChange={(e) => setForm({...form, fullName:e.target.value})} placeholder="Your official student name"/></label>
      <label className="text-xs font-bold">Email address<input className={fieldClass} type="email" required autoComplete="email" value={form.email} onChange={(e) => setForm({...form, email:e.target.value})} placeholder="you@example.com"/></label>
      <label className="text-xs font-bold">Phone number<input className={fieldClass} type="tel" required autoComplete="tel" value={form.phone} onChange={(e) => setForm({...form, phone:e.target.value})} placeholder="0712 345 678"/></label>
      <label className="text-xs font-bold sm:col-span-2"><span className="inline-flex items-center gap-1.5"><GraduationCap className="h-4 w-4"/>University or campus</span><select className={fieldClass} required value={form.university} onChange={(e) => setForm({...form, university:e.target.value})}>{ALL_UNIVERSITIES.map((item) => <option key={item.id} value={item.name}>{item.name}</option>)}</select></label>
      {form.university === OTHER_TANZANIA_UNIVERSITY.name && <label className="text-xs font-bold sm:col-span-2">University name<input className={fieldClass} required maxLength={160} value={form.otherUniversity} onChange={(e) => setForm({...form, otherUniversity:e.target.value})}/></label>}
      <label className="text-xs font-bold sm:col-span-2">Password<PasswordInput className={fieldClass.replace('mt-1.5 ', '')} required minLength={8} maxLength={128} autoComplete="new-password" value={form.password} onChange={(e) => setForm({...form, password:e.target.value})} placeholder="At least 8 characters"/><span className="mt-1 block font-normal text-slate-500">Use this password with your email or phone when you sign in.</span></label>
      {error && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800 sm:col-span-2">{error}</p>}
      <button disabled={busy} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-indigo-700 px-5 text-sm font-bold text-white transition hover:bg-indigo-800 disabled:opacity-60 sm:col-span-2">{busy ? 'Creating your account…' : 'Create account & submit application'}<ArrowRight className="h-4 w-4"/></button>
    </form><p className="mt-5 text-center text-sm text-slate-600 dark:text-slate-300">Already registered? <Link className="font-bold text-indigo-700 hover:underline dark:text-indigo-300" href="/winga/login">Sign in</Link></p></section>
  </main><CartDrawer/></div>;
}
