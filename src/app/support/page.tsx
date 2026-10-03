'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Headphones, 
  ShieldCheck, 
  RotateCcw, 
  MessageSquare, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  Clock, 
  Phone, 
  Sparkles,
  HelpCircle,
  FileQuestion
} from 'lucide-react';
import { UNISOKO_CONTACT } from '@/lib/siteConfig';

export default function SupportPage() {
  const [activeTab, setActiveTab] = useState<'ticket' | 'warranty' | 'faq'>('ticket');

  // Support Ticket Form State
  const [ticketForm, setTicketForm] = useState({
    buyerName: '',
    buyerPhone: '',
    orderId: '',
    subject: 'Payment',
    message: ''
  });
  const [ticketLoading, setTicketLoading] = useState(false);
  const [ticketSuccess, setTicketSuccess] = useState<string | null>(null);
  const [ticketError, setTicketError] = useState<string | null>(null);

  // Warranty Claim Form State
  const [warrantyForm, setWarrantyForm] = useState({
    buyerName: '',
    buyerPhone: '',
    orderId: '',
    claimType: 'Warranty',
    description: ''
  });
  const [warrantyLoading, setWarrantyLoading] = useState(false);
  const [warrantySuccess, setWarrantySuccess] = useState<string | null>(null);
  const [warrantyError, setWarrantyError] = useState<string | null>(null);

  const handleTicketSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTicketLoading(true);
    setTicketError(null);
    setTicketSuccess(null);

    try {
      const res = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ticketForm)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit ticket');
      setTicketSuccess(data.message || 'Support ticket submitted successfully!');
      setTicketForm({ buyerName: '', buyerPhone: '', orderId: '', subject: 'Payment', message: '' });
    } catch (err: any) {
      setTicketError(err.message || 'Something went wrong');
    } finally {
      setTicketLoading(false);
    }
  };

  const handleWarrantySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setWarrantyLoading(true);
    setWarrantyError(null);
    setWarrantySuccess(null);

    try {
      const res = await fetch('/api/warranty', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(warrantyForm)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit warranty claim');
      setWarrantySuccess(data.message || 'Claim submitted successfully!');
      setWarrantyForm({ buyerName: '', buyerPhone: '', orderId: '', claimType: 'Warranty', description: '' });
    } catch (err: any) {
      setWarrantyError(err.message || 'Something went wrong');
    } finally {
      setWarrantyLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white selection:bg-indigo-500 selection:text-white pb-24">
      {/* Hero Header */}
      <section className="relative overflow-hidden border-b border-slate-800 bg-gradient-to-b from-indigo-950/40 via-slate-950 to-slate-950 py-16 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-1.5 text-xs font-semibold text-indigo-400">
            <Sparkles className="w-3.5 h-3.5" />
            Student Protection & Care Hub
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-indigo-300">
            UniSoko Customer Support & Guarantee
          </h1>
          <p className="max-w-2xl mx-auto text-slate-400 text-sm sm:text-base">
            Direct assistance from our Mbeya HQ operations team. Fast resolutions for orders, warranty claims, returns, and campus deliveries.
          </p>

          {/* Quick Direct WhatsApp CTA */}
          <div className="pt-4 flex flex-wrap justify-center gap-3">
            <a
              href={`https://wa.me/${UNISOKO_CONTACT.phoneDigits}?text=${encodeURIComponent('Hello UniSoko Support, I need help with an order.')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-6 py-3.5 text-sm transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
            >
              <MessageSquare className="w-4 h-4 fill-current" />
              Chat on WhatsApp ({UNISOKO_CONTACT.phoneDisplay})
            </a>
            <a
              href={`tel:${UNISOKO_CONTACT.phoneDigits}`}
              className="inline-flex items-center gap-2.5 rounded-2xl bg-slate-900 border border-slate-700 hover:border-slate-500 text-white font-semibold px-6 py-3.5 text-sm transition-all active:scale-95"
            >
              <Phone className="w-4 h-4 text-indigo-400" />
              Call Support Direct
            </a>
          </div>
        </div>
      </section>

      {/* Main Tabs Navigation */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 pt-10">
        <div className="grid grid-cols-3 gap-2 p-1.5 rounded-2xl bg-slate-900 border border-slate-800">
          <button
            onClick={() => setActiveTab('ticket')}
            className={`flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-xs sm:text-sm transition-all ${
              activeTab === 'ticket'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Headphones className="w-4 h-4" />
            Support Ticket
          </button>
          <button
            onClick={() => setActiveTab('warranty')}
            className={`flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-xs sm:text-sm transition-all ${
              activeTab === 'warranty'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            Warranty & Returns
          </button>
          <button
            onClick={() => setActiveTab('faq')}
            className={`flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-xs sm:text-sm transition-all ${
              activeTab === 'faq'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            FAQs & Policies
          </button>
        </div>

        {/* Tab 1: Support Ticket */}
        {activeTab === 'ticket' && (
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-slate-900/60 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Headphones className="w-5 h-5 text-indigo-400" />
                  Submit a Support Request
                </h2>
                <p className="text-sm text-slate-400 mt-1">
                  Have an issue with payment verification, delivery delay, or need order changes? Leave a ticket and our team will get back to you immediately.
                </p>
              </div>

              {ticketSuccess && (
                <div className="p-4 rounded-2xl bg-emerald-950/50 border border-emerald-500/30 text-emerald-300 flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-semibold">Ticket Received!</p>
                    <p className="text-xs text-emerald-400/90 mt-0.5">{ticketSuccess}</p>
                  </div>
                </div>
              )}

              {ticketError && (
                <div className="p-4 rounded-2xl bg-rose-950/50 border border-rose-500/30 text-rose-300 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                  <p className="text-sm">{ticketError}</p>
                </div>
              )}

              <form onSubmit={handleTicketSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Your Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rheis Misalek"
                      value={ticketForm.buyerName}
                      onChange={(e) => setTicketForm({ ...ticketForm, buyerName: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">WhatsApp / Phone Number *</label>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. 0616961511"
                      value={ticketForm.buyerPhone}
                      onChange={(e) => setTicketForm({ ...ticketForm, buyerPhone: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Order ID (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. ORD-17290..."
                      value={ticketForm.orderId}
                      onChange={(e) => setTicketForm({ ...ticketForm, orderId: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Issue Subject *</label>
                    <select
                      value={ticketForm.subject}
                      onChange={(e) => setTicketForm({ ...ticketForm, subject: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500"
                    >
                      <option value="Payment">Payment / Lipa Namba Issue</option>
                      <option value="Delivery">Delivery / Winga Pickup Delay</option>
                      <option value="Wrong product">Wrong Item Received</option>
                      <option value="Damaged product">Damaged Item</option>
                      <option value="Cancellation">Order Cancellation</option>
                      <option value="Warranty">Warranty Question</option>
                      <option value="Other">Other Question</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Describe your issue in detail *</label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Provide details such as transaction message snippet, hostel delivery location, or what went wrong..."
                    value={ticketForm.message}
                    onChange={(e) => setTicketForm({ ...ticketForm, message: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-sm text-white focus:outline-none focus:border-indigo-500 resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={ticketLoading}
                  className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-sm transition-all shadow-lg shadow-indigo-600/20 active:scale-[0.98]"
                >
                  {ticketLoading ? 'Submitting Ticket...' : 'Submit Support Ticket'}
                </button>
              </form>
            </div>

            {/* Sidebar Guide */}
            <div className="space-y-6">
              <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 space-y-4">
                <h3 className="font-bold text-white text-base flex items-center gap-2">
                  <Clock className="w-4 h-4 text-indigo-400" />
                  Response SLA
                </h3>
                <ul className="space-y-3 text-xs text-slate-400">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span><strong>WhatsApp:</strong> 5–15 minutes during operating hours (8:00 AM – 9:00 PM).</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span><strong>Support Tickets:</strong> Resolved within 2 hours.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span><strong>Delivery Inquiries:</strong> Live coordination with your campus Winga.</span>
                  </li>
                </ul>
              </div>

              <div className="bg-gradient-to-br from-indigo-950/40 to-slate-900 border border-indigo-500/20 rounded-3xl p-6 space-y-3">
                <h3 className="font-bold text-white text-base">Track Existing Order?</h3>
                <p className="text-xs text-slate-400">
                  You can check real-time status, Lipa Namba verification, and winga dispatch directly on the tracking portal.
                </p>
                <Link
                  href="/track"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-400 hover:text-indigo-300"
                >
                  Go to Tracking Portal <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Warranty & Returns */}
        {activeTab === 'warranty' && (
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-slate-900/60 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  Submit Warranty Claim or Return Request
                </h2>
                <p className="text-sm text-slate-400 mt-1">
                  All UniSoko products come with a minimum 30-day student warranty guarantee. If your device malfunctions or is not as described, request a repair, replacement, or refund.
                </p>
              </div>

              {warrantySuccess && (
                <div className="p-4 rounded-2xl bg-emerald-950/50 border border-emerald-500/30 text-emerald-300 flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-semibold">Claim Logged!</p>
                    <p className="text-xs text-emerald-400/90 mt-0.5">{warrantySuccess}</p>
                  </div>
                </div>
              )}

              {warrantyError && (
                <div className="p-4 rounded-2xl bg-rose-950/50 border border-rose-500/30 text-rose-300 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                  <p className="text-sm">{warrantyError}</p>
                </div>
              )}

              <form onSubmit={handleWarrantySubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Order ID *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. ORD-17290..."
                      value={warrantyForm.orderId}
                      onChange={(e) => setWarrantyForm({ ...warrantyForm, orderId: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Claim Type *</label>
                    <select
                      value={warrantyForm.claimType}
                      onChange={(e) => setWarrantyForm({ ...warrantyForm, claimType: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500"
                    >
                      <option value="Warranty">Warranty Repair / Malfunction</option>
                      <option value="Return">Product Return / Exchange</option>
                      <option value="Damaged">Damaged on Arrival</option>
                      <option value="Wrong item">Wrong Product Dispatched</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Your Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rheis Misalek"
                      value={warrantyForm.buyerName}
                      onChange={(e) => setWarrantyForm({ ...warrantyForm, buyerName: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">WhatsApp / Phone Number *</label>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. 0616961511"
                      value={warrantyForm.buyerPhone}
                      onChange={(e) => setWarrantyForm({ ...warrantyForm, buyerPhone: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Fault Details & Symptoms *</label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Describe what is wrong with the device (e.g. battery draining quickly, screen flickering, charging port loose, missing accessory)..."
                    value={warrantyForm.description}
                    onChange={(e) => setWarrantyForm({ ...warrantyForm, description: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-sm text-white focus:outline-none focus:border-indigo-500 resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={warrantyLoading}
                  className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-sm transition-all shadow-lg shadow-emerald-600/20 active:scale-[0.98]"
                >
                  {warrantyLoading ? 'Recording Claim...' : 'Submit Warranty / Return Claim'}
                </button>
              </form>
            </div>

            {/* Warranty terms callout */}
            <div className="space-y-6">
              <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 space-y-4">
                <h3 className="font-bold text-white text-base flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  UniSoko 30-Day Guarantee
                </h3>
                <div className="space-y-3 text-xs text-slate-400">
                  <p><strong>1. Campus Drop-Off:</strong> You can hand over the device to your campus Winga or our Mbeya HQ hub.</p>
                  <p><strong>2. 24-Hour Inspection:</strong> Our technical team tests hardware issues immediately upon receipt.</p>
                  <p><strong>3. Fast Resolution:</strong> Direct same-day replacement if in stock, or full refund if unresolved within 3 business days.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: FAQs & Policies */}
        {activeTab === 'faq' && (
          <div className="mt-8 space-y-6 max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 space-y-2">
                <h4 className="font-bold text-white text-sm flex items-center gap-2">
                  <FileQuestion className="w-4 h-4 text-indigo-400" />
                  How do I pay with Lipa Namba?
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Use Lipa Namba <strong>5849201</strong> (UNISOKO TECH CAMPUS HUB) on M-Pesa, Tigo Pesa, Airtel Money, or AzamPesa. After paying, paste your transaction ID into checkout or tracking.
                </p>
              </div>

              <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 space-y-2">
                <h4 className="font-bold text-white text-sm flex items-center gap-2">
                  <RotateCcw className="w-4 h-4 text-indigo-400" />
                  Can I cancel an order before delivery?
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Yes! Open your tracking link and submit a cancellation request. If the order has not been dispatched, your payment is refunded within 24 hours.
                </p>
              </div>

              <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 space-y-2">
                <h4 className="font-bold text-white text-sm flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-indigo-400" />
                  What is covered under Warranty?
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Hardware defects, battery failures, internal component faults, and screen issues not caused by accidental liquid/drop damage are fully covered.
                </p>
              </div>

              <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 space-y-2">
                <h4 className="font-bold text-white text-sm flex items-center gap-2">
                  <Headphones className="w-4 h-4 text-indigo-400" />
                  How do I reach the developer or management?
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  You can reach the platform creator Rheis Ifan Misalek via WhatsApp at <strong>{UNISOKO_CONTACT.phoneDisplay}</strong> or review the developer profile page.
                </p>
              </div>
            </div>

            <div className="flex justify-center gap-4 pt-4 text-xs font-semibold text-slate-400">
              <Link href="/refund-policy" className="hover:text-white underline">Refund Policy</Link>
              <span>•</span>
              <Link href="/terms-of-service" className="hover:text-white underline">Terms of Service</Link>
              <span>•</span>
              <Link href="/privacy-policy" className="hover:text-white underline">Privacy Policy</Link>
              <span>•</span>
              <Link href="/developer" className="hover:text-white underline">Developer Story</Link>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
