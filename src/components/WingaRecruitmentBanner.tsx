'use client';

import Link from 'next/link';
import { ArrowRight, Users } from 'lucide-react';

export default function WingaRecruitmentBanner() {
  return <section className="relative overflow-hidden rounded-3xl bg-slate-900 p-6 text-white shadow-2xl ring-1 ring-white/10 sm:p-10">
    <div className="absolute -right-12 -top-12 h-64 w-64 rounded-full bg-emerald-500/20 blur-3xl"/><div className="relative z-10 mx-auto flex max-w-5xl flex-col gap-7">
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center"><div><p className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-3.5 py-1 text-xs font-black uppercase tracking-wide"><Users className="h-3.5 w-3.5"/>UniSoko Winga</p><h2 className="mt-3 text-2xl font-black tracking-tight sm:text-4xl">Become a Campus <span className="text-emerald-400">Winga</span></h2><p className="mt-2 max-w-xl text-sm text-slate-300">Support your university community as part of UniSoko’s campus network.</p></div>
        <div className="flex flex-wrap gap-3"><Link href="/winga/register" className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 text-sm font-bold text-slate-950 hover:bg-emerald-400">Become Campus Winga<ArrowRight className="h-4 w-4"/></Link><Link href="/winga/login" className="rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-sm font-semibold hover:bg-white/20">Winga Portal</Link></div>
      </div>
      <div className="flex flex-col items-start justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 sm:flex-row sm:items-center"><p className="text-sm font-bold">Active University Winga</p><Link href="/winga/leaderboard" className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400 underline underline-offset-4 hover:text-emerald-300">See Winga Leaderboard<ArrowRight className="h-3.5 w-3.5"/></Link></div>
    </div>
  </section>;
}
