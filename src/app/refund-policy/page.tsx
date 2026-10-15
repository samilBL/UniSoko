/* eslint-disable react/no-unescaped-entities */
'use client';

import Link from 'next/link';
import Header from '@/components/Header';
import CartDrawer from '@/components/CartDrawer';
import { ArrowLeft, RotateCcw, PackageCheck, AlertTriangle, CheckCircle, Clock, Wrench, ShieldCheck } from 'lucide-react';
import { TRADE_IN_INSPECTION_DISCLAIMER } from '@/lib/tradeInValuation';

export default function RefundPolicyPage() {
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
            Warranty &amp; Consumer Protection
          </span>
        </div>

        {/* Hero Card - Solid high-contrast styling */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-8 text-white shadow-xl">
          <div className="flex items-center gap-3.5 mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <RotateCcw className="h-6 w-6" />
            </div>
            <div>
              <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest block">
                UniSoko Tanzania
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-white">
                Refund &amp; Warranty Policy
              </h1>
            </div>
          </div>
          <p className="text-slate-300 text-sm leading-relaxed max-w-2xl">
            We stand behind every gadget and item we deliver. This policy outlines your consumer rights for returns, replacements, and warranty coverage for brand-new and certified refurbished devices purchased through UniSoko.
          </p>
          <div className="mt-5 flex flex-wrap gap-2.5 text-xs">
            <span className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-1 font-semibold text-slate-200">
              Effective: September 1, 2026
            </span>
            <span className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-1 font-semibold text-slate-200">
              Coverage: All UniSoko Orders
            </span>
            <span className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-1 font-semibold text-slate-200">
              Up to 90-Day Hardware Warranty
            </span>
          </div>
        </div>

        {/* Quick Reference Summary Cards - High Contrast, Solid Colors, No Glare */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-5 space-y-2">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
              <CheckCircle className="h-4 w-4" />
              <span>Brand New Gadgets</span>
            </div>
            <p className="text-lg font-black text-white">14-Day Returns</p>
            <p className="text-xs text-slate-300 leading-relaxed">
              Full refund or replacement if returned in original, undamaged packaging with all accessories intact.
            </p>
          </div>

          <div className="rounded-2xl border border-indigo-500/30 bg-indigo-950/20 p-5 space-y-2">
            <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-wider">
              <Wrench className="h-4 w-4" />
              <span>Grade A / Refurbished</span>
            </div>
            <p className="text-lg font-black text-white">90-Day Warranty</p>
            <p className="text-xs text-slate-300 leading-relaxed">
              Comprehensive hardware warranty against internal motherboard, battery health, and display panel defects.
            </p>
          </div>

          <div className="rounded-2xl border border-amber-500/30 bg-amber-950/20 p-5 space-y-2">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
              <AlertTriangle className="h-4 w-4" />
              <span>Device Trade-Ins</span>
            </div>
            <p className="text-lg font-black text-white">Physical Verification</p>
            <p className="text-xs text-slate-300 leading-relaxed">
              Quotes are provisional estimates until in-person physical inspection on campus by our certified technician.
            </p>
          </div>
        </div>

        {/* Section 1 */}
        <PolicySection icon={<CheckCircle className="h-5 w-5 text-indigo-400" />} title="1. Eligibility for Returns & Exchanges">
          <p>You may initiate a return or exchange within 14 calendar days of taking delivery on your campus under these criteria:</p>
          <ul className="space-y-2 mt-2">
            <li><strong className="text-white">Dead on Arrival (DOA):</strong> Device does not turn on, charge, or initialize properly out of the box.</li>
            <li><strong className="text-white">Incorrect Specifications:</strong> The device delivered differs from the listed RAM, SSD, processor, or model in your order.</li>
            <li><strong className="text-white">Undisclosed Physical Damage:</strong> Structural cracks or panel damage reported within 24 hours of campus hand-off.</li>
          </ul>
        </PolicySection>

        {/* Section 2 */}
        <PolicySection icon={<Wrench className="h-5 w-5 text-indigo-400" />} title="2. 90-Day Hardware Warranty Terms">
          <p>All laptops and phones supplied by UniSoko carry our official 90-day hardware guarantee:</p>
          <ul className="space-y-2 mt-2">
            <li><strong className="text-white">Covered:</strong> Motherboard failure, keyboard malfunctions, power delivery circuits, display failure (not caused by drops).</li>
            <li><strong className="text-white">Not Covered:</strong> Water/liquid damage, accidental drops, cracked screens after receipt, unauthorized repairs or OS rooting.</li>
            <li><strong className="text-white">Battery Health:</strong> Guaranteed minimum 80% battery health benchmark upon delivery for Grade A devices.</li>
          </ul>
        </PolicySection>

        {/* Section 3 */}
        <PolicySection icon={<AlertTriangle className="h-5 w-5 text-amber-400" />} title="3. Device Trade-In Valuations">
          <p className="font-semibold text-amber-300">
            DISCLAIMER: {TRADE_IN_INSPECTION_DISCLAIMER}
          </p>
          <p className="mt-2">
            Online estimates are indicative based on the condition reported. If an item has hidden defects during hand-off (e.g. liquid spill, bypass locks, dead battery cells), the trade-in quote will be adjusted or rejected.
          </p>
        </PolicySection>

        {/* Section 4 */}
        <PolicySection icon={<RotateCcw className="h-5 w-5 text-indigo-400" />} title="4. How to Claim Your Warranty or Return">
          <p>Filing a claim is quick and completely handled on your campus:</p>
          <ol className="list-decimal list-inside space-y-2 mt-2 text-slate-200">
            <li>Locate your <strong className="text-white">Order Reference ID</strong> and <strong className="text-white">Security Token</strong> from your checkout confirmation.</li>
            <li>Message our WhatsApp Warranty Desk (+255 616 961 511) or visit the <Link href="/support" className="text-indigo-400 underline">Support Portal</Link>.</li>
            <li>Our campus technician or Winga will arrange a physical inspection at your hostel or university landmark within 24 hours.</li>
            <li>If hardware fault is confirmed, immediate replacement or refund is issued.</li>
          </ol>
        </PolicySection>

        {/* Legal Cross-Navigation */}
        <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-400 border-t border-slate-800 pt-6">
          <Link href="/terms-of-service" className="text-indigo-400 hover:underline">
            Terms of Service
          </Link>
          <span className="text-slate-600">·</span>
          <Link href="/privacy-policy" className="text-indigo-400 hover:underline">
            Privacy Policy
          </Link>
          <span className="text-slate-600">·</span>
          <Link href="/cookie-policy" className="text-indigo-400 hover:underline">
            Cookie Policy
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

function PolicySection({
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
