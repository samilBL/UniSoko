'use client';

import React, { useState, useMemo } from 'react';
import Header from '@/components/Header';
import HeroCarousel from '@/components/HeroCarousel';
import FilterChips, { FilterCategory } from '@/components/FilterChips';
import ProductCard from '@/components/ProductCard';
import WingaRecruitmentBanner from '@/components/WingaRecruitmentBanner';
import CampusEngagement from '@/components/CampusEngagement';
import { openStudentGuide } from '@/lib/studentGuide';
import CartDrawer from '@/components/CartDrawer';
import { useStore } from '@/context/StoreContext';
import {
  ShieldCheck,
  MapPin,
  Layers,
  ArrowRight,
  PlayCircle,
  DollarSign,
  Award,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { createWhatsAppLink } from '@/lib/whatsapp';

export default function StorefrontHomePage() {
  const { selectedCampus, products, storeSettings } = useStore();
  const [selectedFilter, setSelectedFilter] = useState<FilterCategory>('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Calculate counts for chips
  const filterCounts = useMemo(() => {
    return {
      All: products.length,
      Laptops: products.filter((p) => p.category === 'Laptops').length,
      'Laptops & Computers': products.filter((p) => p.category === 'Laptops' || p.category === 'Laptops & Computers').length,
      Phones: products.filter((p) => p.category === 'Phones').length,
      'Smart Phones & Accessories': products.filter((p) => p.category === 'Phones' || p.category === 'Smart Phones & Accessories').length,
      Accessories: products.filter((p) => p.category === 'Accessories').length,
      'Power & Audio': products.filter((p) => p.category === 'Power & Audio').length,
      'Room Gear': products.filter((p) => p.category === 'Room Gear').length,
      'Student Lifestyle Gear': products.filter((p) => p.category === 'Student Lifestyle Gear' || p.category === 'Campus Essentials').length,
      'Campus Essentials': products.filter((p) => p.category === 'Campus Essentials').length,
      'Bei ya Jumla': products.length,
      Trending: products.filter((p) => p.stockStatus === 'Trending').length,
    };
  }, [products]);

  // Filter products based on selected chip and search
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = product.title.toLowerCase().includes(query);
        const matchesDesc = product.description.toLowerCase().includes(query);
        const matchesCategory = product.category.toLowerCase().includes(query);
        if (!matchesTitle && !matchesDesc && !matchesCategory) return false;
      }

      // Category chip filter
      if (selectedFilter === 'All') return true;
      if (selectedFilter === 'Laptops') return product.category === 'Laptops';
      if (selectedFilter === 'Laptops & Computers') return product.category === 'Laptops' || product.category === 'Laptops & Computers';
      if (selectedFilter === 'Phones') return product.category === 'Phones';
      if (selectedFilter === 'Smart Phones & Accessories') return product.category === 'Phones' || product.category === 'Smart Phones & Accessories';
      if (selectedFilter === 'Accessories') return product.category === 'Accessories';
      if (selectedFilter === 'Power & Audio') return product.category === 'Power & Audio';
      if (selectedFilter === 'Room Gear') return product.category === 'Room Gear';
      if (selectedFilter === 'Student Lifestyle Gear') return product.category === 'Student Lifestyle Gear' || product.category === 'Campus Essentials';
      if (selectedFilter === 'Campus Essentials') return product.category === 'Campus Essentials';
      if (selectedFilter === 'Trending') return product.stockStatus === 'Trending';
      if (selectedFilter === 'Bei ya Jumla') return product.priceWholesale > 0;
      return true;
    });
  }, [products, selectedFilter, searchQuery]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 flex flex-col font-sans">
      {/* Header */}
      <Header />

      {/* Main Content Area */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6 space-y-10">
        {/* Top Onboarding & Campus Alert Banner */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-2xl bg-indigo-50/80 px-4 py-2.5 text-xs text-indigo-950 dark:bg-indigo-950/40 dark:text-indigo-200 border border-indigo-100 dark:border-indigo-900/60 shadow-xs">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-indigo-600 animate-pulse" />
            <span className="font-semibold">
              {storeSettings?.bannerNotice || 'Semester Rush: Group wholesale discounts unlock automatically at 3+ units!'}
            </span>
          </div>
          <button
            onClick={openStudentGuide}
            className="inline-flex items-center gap-1.5 font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 underline underline-offset-4 shrink-0"
          >
            <PlayCircle className="h-4 w-4" />
            <span>How UniSoko Works (Student Guide)</span>
          </button>
        </div>

        {/* Hero Carousel */}
        <section>
          <HeroCarousel />
        </section>

        {/* Value Props Strip */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
              <MapPin className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                Hostel Hand-Off in Mbeya
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Direct delivery to {selectedCampus?.shortCode || 'MUST'} hostels
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                Bei ya Jumla (Wholesale)
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Pool 3+ units for direct supplier discount
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                Grade-A Quality Inspected
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Battery health & ports fully certified
              </p>
            </div>
          </div>

          <Link
            href="/sell-device"
            className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900 hover:border-indigo-300 transition-all group"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400 group-hover:scale-105 transition-transform">
              <DollarSign className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-indigo-600">
                Sell / Trade-In Device
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Instant cash & upgrade credits
              </p>
            </div>
          </Link>
        </section>

        {/* Product Catalog Section */}
        <section id="products-section" className="space-y-6 pt-2">
          {/* Section Header & Filter Chips */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4 dark:border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  Featured Gadget Listings
                </h2>
                <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-bold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                  {filteredProducts.length} Available
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Delivering directly to {selectedCampus?.name || 'Mbeya Campuses'} ({selectedCampus?.shortCode || 'MUST'})
              </p>
            </div>

            {/* Filter Chips Bar */}
            <FilterChips
              selectedFilter={selectedFilter}
              onSelectFilter={setSelectedFilter}
              counts={filterCounts}
            />
          </div>

          {/* Wholesale Info Callout */}
          <div
            id="wholesale-info"
            className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-3xl border border-emerald-200 bg-emerald-50 p-5 text-slate-900 shadow-sm"
          >
            <div className="flex items-center gap-3.5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-100">
                <Layers className="h-6 w-6 text-emerald-700" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                  Hostel Pool & Reseller Advantage:
                </p>
                <p className="text-xs sm:text-sm font-semibold text-slate-700">
                  Combine 3 or more gadgets in your cart or pool with roommates to unlock{' '}
                  <span className="underline decoration-emerald-600 decoration-2">Bei ya Jumla</span> wholesale pricing automatically!
                </p>
              </div>
            </div>
            <span className="shrink-0 rounded-xl bg-white px-4 py-2 text-xs font-black text-emerald-800 shadow-sm">
              Min 3 Units Required
            </span>
          </div>

          {/* Product Grid */}
          {filteredProducts.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 p-12 text-center dark:border-slate-800">
              <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                No gadgets found matching your selection.
              </p>
              <button
                onClick={() => {
                  setSelectedFilter('All');
                  setSearchQuery('');
                }}
                className="mt-3 text-xs font-bold text-indigo-600 hover:underline"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </section>

        {/* Sell / Trade-In Banner */}
        <section className="rounded-3xl bg-slate-900 p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 border border-white/10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-3 py-0.5 text-xs font-bold text-emerald-400 border border-emerald-500/30">
              <DollarSign className="h-3.5 w-3.5" />
              <span>Campus Device Buy-Back</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black">
              Got a Laptop or Smartphone You Want to Sell?
            </h3>
            <p className="text-xs text-slate-300 max-w-xl">
              Get an instant valuation and cash out on the spot directly at your campus hostel. We accept HP, Dell, MacBooks, iPhones, and Samsung devices.
            </p>
          </div>

          <Link
            href="/sell-device"
            className="shrink-0 inline-flex items-center gap-2 rounded-2xl bg-emerald-500 px-6 py-3.5 text-xs font-black text-slate-950 shadow-lg hover:bg-emerald-600 active:scale-95 transition-all"
          >
            <span>Sell My Device Now</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </section>

        {/* Winga Recruitment Banner */}
        <section className="pt-2">
          <WingaRecruitmentBanner />
        </section>

        <CampusEngagement />

        {/* Institutional Partners & Badges */}
        <section className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 dark:border-slate-800 dark:bg-slate-900 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Award className="h-4 w-4 text-indigo-600" />
                Institutional Partners & Payment Gateways
              </h3>
              <p className="text-xs text-slate-500">
                Verified campus operations across higher learning institutions in Tanzania
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 pt-2">
            {(storeSettings?.partnerBadges || []).map((badge, idx) => (
              <a
                key={idx}
                href={badge.url && /^https?:\/\//i.test(badge.url) ? badge.url : undefined}
                target={badge.url && /^https?:\/\//i.test(badge.url) ? '_blank' : undefined}
                rel={badge.url && /^https?:\/\//i.test(badge.url) ? 'noreferrer' : undefined}
                className="flex flex-col items-center justify-center gap-1 rounded-2xl border border-slate-200/80 bg-slate-50 p-3 text-center transition hover:border-indigo-300 dark:border-slate-700 dark:bg-slate-800/60"
              >
                {badge.logoUrl ? <Image src={badge.logoUrl} alt={`${badge.name} logo`} width={120} height={32} unoptimized className="h-8 max-w-full object-contain" /> : <span className="font-mono text-xs font-black text-indigo-600 dark:text-indigo-400">{badge.shortCode}</span>}
                <span className="line-clamp-1 text-[11px] font-semibold text-slate-800 dark:text-slate-200">{badge.name}</span>
                <span className="text-[10px] text-slate-400">{badge.category}</span>
              </a>
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="mt-16 border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-center md:text-left">
              <p className="text-lg font-black text-slate-900 dark:text-white">
                UniSoko <span className="text-indigo-600">Tanzania</span>
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md">
                The Dedicated Campus Tech Marketplace for Mbeya Universities (MUST, TEKU, TIA, Mzumbe, CUoM) & Regional Shipping.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-6 text-xs font-bold text-slate-700 dark:text-slate-300">
              <Link href="/sell-device" className="hover:text-indigo-600">
                Sell Your Device
              </Link>
              <Link href="/winga" className="hover:text-indigo-600">
                Become a Winga
              </Link>
              <Link href="/winga/dashboard" className="hover:text-indigo-600">
                Winga Portal
              </Link>
              <a
                href={createWhatsAppLink(storeSettings?.supportWhatsApp || '0616961511', 'Habari UniSoko!')}
                target="_blank"
                rel="noreferrer"
                className="hover:text-emerald-600 text-emerald-700 dark:text-emerald-400"
              >
                WhatsApp Helpline ({storeSettings?.supportPhone || '+255 754 892 110'})
              </a>
            </div>
          </div>

          {(storeSettings?.partnerBadges || []).length > 0 && (
            <div className="border-t border-slate-100 pt-5 dark:border-slate-800">
              <p className="mb-3 text-center text-[10px] font-bold uppercase tracking-widest text-slate-400">Campus partners & sponsors</p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                {storeSettings.partnerBadges.map((partner, index) => (
                  <a key={`${partner.shortCode}-${index}`} href={partner.url && /^https?:\/\//i.test(partner.url) ? partner.url : undefined} target={partner.url && /^https?:\/\//i.test(partner.url) ? '_blank' : undefined} rel={partner.url && /^https?:\/\//i.test(partner.url) ? 'noreferrer' : undefined} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/70 px-3 py-2 text-xs font-semibold text-slate-700 hover:border-indigo-300 dark:border-slate-700 dark:text-slate-200">
                    {partner.logoUrl && <Image src={partner.logoUrl} alt="" width={20} height={20} unoptimized className="h-5 w-5 object-contain" />}{partner.name}
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Legal & Compliance Links */}
          <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
            <div className="text-center sm:text-left">
              <p>© {new Date().getFullYear()} UniSoko. All rights reserved.</p>
              <p className="mt-1">Created by Rheis Ifan · <a className="hover:text-indigo-600" href="tel:0704961511">0704961511</a> · <a className="hover:text-emerald-600" href="https://wa.me/255704961511" target="_blank" rel="noreferrer">WhatsApp</a> · <a className="hover:text-indigo-600" href="mailto:qwazerty01012001@gmail.com">qwazerty01012001@gmail.com</a></p>
            </div>

            <div className="flex items-center gap-5 font-semibold">
              <Link href="/privacy-policy" className="hover:text-indigo-600">
                Privacy Policy
              </Link>
              <Link href="/refund-policy" className="hover:text-indigo-600">
                Refund & Warranty Policy
              </Link>
              <Link href="/terms-of-service" className="hover:text-indigo-600">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </footer>

      {/* Cart Drawer */}
      <CartDrawer />

    </div>
  );
}
