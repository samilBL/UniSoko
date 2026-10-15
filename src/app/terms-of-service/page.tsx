/* eslint-disable react/no-unescaped-entities */
'use client';

import Link from 'next/link';
import Header from '@/components/Header';
import CartDrawer from '@/components/CartDrawer';
import { ArrowLeft, FileText, ShoppingBag, Users, Truck, CreditCard, AlertTriangle, Scale, ShieldCheck } from 'lucide-react';

export default function TermsOfServicePage() {
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
            Legal Agreements &amp; User Terms
          </span>
        </div>

        {/* Hero Card - Solid high-contrast styling */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-8 text-white shadow-xl">
          <div className="flex items-center gap-3.5 mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest block">
                UniSoko Tanzania
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-white">
                Terms of Service
              </h1>
            </div>
          </div>
          <p className="text-slate-300 text-sm leading-relaxed max-w-2xl">
            These Terms govern your use of UniSoko — Tanzania's dedicated university gadget marketplace. By browsing, placing orders, participating in group buys, or registering as a Campus Winga, you agree to these terms.
          </p>
          <div className="mt-5 flex flex-wrap gap-2.5 text-xs">
            <span className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-1 font-semibold text-slate-200">
              Effective: September 1, 2026
            </span>
            <span className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-1 font-semibold text-slate-200">
              Governed By: Laws of Tanzania
            </span>
            <span className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-1 font-semibold text-slate-200">
              Fair Campus Trading Standards
            </span>
          </div>
        </div>

        {/* Section 1 */}
        <TermsSection icon={<Scale className="h-5 w-5 text-indigo-400" />} title="1. Acceptance of Terms">
          <p>
            By accessing or using UniSoko (the "Platform"), you confirm that you are at least 16 years of age (or have student guardian consent) and agree to comply fully with these terms. If you do not agree, you must cease using the Platform.
          </p>
          <p className="mt-2">
            UniSoko operates as a central seller and campus fulfillment network connecting students with quality laptops, phones, and academic gear.
          </p>
        </TermsSection>

        {/* Section 2 */}
        <TermsSection icon={<ShoppingBag className="h-5 w-5 text-indigo-400" />} title="2. Platform Orders & Pricing">
          <p>
            All listed prices are displayed in Tanzanian Shillings (TZS). While we strive for absolute accuracy, inadvertent technical errors in pricing will be corrected promptly with notice to the buyer before dispatch.
          </p>
          <ul className="space-y-2 mt-2">
            <li><strong className="text-white">Wholesale Thresholds ("Bei ya Jumla"):</strong> Automatically apply when order quantity reaches 3+ units across designated gadgets.</li>
            <li><strong className="text-white">Group Buy Sessions:</strong> Run for 24 hours from initiation. Squad members can choose products from any store across the platform. If the minimum squad threshold is met within 24 hours, wholesale rates unlock for all participants.</li>
          </ul>
        </TermsSection>

        {/* Section 3 */}
        <TermsSection icon={<CreditCard className="h-5 w-5 text-indigo-400" />} title="3. Payment & Lipa Namba Policy">
          <p>
            UniSoko facilitates payments exclusively via verified mobile money Lipa Namba channels (M-Pesa, Tigo Pesa, Airtel Money).
          </p>
          <p className="mt-2">
            Customers must submit their official telecom transaction reference ID upon checkout. Submitting fabricated, altered, or duplicate transaction IDs constitutes fraud and results in immediate order rejection and device blacklisting.
          </p>
        </TermsSection>

        {/* Section 4 */}
        <TermsSection icon={<Truck className="h-5 w-5 text-indigo-400" />} title="4. Campus Delivery & Physical Hand-off">
          <p>
            Campus deliveries are conducted by verified student runners (Campus Wingas) to student hostels or official campus landmarks (gates, library fronts, cafeteria squares).
          </p>
          <p className="mt-2">
            The customer is required to present their <strong className="text-white">Order Reference ID</strong> and <strong className="text-white">Security Confirmation Token</strong> during physical hand-off to complete delivery verification.
          </p>
        </TermsSection>

        {/* Section 5 */}
        <TermsSection icon={<Users className="h-5 w-5 text-indigo-400" />} title="5. Campus Winga Program">
          <p>
            Campus Wingas act as student brand representatives and fulfillment agents. Winga commissions are earned only on verified, paid, and completed deliveries. Wingas must adhere to our student ethics code and must never solicit off-platform payments.
          </p>
        </TermsSection>

        {/* Legal Cross-Navigation */}
        <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-400 border-t border-slate-800 pt-6">
          <Link href="/privacy-policy" className="text-indigo-400 hover:underline">
            Privacy Policy
          </Link>
          <span className="text-slate-600">·</span>
          <Link href="/refund-policy" className="text-indigo-400 hover:underline">
            Refund &amp; Warranty Policy
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

function TermsSection({
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
