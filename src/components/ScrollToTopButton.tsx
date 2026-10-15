'use client';

import React, { useEffect, useState } from 'react';
import { ArrowUp } from 'lucide-react';

export default function ScrollToTopButton() {
  const [isVisible, setIsVisible] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;
      const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      
      // Show when scrolled down past 220px
      setIsVisible(scrollTop > 220);

      if (scrollHeight > 0) {
        const progress = Math.min(100, Math.max(0, Math.round((scrollTop / scrollHeight) * 100)));
        setScrollProgress(progress);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    // Run once on mount in case user navigated while scrolled
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    try {
      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      });
      document.documentElement.scrollTo({
        top: 0,
        behavior: 'smooth',
      });
    } catch {
      window.scrollTo(0, 0);
    }
  };

  return (
    <div
      className={`fixed bottom-20 right-4 sm:bottom-8 sm:right-8 z-50 transition-all duration-300 pointer-events-auto ${
        isVisible
          ? 'opacity-100 translate-y-0 scale-100 pointer-events-auto'
          : 'opacity-0 translate-y-4 scale-90 pointer-events-none'
      }`}
    >
      <button
        type="button"
        onClick={scrollToTop}
        aria-label="Scroll back to top of page"
        title="Scroll to top"
        className="group relative flex items-center gap-1.5 rounded-full bg-slate-900/95 px-3 py-2 text-xs font-bold text-white shadow-2xl shadow-indigo-950/60 ring-1 ring-white/20 backdrop-blur-xl transition-all duration-200 hover:bg-indigo-600 hover:scale-105 hover:ring-indigo-400 active:scale-95 focus:outline-none focus:ring-2 focus:ring-indigo-400"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-600 text-white shadow-sm group-hover:bg-white group-hover:text-indigo-600 transition-colors">
          <ArrowUp className="h-4 w-4 transition-transform group-hover:-translate-y-0.5" />
        </span>
        <span className="hidden sm:inline font-bold pr-1 text-slate-200 group-hover:text-white">
          Top
        </span>
        {scrollProgress > 0 && (
          <span className="text-[10px] text-slate-400 group-hover:text-indigo-200 font-mono hidden md:inline">
            {scrollProgress}%
          </span>
        )}
      </button>
    </div>
  );
}
