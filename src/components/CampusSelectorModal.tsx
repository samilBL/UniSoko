'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '@/context/StoreContext';
import { MapPin, Check, X, School, Navigation } from 'lucide-react';
import { UniversityLocation } from '@/lib/types';

interface CampusSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CampusSelectorModal({ isOpen, onClose }: CampusSelectorModalProps) {
  const { selectedCampus, setSelectedCampus, allUniversities } = useStore();

  const handleSelect = (uni: UniversityLocation) => {
    setSelectedCampus(uni);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
          />

          {/* Modal Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-slate-900/10 dark:bg-slate-900 dark:ring-slate-800"
          >
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
                  <MapPin className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    Select Your University Campus
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Tanzania-wide • Choose your university for local delivery or courier options
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* University List */}
            <div className="mt-4 space-y-4 max-h-[60vh] overflow-y-auto pr-1">
              {/* Mbeya Campuses */}
              <div className="space-y-2">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1">
                  Mbeya Hostels & Direct Hand-Off
                </div>
                {allUniversities.filter((u) => u.isMbeya).map((uni) => {
                  const isSelected = selectedCampus.id === uni.id;
                  return (
                    <button
                      key={uni.id}
                      onClick={() => handleSelect(uni)}
                      className={`group w-full text-left rounded-xl p-3.5 transition-all border ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/40 dark:border-indigo-500 shadow-sm'
                          : 'border-slate-200/80 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:hover:border-slate-700 dark:hover:bg-slate-800/60'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-start gap-3">
                          <div
                            className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                              isSelected
                                ? 'bg-indigo-600 text-white'
                                : 'bg-slate-100 text-slate-600 group-hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
                            }`}
                          >
                            <School className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-sm text-slate-900 dark:text-white">
                                {uni.name}
                              </span>
                              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                {uni.shortCode}
                              </span>
                            </div>
                            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                              {uni.campus}
                            </p>
                            <div className="mt-2 flex flex-wrap gap-1">
                              {uni.popularSpots.slice(0, 2).map((spot, idx) => (
                                <span
                                  key={idx}
                                  className="inline-flex items-center gap-1 rounded bg-white/80 px-1.5 py-0.5 text-[10px] text-slate-600 ring-1 ring-slate-200 dark:bg-slate-800/80 dark:text-slate-300 dark:ring-slate-700"
                                >
                                  <Navigation className="h-2.5 w-2.5 text-emerald-500" />
                                  {spot}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>

                        {isSelected && (
                          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-white">
                            <Check className="h-3.5 w-3.5" />
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Regional Campuses */}
              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1">
                  National Universities (Bus / Courier Shipping)
                </div>
                {allUniversities.filter((u) => !u.isMbeya).map((uni) => {
                  const isSelected = selectedCampus.id === uni.id;
                  return (
                    <button
                      key={uni.id}
                      onClick={() => handleSelect(uni)}
                      className={`group w-full text-left rounded-xl p-3.5 transition-all border ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/40 dark:border-indigo-500 shadow-sm'
                          : 'border-slate-200/80 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:hover:border-slate-700 dark:hover:bg-slate-800/60'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-start gap-3">
                          <div
                            className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                              isSelected
                                ? 'bg-indigo-600 text-white'
                                : 'bg-slate-100 text-slate-600 group-hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
                            }`}
                          >
                            <School className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-sm text-slate-900 dark:text-white">
                                {uni.name}
                              </span>
                              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                {uni.shortCode}
                              </span>
                            </div>
                            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                              {uni.city} • Courier parcel shipping
                            </p>
                          </div>
                        </div>

                        {isSelected && (
                          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-white">
                            <Check className="h-3.5 w-3.5" />
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Footer Note */}
            <div className="mt-5 rounded-xl bg-emerald-50/80 p-3 text-xs text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/50 flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>
                Mbeya offers direct campus hand-off; regional campuses use courier delivery and local Winga hub coordination.
              </span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
