'use client';

import React from 'react';
import {
  Laptop,
  Smartphone,
  Headphones,
  Layers,
  Flame,
  LayoutGrid,
  Zap,
  Sparkles,
} from 'lucide-react';

export type FilterCategory =
  | 'All'
  | 'Laptops'
  | 'Laptops & Computers'
  | 'Phones'
  | 'Smart Phones & Accessories'
  | 'Accessories'
  | 'Power & Audio'
  | 'Room Gear'
  | 'Student Lifestyle Gear'
  | 'Campus Essentials'
  | 'Bei ya Jumla'
  | 'Trending';

interface FilterChipsProps {
  selectedFilter: FilterCategory;
  onSelectFilter: (filter: FilterCategory) => void;
  counts?: Partial<Record<FilterCategory, number>>;
}

const CHIPS: { id: FilterCategory; label: string; icon: React.ReactNode }[] = [
  { id: 'All', label: 'All products', icon: <LayoutGrid className="h-3.5 w-3.5" /> },
  { id: 'Laptops', label: 'Laptops', icon: <Laptop className="h-3.5 w-3.5" /> },
  { id: 'Phones', label: 'Phones & tablets', icon: <Smartphone className="h-3.5 w-3.5" /> },
  { id: 'Accessories', label: 'Fast Chargers & Hubs', icon: <Zap className="h-3.5 w-3.5 text-amber-500" /> },
  { id: 'Power & Audio', label: 'Power & audio', icon: <Headphones className="h-3.5 w-3.5" /> },
  { id: 'Room Gear', label: 'Room essentials', icon: <Sparkles className="h-3.5 w-3.5 text-emerald-500" /> },
  { id: 'Bei ya Jumla', label: 'Group-buy prices', icon: <Layers className="h-3.5 w-3.5 text-indigo-500" /> },
  { id: 'Trending', label: 'Trending', icon: <Flame className="h-3.5 w-3.5 text-red-500" /> },
];

export default function FilterChips({ selectedFilter, onSelectFilter, counts }: FilterChipsProps) {
  return (
    <div role="group" aria-label="Filter products by category" className="flex items-center gap-2 overflow-x-auto pb-2 pt-1 no-scrollbar">
      {CHIPS.map((chip) => {
        const isSelected = selectedFilter === chip.id;
        const count = counts?.[chip.id];

        return (
          <button
            key={chip.id}
            type="button"
            aria-pressed={isSelected}
            onClick={() => onSelectFilter(chip.id)}
            className={`flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-xs font-bold transition-all shadow-xs ${
              isSelected
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20 scale-[1.02]'
                : 'bg-white text-slate-800 hover:bg-slate-100 hover:text-slate-900 border border-slate-300 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            {chip.icon}
            <span>{chip.label}</span>
            {count !== undefined && (
              <span
                className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                  isSelected
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                }`}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
