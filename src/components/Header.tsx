'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useStore } from '@/context/StoreContext';
import CampusSelectorModal from './CampusSelectorModal';
import { openStudentGuide } from '@/lib/studentGuide';
import {
  MapPin,
  ShoppingBag,
  UserCheck,
  ChevronDown,
  Search,
  Sparkles,
  Zap,
  GraduationCap,
  BedDouble,
  PackageCheck,
  DollarSign,
  ShieldCheck,
} from 'lucide-react';

export default function Header() {
  const { cartCount, setIsCartOpen, selectedCampus, searchQuery, setSearchQuery } = useStore();
  const [isCampusModalOpen, setIsCampusModalOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const submitSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (pathname !== '/') router.push('/#products-section');
    else document.getElementById('products-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-black/80 backdrop-blur-xl transition-colors">
        {/* Top Info Strip */}
        <div className="bg-indigo-600 px-4 py-1.5 text-xs text-white">
          <div className="mx-auto flex max-w-7xl items-center justify-between">
            <div className="flex items-center gap-2 overflow-hidden text-[11px] sm:text-xs">
              <span className="flex items-center gap-1 font-semibold">
                <Zap className="h-3 w-3 text-amber-300 fill-amber-300 animate-pulse" />
                Tanzania Student Deals:
              </span>
              <span className="hidden sm:inline text-indigo-100">
                Bei ya Jumla discounts unlock at 3+ units on all gadgets!
              </span>
              <span className="sm:hidden text-indigo-100">Jumla discount 3+ units!</span>
            </div>

            <div className="flex items-center gap-4 text-[11px] sm:text-xs">
              <button type="button" onClick={openStudentGuide} className="min-h-11 px-1 font-medium transition-colors hover:text-indigo-100">How It Works</button>
              <Link
                href="/winga/register"
                className="font-medium hover:text-emerald-200 transition-colors flex items-center gap-1"
              >
                <Sparkles className="h-3 w-3 text-emerald-300" />
                <span>Join as Winga</span>
              </Link>
              <Link href="/seller" className="font-medium hover:text-emerald-200 transition-colors">Become a seller</Link>
            </div>
          </div>
        </div>

        {/* Main Navbar */}
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:gap-6 sm:px-6">
          {/* Logo */}
          <Link href="/" aria-label="UniSoko home" className="flex shrink-0 items-center gap-2.5 group">
            <span aria-hidden="true" className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 shadow-sm shadow-indigo-600/20 sm:h-11 sm:w-11">
              <svg viewBox="0 0 32 32" className="h-7 w-7" fill="none">
                <path d="M8 11h16l1.5 14a2 2 0 0 1-2 2.2h-13a2 2 0 0 1-2-2.2L8 11Z" fill="var(--unisoko-background)" />
                <path d="M12 11V9a4 4 0 0 1 8 0v2" stroke="var(--unisoko-background)" strokeWidth="2" strokeLinecap="round" />
                <path d="m18 13-5 7h3l-1 5 6-8h-3l1-4Z" fill="var(--unisoko-success)" />
              </svg>
            </span>
            <span className="min-w-max whitespace-nowrap text-lg font-black leading-none tracking-normal sm:text-2xl">
              <span className="text-indigo-400">Uni</span><span className="text-white">Soko</span>
            </span>
          </Link>

          {/* Campus Location Selector Button */}
          <button
            onClick={() => setIsCampusModalOpen(true)}
            className="flex min-h-11 min-w-0 items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50/80 px-3 py-1.5 text-xs font-semibold text-indigo-900 transition-all hover:border-indigo-300 hover:bg-indigo-100 dark:border-indigo-900/60 dark:bg-indigo-950/40 dark:text-indigo-200 dark:hover:bg-indigo-900/60 shadow-xs"
            aria-label={`Change campus location. Current campus ${selectedCampus.shortCode} in ${selectedCampus.city}`}
          >
            <MapPin className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="truncate max-w-10 sm:max-w-45">
              <span className="sm:hidden">{selectedCampus.shortCode}</span>
              <span className="hidden sm:inline">📍 {selectedCampus.shortCode} Campus ({selectedCampus.city})</span>
            </span>
            <ChevronDown className="h-3 w-3 text-indigo-500 opacity-80" />
          </button>

          {/* Search Bar (Desktop) */}
          <form onSubmit={submitSearch} role="search" className="relative hidden md:flex flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              aria-label="Search UniSoko products"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search brand, model, RAM, storage..."
              className="w-full rounded-full border border-slate-200 bg-slate-50 py-2 pl-10 pr-4 text-xs text-slate-800 placeholder-slate-400 focus:border-indigo-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600/20 dark:border-slate-800 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500 transition-all"
            />
          </form>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Winga Dashboard Link */}
            <Link
              href="/winga/login"
              className="hidden sm:flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 transition-all"
            >
              <UserCheck className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              <span>Winga Dashboard</span>
            </Link>

            {/* Cart Drawer Trigger */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative flex min-h-11 items-center gap-2 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-bold text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-700 active:scale-95 transition-all"
              aria-label="Open Shopping Cart"
            >
              <ShoppingBag className="h-4 w-4" />
              <span className="hidden sm:inline">Cart</span>
              {cartCount > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-emerald-400 px-1 text-[11px] font-extrabold text-slate-900 animate-scale-in">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>

        <form onSubmit={submitSearch} role="search" className="relative px-4 pb-3 md:hidden">
          <Search className="absolute left-7 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            aria-label="Search UniSoko products"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search brand, model, RAM, storage..."
            className="min-h-11 w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-10 pr-3 text-xs text-slate-800 placeholder-slate-400 focus:border-indigo-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600/20 dark:border-slate-800 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500"
          />
        </form>

        {/* Student Services Quick-Access Subnav */}
        <div className="border-t border-white/10 bg-slate-900 px-4 py-2 overflow-x-auto no-scrollbar">
          <div className="mx-auto flex max-w-7xl items-center gap-2 text-xs font-semibold">
            <span className="hidden sm:inline-flex text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1">
              Campus Hub:
            </span>
            <Link
              href="/grad-clearance"
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 transition-all shrink-0 ${
                pathname === '/grad-clearance'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-800 text-slate-100 hover:bg-slate-700 hover:text-white border border-slate-700'
              }`}
            >
              <GraduationCap className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
              <span>Grad Clearance</span>
              <span className="rounded-full bg-amber-500/20 px-1.5 py-0.5 text-[9px] font-black text-amber-300">Hot</span>
            </Link>
            <Link
              href="/bundles"
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 transition-all shrink-0 ${
                pathname === '/bundles'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-800 text-slate-100 hover:bg-slate-700 hover:text-white border border-slate-700'
              }`}
            >
              <PackageCheck className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
              <span>Student Bundles</span>
            </Link>
            <Link
              href="/hostels"
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 transition-all shrink-0 ${
                pathname === '/hostels'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-800 text-slate-100 hover:bg-slate-700 hover:text-white border border-slate-700'
              }`}
            >
              <BedDouble className="h-3.5 w-3.5 text-purple-400 shrink-0" />
              <span>Find a Hostel</span>
            </Link>
            <Link
              href="/sell-device"
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 transition-all shrink-0 ${
                pathname === '/sell-device'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-800 text-slate-100 hover:bg-slate-700 hover:text-white border border-slate-700'
              }`}
            >
              <DollarSign className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
              <span>Sell / Trade-In</span>
            </Link>
            <Link
              href="/seller"
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 transition-all shrink-0 ${pathname.startsWith('/seller') ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-100 hover:bg-slate-700 hover:text-white border border-slate-700'}`}
            >
              <UserCheck className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
              <span>Become a Seller</span>
            </Link>
            <Link
              href="/support"
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 transition-all shrink-0 ${
                pathname === '/support'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-800 text-slate-100 hover:bg-slate-700 hover:text-white border border-slate-700'
              }`}
            >
              <ShieldCheck className="h-3.5 w-3.5 text-blue-400 shrink-0" />
              <span>Warranty & Help</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Campus Selector Modal */}
      <CampusSelectorModal
        isOpen={isCampusModalOpen}
        onClose={() => setIsCampusModalOpen(false)}
      />
    </>
  );
}
