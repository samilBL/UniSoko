'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  Grid,
  Laptop,
  Smartphone,
  Home,
  BookOpen,
  Headphones,
  Flame,
  Layers,
  X,
} from 'lucide-react';

interface DepartmentItem {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  categoryFilter: string;
}

const DEPARTMENTS: { title: string; items: DepartmentItem[] }[] = [
  {
    title: 'PC & Electronics',
    items: [
      {
        id: 'dept-laptops',
        name: 'Laptops & Computers',
        description: 'ThinkPads, EliteBooks, MacBooks & coursework PCs',
        icon: <Laptop className="h-4 w-4 text-indigo-400" />,
        categoryFilter: 'Laptops',
      },
      {
        id: 'dept-phones',
        name: 'Smartphones & Tablets',
        description: 'iPhones, Samsungs, iPads, and high-res screen devices',
        icon: <Smartphone className="h-4 w-4 text-emerald-400" />,
        categoryFilter: 'Phones',
      },
      {
        id: 'dept-accessories',
        name: 'Fast Chargers & Audio',
        description: '65W GaN chargers, ANC earbuds, noise-canceling headsets',
        icon: <Headphones className="h-4 w-4 text-amber-400" />,
        categoryFilter: 'Accessories',
      },
    ],
  },
  {
    title: 'Home & Hostel Living',
    items: [
      {
        id: 'dept-room-gear',
        name: 'Room & Study Essentials',
        description: 'LED desk lamps, mini cooling fans, room organizers',
        icon: <Home className="h-4 w-4 text-purple-400" />,
        categoryFilter: 'Room Gear',
      },
      {
        id: 'dept-lifestyle',
        name: 'Student Lifestyle Gear',
        description: 'Backpacks, water bottles, power banks, multi-plugs',
        icon: <Sparkles className="h-4 w-4 text-sky-400" />,
        categoryFilter: 'Student Lifestyle Gear',
      },
    ],
  },
  {
    title: 'Academic & Coursework',
    items: [
      {
        id: 'dept-books',
        name: 'Books & Academic Supplies',
        description: 'Engineering manuals, revision guides, scientific calculators',
        icon: <BookOpen className="h-4 w-4 text-blue-400" />,
        categoryFilter: 'Campus Essentials',
      },
    ],
  },
  {
    title: 'Clearance & Bulk Wholesale',
    items: [
      {
        id: 'dept-jumla',
        name: 'Bei ya Jumla (Wholesale 3+)',
        description: 'Squad pooling deals on bulk electronics & gadgets',
        icon: <Layers className="h-4 w-4 text-emerald-400" />,
        categoryFilter: 'Bei ya Jumla',
      },
      {
        id: 'dept-trending',
        name: 'Trending Campus Deals',
        description: 'Most popular purchases this semester across universities',
        icon: <Flame className="h-4 w-4 text-red-400" />,
        categoryFilter: 'Trending',
      },
    ],
  },
];

export default function Header() {
  const { cartCount, setIsCartOpen, selectedCampus, searchQuery, setSearchQuery } = useStore();
  const [isCampusModalOpen, setIsCampusModalOpen] = useState(false);
  const [isDeptOpen, setIsDeptOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);
  const lastScrollY = useRef(0);
  const deptRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();

  // Scroll detection for auto-hiding header
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // Check if user is scrolled past top
      setIsScrolled(currentScrollY > 40);

      // Only toggle visibility if scrolled past header threshold (100px)
      if (currentScrollY > 100) {
        if (currentScrollY > lastScrollY.current && currentScrollY - lastScrollY.current > 5) {
          // Scrolling DOWN -> Hide header
          setIsVisible(false);
          setIsDeptOpen(false); // Close dropdown if scrolling down
        } else if (lastScrollY.current - currentScrollY > 8) {
          // Scrolling UP -> Show header
          setIsVisible(true);
        }
      } else {
        // At or near top -> Always visible
        setIsVisible(true);
      }

      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close department dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (deptRef.current && !deptRef.current.contains(e.target as Node)) {
        setIsDeptOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const submitSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (pathname !== '/') router.push('/#products-section');
    else document.getElementById('products-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSelectDepartment = (categoryFilter: string) => {
    setIsDeptOpen(false);
    if (pathname !== '/') {
      router.push(`/?filter=${encodeURIComponent(categoryFilter)}#products-section`);
    } else {
      // Find filter chip on page or scroll to products
      const targetElement = document.getElementById('products-section');
      if (targetElement) {
        targetElement.scrollIntoView({ behavior: 'smooth' });
      }
      // Also set search or trigger event
      window.dispatchEvent(new CustomEvent('unisoko-select-category', { detail: categoryFilter }));
    }
  };

  return (
    <>
      <header
        className={`sticky top-0 z-40 w-full transition-transform duration-300 ease-in-out ${
          isVisible ? 'translate-y-0' : '-translate-y-full'
        } ${
          isScrolled
            ? 'bg-black/90 backdrop-blur-xl border-b border-white/10 shadow-lg shadow-black/40'
            : 'bg-black/95 border-b border-white/10'
        }`}
      >
        {/* Top Info Strip */}
        <div className="bg-indigo-600 px-4 py-1 text-xs text-white">
          <div className="mx-auto flex max-w-7xl items-center justify-between">
            <div className="flex items-center gap-2 overflow-hidden text-[11px] sm:text-xs">
              <span className="flex items-center gap-1 font-semibold">
                <Zap className="h-3 w-3 text-amber-300 fill-amber-300 animate-pulse" />
                Student Wholesale:
              </span>
              <span className="hidden sm:inline text-indigo-100">
                Bei ya Jumla bulk pricing unlocks at 3+ units on all gadgets!
              </span>
              <span className="sm:hidden text-indigo-100">Jumla discount at 3+ units!</span>
            </div>

            <div className="flex items-center gap-4 text-[11px] sm:text-xs font-semibold">
              <button
                type="button"
                onClick={openStudentGuide}
                className="transition-colors hover:text-indigo-200"
              >
                How It Works
              </button>
              <Link
                href="/winga/register"
                className="hover:text-emerald-200 transition-colors flex items-center gap-1"
              >
                <Sparkles className="h-3 w-3 text-emerald-300" />
                <span className="hidden sm:inline">Join as Winga</span>
              </Link>
              <Link href="/seller" className="hover:text-emerald-200 transition-colors">
                Become a Seller
              </Link>
            </div>
          </div>
        </div>

        {/* Main Navbar */}
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-2.5 sm:gap-6 sm:px-6">
          {/* Logo & Department Picker */}
          <div className="flex items-center gap-3">
            <Link href="/" aria-label="UniSoko home" className="flex shrink-0 items-center gap-2 group">
              <span
                aria-hidden="true"
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 shadow-sm shadow-indigo-600/30 sm:h-10 sm:w-10"
              >
                <svg viewBox="0 0 32 32" className="h-6 w-6" fill="none">
                  <path
                    d="M8 11h16l1.5 14a2 2 0 0 1-2 2.2h-13a2 2 0 0 1-2-2.2L8 11Z"
                    fill="var(--unisoko-background)"
                  />
                  <path
                    d="M12 11V9a4 4 0 0 1 8 0v2"
                    stroke="var(--unisoko-background)"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <path d="m18 13-5 7h3l-1 5 6-8h-3l1-4Z" fill="var(--unisoko-success)" />
                </svg>
              </span>
              <span className="min-w-max whitespace-nowrap text-lg font-black leading-none sm:text-xl">
                <span className="text-indigo-400">Uni</span>
                <span className="text-white">Soko</span>
              </span>
            </Link>

            {/* Department Picker Trigger Button */}
            <div className="relative" ref={deptRef}>
              <button
                type="button"
                onClick={() => setIsDeptOpen((v) => !v)}
                aria-expanded={isDeptOpen}
                className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition-all ${
                  isDeptOpen
                    ? 'border-indigo-500 bg-indigo-600/20 text-white ring-2 ring-indigo-500/20'
                    : 'border-slate-800 bg-slate-900 text-slate-200 hover:border-slate-700 hover:text-white'
                }`}
              >
                <Grid className="h-3.5 w-3.5 text-indigo-400" />
                <span className="hidden md:inline">Departments</span>
                <span className="md:hidden">Categories</span>
                <ChevronDown
                  className={`h-3 w-3 text-slate-400 transition-transform ${
                    isDeptOpen ? 'rotate-180 text-white' : ''
                  }`}
                />
              </button>

              {/* Department Dropdown Panel */}
              {isDeptOpen && (
                <div className="absolute left-0 top-full mt-2 w-80 sm:w-96 rounded-2xl border border-slate-800 bg-slate-900/98 p-4 text-white shadow-2xl backdrop-blur-xl z-50 animate-in fade-in zoom-in-95">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Browse by Department
                    </p>
                    <button
                      type="button"
                      onClick={() => setIsDeptOpen(false)}
                      className="text-slate-400 hover:text-white p-0.5"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <div className="mt-3 space-y-4 max-h-[65vh] overflow-y-auto no-scrollbar pr-1">
                    {DEPARTMENTS.map((dept) => (
                      <div key={dept.title} className="space-y-1.5">
                        <p className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-400">
                          {dept.title}
                        </p>
                        <div className="space-y-1">
                          {dept.items.map((item) => (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => handleSelectDepartment(item.categoryFilter)}
                              className="w-full flex items-start gap-2.5 rounded-xl p-2 text-left hover:bg-slate-800/80 transition-colors group"
                            >
                              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-800 group-hover:bg-indigo-600/20 transition-colors mt-0.5">
                                {item.icon}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-bold text-slate-200 group-hover:text-white">
                                  {item.name}
                                </p>
                                <p className="text-[10px] text-slate-400 leading-tight truncate">
                                  {item.description}
                                </p>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-800 text-center">
                    <button
                      type="button"
                      onClick={() => handleSelectDepartment('All')}
                      className="text-xs font-bold text-indigo-400 hover:text-indigo-300"
                    >
                      View All Products Catalog →
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Campus Location Selector Button */}
          <button
            onClick={() => setIsCampusModalOpen(true)}
            className="flex min-h-9 min-w-0 items-center gap-1.5 rounded-full border border-indigo-900/60 bg-indigo-950/40 px-3 py-1 text-xs font-semibold text-indigo-200 hover:bg-indigo-900/60 transition-all shadow-xs"
            aria-label={`Change campus location. Current campus ${selectedCampus.shortCode} in ${selectedCampus.city}`}
          >
            <MapPin className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
            <span className="truncate max-w-10 sm:max-w-45">
              <span className="sm:hidden">{selectedCampus.shortCode}</span>
              <span className="hidden sm:inline">📍 {selectedCampus.shortCode} Campus</span>
            </span>
            <ChevronDown className="h-3 w-3 text-indigo-400 opacity-80" />
          </button>

          {/* Search Bar (Desktop) */}
          <form onSubmit={submitSearch} role="search" className="relative hidden md:flex flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              aria-label="Search UniSoko products"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search brand, model, RAM, category..."
              className="w-full rounded-full border border-slate-800 bg-slate-900/90 py-1.5 pl-9 pr-4 text-xs text-white placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
            />
          </form>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Winga Dashboard Link */}
            <Link
              href="/winga/login"
              className="hidden sm:flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-800 transition-all"
            >
              <UserCheck className="h-3.5 w-3.5 text-indigo-400" />
              <span>Winga Portal</span>
            </Link>

            {/* Cart Drawer Trigger */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative flex min-h-9 items-center gap-2 rounded-xl bg-indigo-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-500 active:scale-95 transition-all"
              aria-label="Open Shopping Cart"
            >
              <ShoppingBag className="h-4 w-4" />
              <span className="hidden sm:inline">Cart</span>
              {cartCount > 0 && (
                <span className="flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-emerald-400 px-1 text-[10px] font-black text-slate-950">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Search Bar */}
        <form onSubmit={submitSearch} role="search" className="relative px-4 pb-2.5 md:hidden">
          <Search className="absolute left-7 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            aria-label="Search UniSoko products"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search laptops, phones, essentials..."
            className="w-full rounded-xl border border-slate-800 bg-slate-900 py-2 pl-9 pr-3 text-xs text-white placeholder-slate-400 focus:border-indigo-500 focus:outline-none"
          />
        </form>

        {/* Quick-Access Campus Hub Subnav */}
        <div className="border-t border-white/5 bg-slate-950 px-4 py-1.5 overflow-x-auto no-scrollbar">
          <div className="mx-auto flex max-w-7xl items-center gap-2 text-xs font-semibold">
            <span className="hidden sm:inline-flex text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1">
              Campus Hub:
            </span>
            <Link
              href="/grad-clearance"
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 transition-all shrink-0 text-xs ${
                pathname === '/grad-clearance'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-900 text-slate-200 hover:bg-slate-800 border border-slate-800'
              }`}
            >
              <GraduationCap className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
              <span>Grad Clearance</span>
              <span className="rounded-full bg-amber-500/20 px-1.5 py-0.2 text-[9px] font-black text-amber-300">
                Hot
              </span>
            </Link>
            <Link
              href="/bundles"
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 transition-all shrink-0 text-xs ${
                pathname === '/bundles'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-900 text-slate-200 hover:bg-slate-800 border border-slate-800'
              }`}
            >
              <PackageCheck className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
              <span>Student Bundles</span>
            </Link>
            <Link
              href="/hostels"
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 transition-all shrink-0 text-xs ${
                pathname === '/hostels'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-900 text-slate-200 hover:bg-slate-800 border border-slate-800'
              }`}
            >
              <BedDouble className="h-3.5 w-3.5 text-purple-400 shrink-0" />
              <span>Find a Hostel</span>
            </Link>
            <Link
              href="/sell-device"
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 transition-all shrink-0 text-xs ${
                pathname === '/sell-device'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-900 text-slate-200 hover:bg-slate-800 border border-slate-800'
              }`}
            >
              <DollarSign className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
              <span>Sell / Trade-In</span>
            </Link>
            <Link
              href="/seller"
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 transition-all shrink-0 text-xs ${
                pathname.startsWith('/seller')
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-900 text-slate-200 hover:bg-slate-800 border border-slate-800'
              }`}
            >
              <UserCheck className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
              <span>Become a Seller</span>
            </Link>
            <Link
              href="/support"
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 transition-all shrink-0 text-xs ${
                pathname === '/support'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-900 text-slate-200 hover:bg-slate-800 border border-slate-800'
              }`}
            >
              <ShieldCheck className="h-3.5 w-3.5 text-blue-400 shrink-0" />
              <span>Warranty &amp; Help</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Campus Selector Modal */}
      <CampusSelectorModal isOpen={isCampusModalOpen} onClose={() => setIsCampusModalOpen(false)} />
    </>
  );
}
