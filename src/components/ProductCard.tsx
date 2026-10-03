'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Product } from '@/lib/types';
import { formatTZS } from '@/lib/mockData';
import { useStore } from '@/context/StoreContext';
import { ShoppingBag, MessageCircle, Check, Sparkles, ArrowUpRight, ShieldCheck, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { getProductSpecEntries } from '@/lib/productSpecs';
import { UNISOKO_CONTACT } from '@/lib/siteConfig';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addToCart, selectedCampus, storeSettings } = useStore();
  const [isAdded, setIsAdded] = useState(false);
  const isAvailable = product.stockStatus !== 'Coming Soon';
  const productSpecEntries = getProductSpecEntries(product);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAvailable) return;
    addToCart(product, 1);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 1500);
  };

  const handleWhatsAppOrder = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const campusName = selectedCampus?.name || 'MUST Campus';
    const campusCode = selectedCampus?.shortCode || 'MUST';
    const msg = encodeURIComponent(
      `Habari UniSoko! Nipo ${campusName} (${campusCode}). Nataka kuagiza gadget hii:\n\n• ${product.title}\n• Condition: ${product.condition}\n• Bei ya Rejareja: ${formatTZS(product.priceRetail)}\n• Bei ya Jumla (3+): ${formatTZS(product.priceWholesale)}\n\nTafadhali nambie upatikanaji wa hostel delivery!`
    );
    window.open(`${UNISOKO_CONTACT.whatsappUrl}?text=${msg}`, '_blank', 'noopener,noreferrer');
  };

  // Badge color mapping for conditions
  const conditionColorMap: Record<string, string> = {
    'Grade A Like-New': 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/70 dark:text-indigo-300 dark:border-indigo-800',
    'Brand New': 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/70 dark:text-emerald-300 dark:border-emerald-800',
    'Refurbished': 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/70 dark:text-amber-300 dark:border-amber-800',
  };

  return (
    <motion.div
      whileHover={{ y: -5 }}
      transition={{ duration: 0.2 }}
      className="group relative flex flex-col justify-between h-full overflow-hidden rounded-3xl border border-slate-200 bg-white p-4 shadow-sm hover:border-indigo-300 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900/90 dark:hover:border-indigo-900/80 transition-all"
    >
      <div>
        {/* Top Badges */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <span
            className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${
              conditionColorMap[product.condition] || 'bg-slate-100 text-slate-700'
            }`}
          >
            <ShieldCheck className="h-3 w-3" />
            {product.condition}
          </span>

          {product.stockStatus === 'Coming Soon' ? (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">COMING SOON</span>
          ) : product.stockStatus === 'Trending' ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-extrabold text-amber-700 dark:text-amber-400 border border-amber-500/20">
              <Zap className="h-2.5 w-2.5 fill-current text-amber-600" />
              HOT DEAL
            </span>
          ) : product.stockStatus === 'New Stock' ? (
            <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-extrabold text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
              NEW ARRIVAL
            </span>
          ) : (
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              {product.category}
            </span>
          )}
        </div>

        {/* Product Image */}
        <Link href={`/product/${product.id}`} className="block relative aspect-4/3 w-full overflow-hidden rounded-2xl bg-slate-100 dark:bg-slate-800 mb-3.5 border border-slate-100 dark:border-slate-800">
          <Image
            src={product.images[0]}
            alt={product.title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-linear-to-t from-slate-950/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2.5">
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-white bg-slate-900/85 backdrop-blur-xs px-2.5 py-1 rounded-xl shadow-md">
              View Specs <ArrowUpRight className="h-3 w-3" />
            </span>
          </div>
        </Link>

        {/* Title */}
        <Link href={`/product/${product.id}`} className="block group-hover:text-indigo-600 transition-colors">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-2 leading-snug">
            {product.title}
          </h3>
        </Link>

        {/* Quick Specs Snippet */}
        {productSpecEntries.length > 0 && (
          <div className="mt-2.5 flex flex-wrap gap-1">
            {productSpecEntries.slice(0, 2).map(([key, val]) => (
              <span
                key={key}
                className="rounded-lg bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60"
              >
                {val}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
        {/* Pricing Rows */}
        <div className="mb-3 space-y-1.5">
          {/* Retail Price */}
          <div className="flex items-baseline justify-between">
            <span className="text-[11px] text-slate-600 dark:text-slate-400 font-semibold">Rejareja (Retail):</span>
            <span className="text-base font-extrabold text-slate-900 dark:text-white">
              {formatTZS(product.priceRetail)}
            </span>
          </div>

          {/* Wholesale Pill */}
          <div className="flex items-center justify-between rounded-xl bg-emerald-50/90 px-2.5 py-1.5 text-xs text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/80">
            <span className="flex items-center gap-1 font-bold text-[11px]">
              <Sparkles className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
              Jumla (3+):
            </span>
            <span className="font-extrabold text-emerald-800 dark:text-emerald-300 text-[11px]">
              {formatTZS(product.priceWholesale)} /pc
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2">
          {/* Add to Cart */}
          <button
            onClick={handleAddToCart}
            disabled={!isAvailable}
              className={`flex min-h-11 items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-bold transition-all ${
              !isAvailable
                ? 'cursor-not-allowed bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                : isAdded
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95 shadow-md shadow-indigo-600/20'
            }`}
          >
            {!isAvailable ? (
              <span>Coming Soon</span>
            ) : isAdded ? (
              <>
                <Check className="h-3.5 w-3.5" />
                <span>Added!</span>
              </>
            ) : (
              <>
                <ShoppingBag className="h-3.5 w-3.5" />
                <span>Add to Cart</span>
              </>
            )}
          </button>

          {/* Order via WhatsApp */}
          <button
            onClick={handleWhatsAppOrder}
            className="flex min-h-11 items-center justify-center gap-1.5 rounded-xl border border-emerald-500/50 bg-emerald-50/80 py-2.5 text-xs font-bold text-emerald-800 hover:bg-emerald-100 hover:border-emerald-600 active:scale-95 dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-900/60 transition-all"
            aria-label="Order via WhatsApp"
          >
            <MessageCircle className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>WhatsApp</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
}
