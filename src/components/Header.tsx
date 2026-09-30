'use client';

import React, { useState } from 'react';
import Link from 'next/link';
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
} from 'lucide-react';

export default function Header() {
  const { cartCount, setIsCartOpen, selectedCampus } = useStore();
  const [isCampusModalOpen, setIsCampusModalOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/95 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/95 transition-colors">
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
              <button type="button" onClick={openStudentGuide} className="font-medium transition-colors hover:text-indigo-100">How It Works</button>
              <Link
                href="/winga"
                className="font-medium hover:text-emerald-200 transition-colors flex items-center gap-1"
              >
                <Sparkles className="h-3 w-3 text-emerald-300" />
                <span>Earn 5% with Winga</span>
              </Link>
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
            <span className="whitespace-nowrap text-[1.35rem] font-black leading-none tracking-[-0.055em] sm:text-2xl">
              <span className="text-indigo-600">Uni</span><span className="text-slate-900 dark:text-white">Soko</span>
            </span>
          </Link>

          {/* Campus Location Selector Button */}
          <button
            onClick={() => setIsCampusModalOpen(true)}
            className="flex min-w-0 items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50/80 px-3 py-1.5 text-xs font-semibold text-indigo-900 transition-all hover:border-indigo-300 hover:bg-indigo-100 dark:border-indigo-900/60 dark:bg-indigo-950/40 dark:text-indigo-200 dark:hover:bg-indigo-900/60 shadow-xs"
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
          <div className="relative hidden md:flex flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search HP laptops, MacBooks, phones..."
              className="w-full rounded-full border border-slate-200 bg-slate-50 py-2 pl-10 pr-4 text-xs text-slate-800 placeholder-slate-400 focus:border-indigo-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600/20 dark:border-slate-800 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500 transition-all"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Winga Dashboard Link */}
            <Link
              href="/winga/dashboard"
              className="hidden sm:flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 transition-all"
            >
              <UserCheck className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              <span>Winga Agent</span>
            </Link>

            {/* Cart Drawer Trigger */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative flex items-center gap-2 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-bold text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-700 active:scale-95 transition-all"
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
      </header>

      {/* Campus Selector Modal */}
      <CampusSelectorModal
        isOpen={isCampusModalOpen}
        onClose={() => setIsCampusModalOpen(false)}
      />
    </>
  );
}
