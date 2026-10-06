'use client';

import React, { useState, useMemo } from 'react';
import Header from '@/components/Header';
import HeroCarousel from '@/components/HeroCarousel';
import FilterChips, { FilterCategory } from '@/components/FilterChips';
import ProductCard from '@/components/ProductCard';
import WingaRecruitmentBanner from '@/components/WingaRecruitmentBanner';
import CampusEngagement from '@/components/CampusEngagement';
import HomepageBanners from '@/components/HomepageBanners';
import TrustedBySection from '@/components/TrustedBySection';
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
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { createWhatsAppLink } from '@/lib/whatsapp';
import { matchesProductSearch } from '@/lib/productSpecs';
import { DEVELOPER_PROFILE_DEFAULTS, UNISOKO_CONTACT } from '@/lib/siteConfig';

export default function StorefrontHomePage() {
  const { selectedCampus, products, storeSettings, searchQuery, setSearchQuery } = useStore();
  const developerProfile = { ...DEVELOPER_PROFILE_DEFAULTS, ...storeSettings.developerProfile };
  const [selectedFilter, setSelectedFilter] = useState<FilterCategory>('All');
  const [showDev, setShowDev] = useState(false);
  const [maxPrice, setMaxPrice] = useState('');
  const [sellerFilter, setSellerFilter] = useState('all');
  const [sortBy, setSortBy] = useState('featured');

  // Calculate counts for chips
  const filterCounts = useMemo(() => {
    return {
      All: products.length,
      Laptops: products.filter((p) => p.category === 'Laptops' || p.category === 'Laptops & Computers').length,
      'Laptops & Computers': products.filter((p) => p.category === 'Laptops' || p.category === 'Laptops & Computers').length,
      Phones: products.filter((p) => p.category === 'Phones' || p.category === 'Smart Phones & Accessories').length,
      'Smart Phones & Accessories': products.filter((p) => p.category === 'Phones' || p.category === 'Smart Phones & Accessories').length,
      Accessories: products.filter((p) => p.category === 'Accessories').length,
      'Power & Audio': products.filter((p) => p.category === 'Power & Audio').length,
      'Room Gear': products.filter((p) => p.category === 'Room Gear').length,
      'Student Lifestyle Gear': products.filter((p) => p.category === 'Student Lifestyle Gear' || p.category === 'Campus Essentials').length,
      'Campus Essentials': products.filter((p) => p.category === 'Campus Essentials').length,
      'Bei ya Jumla': products.filter((p) => p.priceWholesale > 0).length,
      Trending: products.filter((p) => p.stockStatus === 'Trending').length,
    };
  }, [products]);

  // Filter products based on selected chip and search
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      // Search filter
      if (searchQuery.trim() && !matchesProductSearch(product, searchQuery)) return false;
      if (maxPrice && product.priceRetail > Number(maxPrice)) return false;
      if (sellerFilter === 'verified' && !product.sellerVerified) return false;
      if (sellerFilter === 'official' && !product.officialUniSoko) return false;

      // Category chip filter
      if (selectedFilter === 'All') return true;
      if (selectedFilter === 'Laptops') return product.category === 'Laptops' || product.category === 'Laptops & Computers';
      if (selectedFilter === 'Laptops & Computers') return product.category === 'Laptops' || product.category === 'Laptops & Computers';
      if (selectedFilter === 'Phones') return product.category === 'Phones' || product.category === 'Smart Phones & Accessories';
      if (selectedFilter === 'Smart Phones & Accessories') return product.category === 'Phones' || product.category === 'Smart Phones & Accessories';
      if (selectedFilter === 'Accessories') return product.category === 'Accessories';
      if (selectedFilter === 'Power & Audio') return product.category === 'Power & Audio';
      if (selectedFilter === 'Room Gear') return product.category === 'Room Gear';
      if (selectedFilter === 'Student Lifestyle Gear') return product.category === 'Student Lifestyle Gear' || product.category === 'Campus Essentials';
      if (selectedFilter === 'Campus Essentials') return product.category === 'Campus Essentials';
      if (selectedFilter === 'Trending') return product.stockStatus === 'Trending';
      if (selectedFilter === 'Bei ya Jumla') return product.priceWholesale > 0;
      return true;
        }).sort((a, b) => sortBy === 'price-low' ? a.priceRetail - b.priceRetail : sortBy === 'price-high' ? b.priceRetail - a.priceRetail : Number(Boolean(b.featured)) - Number(Boolean(a.featured)));
  }, [products, selectedFilter, searchQuery, maxPrice, sellerFilter, sortBy]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 flex flex-col font-sans">
      {/* Header */}
      <Header />

      {/* Main Content Area */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6 space-y-10">
        {/* Top Onboarding & Campus Alert Banner */}
        <div className="flex flex-col gap-3 rounded-2xl border border-indigo-100 bg-indigo-50/80 px-4 py-3 text-xs text-indigo-950 shadow-xs dark:border-indigo-900/60 dark:bg-indigo-950/40 dark:text-indigo-200 sm:flex-row sm:items-center sm:justify-between">
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

        <section aria-label="Quick actions" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <button type="button" onClick={() => { setSelectedFilter('Bei ya Jumla'); document.getElementById('products-section')?.scrollIntoView({ behavior: 'smooth' }); }} className="group flex min-h-28 items-center justify-between rounded-2xl border border-indigo-200 bg-indigo-700 p-5 text-left text-white shadow-lg shadow-indigo-900/10 transition hover:-translate-y-0.5 hover:bg-indigo-800">
            <span><span className="block text-xs font-bold uppercase tracking-wider text-indigo-200">Save together</span><span className="mt-1 block text-lg font-black">Explore group buys</span><span className="mt-1 block text-xs text-indigo-100">Find a product and invite your campus</span></span><ArrowRight className="h-5 w-5 shrink-0 transition group-hover:translate-x-1"/>
          </button>
          <Link href="/seller/apply" className="group flex min-h-28 items-center justify-between rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-slate-950 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-400 hover:bg-emerald-100 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-white dark:hover:bg-emerald-950/70">
            <span><span className="block text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">For local businesses</span><span className="mt-1 block text-lg font-black">Join as a seller</span><span className="mt-1 block text-xs text-slate-700 dark:text-emerald-100">Create your account and apply in one step</span></span><ArrowRight className="h-5 w-5 shrink-0 text-emerald-800 transition group-hover:translate-x-1 dark:text-emerald-300"/>
          </Link>
          <Link href="/winga/register" className="group flex min-h-28 items-center justify-between rounded-2xl border border-amber-200 bg-amber-50 p-5 text-slate-950 shadow-sm transition hover:-translate-y-0.5 hover:border-amber-400 hover:bg-amber-100 dark:border-amber-900 dark:bg-amber-950/40 dark:text-white dark:hover:bg-amber-950/70 sm:col-span-2 lg:col-span-1">
            <span><span className="block text-xs font-bold uppercase tracking-wider text-amber-900 dark:text-amber-300">Earn on campus</span><span className="mt-1 block text-lg font-black">Become a Winga</span><span className="mt-1 block text-xs text-slate-700 dark:text-amber-100">Apply for a reviewed campus role</span></span><ArrowRight className="h-5 w-5 shrink-0 text-amber-900 transition group-hover:translate-x-1 dark:text-amber-300"/>
          </Link>
        </section>

        {/* Value Props Strip */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
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

        </section>

        <HomepageBanners />

        {/* Product Catalog Section */}
        <section id="products-section" className="space-y-6 pt-2">
          {/* Section Header & Filter Chips */}
          <div className="border-b border-slate-200 pb-4 dark:border-slate-800">
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

            <div className="mt-4"><p className="mb-1 text-[11px] font-bold uppercase tracking-wider text-slate-500">Browse categories</p><FilterChips
              selectedFilter={selectedFilter}
              onSelectFilter={setSelectedFilter}
              counts={filterCounts}
            /></div>
          </div>

          <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1.2fr_auto] lg:items-end" aria-label="Refine product results">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-200">Maximum price <span className="font-normal text-slate-500">(TZS)</span><input type="number" min="0" value={maxPrice} onChange={(event) => setMaxPrice(event.target.value)} placeholder="Any price" className="mt-1.5 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/10 dark:border-slate-700 dark:bg-slate-950 dark:text-white"/></label>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-200">Seller<select value={sellerFilter} onChange={(event) => setSellerFilter(event.target.value)} className="mt-1.5 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/10 dark:border-slate-700 dark:bg-slate-950 dark:text-white"><option value="all">All sellers</option><option value="official">Official UniSoko</option><option value="verified">Verified sellers</option></select></label>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-200">Sort by<select value={sortBy} onChange={(event) => setSortBy(event.target.value)} className="mt-1.5 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/10 dark:border-slate-700 dark:bg-slate-950 dark:text-white"><option value="featured">Featured first</option><option value="price-low">Price: low to high</option><option value="price-high">Price: high to low</option></select></label>
            <button type="button" onClick={() => { setMaxPrice(''); setSellerFilter('all'); setSortBy('featured'); setSelectedFilter('All'); setSearchQuery(''); }} className="min-h-11 rounded-xl border border-slate-300 px-4 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">Clear filters</button>
          </div>

          {/* Wholesale Info Callout */}
          <div
            id="wholesale-info"
            className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-3xl border border-emerald-800 bg-emerald-950 p-5 text-white shadow-lg shadow-emerald-950/10 sm:p-6"
          >
            <div className="flex items-center gap-3.5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-100">
                <Layers className="h-6 w-6 text-emerald-700" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-emerald-200">
                  Hostel Pool & Reseller Advantage
                </p>
                <p className="mt-1 text-sm font-medium leading-6 text-white">
                  Pool your order with roommates or buy 3+ units to unlock{' '}
                  <span className="font-extrabold text-emerald-200 underline decoration-emerald-300 decoration-2 underline-offset-2">Bei ya Jumla</span> pricing.
                </p>
              </div>
            </div>
            <span className="shrink-0 rounded-xl border border-emerald-300/30 bg-emerald-800 px-4 py-2 text-xs font-extrabold text-white shadow-sm">
              Save together · 3+ units
            </span>
          </div>

          {/* Product Grid */}
          {filteredProducts.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 p-12 text-center dark:border-slate-800">
              <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                No gadgets found matching your selection.
              </p>
              <button
                onClick={() => setSelectedFilter('All')}
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
        <TrustedBySection partners={storeSettings.partnerBadges || []} />

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
              <Link href="/support" className="hover:text-indigo-600 text-indigo-700 dark:text-indigo-400">
                Support & Warranty
              </Link>
              <Link href="/winga/register" className="hover:text-indigo-600">
                Become Campus Winga
              </Link>
              <Link href="/winga/login" className="hover:text-indigo-600">
                Winga Portal
              </Link>
              <a
                href={createWhatsAppLink(UNISOKO_CONTACT.phoneDigits, 'Habari UniSoko!')}
                target="_blank"
                rel="noreferrer"
                className="hover:text-emerald-600 text-emerald-700 dark:text-emerald-400"
              >
                WhatsApp Helpline ({UNISOKO_CONTACT.phoneDisplay})
              </a>
            </div>
          </div>

          {/* Legal & Compliance Links */}
          <div className="pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
            <div className="text-center sm:text-left">
              <p>© {new Date().getFullYear()} UniSoko. All rights reserved.</p>
              <div className="mt-3 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                <button
                  type="button"
                  onClick={() => setShowDev((v) => !v)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:border-indigo-500 hover:text-white transition-all"
                >
                  About Developer
                  <svg className={`h-3 w-3 transition-transform ${showDev ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </button>
              </div>
              {showDev && (
                <div className="mt-3 flex flex-wrap items-center gap-2 rounded-2xl border border-slate-700 bg-slate-800/60 p-3">
                  {developerProfile.imageUrl ? <Image src={developerProfile.imageUrl} alt="" width={36} height={36} unoptimized className="h-9 w-9 rounded-full object-cover" /> : <span aria-hidden="true" className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-600/30 text-xs font-black text-indigo-300">RI</span>}
                  <div><p className="text-[10px] font-bold uppercase text-slate-500">Built by</p><p className="font-bold text-slate-100">{developerProfile.name} <span className="font-normal text-slate-400">· Developer / Creator</span></p></div>
                  <Link href="/developer" className="ml-auto font-semibold text-indigo-400 hover:underline hover:text-indigo-300 text-xs">View Profile →</Link>
                  <p className="w-full mt-1 text-slate-400">
                    <a className="hover:text-indigo-300" href={`tel:${developerProfile.phone}`}>{developerProfile.phone}</a>
                    {' · '}
                    <a className="hover:text-emerald-400" href={createWhatsAppLink(developerProfile.whatsapp, 'Hello UniSoko, I need help.')} target="_blank" rel="noreferrer">WhatsApp</a>
                    {' · '}
                    <a className="hover:text-indigo-300" href={`mailto:${developerProfile.email}`}>{developerProfile.email}</a>
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center gap-5 font-semibold">
              <Link href="/privacy-policy" className="hover:text-indigo-400">
                Privacy Policy
              </Link>
              <Link href="/refund-policy" className="hover:text-indigo-400">
                Refund &amp; Warranty Policy
              </Link>
              <Link href="/terms-of-service" className="hover:text-indigo-400">
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
