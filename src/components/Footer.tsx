'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useStore } from '@/context/StoreContext';
import { DEVELOPER_PROFILE_DEFAULTS, UNISOKO_CONTACT } from '@/lib/siteConfig';
import { createWhatsAppLink } from '@/lib/whatsapp';
import {
  Sparkles,
  ChevronDown,
  Megaphone,
  Briefcase,
  ArrowUp,
} from 'lucide-react';

export default function Footer() {
  const { storeSettings } = useStore();
  const developerProfile = { ...DEVELOPER_PROFILE_DEFAULTS, ...storeSettings.developerProfile };
  const [showDev, setShowDev] = useState(false);

  return (
    <footer className="mt-16 border-t border-slate-800 bg-slate-950 py-12 text-slate-400 font-sans">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Main Grid */}
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-5">
          {/* Brand Info */}
          <div className="space-y-3 lg:col-span-2">
            <Link href="/" className="inline-flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600 text-white font-black text-sm">
                US
              </span>
              <span className="text-xl font-black text-white">
                Uni<span className="text-indigo-400">Soko</span> Tanzania
              </span>
            </Link>
            <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
              Tanzania&apos;s dedicated university student marketplace connecting university communities across MUST, UDSM, CBE, DIT, and IFM with inspected laptops, phones, group-buy bulk pricing, and reliable hostel hand-off delivery.
            </p>
            <div className="pt-2 text-xs text-slate-300 space-y-1">
              <p>📍 Campus Hub: MUST Campus (Iyunga), Mbeya, Tanzania</p>
              <p>
                📞 Customer Helpline:{' '}
                <a
                  href={createWhatsAppLink(UNISOKO_CONTACT.phoneDigits, 'Habari UniSoko!')}
                  target="_blank"
                  rel="noreferrer"
                  className="font-bold text-emerald-400 hover:underline"
                >
                  {UNISOKO_CONTACT.phoneDisplay}
                </a>
              </p>
            </div>
          </div>

          {/* Quick Services */}
          <div className="space-y-3">
            <p className="text-xs font-black uppercase tracking-wider text-white">Student Services</p>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/sell-device" className="hover:text-white transition-colors">
                  Sell / Trade-In Device
                </Link>
              </li>
              <li>
                <Link href="/grad-clearance" className="hover:text-white transition-colors flex items-center gap-1.5">
                  <span>Grad Clearance Deals</span>
                  <span className="rounded-full bg-amber-500/20 px-1.5 py-0.2 text-[9px] font-black text-amber-300">Hot</span>
                </Link>
              </li>
              <li>
                <Link href="/bundles" className="hover:text-white transition-colors">
                  Student Semester Bundles
                </Link>
              </li>
              <li>
                <Link href="/hostels" className="hover:text-white transition-colors">
                  Campus Hostel Directory
                </Link>
              </li>
              <li>
                <Link href="/support" className="text-indigo-400 hover:text-indigo-300 transition-colors">
                  Support &amp; 90-Day Warranty
                </Link>
              </li>
            </ul>
          </div>

          {/* Winga & Business Opportunities */}
          <div className="space-y-3">
            <p className="text-xs font-black uppercase tracking-wider text-white">Work &amp; Partnerships</p>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/winga/register" className="hover:text-white transition-colors flex items-center gap-1">
                  <Sparkles className="h-3 w-3 text-emerald-400" />
                  <span>Become Campus Winga</span>
                </Link>
              </li>
              <li>
                <Link href="/winga/login" className="hover:text-white transition-colors">
                  Winga Agent Portal
                </Link>
              </li>
              <li>
                <Link href="/seller" className="hover:text-white transition-colors">
                  Become a Marketplace Seller
                </Link>
              </li>
              <li>
                <Link
                  href="/advertise"
                  className="text-amber-400 hover:text-amber-300 transition-colors font-semibold flex items-center gap-1"
                >
                  <Megaphone className="h-3.5 w-3.5" />
                  <span>Advertise with UniSoko</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/careers"
                  className="text-indigo-400 hover:text-indigo-300 transition-colors font-semibold flex items-center gap-1"
                >
                  <Briefcase className="h-3.5 w-3.5" />
                  <span>Careers Portal</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Company & Legal Policies */}
          <div className="space-y-3">
            <p className="text-xs font-black uppercase tracking-wider text-white">Company &amp; Legal</p>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/about" className="hover:text-white transition-colors">
                  Who We Are &amp; Developer
                </Link>
              </li>
              <li><Link href="/everything-we-do" className="hover:text-white transition-colors">Everything We Do</Link></li>
              <li>
                <Link href="/terms-of-service" className="hover:text-white transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/privacy-policy" className="hover:text-white transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/refund-policy" className="hover:text-white transition-colors">
                  Refund &amp; Warranty Policy
                </Link>
              </li>
              <li>
                <Link href="/cookie-policy" className="hover:text-white transition-colors">
                  Cookie &amp; Storage Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Developer Profile Toggle Accordion */}
        <div className="border-t border-slate-800/80 pt-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
            <div className="flex flex-wrap items-center gap-3">
              <p>© {new Date().getFullYear()} UniSoko Tanzania. All rights reserved.</p>
              <button
                type="button"
                onClick={() => setShowDev((v) => !v)}
                className="inline-flex items-center gap-1.5 rounded-full border border-slate-800 bg-slate-900 px-3 py-1 text-[11px] font-semibold text-slate-300 hover:border-indigo-500 hover:text-white transition-all"
              >
                <span>About Developer</span>
                <ChevronDown className={`h-3 w-3 transition-transform ${showDev ? 'rotate-180' : ''}`} />
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs font-semibold">
              <Link href="/privacy-policy" className="text-slate-400 hover:text-indigo-400">
                Privacy
              </Link>
              <Link href="/terms-of-service" className="text-slate-400 hover:text-indigo-400">
                Terms
              </Link>
              <Link href="/cookie-policy" className="text-slate-400 hover:text-indigo-400">
                Cookies
              </Link>
              <Link href="/advertise" className="text-amber-400 hover:text-amber-300">
                Advertise
              </Link>
              <button
                type="button"
                onClick={() => {
                  try {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                    document.documentElement.scrollTo({ top: 0, behavior: 'smooth' });
                  } catch {
                    window.scrollTo(0, 0);
                  }
                }}
                className="inline-flex items-center gap-1 text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors ml-auto sm:ml-2"
                aria-label="Back to top of page"
              >
                <ArrowUp className="h-3.5 w-3.5" />
                <span>Back to top</span>
              </button>
            </div>
          </div>

          {showDev && (
            <div className="mt-4 flex flex-wrap items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900/90 p-4 text-xs animate-in fade-in">
              {developerProfile.imageUrl ? (
                <Image
                  src={developerProfile.imageUrl}
                  alt={developerProfile.name}
                  width={38}
                  height={38}
                  unoptimized
                  className="h-9 w-9 rounded-full object-cover"
                />
              ) : (
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-600/30 text-xs font-black text-indigo-300">
                  RI
                </span>
              )}
              <div>
                <p className="text-[10px] font-bold uppercase text-slate-400">Architect &amp; Creator</p>
                <p className="font-bold text-white">
                  {developerProfile.name}{' '}
                  <span className="font-normal text-slate-400">· Full-Stack Developer</span>
                </p>
              </div>
              <Link
                href="/about"
                className="ml-auto font-semibold text-indigo-400 hover:text-indigo-300 underline text-xs"
              >
                View Full Profile &amp; Story →
              </Link>
              <p className="w-full mt-1 text-slate-400 border-t border-slate-800 pt-2">
                <a className="hover:text-indigo-300" href={`tel:${developerProfile.phone}`}>
                  {developerProfile.phone}
                </a>
                {' · '}
                <a
                  className="hover:text-emerald-400"
                  href={createWhatsAppLink(developerProfile.whatsapp, 'Hello UniSoko, I would like to get in touch with the developer.')}
                  target="_blank"
                  rel="noreferrer"
                >
                  WhatsApp
                </a>
                {' · '}
                <a className="hover:text-indigo-300" href={`mailto:${developerProfile.email}`}>
                  {developerProfile.email}
                </a>
              </p>
            </div>
          )}
        </div>
      </div>
    </footer>
  );
}
