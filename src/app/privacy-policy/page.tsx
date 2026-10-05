/* eslint-disable react/no-unescaped-entities */
'use client';

import Link from 'next/link';
import { Shield, ArrowLeft, Lock, Eye, Database, UserCheck, Globe, Bell } from 'lucide-react';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* Header Bar */}
      <div className="sticky top-0 z-10 backdrop-blur-lg bg-white/80 border-b border-slate-200 shadow-sm">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-indigo-600 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to UniSoko
          </Link>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Legal Documentation
          </span>
        </div>
      </div>

      <main className="mx-auto max-w-4xl px-4 sm:px-6 py-12 space-y-10">
        {/* Hero */}
        <div className="rounded-3xl border border-indigo-100 bg-indigo-50 p-8 text-slate-900 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="rounded-2xl bg-white p-3">
              <Shield className="h-6 w-6 text-indigo-600" />
            </div>
            <div>
              <span className="text-xs font-bold text-indigo-700 uppercase tracking-widest block">
                UniSoko Tanzania
              </span>
              <h1 className="text-2xl sm:text-3xl font-black font-heading">
                Privacy Policy
              </h1>
            </div>
          </div>
          <p className="text-slate-700 text-sm leading-relaxed max-w-2xl">
            Your privacy matters to us. This policy explains how UniSoko collects, uses, and protects personal information from students, agents, and visitors across our platform.
          </p>
          <div className="mt-4 flex flex-wrap gap-3 text-xs">
            <span className="rounded-xl border border-indigo-100 bg-white px-3 py-1.5 font-semibold text-slate-700">Effective: September 1, 2026</span>
            <span className="rounded-xl border border-indigo-100 bg-white px-3 py-1.5 font-semibold text-slate-700">Jurisdiction: Tanzania</span>
            <span className="rounded-xl border border-indigo-100 bg-white px-3 py-1.5 font-semibold text-slate-700">Language: English / Kiswahili</span>
          </div>
        </div>

        {/* Section Component Helper rendered inline */}
        <PolicySection icon={<Database className="h-5 w-5 text-indigo-600" />} title="1. Information We Collect">
          <p>We collect information you provide directly when using UniSoko, including:</p>
          <ul>
            <li><strong>Identity Data:</strong> Full name, university/campus affiliation, verified email address, and student ID details or images when provided for Campus Winga identity review.</li>
            <li><strong>Contact Data:</strong> Phone number (used to confirm orders and deliver Lipa Namba receipts via SMS/WhatsApp).</li>
            <li><strong>Order Data:</strong> Products ordered, delivery location (hostel name, room number, campus landmark), quantity, promo codes used, and M-Pesa/Tigo Pesa transaction reference IDs.</li>
            <li><strong>Device Trade-In Data:</strong> Photos, specifications, condition details, and provisional estimate for devices submitted for sale or attached to a purchase.</li>
            <li><strong>Room and Hostel Data:</strong> Room locations, amenities, listing photos, landlord contacts, and student contact details supplied for a vacancy lead or listing.</li>
            <li><strong>Agent Earnings Data:</strong> Winga promo code usage, commission earnings, payout requests, and mobile money disbursement records.</li>
          </ul>
          <p className="mt-3">We also automatically collect limited technical data such as browser type and session timestamps for security and fraud prevention purposes. We do <strong>not</strong> use tracking cookies for advertising.</p>
        </PolicySection>

        <PolicySection icon={<Eye className="h-5 w-5 text-indigo-600" />} title="2. How We Use Your Information">
          <p>UniSoko uses your personal data to:</p>
          <ul>
            <li>Process and fulfil your gadget orders and arrange campus hostel delivery.</li>
            <li>Verify Lipa Namba (M-Pesa / Tigo Pesa) payment transaction IDs against submitted orders.</li>
            <li>Communicate order status updates via WhatsApp and SMS.</li>
            <li>Verify Campus Winga identities through student ID review before authorising mobile money payouts.</li>
            <li>Calculate and credit commission earnings to Winga balances when orders using their promo code are approved.</li>
            <li>Appraise and respond to student device trade-in submissions.</li>
            <li>Apply provisional purchase trade-in estimates, arrange physical inspection, and review room listings and vacancy leads.</li>
            <li>Improve platform features based on aggregate, anonymised usage patterns.</li>
          </ul>
          <p className="mt-3">We will never sell your personal data to third parties or use it for targeted advertising.</p>
        </PolicySection>

        <PolicySection icon={<Lock className="h-5 w-5 text-indigo-600" />} title="3. Data Storage & Security">
          <p>UniSoko stores order and agent data using browser-based local storage for session persistence combined with our secure backend database. The following security measures are applied:</p>
          <ul>
            <li>Student ID card uploads are stored in a private, access-controlled storage bucket — only verified admin staff can view these files.</li>
            <li>Payment transaction IDs are only visible to the customer who submitted them and UniSoko admin staff.</li>
            <li>Mobile money payout records are retained for a minimum of 7 years for financial compliance under Tanzanian law.</li>
            <li>All data transmissions use HTTPS (TLS 1.3) encryption.</li>
          </ul>
        </PolicySection>

        <PolicySection icon={<UserCheck className="h-5 w-5 text-indigo-600" />} title="4. Your Rights as a Data Subject">
          <p>Under Tanzanian data protection principles and in alignment with international best practices, you have the right to:</p>
          <ul>
            <li><strong>Access:</strong> Request a copy of the personal data UniSoko holds about you.</li>
            <li><strong>Correction:</strong> Request correction of inaccurate information (e.g., wrong phone number or university).</li>
            <li><strong>Deletion:</strong> Request deletion of your account and associated data, subject to retention requirements for active orders or unpaid commissions.</li>
            <li><strong>Portability:</strong> Request your earnings and order history in a readable format (CSV/PDF).</li>
            <li><strong>Withdrawal of consent:</strong> Withdraw consent for KYC processing at any time, noting this will suspend your Winga payout eligibility.</li>
          </ul>
          <p className="mt-3">To exercise these rights, contact us on WhatsApp at <strong>+255 616 961 511</strong> or email <strong>qwazerty01012001@gmail.com</strong>.</p>
        </PolicySection>

        <PolicySection icon={<Globe className="h-5 w-5 text-indigo-600" />} title="5. Sharing With Third Parties">
          <p>UniSoko does not share personal data with third parties except in the following limited circumstances:</p>
          <ul>
            <li><strong>Mobile Network Operators:</strong> When processing M-Pesa / Tigo Pesa / Airtel Money disbursements, your registered mobile number is processed by the respective network's B2C API.</li>
            <li><strong>WhatsApp:</strong> When you click an "Order via WhatsApp" link, your order summary and contact details are shared with UniSoko's official business number to initiate a conversation.</li>
            <li><strong>Legal Compliance:</strong> We may disclose information to Tanzanian law enforcement or regulatory authorities if required by a valid court order.</li>
          </ul>
        </PolicySection>

        <PolicySection icon={<Bell className="h-5 w-5 text-indigo-600" />} title="6. Changes to This Policy">
          <p>UniSoko reserves the right to update this Privacy Policy as the platform evolves. Significant changes will be communicated via:</p>
          <ul>
            <li>A notice banner on the UniSoko homepage for 14 days.</li>
            <li>A direct WhatsApp message to registered Wingas.</li>
          </ul>
          <p className="mt-3">Continued use of UniSoko after the notice period constitutes acceptance of the updated policy.</p>
        </PolicySection>

        {/* Contact */}
        <div className="rounded-3xl bg-slate-900 text-white p-6 text-xs space-y-2">
          <h2 className="text-sm font-bold font-heading">Contact UniSoko for Privacy Enquiries</h2>
          <p className="text-slate-300">Data Controller: UniSoko Tanzania Limited</p>
          <p className="text-slate-300">WhatsApp: +255 616 961 511 | Email: qwazerty01012001@gmail.com</p>
          <p className="text-slate-300">Campus Office: MUST Campus, Mbeya, Tanzania</p>
        </div>

        {/* Legal nav footer */}
        <div className="flex flex-wrap gap-3 text-xs font-semibold text-indigo-600 border-t border-slate-200 pt-6">
          <Link href="/refund-policy" className="hover:underline">Refund & Warranty Policy</Link>
          <span className="text-slate-300">|</span>
          <Link href="/terms-of-service" className="hover:underline">Terms of Service</Link>
          <span className="text-slate-300">|</span>
          <Link href="/" className="hover:underline">← Return to Store</Link>
        </div>
      </main>
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
    <section className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-4">
      <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
        <div className="rounded-xl bg-indigo-50 p-2.5">{icon}</div>
        <h2 className="text-base font-bold text-slate-900 font-heading">{title}</h2>
      </div>
      <div className="text-sm text-slate-700 leading-relaxed space-y-3 [&_ul]:list-disc [&_ul]:ml-5 [&_ul]:space-y-2 [&_li]:leading-relaxed">
        {children}
      </div>
    </section>
  );
}
