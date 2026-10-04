'use client';

import { useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AlertCircle, Eye, EyeOff, KeyRound } from 'lucide-react';
import Header from '@/components/Header';
import CartDrawer from '@/components/CartDrawer';
import { getSupabaseBrowser } from '@/lib/supabaseBrowser';

export default function WingaResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const supabase = getSupabaseBrowser();
    if (!supabase) {
      const timer = window.setTimeout(() => setError('Password reset is not configured. Contact UniSoko support.'), 0);
      return () => window.clearTimeout(timer);
    }
    const timer = window.setTimeout(() => {
      void supabase.auth.getSession().then(({ data }) => {
        if (data.session) setIsReady(true);
        else setError('This reset link is invalid or expired. Request a new password reset email.');
      });
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    if (password.length < 12) {
      setError('Choose a password with at least 12 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('The passwords do not match.');
      return;
    }
    const supabase = getSupabaseBrowser();
    if (!supabase) {
      setError('Password reset is not configured. Contact UniSoko support.');
      return;
    }
    setIsSaving(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setIsSaving(false);
    if (updateError) {
      setError('Could not update your password. Request a new reset link and try again.');
      return;
    }
    router.replace('/winga/dashboard');
    router.refresh();
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <Header />
      <main className="mx-auto flex w-full max-w-lg flex-1 items-center px-4 py-12">
        <section className="w-full rounded-3xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900 sm:p-8">
          <h1 className="text-2xl font-black text-slate-950 dark:text-white">Set a new Winga password</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">Use at least 12 characters. After saving, you will return to your Winga dashboard.</p>
          {isReady ? <form onSubmit={submit} className="mt-6 space-y-4">
            <label className="block text-xs font-bold">New password
              <span className="relative mt-1.5 block"><KeyRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input type={showPassword ? 'text' : 'password'} autoComplete="new-password" minLength={12} maxLength={128} required value={password} onChange={(event) => setPassword(event.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-12 text-sm outline-none focus:border-indigo-600 dark:border-slate-700 dark:bg-slate-800" placeholder="At least 12 characters" /><button type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? 'Hide password' : 'Show password'} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-500 hover:text-indigo-700">{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></span>
            </label>
            <label className="block text-xs font-bold">Confirm new password
              <input type={showPassword ? 'text' : 'password'} autoComplete="new-password" minLength={12} maxLength={128} required value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm outline-none focus:border-indigo-600 dark:border-slate-700 dark:bg-slate-800" />
            </label>
            {error && <p role="alert" className="flex gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200"><AlertCircle className="h-4 w-4 shrink-0" />{error}</p>}
            <button disabled={isSaving} className="min-h-12 w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-60">{isSaving ? 'Saving…' : 'Save new password'}</button>
          </form> : error && <p role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">{error}</p>}
          <Link href="/winga" className="mt-5 inline-block text-sm font-semibold text-indigo-700 hover:underline dark:text-indigo-300">Back to Winga sign in</Link>
        </section>
      </main>
      <CartDrawer />
    </div>
  );
}
