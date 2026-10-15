'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import CartDrawer from '@/components/CartDrawer';
import { createWhatsAppLink } from '@/lib/whatsapp';
import { UNISOKO_CONTACT } from '@/lib/siteConfig';
import {
  Megaphone,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Users,
  Target,
  Send,
  MessageCircle,
  HelpCircle,
  ArrowLeft,
  Building,
} from 'lucide-react';

const AD_PACKAGES = [
  {
    id: 'homepage-spotlight',
    name: 'Homepage Spotlight',
    tag: 'Highest Visibility',
    description: 'Prominent banner placed across the UniSoko home storefront, viewed by every visiting student.',
    priceNote: 'Starting at TZS 30,000 / week',
    features: [
      'Top-level placement on UniSoko homepage',
      'Custom image or branded creative display',
      'Direct link to your WhatsApp, website, or product',
      'Weekly click & impression summary',
    ],
  },
  {
    id: 'category-sponsor',
    name: 'Category Exclusive Sponsor',
    tag: 'High Intent',
    description: 'Exclusive placement within targeted student categories like Laptops, Hostels, or Gadgets.',
    priceNote: 'Starting at TZS 25,000 / week',
    features: [
      'Pin your banner above relevant catalog results',
      'Target high-intent student buyers specifically',
      'Great for electronics stores, hostels, or repairs',
      'Verified Partner badge on your ads',
    ],
  },
  {
    id: 'campus-blast',
    name: 'Campus Community Blast',
    tag: 'Direct Reach',
    description: 'Amplified promotion through our verified Campus Winga networks on WhatsApp student groups.',
    priceNote: 'Starting at TZS 40,000 / campaign',
    features: [
      'Direct post across official UniSoko Winga channels',
      'Coverage across MUST, UDSM, CBE, DIT, and IFM groups',
      'Targeted hostel & campus hall broadcasts',
      'Ideal for events, semester launches, or student discounts',
    ],
  },
  {
    id: 'semester-rush',
    name: 'Semester Rush Partner',
    tag: 'Comprehensive Bundle',
    description: 'Full-spectrum advertising campaign including homepage, category pin, and campus community blasts.',
    priceNote: 'Custom / Monthly partnership',
    features: [
      'Homepage banner + Category sponsor combo',
      'Dedicated Campus Winga promotion pushes',
      'Featured logo on UniSoko Trusted By section',
      'Priority account management & creative assistance',
    ],
  },
];

const CAMPUSES = [
  'MUST (Mbeya)',
  'TEKU (Mbeya)',
  'UDSM (Dar es Salaam)',
  'CBE (Dar / Dodoma)',
  'DIT (Dar es Salaam)',
  'IFM (Dar es Salaam)',
  'All Tanzania Campuses',
];

export default function AdvertisePage() {
  const [businessName, setBusinessName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [selectedPackage, setSelectedPackage] = useState(AD_PACKAGES[0].name);
  const [selectedCampuses, setSelectedCampuses] = useState<string[]>(['MUST (Mbeya)']);
  const [budget, setBudget] = useState('');
  const [details, setDetails] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const toggleCampus = (campus: string) => {
    setSelectedCampuses((prev) =>
      prev.includes(campus) ? prev.filter((c) => c !== campus) : [...prev, campus]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessName.trim() || !phone.trim()) {
      setErrorMsg('Please enter your business name and WhatsApp contact number.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/advertise', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessName,
          contactPerson,
          phone,
          email,
          packageType: selectedPackage,
          targetCampuses: selectedCampuses,
          budget,
          campaignDetails: details,
        }),
      });

      if (!res.ok) throw new Error('Could not submit inquiry. Please try again.');
      setSubmitted(true);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const whatsappMessage = `Habari UniSoko Ad Partnerships! I would like to advertise my business (${businessName || 'My Brand'}) on UniSoko. Package of interest: ${selectedPackage}. Target campuses: ${selectedCampuses.join(', ')}.`;

  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-slate-100 font-sans">
      <Header />

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6 space-y-12">
        {/* Breadcrumb */}
        <div className="flex items-center justify-between text-xs text-slate-400">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-slate-400 hover:text-indigo-400 transition-colors font-semibold"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Storefront</span>
          </Link>
          <span className="font-bold uppercase tracking-wider text-indigo-400">
            UniSoko Partnerships &amp; Ads
          </span>
        </div>

        {/* Hero Section */}
        <section className="relative overflow-hidden rounded-3xl border border-slate-800 bg-linear-to-b from-indigo-950/40 via-slate-900 to-slate-900 p-8 sm:p-12 text-center space-y-5">
          <span className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-1.5 text-xs font-bold text-indigo-300">
            <Megaphone className="h-4 w-4 text-indigo-400" />
            <span>Self-Serve Advertising &amp; Sponsor Portal</span>
          </span>

          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            Reach Thousands of University Students Across Tanzania.
          </h1>

          <p className="mx-auto max-w-2xl text-sm sm:text-base text-slate-300 leading-relaxed">
            Put your brand, hostel, tech store, or campus service in front of active students across MUST, UDSM, CBE, DIT, and IFM with high-impact, verified placements.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <a
              href="#booking-form"
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3.5 text-xs font-bold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 transition-all active:scale-95"
            >
              <span>Book an Ad Campaign</span>
              <ArrowRight className="h-4 w-4" />
            </a>
            <a
              href={createWhatsAppLink(UNISOKO_CONTACT.phoneDigits, whatsappMessage)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-950/30 px-6 py-3.5 text-xs font-bold text-emerald-300 hover:bg-emerald-900/40 transition-all"
            >
              <MessageCircle className="h-4 w-4" />
              <span>Chat with Ad Sales on WhatsApp</span>
            </a>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-8 border-t border-slate-800/80">
            <div>
              <p className="text-2xl sm:text-3xl font-black text-white">15,000+</p>
              <p className="text-xs text-slate-400">Active Students</p>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-black text-emerald-400">7+</p>
              <p className="text-xs text-slate-400">Major Campuses</p>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-black text-indigo-400">92%</p>
              <p className="text-xs text-slate-400">Student Mobile Engagement</p>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-black text-amber-400">&lt; 24h</p>
              <p className="text-xs text-slate-400">Campaign Launch Time</p>
            </div>
          </div>
        </section>

        {/* Packages Section */}
        <section className="space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-black text-white">Choose Your Ad Placement</h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Clear, transparent packages designed for student startups, local businesses, and national brands.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {AD_PACKAGES.map((pkg) => {
              const isSelected = selectedPackage === pkg.name;
              return (
                <div
                  key={pkg.id}
                  onClick={() => setSelectedPackage(pkg.name)}
                  className={`cursor-pointer rounded-3xl border p-6 flex flex-col justify-between transition-all ${
                    isSelected
                      ? 'border-indigo-500 bg-indigo-950/30 ring-2 ring-indigo-500/20'
                      : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                  }`}
                >
                  <div className="space-y-4">
                    <span className="inline-block rounded-full bg-indigo-500/10 px-3 py-1 text-[10px] font-extrabold text-indigo-300 border border-indigo-500/20">
                      {pkg.tag}
                    </span>
                    <h3 className="text-lg font-black text-white">{pkg.name}</h3>
                    <p className="text-xs text-slate-300 leading-relaxed">{pkg.description}</p>
                    <p className="text-xs font-bold text-emerald-400">{pkg.priceNote}</p>
                    <ul className="space-y-2 text-xs text-slate-400 border-t border-slate-800/80 pt-4">
                      {pkg.features.map((feat, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400 mt-0.5" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <button
                    type="button"
                    className={`mt-6 w-full rounded-xl py-2.5 text-xs font-bold transition-all ${
                      isSelected
                        ? 'bg-indigo-600 text-white'
                        : 'border border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700'
                    }`}
                  >
                    {isSelected ? 'Selected' : 'Select Package'}
                  </button>
                </div>
              );
            })}
          </div>
        </section>

        {/* Self-Serve Inquiry Form */}
        <section
          id="booking-form"
          className="rounded-3xl border border-slate-800 bg-slate-900 p-6 sm:p-10 space-y-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                <Building className="h-6 w-6 text-indigo-400" />
                <span>Self-Serve Advertising Booking Form</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Fill in your details below. Our advertising team will reach out via WhatsApp to finalize your creative assets and launch your campaign.
              </p>
            </div>
          </div>

          {submitted ? (
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-8 text-center space-y-4">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-black text-white">Campaign Inquiry Received!</h3>
              <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto">
                Thank you for choosing UniSoko. Our advertising partnerships desk will message your WhatsApp at{' '}
                <strong className="text-white">{phone}</strong> within 24 hours to review your creatives and schedule publication.
              </p>
              <div className="pt-2">
                <a
                  href={createWhatsAppLink(UNISOKO_CONTACT.phoneDigits, whatsappMessage)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-xs font-bold text-white shadow hover:bg-emerald-500"
                >
                  <MessageCircle className="h-4 w-4" />
                  <span>Speed up activation on WhatsApp</span>
                </a>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {errorMsg && (
                <p className="rounded-xl bg-red-950/40 border border-red-900 p-3.5 text-xs font-semibold text-red-300">
                  {errorMsg}
                </p>
              )}

              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold text-slate-200">
                    Business / Brand / Service Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="e.g. Mbeya Tech Repairs / New Vision Hostels"
                    className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-200">
                    Contact Person Name
                  </label>
                  <input
                    type="text"
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    placeholder="e.g. Juma Rashid"
                    className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-200">
                    WhatsApp Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. +255 754 000 000"
                    className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-200">
                    Email Address (Optional)
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. contact@business.co.tz"
                    className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Package Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-200 mb-2">
                  Select Desired Package
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {AD_PACKAGES.map((pkg) => (
                    <button
                      key={pkg.id}
                      type="button"
                      onClick={() => setSelectedPackage(pkg.name)}
                      className={`p-3 rounded-xl border text-xs font-semibold text-left transition-all ${
                        selectedPackage === pkg.name
                          ? 'border-indigo-500 bg-indigo-950/40 text-white'
                          : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <p className="font-bold text-white truncate">{pkg.name}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{pkg.priceNote.split('/')[0]}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Target Campuses */}
              <div>
                <label className="block text-xs font-bold text-slate-200 mb-2">
                  Target Campuses (Select all that apply)
                </label>
                <div className="flex flex-wrap gap-2">
                  {CAMPUSES.map((campus) => {
                    const isChecked = selectedCampuses.includes(campus);
                    return (
                      <button
                        key={campus}
                        type="button"
                        onClick={() => toggleCampus(campus)}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                          isChecked
                            ? 'bg-indigo-600 border-indigo-500 text-white'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        {campus}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Campaign Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-200">
                  Campaign Description, Target URL, or Creative Link
                </label>
                <textarea
                  rows={3}
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder="Share details about what you want to promote, preferred start date, or link to Google Drive/Canva design..."
                  className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3.5 text-xs font-bold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 disabled:opacity-50 transition-all active:scale-[0.99]"
              >
                <Send className="h-4 w-4" />
                <span>{isSubmitting ? 'Submitting Inquiry…' : 'Submit Advertising Request'}</span>
              </button>
            </form>
          )}
        </section>
      </main>

      <CartDrawer />
    </div>
  );
}
