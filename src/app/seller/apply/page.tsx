'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { type FormEvent, useEffect, useState } from 'react';
import { ArrowRight, Building2, CheckCircle2, Clock3, Store } from 'lucide-react';
import Header from '@/components/Header';

type SellerApplication = { id: string; status: string; review_notes: string; submitted_at: string };
type SellerProfile = { display_name: string; university: string; campus: string | null; description: string; status: string };

export default function SellerApplyPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [profile, setProfile] = useState<SellerProfile | null>(null);
  const [application, setApplication] = useState<SellerApplication | null>(null);
  const [form, setForm] = useState({ displayName: '', university: '', campus: '', phone: '', description: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [complete, setComplete] = useState(false);

  useEffect(() => {
    let active = true;
    fetch('/api/seller/profile', { cache: 'no-store' }).then(async (response) => {
      const result = await response.json() as { email?: string; profile?: SellerProfile | null; application?: SellerApplication | null; error?: string };
      if (!active) return;
      if (response.status === 401) {
        setLoading(false);
        return;
      }
      if (!response.ok) throw new Error(result.error || 'Could not load seller application status.');
      const currentProfile = result.profile || null;
      const currentApplication = result.application || null;
      setEmail(result.email || '');
      setProfile(currentProfile);
      setApplication(currentApplication);
      if (currentProfile) {
        setForm((current) => ({ ...current, displayName: currentProfile.display_name, university: currentProfile.university, campus: currentProfile.campus || '', description: currentProfile.description || '' }));
      }
      if (currentProfile?.status === 'approved') router.replace('/seller/dashboard');
      setLoading(false);
    }).catch((err: unknown) => {
      if (active) {
        setError(err instanceof Error ? err.message : 'Could not load seller application status.');
        setLoading(false);
      }
    });
    return () => { active = false; };
  }, [router]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      const response = await fetch('/api/seller/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) {
        if (response.status === 401) throw new Error('Sign in and verify your email first. Your form details will stay in this page while you return.');
        throw new Error(result.error || 'Could not submit your application.');
      }
      setComplete(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not submit your application.');
    } finally {
      setSaving(false);
    }
  };

  const inputClass = 'mt-1.5 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white';
  const applicationPending = profile?.status === 'pending' && application?.status === 'pending';
  const rejected = profile?.status === 'rejected' || application?.status === 'rejected';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <Header />
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
        <Link href="/seller" className="text-xs font-bold text-indigo-600 hover:underline">← Seller information</Link>
        <section className="mt-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8">
          <div className="flex items-start gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"><Store className="h-6 w-6" /></span>
            <div><p className="text-xs font-bold uppercase tracking-wide text-emerald-700">Seller application</p><h1 className="mt-1 text-2xl font-black">Tell us about your shop</h1><p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">Use your existing verified UniSoko account. You won’t need another password or account.</p></div>
          </div>

          {loading ? <p className="mt-8 text-sm text-slate-500" role="status">Checking your account…</p> : !email ? (
            <div className="mt-8 rounded-2xl border border-indigo-200 bg-indigo-50 p-5 dark:border-indigo-900 dark:bg-indigo-950/40">
              <h2 className="font-bold">Sign in to apply</h2><p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Use the seller portal to verify your email and submit your shop application.</p>
              <Link href="/seller/login" className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-bold text-white hover:bg-indigo-700">Sign in to seller portal<ArrowRight className="h-4 w-4" /></Link>
            </div>
          ) : applicationPending ? (
            <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-5 dark:border-amber-900 dark:bg-amber-950/40">
              <div className="flex items-center gap-2 font-bold text-amber-900 dark:text-amber-200"><Clock3 className="h-5 w-5" />Application under review</div><p className="mt-2 text-sm leading-6 text-amber-900/80 dark:text-amber-100/80">We received your application on {new Date(application.submitted_at).toLocaleDateString('en-TZ', { dateStyle: 'medium' })}. You can check its status in your seller dashboard.</p><Link href="/seller/dashboard" className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl border border-amber-300 px-4 text-sm font-bold text-amber-950 dark:text-amber-100">Open dashboard<ArrowRight className="h-4 w-4" /></Link>
            </div>
          ) : complete ? (
            <div className="mt-8 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 dark:border-emerald-900 dark:bg-emerald-950/40">
              <p className="flex items-center gap-2 font-bold text-emerald-900 dark:text-emerald-200"><CheckCircle2 className="h-5 w-5" />Application submitted</p><p className="mt-2 text-sm text-emerald-900/80 dark:text-emerald-100/80">We’ll review your seller application. No subscription payment is required in this phase.</p><Link href="/seller/dashboard" className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl bg-emerald-700 px-4 text-sm font-bold text-white hover:bg-emerald-800">View application status<ArrowRight className="h-4 w-4" /></Link>
            </div>
          ) : (
            <form onSubmit={submit} className="mt-8 space-y-5">
              <p className="rounded-xl bg-slate-50 px-4 py-3 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300">Signed in as <span className="font-bold">{email}</span></p>
              {rejected && <p className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200">Your previous application wasn’t approved. Update your details and submit again.{application?.review_notes && <span className="mt-2 block">Review note: {application.review_notes}</span>}</p>}
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="text-xs font-bold">Seller or shop name<input className={inputClass} required minLength={2} maxLength={120} value={form.displayName} onChange={(event) => setForm({ ...form, displayName: event.target.value })} autoComplete="organization" /></label>
                <label className="text-xs font-bold"><span className="inline-flex items-center gap-1"><Building2 className="h-3.5 w-3.5" />University</span><input className={inputClass} required minLength={2} maxLength={160} value={form.university} onChange={(event) => setForm({ ...form, university: event.target.value })} placeholder="Your university" autoComplete="organization-title" /></label>
                <label className="text-xs font-bold">Campus (optional)<input className={inputClass} maxLength={160} value={form.campus} onChange={(event) => setForm({ ...form, campus: event.target.value })} placeholder="Campus or area" /></label>
                <label className="text-xs font-bold">Buyer contact phone (optional)<input className={inputClass} maxLength={32} value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} placeholder="+255…" autoComplete="tel" /></label>
              </div>
              <label className="block text-xs font-bold">About your shop (optional)<textarea className={`${inputClass} min-h-28 resize-y py-3`} maxLength={2000} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="What do you plan to sell to students?" /></label>
              {error && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200">{error}{error.startsWith('Sign in') && <Link href="/seller/login" className="ml-1 font-bold underline">Sign in</Link>}</p>}
              <button type="submit" disabled={saving} className="min-h-12 w-full rounded-xl bg-emerald-600 px-5 text-sm font-extrabold text-white transition hover:bg-emerald-700 disabled:cursor-wait disabled:opacity-60 sm:w-auto">{saving ? 'Submitting…' : rejected ? 'Resubmit application' : 'Submit seller application'}</button>
            </form>
          )}
        </section>
      </main>
    </div>
  );
}
