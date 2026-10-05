'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  KeyRound, 
  Mail, 
  Lock, 
  ArrowRight, 
  ShieldCheck, 
  Sparkles, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  CheckCircle2,
  HelpCircle
} from 'lucide-react';
import Header from '@/components/Header';
import CartDrawer from '@/components/CartDrawer';
import { getSupabaseBrowser } from '@/lib/supabaseBrowser';
import { UNISOKO_CONTACT } from '@/lib/siteConfig';

function getPostLoginPath() {
  const requestedPath = new URLSearchParams(window.location.search).get('next');
  if (!requestedPath || !requestedPath.startsWith('/winga/') || requestedPath.startsWith('//')) return '/winga/dashboard';
  const destination = new URL(requestedPath, window.location.origin);
  return destination.origin === window.location.origin ? `${destination.pathname}${destination.search}${destination.hash}` : '/winga/dashboard';
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback;
}

export default function WingaLoginPage() {
  const router = useRouter();
  const [loginMethod, setLoginMethod] = useState<'password' | 'otp'>('password');

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [otpToken, setOtpToken] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  // Status states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const normalizedEmail = email.trim().toLowerCase();

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    const supabase = getSupabaseBrowser();
    if (!supabase) {
      setError('Authentication service is not configured. Please contact support.');
      setLoading(false);
      return;
    }

    if (!normalizedEmail || !password) {
      setError('Please enter both your email and password.');
      setLoading(false);
      return;
    }

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password: password,
      });

      if (authError) {
        if (authError.message.toLowerCase().includes('invalid login credentials')) {
          throw new Error('Invalid email or password. If you registered via OTP, you can log in with a verification code or reset your password below.');
        }
        throw authError;
      }

      if (data.session) {
        router.push(getPostLoginPath());
        router.refresh();
      }
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Failed to sign in. Please check your credentials.'));
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    const supabase = getSupabaseBrowser();
    if (!supabase) {
      setError('Authentication service is not configured.');
      setLoading(false);
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setError('Please enter a valid email address.');
      setLoading(false);
      return;
    }

    try {
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: normalizedEmail,
      });

      if (otpError) throw otpError;

      setOtpSent(true);
      setMessage(`A 6-digit verification code was sent to ${normalizedEmail}. Check your inbox.`);
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Could not send verification code.'));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    const supabase = getSupabaseBrowser();
    if (!supabase) {
      setError('Authentication service is not configured.');
      setLoading(false);
      return;
    }

    try {
      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        email: normalizedEmail,
        token: otpToken.trim(),
        type: 'email',
      });

      if (verifyError) throw verifyError;

      if (data.session) {
        router.push(getPostLoginPath());
        router.refresh();
      }
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Invalid or expired verification code.'));
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setError('Enter your registered email address first, then click Forgot Password.');
      return;
    }
    setError(null);
    setMessage(null);
    setLoading(true);

    const supabase = getSupabaseBrowser();
    if (!supabase) {
      setError('Auth service not configured.');
      setLoading(false);
      return;
    }

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
        redirectTo: `${window.location.origin}/winga/dashboard`,
      });
      if (resetError) throw resetError;
      setMessage(`Password reset link sent to ${normalizedEmail}. Follow the link in your email to set a new password.`);
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Could not send password reset email.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 flex flex-col font-sans">
      <Header />

      <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-10 flex items-center justify-center">
        <div className="w-full max-w-md space-y-6">
          {/* Top Badge & Header */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/10 px-3 py-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Winga Portal</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Winga Sign In
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Sign in to your Campus Winga account and dashboard.
            </p>
          </div>

          {/* Login Card */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xl dark:border-slate-800 dark:bg-slate-900 space-y-5">
            {/* Method Switcher Tabs */}
            <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800">
              <button
                type="button"
                onClick={() => { setLoginMethod('password'); setError(null); setMessage(null); }}
                className={`py-2 text-xs font-bold rounded-lg transition-all ${
                  loginMethod === 'password'
                    ? 'bg-white text-indigo-600 shadow-xs dark:bg-slate-900 dark:text-indigo-400'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                Password Login
              </button>
              <button
                type="button"
                onClick={() => { setLoginMethod('otp'); setError(null); setMessage(null); }}
                className={`py-2 text-xs font-bold rounded-lg transition-all ${
                  loginMethod === 'otp'
                    ? 'bg-white text-indigo-600 shadow-xs dark:bg-slate-900 dark:text-indigo-400'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                Email Code (OTP)
              </button>
            </div>

            {/* Error & Success Alerts */}
            {error && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 dark:bg-rose-950/50 dark:border-rose-800/60 dark:text-rose-300 flex items-start gap-2.5 text-xs">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-500 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {message && (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 dark:bg-emerald-950/50 dark:border-emerald-800/60 dark:text-emerald-300 flex items-start gap-2.5 text-xs">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500 mt-0.5" />
                <span>{message}</span>
              </div>
            )}

            {/* Tab 1: Email + Password */}
            {loginMethod === 'password' && (
              <form onSubmit={handlePasswordLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Registered Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="email"
                      required
                      placeholder="e.g. student@must.ac.tz"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-xs text-slate-900 focus:border-indigo-600 focus:bg-white focus:outline-none dark:border-slate-800 dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={handleResetPassword}
                      className="text-[11px] font-semibold text-indigo-600 hover:underline dark:text-indigo-400"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-10 text-xs text-slate-900 focus:border-indigo-600 focus:bg-white focus:outline-none dark:border-slate-800 dark:bg-slate-800 dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-indigo-600/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  <span>{loading ? 'Signing In...' : 'Sign In to Dashboard'}</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </form>
            )}

            {/* Tab 2: One-Time Code / Magic Link */}
            {loginMethod === 'otp' && (
              <div className="space-y-4">
                {!otpSent ? (
                  <form onSubmit={handleSendOtp} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                        Your Verified Email
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                          type="email"
                          required
                          placeholder="e.g. student@must.ac.tz"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-xs text-slate-900 focus:border-indigo-600 focus:bg-white focus:outline-none dark:border-slate-800 dark:bg-slate-800 dark:text-white"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-indigo-600/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                    >
                      <KeyRound className="h-4 w-4" />
                      <span>{loading ? 'Sending Code...' : 'Send Verification Code'}</span>
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleVerifyOtp} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                        Enter 6-Digit Code sent to {email}
                      </label>
                      <input
                        type="text"
                        required
                        maxLength={6}
                        autoFocus
                        placeholder="123456"
                        value={otpToken}
                        onChange={(e) => setOtpToken(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 px-4 text-center font-mono text-base tracking-widest text-slate-900 focus:border-indigo-600 focus:bg-white focus:outline-none dark:border-slate-800 dark:bg-slate-800 dark:text-white"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-emerald-600/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                    >
                      <span>{loading ? 'Verifying...' : 'Verify Code & Sign In'}</span>
                      <ArrowRight className="h-4 w-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => { setOtpSent(false); setOtpToken(''); }}
                      className="w-full text-center text-xs font-semibold text-slate-500 hover:text-indigo-600"
                    >
                      Use a different email address
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* Registration CTA */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-center space-y-2">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Not a registered Winga yet?
              </p>
              <Link
                href="/winga/register"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
              >
                <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                <span>Apply to become a Campus Winga</span>
              </Link>
            </div>
          </div>

          {/* Quick Help */}
          <div className="text-center">
            <a
              href={`https://wa.me/${UNISOKO_CONTACT.phoneDigits}?text=${encodeURIComponent('Habari UniSoko, I need help signing into my Winga account.')}`}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 inline-flex items-center gap-1"
            >
              <HelpCircle className="h-3.5 w-3.5" />
              <span>Need help accessing your Winga account? WhatsApp Support</span>
            </a>
          </div>
        </div>
      </main>

      <CartDrawer />
    </div>
  );
}
