'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LockKeyhole, ShieldCheck } from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Unable to sign in.');

      router.replace('/admin');
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to sign in.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12 text-slate-900">
      <section className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-2xl shadow-indigo-500/10">
        <div className="mb-7 flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-white">
          <LockKeyhole className="h-6 w-6" />
        </div>
        <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-emerald-700">
          <ShieldCheck className="h-4 w-4" /> Authorized staff only
        </p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-950">Admin sign in</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">Sign in with the admin username and password for this deployment. If setup is incomplete, this page will explain what needs configuring.</p>

        <form onSubmit={handleSubmit} className="mt-7 space-y-4">
          <label className="block text-sm font-semibold text-slate-800">
            Username
            <input autoComplete="username" required value={username} onChange={(event) => setUsername(event.target.value)} className="mt-1.5 w-full rounded-xl px-3.5 py-3 text-sm" />
          </label>
          <label className="block text-sm font-semibold text-slate-800">
            Password
            <input type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} className="mt-1.5 w-full rounded-xl px-3.5 py-3 text-sm" />
          </label>
          {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
          <button disabled={isSubmitting} className="w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-indigo-700 disabled:opacity-60">
            {isSubmitting ? 'Verifying…' : 'Sign in securely'}
          </button>
        </form>
        <Link href="/" className="mt-6 inline-block text-sm font-semibold text-slate-500 hover:text-indigo-600">Return to UniSoko</Link>
      </section>
    </main>
  );
}
