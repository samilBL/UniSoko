/* eslint-disable react/no-unescaped-entities */
'use client';

import Link from 'next/link';
import Header from '@/components/Header';
import CartDrawer from '@/components/CartDrawer';
import { Shield, ArrowLeft, Lock, Eye, Database, UserCheck, Globe, Bell } from 'lucide-react';

export default function PrivacyPolicyPage() {
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
            Legal &amp; Compliance Documentation
          </span>
        </div>

        {/* Hero Card - Solid high-contrast styling, zero glare */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-8 text-white shadow-xl">
          <div className="flex items-center gap-3.5 mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <Shield className="h-6 w-6" />
            </div>
            <div>
              <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest block">
                UniSoko Tanzania
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-white">
                Privacy Policy
              </h1>
            </div>
          </div>
          <p className="text-slate-300 text-sm leading-relaxed max-w-2xl">
            Your privacy matters to us. This policy explains how UniSoko collects, uses, and safeguards personal information from students, Wingas, and marketplace customers across Tanzania.
          </p>
          <div className="mt-5 flex flex-wrap gap-2.5 text-xs">
            <span className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-1 font-semibold text-slate-200">
              Effective: September 1, 2026
            </span>
            <span className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-1 font-semibold text-slate-200">
              Jurisdiction: Tanzania
            </span>
            <span className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-1 font-semibold text-slate-200">
              Zero Third-Party Ad Tracking
            </span>
          </div>
        </div>

        {/* Section 1 */}
        <PolicySection icon={<Database className="h-5 w-5 text-indigo-400" />} title="1. Information We Collect">
          <p>We collect information you provide directly when browsing and placing orders on UniSoko, including:</p>
          <ul className="space-y-2 mt-2">
            <li>
              <strong className="text-white">Identity Data:</strong> Full name, university affiliation, verified email, and student ID details when applying as a Campus Winga.
            </li>
            <li>
              <strong className="text-white">Contact Data:</strong> Phone number (used to coordinate deliveries, send SMS/WhatsApp order updates, and deliver payment tokens).
            </li>
            <li>
              <strong className="text-white">Order &amp; Transaction Data:</strong> Products purchased, delivery coordinates (hostel name, room number, campus drop spot), quantity, promo codes applied, and Lipa Namba reference IDs.
            </li>
            <li>
              <strong className="text-white">Device Trade-In Data:</strong> Photos, specifications, IMEI/serial details, and condition notes submitted for valuation.
            </li>
            <li>
              <strong className="text-white">Hostel &amp; Room Listings:</strong> Room locations, amenities, photos, landlord contacts, and student inquiry information.
            </li>
          </ul>
        </PolicySection>

        {/* Section 2 */}
        <PolicySection icon={<Lock className="h-5 w-5 text-indigo-400" />} title="2. How We Use Your Information">
          <p>UniSoko utilizes your personal data strictly for operations and customer delivery:</p>
          <ul className="space-y-2 mt-2">
            <li>Fulfilling and verifying your orders through our central dispatch team and campus student runners (Wingas).</li>
            <li>Providing order confirmation tokens, tracking links, and digital warranty receipts.</li>
            <li>Verifying student eligibility for exclusive wholesale pricing and graduation clearance discounts.</li>
            <li>Processing device trade-in valuations and seller payouts.</li>
            <li>Preventing fraudulent orders and duplicate Lipa Namba submissions.</li>
          </ul>
        </PolicySection>

        {/* Section 3 */}
        <PolicySection icon={<Eye className="h-5 w-5 text-indigo-400" />} title="3. Information Sharing & Third Parties">
          <p>We believe in absolute data transparency. UniSoko never sells your data to brokers, advertising networks, or third parties.</p>
          <p className="mt-2">Limited sharing occurs exclusively with:</p>
          <ul className="space-y-2 mt-2">
            <li>
              <strong className="text-white">Campus Wingas / Runners:</strong> Granted access only to your name, phone number, and delivery room/landmark to fulfill physical hand-offs.
            </li>
            <li>
              <strong className="text-white">Payment Networks:</strong> Telecom networks (Vodacom, Tigo, Airtel) to verify Lipa Namba transaction codes.
            </li>
            <li>
              <strong className="text-white">Courier Services:</strong> Inter-city couriers for off-campus deliveries outside of Mbeya.
            </li>
          </ul>
        </PolicySection>

        {/* Section 4 */}
        <PolicySection icon={<Globe className="h-5 w-5 text-indigo-400" />} title="4. Cookies & Local Storage">
          <p>
            UniSoko uses privacy-first browser local storage and essential session cookies strictly to preserve your active shopping cart, campus location choice, and group buy tokens.
          </p>
          <p className="mt-2">
            We do <strong className="text-white">not</strong> use third-party tracking pixels, marketing cookies, or fingerprinting technologies. For details, review our{' '}
            <Link href="/cookie-policy" className="text-indigo-400 underline hover:text-indigo-300">
              Cookie Policy
            </Link>.
          </p>
        </PolicySection>

        {/* Section 5 */}
        <PolicySection icon={<UserCheck className="h-5 w-5 text-indigo-400" />} title="5. Data Retention & Your Rights">
          <p>
            You retain full rights over your data. You may request a copy of your purchase history, ask for correction of inaccurate details, or request account deletion at any time by contacting our support team via WhatsApp or email.
          </p>
        </PolicySection>

        {/* Contact Info Card */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 text-xs text-slate-300 space-y-2">
          <h2 className="text-sm font-extrabold text-white">Contact UniSoko Data Controller</h2>
          <p className="text-slate-300">Entity: UniSoko Tanzania Marketplace</p>
          <p className="text-slate-300">WhatsApp Helpline: +255 616 961 511 | Email: support@unisoko.co.tz</p>
          <p className="text-slate-300">Campus Hub: MUST Campus (Iyunga), Mbeya, Tanzania</p>
        </div>

        {/* Legal Cross-Navigation */}
        <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-400 border-t border-slate-800 pt-6">
          <Link href="/terms-of-service" className="text-indigo-400 hover:underline">
            Terms of Service
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
