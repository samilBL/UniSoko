'use client';

import React from 'react';
import Link from 'next/link';
import { Sparkles, ArrowRight, UserPlus, Share2, Wallet, CheckCircle2 } from 'lucide-react';
import { MOCK_WINGA_AGENTS, formatTZS } from '@/lib/mockData';
import { openStudentGuide } from '@/lib/studentGuide';

export default function WingaRecruitmentBanner() {
  const steps = [
    {
      step: '01',
      title: 'Sign Up & Get Your Code',
      description: 'Register in 60 seconds with your university ID. Receive your custom discount code (e.g. WINGA-SAM).',
      icon: <UserPlus className="h-6 w-6 text-indigo-400" />,
      highlight: 'Zero capital needed',
    },
    {
      step: '02',
      title: 'Share Deals With Classmates',
      description: 'Post verified gadget listings to your WhatsApp status, hostel group chats, and student forums.',
      icon: <Share2 className="h-6 w-6 text-emerald-400" />,
      highlight: 'Ready-made flyers & specs',
    },
    {
      step: '03',
      title: 'Earn 5% Instant Commission',
      description: 'When students buy with your code, your commission is credited instantly and paid to M-Pesa / Tigo Pesa.',
      icon: <Wallet className="h-6 w-6 text-amber-400" />,
      highlight: 'Same-day cashout',
    },
  ];

  return (
    <section className="relative overflow-hidden rounded-3xl bg-slate-900 p-6 sm:p-10 text-white shadow-2xl ring-1 ring-white/10">
      {/* Background Gradients */}
      <div className="absolute top-0 right-0 -mt-12 -mr-12 h-64 w-64 rounded-full bg-emerald-500/20 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -mb-12 -ml-12 h-64 w-64 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-5xl mx-auto">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-white/10">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-3.5 py-1 text-xs font-black uppercase tracking-wide text-white shadow-[0_0_20px_rgba(99,102,241,0.3)]">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Winga Bonus</span>
            </div>
            <h2 className="mt-3 text-2xl sm:text-4xl font-black tracking-tight text-white">
              Become a Campus{' '}
              <span className="text-emerald-400">
                Winga
              </span>
            </h2>
            <p className="mt-2 text-sm text-slate-300 max-w-xl">
              Join from any Tanzanian university. Outside Mbeya, manage a local campus hub, receive bulk stock from UniSoko, coordinate in-person delivery, and earn commission on successful sales.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={openStudentGuide}
              className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-4 py-3.5 text-sm font-semibold text-white transition hover:bg-white/20"
            >
              Watch Guide
            </button>
            <Link
              href="/winga/register"
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-6 py-3.5 text-sm font-bold text-slate-950 shadow-lg shadow-emerald-500/25 hover:bg-emerald-600 active:scale-95 transition-all"
            >
              <span>Join as Winga</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/winga/login"
              className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-3.5 text-sm font-semibold text-white hover:bg-white/20 active:scale-95 border border-white/10 transition-all"
            >
              <span>Winga Portal</span>
            </Link>
          </div>
        </div>

        {/* 3-Step Process Grid */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          {steps.map((step, idx) => (
            <div
              key={idx}
              className="relative flex flex-col justify-between rounded-2xl bg-white/5 p-6 backdrop-blur-xs border border-white/10 hover:border-white/20 transition-all"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 border border-white/10">
                    {step.icon}
                  </div>
                  <span className="text-3xl font-black text-white/20">{step.step}</span>
                </div>
                <h3 className="text-base font-bold text-white mb-2">{step.title}</h3>
                <p className="text-xs text-slate-300 leading-relaxed">{step.description}</p>
              </div>

              <div className="mt-5 pt-3 border-t border-white/10 flex items-center gap-1.5 text-xs text-emerald-400 font-semibold">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>{step.highlight}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Live Winga Social Proof */}
        <div className="mt-8 rounded-2xl bg-white/5 p-4 sm:p-5 border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex -space-x-2 overflow-hidden">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-600 ring-2 ring-slate-900 font-bold text-xs text-white">
                SM
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-600 ring-2 ring-slate-900 font-bold text-xs text-white">
                MM
              </div>
            </div>
            <div>
              <p className="text-xs font-bold text-white">
                Active Wingas in Mbeya:
              </p>
              <p className="text-[11px] text-slate-400">
                {MOCK_WINGA_AGENTS[0].fullName} ({MOCK_WINGA_AGENTS[0].promoCode}) earned {formatTZS(MOCK_WINGA_AGENTS[0].totalEarnings)} this semester!
              </p>
            </div>
          </div>

          <Link
            href="/winga/leaderboard"
            className="text-xs font-bold text-emerald-400 hover:text-emerald-300 underline underline-offset-4 flex items-center gap-1"
          >
            See Winga Leaderboard <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
