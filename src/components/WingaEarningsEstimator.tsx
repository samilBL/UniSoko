'use client';

import { useState } from 'react';
import { TrendingUp, Wallet } from 'lucide-react';
import { formatTZS } from '@/lib/mockData';

export default function WingaEarningsEstimator() {
  const [weeklySales, setWeeklySales] = useState(500000);
  const projected = Math.round(weeklySales * 0.05);
  return <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8" aria-label="Winga earnings estimator">
    <div className="flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700"><Wallet className="h-5 w-5"/></div><div><p className="text-xs font-bold uppercase tracking-widest text-emerald-700">Earnings estimator</p><h2 className="mt-1 text-lg font-extrabold">Explore a sample weekly sales estimate</h2></div></div>
    <div className="mt-5 rounded-2xl bg-slate-950 p-5 text-white"><div className="flex items-center justify-between gap-3"><label htmlFor="winga-weekly-sales" className="text-sm font-medium text-slate-300">Estimated weekly sales</label><span className="text-sm font-bold">{formatTZS(weeklySales)}</span></div><input id="winga-weekly-sales" type="range" min="100000" max="5000000" step="50000" value={weeklySales} onChange={(event) => setWeeklySales(Number(event.target.value))} className="mt-5 w-full accent-emerald-400"/><div className="mt-5 flex items-end justify-between gap-3"><div><p className="text-xs text-slate-400">Illustrative estimate at 5%</p><p className="mt-1 text-3xl font-extrabold tracking-tight text-emerald-300">{formatTZS(projected)}</p></div><TrendingUp className="mb-1 h-7 w-7 text-emerald-400"/></div></div>
    <p className="mt-3 text-xs leading-5 text-slate-500">This is an example only. UniSoko and seller campaign commission rates can differ; actual earnings depend on eligible orders and completed delivery.</p>
  </section>;
}
