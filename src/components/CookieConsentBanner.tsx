'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Cookie, ShieldCheck, X } from 'lucide-react';

const COOKIE_CONSENT_KEY = 'unisoko_cookie_consent';

export default function CookieConsentBanner() {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    try {
      const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
      if (!consent) {
        // Subtle delay before showing so it doesn't jarringly block initial render
        const timer = setTimeout(() => setShowBanner(true), 1200);
        return () => clearTimeout(timer);
      }
    } catch {
      // In case localStorage is blocked
    }
  }, []);

  const handleConsent = (choice: 'accepted' | 'essential') => {
    try {
      localStorage.setItem(COOKIE_CONSENT_KEY, choice);
    } catch {
      // Ignore storage errors
    }
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div
      role="region"
      aria-label="Cookie and Privacy Preferences"
      className="fixed bottom-4 left-4 right-4 sm:left-6 sm:max-w-md z-50 rounded-2xl border border-slate-700/80 bg-slate-900/95 p-4 text-white shadow-2xl backdrop-blur-md transition-all duration-300 animate-in fade-in slide-in-from-bottom-5"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-600/20 text-indigo-400">
          <Cookie className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <span>Privacy &amp; Cookies</span>
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
            </h3>
            <button
              type="button"
              onClick={() => handleConsent('essential')}
              className="text-slate-400 hover:text-slate-200 p-0.5 rounded-md"
              aria-label="Close cookie banner"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <p className="mt-1.5 text-xs text-slate-300 leading-relaxed">
            UniSoko uses essential local storage and privacy-friendly cookies to remember your campus, manage your shopping cart, and ensure secure order delivery. We never sell your data or use cross-site tracking.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => handleConsent('accepted')}
              className="rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-bold text-white shadow hover:bg-indigo-500 transition-all active:scale-95"
            >
              Accept All
            </button>
            <button
              type="button"
              onClick={() => handleConsent('essential')}
              className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition-all"
            >
              Essential Only
            </button>
            <Link
              href="/cookie-policy"
              className="text-[11px] font-semibold text-indigo-400 underline-offset-2 hover:underline ml-auto"
            >
              Cookie Policy
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
