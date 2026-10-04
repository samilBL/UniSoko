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
    // Show once per session
    if (sessionStorage.getItem('unisoko_splash_seen')) {
      setVisible(false);
      return;
    }
    sessionStorage.setItem('unisoko_splash_seen', 'true');

    // Phase 1: Show logo icon for 600ms, then start typing
    const t1 = setTimeout(() => setPhase('typing'), 600);
    return () => clearTimeout(t1);
  }, []);

  // Typewriter effect
  useEffect(() => {
    if (phase !== 'typing') return;
    if (typedChars < WORD.length) {
      const t = setTimeout(() => setTypedChars((c) => c + 1), 90);
      return () => clearTimeout(t);
    } else {
      // All chars typed — show tagline after brief pause
      const t = setTimeout(() => setPhase('tagline'), 300);
      return () => clearTimeout(t);
    }
  }, [phase, typedChars]);

  // After tagline appears, fade out after 1.2s
  useEffect(() => {
    if (phase !== 'tagline') return;
    const t = setTimeout(() => setPhase('done'), 1400);
    return () => clearTimeout(t);
  }, [phase]);

  useEffect(() => {
    if (phase === 'done') {
      const t = setTimeout(() => setVisible(false), 500);
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
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-between bg-black"
        >
          {/* Centre: icon + name */}
          <div className="flex flex-1 flex-col items-center justify-center gap-5">
            {/* Bag icon */}
            <motion.div
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="flex h-24 w-24 items-center justify-center rounded-3xl bg-indigo-600 shadow-2xl shadow-indigo-600/50"
            >
              <UniSokoIcon />
            </motion.div>

            {/* Typewriter name */}
            <div className="flex items-center h-14">
              {(phase === 'typing' || phase === 'tagline') && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-5xl font-black tracking-tight text-white"
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
            className="pb-14 text-center"
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
