'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Header from '@/components/Header';
import CartDrawer from '@/components/CartDrawer';
import { useStore } from '@/context/StoreContext';
import { DEVELOPER_PROFILE_DEFAULTS, UNISOKO_CONTACT } from '@/lib/siteConfig';
import { createWhatsAppLink } from '@/lib/whatsapp';
import {
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  Users,
  Award,
  Sparkles,
  Phone,
  Mail,
  ArrowUpRight,
  Target,
  GraduationCap,
  Store,
  MapPin,
  Laptop,
} from 'lucide-react';

export default function AboutPage() {
  const { storeSettings } = useStore();
  const developerProfile = { ...DEVELOPER_PROFILE_DEFAULTS, ...storeSettings.developerProfile };
  const whatsappDigits = developerProfile.whatsapp.replace(/\D/g, '');
  const safeDeveloperLink = /^https:\/\//i.test(developerProfile.link) ? developerProfile.link : '';

  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-slate-100 font-sans">
      <Header />

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10 sm:px-6 space-y-12">
        {/* Breadcrumb */}
        <div className="flex items-center justify-between text-xs text-slate-400">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 font-bold text-slate-400 hover:text-indigo-400 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Storefront</span>
          </Link>
          <span className="font-bold uppercase tracking-wider text-indigo-400 text-[10px]">
            About UniSoko &amp; Creator
          </span>
        </div>

        {/* Hero Section */}
        <section className="relative overflow-hidden rounded-3xl border border-slate-800 bg-linear-to-b from-indigo-950/40 via-slate-900 to-slate-900 p-8 sm:p-12 space-y-5">
          <span className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-1.5 text-xs font-bold text-indigo-300">
            <GraduationCap className="h-4 w-4 text-indigo-400" />
            <span>Built by Students, for University Students</span>
          </span>

          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            Empowering Tanzania’s University Community.
          </h1>

          <p className="max-w-2xl text-sm sm:text-base text-slate-300 leading-relaxed">
            UniSoko is Tanzania’s student marketplace, uniting university campuses with certified coursework laptops, essential smartphones, hostel gear, and campus delivery through our Campus Winga runner network.
          </p>

          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              href="/#products-section"
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-xs font-bold text-white shadow-lg hover:bg-indigo-500 transition-all"
            >
              <span>Explore Marketplace</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/careers"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-5 py-3 text-xs font-bold text-slate-200 hover:bg-slate-700 hover:text-white transition-all"
            >
              <Users className="h-4 w-4 text-indigo-400" />
              <span>Join the Team (Careers)</span>
            </Link>
          </div>
        </section>

        {/* Mission & Values Grid */}
        <section className="grid gap-6 sm:grid-cols-3">
          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 space-y-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <Target className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-black text-white">Our Mission</h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              To eliminate the stress, inflated prices, and scam risks student face when buying electronics and essentials for university coursework across Tanzania.
            </p>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 space-y-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-black text-white">Verified Quality</h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              Every device is physically tested by technicians, benchmarked for battery longevity, and backed by a comprehensive 90-day replacement warranty.
            </p>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 space-y-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-600/20 text-amber-400 border border-amber-500/30">
              <Users className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-black text-white">Campus Wingas</h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              We create economic empowerment for students through our peer-to-peer Winga network, offering commissions and student runner opportunities.
            </p>
          </div>
        </section>

        {/* Who We Are & Developer Profile */}
        <section className="rounded-3xl border border-slate-800 bg-slate-900 p-6 sm:p-10 space-y-8">
          <div className="border-b border-slate-800 pb-6">
            <span className="text-xs font-bold uppercase tracking-widest text-indigo-400">
              The Leadership &amp; Engineering
            </span>
            <h2 className="mt-1 text-2xl font-black text-white">Meet the Creator &amp; Developer</h2>
          </div>

          <div className="grid gap-8 sm:grid-cols-[14rem_1fr] sm:items-start">
            {/* Developer Avatar Card */}
            <div className="relative flex aspect-square w-full max-w-56 items-center justify-center overflow-hidden rounded-2xl border border-slate-700 bg-slate-800 text-5xl font-black text-indigo-400 shadow-xl">
              {developerProfile.imageUrl ? (
                <Image
                  src={developerProfile.imageUrl}
                  alt={developerProfile.name}
                  fill
                  sizes="224px"
                  unoptimized
                  className="object-cover"
                />
              ) : (
                'RI'
              )}
            </div>

            {/* Profile Info */}
            <div className="space-y-4">
              <div>
                <span className="inline-block rounded-full bg-emerald-500/10 px-3 py-1 text-[10px] font-bold text-emerald-400 border border-emerald-500/20">
                  Lead Full-Stack Architect &amp; Founder
                </span>
                <h3 className="mt-2 text-2xl sm:text-3xl font-black text-white">
                  {developerProfile.name}
                </h3>
                <p className="text-xs sm:text-sm text-slate-400">
                  Engineer, Product Creator, and Technology Enthusiast
                </p>
              </div>

              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                {developerProfile.story ||
                  'Architected UniSoko to solve practical digital access challenges faced by university students in Tanzania. Focused on building high-performance marketplace workflows, real-time campus logistics, and frictionless Lipa Namba integrations.'}
              </p>

              {/* Contact Actions */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <a
                  href={`tel:${developerProfile.phone}`}
                  className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-slate-800 border border-slate-700 px-4 text-xs font-bold text-white hover:bg-slate-700 transition-all"
                >
                  <Phone className="h-3.5 w-3.5 text-indigo-400" />
                  <span>{developerProfile.phone}</span>
                </a>
                <a
                  href={createWhatsAppLink(whatsappDigits, 'Habari Richard! I am contacting you from the UniSoko About page.')}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-emerald-600 px-4 text-xs font-bold text-white shadow hover:bg-emerald-500 transition-all"
                >
                  <span>WhatsApp Creator</span>
                </a>
                <a
                  href={`mailto:${developerProfile.email}`}
                  className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-4 text-xs font-bold text-slate-200 hover:bg-slate-700 transition-all"
                >
                  <Mail className="h-3.5 w-3.5 text-indigo-400" />
                  <span>Email Developer</span>
                </a>
                {safeDeveloperLink && (
                  <a
                    href={safeDeveloperLink}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-indigo-500/30 bg-indigo-500/10 px-4 text-xs font-bold text-indigo-300 hover:bg-indigo-500/20 transition-all"
                  >
                    <span>Developer Portfolio</span>
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </a>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Coverage Universities */}
        <section className="rounded-3xl border border-slate-800 bg-slate-900 p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-emerald-400" />
            <h2 className="text-lg font-bold text-white">Campus Reach Across Tanzania</h2>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            UniSoko currently supports direct student hand-offs at:
          </p>
          <div className="flex flex-wrap gap-2 text-xs">
            {[
              'MUST (Mbeya)',
              'TEKU (Mbeya)',
              'UDSM (Dar es Salaam)',
              'CBE (Dar es Salaam & Dodoma)',
              'DIT (Dar es Salaam)',
              'IFM (Dar es Salaam)',
              'MZUMBE (Morogoro & Mbeya)',
            ].map((campus) => (
              <span
                key={campus}
                className="rounded-full border border-slate-700 bg-slate-800 px-3 py-1 font-medium text-slate-200"
              >
                📍 {campus}
              </span>
            ))}
          </div>
        </section>
      </main>

      <CartDrawer />
    </div>
  );
}
