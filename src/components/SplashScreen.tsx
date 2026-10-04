'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

export default function SplashScreen() {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Optional: Only show once per session to avoid annoying the user on refresh
    const hasSeenSplash = sessionStorage.getItem('unisoko_splash_seen');
    
    if (hasSeenSplash) {
      setIsVisible(false);
      return;
    }

    // Set as seen for this session
    sessionStorage.setItem('unisoko_splash_seen', 'true');

    // Hide splash screen after 2.5 seconds
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key="splash"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.05 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#0A0A0E] text-white"
        >
          <div className="flex flex-col items-center justify-center flex-1">
            {/* Logo Animation */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
              className="flex items-center gap-3"
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-600 shadow-2xl shadow-indigo-600/40">
                <Image 
                  src="/icons/unisoko-logo.svg" 
                  alt="UniSoko Logo" 
                  width={36} 
                  height={36} 
                  className="object-contain"
                  onError={(e) => {
                    // Fallback if SVG fails to load
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
              <span className="text-4xl font-black tracking-tight">UniSoko</span>
            </motion.div>
          </div>

          {/* Powered by text at the bottom */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.8 }}
            className="pb-12 text-center"
          >
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">
              Powered by
            </p>
            <p className="mt-1 text-sm font-black bg-gradient-to-r from-indigo-400 to-emerald-400 bg-clip-text text-transparent">
              Matokeo Luvanda
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
