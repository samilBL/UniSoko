'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AlertCircle, ArrowRight, Eye, EyeOff, KeyRound, Mail, Sparkles } from 'lucide-react';
import Header from '@/components/Header';
import CartDrawer from '@/components/CartDrawer';
import { ALL_UNIVERSITIES, OTHER_TANZANIA_UNIVERSITY } from '@/lib/mockData';
import { getSupabaseBrowser } from '@/lib/supabaseBrowser';

type AccessMode = 'signup' | 'signin' | 'application';

export default function WingaLandingPage() {
  const router = useRouter();
  const [mode, setMode] = useState<AccessMode>('signup');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [phone, setPhone] = useState('');
  const [university, setUniversity] = useState(ALL_UNIVERSITIES[0]?.name || '');
  const [otherUniversity, setOtherUniversity] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const normalizedPhone = () => {
    const digits = phone.replace(/\D/g, '');
    if (phone.trim().startsWith('+')) return `+${digits}`;
    if (digits.startsWith('0')) return `+255${digits.slice(1)}`;
    return digits.startsWith('255') ? `+${digits}` : `+255${digits}`;
  };

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setMessage('');
    setIsSubmitting(true);

    try {
      const supabase = getSupabaseBrowser();
      if (!supabase) throw new Error('Winga sign-in is not configured. Please contact UniSoko support.');
      const normalizedEmail = email.trim().toLowerCase();

      if (mode === 'signup') {
        const response = await fetch('/api/winga/accounts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: normalizedEmail,
            password,
            fullName,
            phone: normalizedPhone(),
            university: university === OTHER_TANZANIA_UNIVERSITY.name ? otherUniversity : university,
          }),
        });
        const result = await response.json() as { error?: string };
        if (!response.ok) {
          if (response.status === 409) {
            setMode('signin');
            setMessage('An account may already exist for this email. Sign in with your password or use Forgot password.');
            return;
          }
          throw new Error(result.error || 'Could not create your Winga account.');
        }
      }

      if (mode === 'application') {
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
        if (!response.ok) throw new Error(result.error || 'Could not submit your Winga application.');
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({ email: normalizedEmail, password });
      if (signInError) {
        if (mode === 'signup') {
          setMode('signin');
          setMessage('Your account was created. Sign in with the email and password you just chose.');
          setError('');
          return;
        }
        throw new Error('Email or password is incorrect. If you have not set a password, reset it using your account email.');
      }

      if (mode === 'signin') {
        const profileResponse = await fetch('/api/winga/me', { cache: 'no-store' });
        const profileResult = await profileResponse.json() as { profile?: unknown; error?: string };
        if (profileResponse.ok && !profileResult.profile) {
          setMode('application');
          setMessage('You are signed in. Complete your Winga profile to continue.');
          return;
        }
      }
      router.replace('/winga/dashboard');
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Could not continue. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function sendPasswordReset() {
    setError('');
    setMessage('');
    const normalizedEmail = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setError('Enter your Winga account email first.');
      return;
    }
    const supabase = getSupabaseBrowser();
    if (!supabase) {
      setError('Winga sign-in is not configured. Please contact UniSoko support.');
      return;
    }
    setIsSubmitting(true);
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
        redirectTo: `${window.location.origin}/winga/reset-password`,
      });
      if (resetError) throw resetError;
      setMessage('If an account exists for this email, a password reset link has been sent. Check your inbox.');
    } catch {
      setError('Could not send the reset email. Check the address and try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  const showProfileFields = mode !== 'signin';

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 font-sans text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <Header />
      <main className="mx-auto flex-1 w-full max-w-7xl space-y-10 px-4 py-10 sm:px-6 lg:px-8">
        <section className="mx-auto max-w-4xl space-y-4 rounded-3xl bg-slate-900 p-8 text-center text-white shadow-2xl sm:p-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/20 px-4 py-1 text-xs font-bold text-emerald-300">
            <Sparkles className="h-4 w-4" /> Campus Winga network
          </div>
          <h1 className="text-3xl font-black tracking-tight sm:text-5xl">Become a UniSoko <span className="text-emerald-400">Campus Winga</span></h1>
          <p className="mx-auto max-w-2xl text-sm leading-relaxed text-slate-300 sm:text-base">
            Create an account without an email code, then upload your student ID for review. You can access your account right away; you can earn commissions only after UniSoko verifies your student ID.
          </p>
        </section>

        <section className="mx-auto max-w-xl rounded-3xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900 sm:p-8">
          <div className="mb-5">
            <h2 className="text-lg font-bold text-slate-950 dark:text-white">
              {mode === 'signin' ? 'Sign in to your Winga account' : mode === 'application' ? 'Complete your Winga profile' : 'Create your Winga account'}
            </h2>
            <p className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-300">
              {mode === 'signin'
                ? 'Use the email and password you chose when you registered.'
                : mode === 'application'
                  ? 'Your account is ready. Add your campus contact information.'
                  : 'No verification code is needed. Use at least 12 characters for your password.'}
            </p>
          </div>

          <form onSubmit={submit} className="space-y-4">
            {showProfileFields && <label className="block text-xs font-bold text-slate-700 dark:text-slate-200">
              Full name
              <input type="text" autoComplete="name" required minLength={2} maxLength={120} value={fullName} onChange={(event) => setFullName(event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-950 outline-none focus:border-indigo-600 dark:border-slate-700 dark:bg-slate-800 dark:text-white" placeholder="Your name as shown on your student ID" />
            </label>}

            <label className="block text-xs font-bold text-slate-700 dark:text-slate-200">
              Email address
              <span className="relative mt-1.5 block"><Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-3 text-sm text-slate-950 outline-none focus:border-indigo-600 dark:border-slate-700 dark:bg-slate-800 dark:text-white" placeholder="you@example.com" /></span>
            </label>

            <label className="block text-xs font-bold text-slate-700 dark:text-slate-200">
              Password
              <span className="relative mt-1.5 block"><KeyRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input type={showPassword ? 'text' : 'password'} autoComplete={mode === 'signin' ? 'current-password' : 'new-password'} required minLength={mode === 'signin' ? undefined : 12} maxLength={128} value={password} onChange={(event) => setPassword(event.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-12 text-sm text-slate-950 outline-none focus:border-indigo-600 dark:border-slate-700 dark:bg-slate-800 dark:text-white" placeholder={mode === 'signin' ? 'Your password' : 'At least 12 characters'} /><button type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? 'Hide password' : 'Show password'} aria-pressed={showPassword} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-500 hover:text-indigo-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-600 dark:text-slate-300 dark:hover:text-white">{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></span>
            </label>

            {showProfileFields && <>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200">
                Mobile-money contact number
                <input type="tel" autoComplete="tel" required value={phone} onChange={(event) => setPhone(event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-950 outline-none focus:border-indigo-600 dark:border-slate-700 dark:bg-slate-800 dark:text-white" placeholder="+255 712 345 678" />
              </label>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200">
                University or campus
                <select value={university} onChange={(event) => setUniversity(event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-950 outline-none focus:border-indigo-600 dark:border-slate-700 dark:bg-slate-800 dark:text-white">
                  {ALL_UNIVERSITIES.map((item) => <option key={item.id} value={item.name}>{item.name} ({item.shortCode})</option>)}
                </select>
              </label>
              {university === OTHER_TANZANIA_UNIVERSITY.name && <label className="block text-xs font-bold text-slate-700 dark:text-slate-200">University and campus<input required maxLength={160} value={otherUniversity} onChange={(event) => setOtherUniversity(event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm dark:border-slate-700 dark:bg-slate-800" /></label>}
            </>}

            {error && <p role="alert" className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200"><AlertCircle className="h-4 w-4 shrink-0" />{error}</p>}
            {message && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200">{message}</p>}

            <button disabled={isSubmitting} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-xs font-bold text-white transition hover:bg-indigo-700 disabled:opacity-60">
              {isSubmitting ? 'Please wait…' : mode === 'signin' ? 'Sign in' : mode === 'application' ? 'Submit Winga profile' : 'Create account'}
              {!isSubmitting && <ArrowRight className="h-4 w-4" />}
            </button>
            {mode === 'signin' && <button type="button" onClick={() => void sendPasswordReset()} disabled={isSubmitting} className="w-full py-1 text-xs font-bold text-indigo-700 hover:underline disabled:opacity-60 dark:text-indigo-300">Forgot password?</button>}
          </form>

          <button type="button" onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(''); setMessage(''); }} className="mt-4 w-full py-2 text-xs font-semibold text-indigo-700 hover:underline dark:text-indigo-300">
            {mode === 'signin' ? 'New to the Winga network? Create an account' : 'Already have a Winga account? Sign in'}
          </button>
          <p className="mt-3 text-center text-[11px] leading-5 text-slate-500 dark:text-slate-400">Student ID photos are private and reviewed by authorized UniSoko staff. Your promo code stays inactive until your student ID is verified.</p>
          <Link href="/" className="mt-3 inline-block text-xs font-semibold text-slate-500 hover:text-indigo-600">Return to UniSoko</Link>
        </section>
      </main>
      <CartDrawer />
    </div>
  );
}
