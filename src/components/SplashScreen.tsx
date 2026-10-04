'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Inline SVG: shopping bag with lightning bolt (matches the Header logo)
function UniSokoIcon() {
  return (
    <svg viewBox="0 0 64 64" className="h-full w-full" fill="none">
      {/* Bag body */}
      <path
        d="M14 24h36l3 28a4 4 0 0 1-4 4.4h-34a4 4 0 0 1-4-4.4L14 24Z"
        fill="white"
      />
      {/* Bag handle */}
      <path
        d="M24 24V20a8 8 0 0 1 16 0v4"
        stroke="white"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      {/* Lightning bolt */}
      <path
        d="M36 29L27 42h7L32 55l13-18h-7l4-8Z"
        fill="#10B981"
      />
    </svg>
  );
}

const WORD = 'UniSoko';

export default function SplashScreen() {
  const [phase, setPhase] = useState<'logo' | 'typing' | 'tagline' | 'done'>('logo');
  const [typedChars, setTypedChars] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    let alreadySeen = false;
    try {
      alreadySeen = sessionStorage.getItem('unisoko_splash_seen') === 'true';
      if (!alreadySeen) sessionStorage.setItem('unisoko_splash_seen', 'true');
    } catch {
      // Storage can be blocked on mobile/private browsing; the splash must still dismiss.
    }
    if (alreadySeen) {
      const hideTimer = window.setTimeout(() => setVisible(false), 0);
      return () => window.clearTimeout(hideTimer);
    }

    // Phase 1: Show logo icon for 600ms, then start typing
    const t1 = window.setTimeout(() => setPhase('typing'), 400);
    return () => window.clearTimeout(t1);
  }, []);

  // Typewriter effect
  useEffect(() => {
    if (phase !== 'typing') return;
    if (typedChars < WORD.length) {
      const t = window.setTimeout(() => setTypedChars((c) => c + 1), 65);
      return () => clearTimeout(t);
    } else {
      // All chars typed — show tagline after brief pause
      const t = window.setTimeout(() => setPhase('tagline'), 180);
      return () => clearTimeout(t);
    }
  }, [phase, typedChars]);

  // After tagline appears, fade out after 1.2s
  useEffect(() => {
    if (phase !== 'tagline') return;
    const t = window.setTimeout(() => setPhase('done'), 800);
    return () => clearTimeout(t);
  }, [phase]);

  useEffect(() => {
    if (phase === 'done') {
      const t = window.setTimeout(() => setVisible(false), 350);
      return () => clearTimeout(t);
    }
  }, [phase]);

  if (!visible) return null;

  return (
    <AnimatePresence>
      {phase !== 'done' && (
        <motion.div
          key="splash"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-[9999] h-[100dvh] min-h-[100svh] w-full overflow-hidden bg-black"
        >
          {/* Centre: icon + name */}
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-4 pb-[env(safe-area-inset-bottom)] pt-[env(safe-area-inset-top)] sm:gap-5">
            {/* Bag icon */}
            <motion.div
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="flex h-20 w-20 items-center justify-center rounded-3xl bg-indigo-600 shadow-2xl shadow-indigo-600/50 sm:h-24 sm:w-24"
            >
              <UniSokoIcon />
            </motion.div>

            {/* Typewriter name */}
            <div className="flex h-12 items-center sm:h-14">
              {(phase === 'typing' || phase === 'tagline') && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-4xl font-black tracking-tight text-white sm:text-5xl"
                >
                  <span className="text-indigo-400">
                    {WORD.slice(0, Math.min(typedChars, 3))}
                  </span>
                  <span className="text-white">
                    {WORD.slice(3, typedChars)}
                  </span>
                  {/* Blinking cursor */}
                  {phase === 'typing' && (
                    <motion.span
                      animate={{ opacity: [1, 0] }}
                      transition={{ duration: 0.5, repeat: Infinity }}
                      className="text-indigo-400"
                    >
                      |
                    </motion.span>
                  )}
                </motion.span>
              )}
            </div>
          </div>

          {/* Bottom: powered by */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: phase === 'tagline' ? 1 : 0, y: phase === 'tagline' ? 0 : 8 }}
            transition={{ duration: 0.4 }}
            className="absolute inset-x-0 bottom-[max(1.5rem,env(safe-area-inset-bottom))] px-4 text-center"
          >
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-600">
              Powered by
            </p>
            <p className="mt-1 text-sm font-bold text-slate-300">
              Matokeo Luvanda Ltd.
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
