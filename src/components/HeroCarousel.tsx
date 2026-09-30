'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Laptop, Users, Layers, ArrowRight, CheckCircle2 } from 'lucide-react';

interface Slide {
  id: string;
  badge: string;
  title: string;
  highlight: string;
  description: string;
  ctaText: string;
  ctaLink: string;
  secondaryCtaText?: string;
  secondaryCtaLink?: string;
  bgColor: string;
  accentColor: string;
  icon: React.ReactNode;
  tags: string[];
}

const SLIDES: Slide[] = [
  {
    id: 'laptops-hero',
    badge: 'Semester Gadget Rush 🚀',
    title: 'Grade A Laptops For',
    highlight: 'Coursework & Coding',
    description:
      'HP EliteBook, Dell Latitude & MacBooks with 6-month warranty. Inspected, tested, and hand-delivered to your hostel in MUST, TEKU & TIA.',
    ctaText: 'Browse Student Laptops',
    ctaLink: '#products-section',
    secondaryCtaText: 'Bei ya Jumla Rates',
    secondaryCtaLink: '#wholesale-info',
    bgColor: 'from-slate-900 via-slate-900 to-slate-900',
    accentColor: 'text-indigo-400',
    icon: <Laptop className="h-6 w-6 text-indigo-400" />,
    tags: ['Grade A Tested', 'Free Hostel Delivery', 'Lipa Namba Ready'],
  },
  {
    id: 'winga-hero',
    badge: 'Earn While You Learn 💰',
    title: 'Become a UniSoko',
    highlight: 'Campus Winga Agent',
    description:
      'Zero startup capital. Get your unique promo code (e.g. WINGA-SAM), share gadget deals with classmates, and earn 5% instant cash on every successful order.',
    ctaText: 'Sign Up as Winga Agent',
    ctaLink: '/winga',
    secondaryCtaText: 'View Agent Dashboard',
    secondaryCtaLink: '/winga/dashboard',
    bgColor: 'from-slate-900 via-slate-900 to-slate-900',
    accentColor: 'text-emerald-400',
    icon: <Users className="h-6 w-6 text-emerald-400" />,
    tags: ['5% Commission', 'Instant M-Pesa Payout', 'Campus Leaderboard'],
  },
  {
    id: 'wholesale-hero',
    badge: 'Bei ya Jumla (Wholesale) 📦',
    title: 'Hostel Group Buying &',
    highlight: 'Reseller Bulk Pricing',
    description:
      'Buy 3 or more gadgets to unlock direct wholesale prices. Save up to TZS 150,000 per unit when you pool orders with roommates or resell on campus.',
    ctaText: 'Explore Jumla Deals (3+)',
    ctaLink: '#products-section',
    secondaryCtaText: 'WhatsApp Sales Desk',
    secondaryCtaLink: 'https://wa.me/255754892110?text=Habari%20UniSoko!%20Nataka%20bei%20za%20jumla%20kwa%20chuo%20chetu',
    bgColor: 'from-slate-900 via-slate-900 to-slate-900',
    accentColor: 'text-amber-400',
    icon: <Layers className="h-6 w-6 text-amber-400" />,
    tags: ['Min 3 Units', 'Save up to 20%', 'Same-Day Mbeya Drop'],
  },
];

export default function HeroCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  useEffect(() => {
    if (!isAutoPlaying) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % SLIDES.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  const current = SLIDES[currentIndex];

  const handleNext = () => setCurrentIndex((prev) => (prev + 1) % SLIDES.length);
  const handlePrev = () => setCurrentIndex((prev) => (prev - 1 + SLIDES.length) % SLIDES.length);

  return (
    <div
      className="relative overflow-hidden rounded-3xl bg-slate-900 text-white shadow-2xl ring-1 ring-white/10"
      onMouseEnter={() => setIsAutoPlaying(false)}
      onMouseLeave={() => setIsAutoPlaying(true)}
    >
      {/* Background Decorative Glow */}
      <div className="absolute inset-0 bg-linear-to-br from-indigo-600/20 via-emerald-500/10 to-transparent pointer-events-none" />
      <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none" />
      <div className="absolute -left-24 -bottom-24 h-96 w-96 rounded-full bg-emerald-500/20 blur-3xl pointer-events-none" />

      <div className="relative min-h-105 sm:min-h-110 flex flex-col justify-between p-6 sm:p-10 z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={current.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.4 }}
            className="flex-1 flex flex-col justify-center"
          >
            {/* Slide Badge */}
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1 text-xs font-semibold backdrop-blur-md ring-1 ring-white/20 w-fit">
              {current.icon}
              <span>{current.badge}</span>
            </div>

            {/* Title */}
            <h1 className="mt-4 text-3xl sm:text-5xl font-black tracking-tight text-white max-w-2xl leading-tight">
              {current.title}{' '}
              <span className="text-indigo-300">
                {current.highlight}
              </span>
            </h1>

            {/* Description */}
            <p className="mt-3 text-sm sm:text-base text-slate-300 max-w-xl leading-relaxed">
              {current.description}
            </p>

            {/* Tag Pills */}
            <div className="mt-5 flex flex-wrap gap-2">
              {current.tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 rounded-lg bg-white/5 px-2.5 py-1 text-xs font-medium text-slate-200 border border-white/10"
                >
                  <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                  {tag}
                </span>
              ))}
            </div>

            {/* CTA Buttons */}
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link
                href={current.ctaLink}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-600/25 hover:bg-indigo-700 active:scale-95 transition-all"
              >
                <span>{current.ctaText}</span>
                <ArrowRight className="h-4 w-4" />
              </Link>

              {current.secondaryCtaText && (
                <Link
                  href={current.secondaryCtaLink || '#'}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-white/10 px-5 py-3 text-sm font-semibold text-white hover:bg-white/20 active:scale-95 backdrop-blur-md transition-all border border-white/10"
                >
                  <span>{current.secondaryCtaText}</span>
                </Link>
              )}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Carousel Navigation Bottom Bar */}
        <div className="mt-8 flex items-center justify-between border-t border-white/10 pt-4">
          {/* Dots Indicator */}
          <div className="flex items-center gap-2">
            {SLIDES.map((slide, idx) => (
              <button
                key={slide.id}
                onClick={() => setCurrentIndex(idx)}
                className={`h-2.5 rounded-full transition-all ${
                  currentIndex === idx
                    ? 'w-8 bg-emerald-400'
                    : 'w-2.5 bg-white/30 hover:bg-white/50'
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>

          {/* Arrows */}
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrev}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-white hover:bg-white/20 active:scale-90 transition-all border border-white/10"
              aria-label="Previous Slide"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={handleNext}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-white hover:bg-white/20 active:scale-90 transition-all border border-white/10"
              aria-label="Next Slide"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
