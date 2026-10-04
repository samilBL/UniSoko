'use client';

import { type FormEvent, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { ArrowLeft, PackageSearch } from 'lucide-react';

export default function TrackingPortalPage() {
  const router = useRouter();
  const [orderId, setOrderId] = useState('');
  const [token, setToken] = useState('');
  const [error, setError] = useState('');

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedOrderId = orderId.trim();
    const normalizedToken = token.trim();

    if (!normalizedOrderId || !/^[A-Za-z0-9_-]{43}$/.test(normalizedToken)) {
      setError('Enter the order number and 43-character tracking access token from your order confirmation.');
      return;
    }

    router.push(`/track/${encodeURIComponent(normalizedOrderId)}?token=${encodeURIComponent(normalizedToken)}`);
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <Header />
      <main className="mx-auto w-full max-w-xl px-4 py-10 sm:px-6">
        <Link href="/support" className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-indigo-600 dark:text-slate-300">
          <ArrowLeft className="h-4 w-4" /> Support
        </Link>
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-300">
            <PackageSearch className="h-6 w-6" />
          </div>
          <h1 className="mt-5 text-2xl font-extrabold">Track your order</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
            Enter the order number and private tracking access token from your order confirmation. The token keeps your order details secure.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <label className="block text-sm font-semibold">
              Order number
              <input
                required
                autoComplete="off"
                value={orderId}
                onChange={(event) => setOrderId(event.target.value)}
                className="mt-1.5 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-normal outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-950"
                placeholder="e.g. order number from your confirmation"
              />
            </label>
            <label className="block text-sm font-semibold">
              Tracking access token
              <input
                required
                autoComplete="off"
                spellCheck={false}
                value={token}
                onChange={(event) => setToken(event.target.value)}
                className="mt-1.5 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 font-mono text-sm font-normal outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-950"
                placeholder="43-character token"
              />
            </label>
            {error && <p className="text-sm text-red-700 dark:text-red-300" role="alert">{error}</p>}
            <button type="submit" className="min-h-11 w-full rounded-lg bg-indigo-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-indigo-700">
              View order status
            </button>
          </form>

          <p className="mt-5 text-xs leading-5 text-slate-500 dark:text-slate-400">
            Your confirmation contains a secure tracking link. If you no longer have it, <Link href="/support" className="font-semibold text-indigo-600 underline dark:text-indigo-300">contact UniSoko Support</Link> for help.
          </p>
        </section>
      </main>
    </div>
  );
}
