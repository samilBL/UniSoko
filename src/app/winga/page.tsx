'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { AlertCircle, ArrowRight, CheckCircle2, Clock3, KeyRound, MessageCircle, Phone, Sparkles } from 'lucide-react';
import Header from '@/components/Header';
import CartDrawer from '@/components/CartDrawer';
import { ALL_UNIVERSITIES, OTHER_TANZANIA_UNIVERSITY } from '@/lib/mockData';
import { getSupabaseBrowser } from '@/lib/supabaseBrowser';

type ApplicationStep = 'phone' | 'otp' | 'application' | 'submitted';

export default function WingaLandingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [university, setUniversity] = useState(ALL_UNIVERSITIES[0]?.name || '');
  const [otherUniversity, setOtherUniversity] = useState('');
  const [step, setStep] = useState<ApplicationStep>('phone');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const normalizedPhone = () => {
    const digits = phone.replace(/\D/g, '');
    if (phone.trim().startsWith('+')) return `+${digits}`;
    if (digits.startsWith('0')) return `+255${digits.slice(1)}`;
    return digits.startsWith('255') ? `+${digits}` : `+255${digits}`;
  };

  const sendOtp = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);
    const supabase = getSupabaseBrowser();
    const canonicalPhone = normalizedPhone();
    if (!supabase) {
      setError('Phone sign-in is not configured. Please contact UniSoko support.');
      setIsSubmitting(false);
      return;
    }
    if (!/^\+255[67]\d{8}$/.test(canonicalPhone)) {
      setError('Enter a valid Tanzanian mobile number, for example +255 712 345 678.');
      setIsSubmitting(false);
      return;
    }
    const { error: otpError } = await supabase.auth.signInWithOtp({ phone: canonicalPhone });
    setIsSubmitting(false);
    if (otpError) {
      setError('Could not send a verification code. Check the number and try again.');
      return;
    }
    setPhone(canonicalPhone);
    setStep('otp');
    setMessage(`We sent a verification code to ${canonicalPhone}.`);
  };

  const verifyOtp = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);
    const supabase = getSupabaseBrowser();
    if (!supabase) {
      setError('Phone sign-in is not configured. Please contact UniSoko support.');
      setIsSubmitting(false);
      return;
    }
    const { error: verifyError } = await supabase.auth.verifyOtp({ phone: normalizedPhone(), token: otp.trim(), type: 'sms' });
    setIsSubmitting(false);
    if (verifyError) {
      setError('That code could not be verified. Check it and try again.');
      return;
    }
    const response = await fetch('/api/winga/me', { cache: 'no-store' });
    if (response.ok) {
      const result = await response.json() as { profile?: { status: string } | null };
      if (result.profile) {
        router.push('/winga/dashboard');
        return;
      }
    }
    setMessage('Phone verified. Complete your Winga application below.');
    setStep('application');
  };

  const submitApplication = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);
    const response = await fetch('/api/winga/applications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName,
        phone: normalizedPhone(),
        university: university === OTHER_TANZANIA_UNIVERSITY.name ? otherUniversity : university,
      }),
    });
    const result = await response.json() as { error?: string };
    setIsSubmitting(false);
    if (!response.ok) {
      setError(result.error || 'Could not submit your application.');
      return;
    }
    setStep('submitted');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 flex flex-col font-sans">
      <Header />
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-10 space-y-12">
        <section className="rounded-3xl bg-slate-900 p-8 sm:p-12 text-white shadow-2xl text-center max-w-4xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/20 px-4 py-1 text-xs font-bold text-emerald-400 border border-emerald-500/30">
            <Sparkles className="h-4 w-4" />
            <span>Join the nationwide UniSoko agent network</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight">Become a UniSoko <span className="text-emerald-400">Winga Agent</span></h1>
          <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Promote UniSoko products and help coordinate campus hand-offs. Winga applications are reviewed by UniSoko; agents are not sellers and do not receive customer payments.
          </p>
        </section>

        <section className="max-w-xl mx-auto rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xl dark:border-slate-800 dark:bg-slate-900">
          {step === 'submitted' ? (
            <div className="text-center py-6 space-y-4">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300"><Clock3 className="h-8 w-8" /></div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Application received</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">UniSoko will review your application. A promo code and portal access are issued only after approval.</p>
              <Link href="/winga/dashboard" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-6 py-3 text-xs font-bold text-slate-800 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-800">View application status<ArrowRight className="h-4 w-4" /></Link>
            </div>
          ) : step === 'phone' ? (
            <form onSubmit={sendOtp} className="space-y-4">
              <div><h2 className="text-lg font-bold text-slate-900 dark:text-white">Apply to become a Winga</h2><p className="text-xs text-slate-500 dark:text-slate-400">Verify your mobile number first. UniSoko reviews every application before activation.</p></div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">Mobile number
                <span className="relative mt-1.5 block"><Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input type="tel" autoComplete="tel" required value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="+255 712 345 678" className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-3 text-sm text-slate-900 focus:border-indigo-600 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white" /></span>
              </label>
              <button disabled={isSubmitting} className="w-full rounded-xl bg-indigo-600 py-3.5 text-xs font-bold text-white hover:bg-indigo-700 disabled:opacity-60"><span className="inline-flex items-center gap-2"><MessageCircle className="h-4 w-4" />{isSubmitting ? 'Sending code…' : 'Send SMS verification code'}</span></button>
            </form>
          ) : step === 'otp' ? (
            <form onSubmit={verifyOtp} className="space-y-4">
              <div><h2 className="text-lg font-bold text-slate-900 dark:text-white">Verify your phone</h2><p className="text-xs text-slate-500 dark:text-slate-400">Enter the SMS code sent to {phone}.</p></div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">Verification code
                <span className="relative mt-1.5 block"><KeyRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input inputMode="numeric" autoComplete="one-time-code" required value={otp} onChange={(event) => setOtp(event.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-3 text-sm tracking-widest text-slate-900 focus:border-indigo-600 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white" /></span>
              </label>
              <button disabled={isSubmitting} className="w-full rounded-xl bg-indigo-600 py-3.5 text-xs font-bold text-white hover:bg-indigo-700 disabled:opacity-60">{isSubmitting ? 'Verifying…' : 'Verify phone'}</button>
              <button type="button" onClick={() => { setStep('phone'); setOtp(''); setMessage(''); }} className="w-full py-2 text-xs font-semibold text-slate-600 hover:text-indigo-600">Change phone number</button>
            </form>
          ) : (
            <form onSubmit={submitApplication} className="space-y-4">
              <div><h2 className="text-lg font-bold text-slate-900 dark:text-white">Winga application</h2><p className="text-xs text-slate-500 dark:text-slate-400">Verified number: {phone}. A UniSoko admin must approve your application before activation.</p></div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">Full name<input type="text" autoComplete="name" required minLength={2} maxLength={120} value={fullName} onChange={(event) => setFullName(event.target.value)} placeholder="e.g. Kelvin Mwakyusa" className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-900 focus:border-indigo-600 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white" /></label>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">University or campus
                <select value={university} onChange={(event) => setUniversity(event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-900 focus:border-indigo-600 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white">
                  {ALL_UNIVERSITIES.map((item) => <option key={item.id} value={item.name}>{item.name} ({item.shortCode})</option>)}
                </select>
              </label>
              {university === OTHER_TANZANIA_UNIVERSITY.name && <input required maxLength={160} value={otherUniversity} onChange={(event) => setOtherUniversity(event.target.value)} placeholder="Enter university and campus" className="w-full rounded-xl p-3 text-sm" />}
              <button type="submit" disabled={isSubmitting} className="w-full rounded-xl bg-indigo-600 py-3.5 text-xs font-bold text-white hover:bg-indigo-700 disabled:opacity-60">{isSubmitting ? 'Submitting…' : 'Submit for UniSoko review'}</button>
            </form>
          )}
          {message && <p role="status" className="mt-4 flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-medium text-emerald-800"><CheckCircle2 className="h-4 w-4 shrink-0" />{message}</p>}
          {error && <p role="alert" className="mt-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-800"><AlertCircle className="h-4 w-4 shrink-0" />{error}</p>}
          {searchParams.get('auth') === 'unavailable' && <p role="alert" className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">Winga sign-in is not configured. Please contact UniSoko support.</p>}
          {searchParams.get('auth') === 'required' && <p role="status" className="mt-4 rounded-xl border border-indigo-100 bg-indigo-50 p-3 text-xs text-indigo-900">Sign in with your verified Winga phone to continue.</p>}
          {searchParams.get('apply') === '1' && <p role="status" className="mt-4 rounded-xl border border-indigo-100 bg-indigo-50 p-3 text-xs text-indigo-900">Verify your phone to apply or check your application status.</p>}
        </section>
      </main>
      <CartDrawer />
    </div>
  );
}
