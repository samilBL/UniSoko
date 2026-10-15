/* eslint-disable react/no-unescaped-entities */
'use client';

import Link from 'next/link';
import Header from '@/components/Header';
import CartDrawer from '@/components/CartDrawer';
import { ArrowLeft, Cookie, ShieldCheck, Database, Lock, EyeOff } from 'lucide-react';

export default function CookiePolicyPage() {
  return (
    <div className="min-h-screen bg-slate-950 font-sans text-slate-100 flex flex-col">
      <Header />

      <main className="mx-auto w-full max-w-4xl flex-1 px-4 sm:px-6 py-10 space-y-8">
        {/* Breadcrumb Bar */}
        <div className="flex items-center justify-between text-xs text-slate-400">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 font-bold text-slate-400 hover:text-indigo-400 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to UniSoko</span>
          </Link>
          <span className="font-extrabold uppercase tracking-widest text-indigo-400 text-[10px]">
            Privacy &amp; Cookie Documentation
          </span>
        </div>

        {/* Hero Card */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-8 text-white shadow-xl">
          <div className="flex items-center gap-3.5 mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <Cookie className="h-6 w-6" />
            </div>
            <div>
              <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest block">
                UniSoko Tanzania
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-white">
                Cookie &amp; Local Storage Policy
              </h1>
            </div>
          </div>
          <p className="text-slate-300 text-sm leading-relaxed max-w-2xl">
            UniSoko respects your digital privacy. This policy details how and why we utilize cookies, local storage, and session keys on our platform.
          </p>
          <div className="mt-5 flex flex-wrap gap-2.5 text-xs">
            <span className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-1 font-semibold text-slate-200">
              Effective: September 1, 2026
            </span>
            <span className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-1 font-semibold text-slate-200">
              Zero Third-Party Advertising Trackers
            </span>
            <span className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-1 font-semibold text-slate-200">
              GDPR &amp; Tanzanian Data Protection
            </span>
          </div>
        </div>

        {/* Section 1 */}
        <CookieSection icon={<ShieldCheck className="h-5 w-5 text-emerald-400" />} title="1. What Are Cookies & Local Storage?">
          <p>
            Cookies and browser local storage are small data files stored directly on your computer or smartphone when you visit a website. They allow the platform to remember your selections as you navigate between pages.
          </p>
        </CookieSection>

        {/* Section 2 */}
        <CookieSection icon={<Database className="h-5 w-5 text-indigo-400" />} title="2. Strictly Necessary Essential Storage">
          <p>UniSoko utilizes browser storage strictly to enable core marketplace functionality:</p>
          <ul className="space-y-2 mt-2">
            <li>
              <strong className="text-white">Shopping Cart (`unisoko_cart`):</strong> Preserves gadgets and accessories added to your cart so your selection is retained if you reload or return later.
            </li>
            <li>
              <strong className="text-white">Selected Campus (`unisoko_selected_campus`):</strong> Remembers whether you are shopping at MUST, UDSM, CBE, DIT, or TEKU to show accurate delivery options.
            </li>
            <li>
              <strong className="text-white">Group Buy Security Token (`unisoko_group_buyer_token`):</strong> Authenticates your participant spot in a 24-hour squad wholesale pool without requiring a password.
            </li>
            <li>
              <strong className="text-white">Winga Referral Attribution (`unisoko_winga_referral`):</strong> Accurately credits your campus runner for your order promo discount.
            </li>
            <li>
              <strong className="text-white">Cookie Consent (`unisoko_cookie_consent`):</strong> Remembers your privacy acceptance preferences.
            </li>
          </ul>
        </CookieSection>

        {/* Section 3 */}
        <CookieSection icon={<EyeOff className="h-5 w-5 text-indigo-400" />} title="3. What We Do NOT Do">
          <ul className="space-y-2">
            <li>We do <strong className="text-white">NOT</strong> use third-party advertising cookies (e.g. Google Ads Remarketing, Meta Pixel).</li>
            <li>We do <strong className="text-white">NOT</strong> sell your browsing habits or profile to data brokers.</li>
            <li>We do <strong className="text-white">NOT</strong> engage in cross-site behavioral tracking.</li>
          </ul>
        </CookieSection>

        {/* Section 4 */}
        <CookieSection icon={<Lock className="h-5 w-5 text-indigo-400" />} title="4. Managing & Clearing Storage">
          <p>
            You can clear or block cookies and local storage at any time via your browser settings (Chrome, Safari, Edge, Firefox). Please note that clearing local storage will empty your current shopping cart and reset your campus location preference to the default hub.
          </p>
        </CookieSection>

        {/* Legal Cross-Navigation */}
        <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-400 border-t border-slate-800 pt-6">
          <Link href="/privacy-policy" className="text-indigo-400 hover:underline">
            Privacy Policy
          </Link>
          <span className="text-slate-600">·</span>
          <Link href="/terms-of-service" className="text-indigo-400 hover:underline">
            Terms of Service
          </Link>
          <span className="text-slate-600">·</span>
          <Link href="/refund-policy" className="text-indigo-400 hover:underline">
            Refund &amp; Warranty Policy
          </Link>
          <span className="text-slate-600">·</span>
          <Link href="/" className="hover:text-white ml-auto">
            ← Return to Storefront
          </Link>
        </div>
      </main>

      <CartDrawer />
    </div>
  );
}

function CookieSection({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-slate-800 bg-slate-900 p-6 sm:p-8 shadow-sm space-y-4">
      <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-800 border border-slate-700/80">
          {icon}
        </div>
        <h2 className="text-base sm:text-lg font-bold text-white">{title}</h2>
      </div>
      <div className="text-xs sm:text-sm text-slate-200 leading-relaxed space-y-2">
        {children}
      </div>
    </section>
  );
}
