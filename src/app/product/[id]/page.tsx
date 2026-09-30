'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Header from '@/components/Header';
import CartDrawer from '@/components/CartDrawer';
import { MOCK_PRODUCTS, formatTZS, calculateWholesaleSavings } from '@/lib/mockData';
import { useStore } from '@/context/StoreContext';
import {
  ShieldCheck,
  Sparkles,
  ShoppingBag,
  MessageCircle,
  Plus,
  Minus,
  Check,
  ArrowLeft,
  CheckCircle2,
  MapPin,
  Flame,
  Users,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import ProductCard from '@/components/ProductCard';

export default function ProductDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { addToCart, selectedCampus } = useStore();

  const productId = params?.id as string;
  const product = MOCK_PRODUCTS.find((p) => p.id === productId) || MOCK_PRODUCTS[0];

  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isAdded, setIsAdded] = useState(false);
  const [isStartingGroupBuy, setIsStartingGroupBuy] = useState(false);
  const [groupBuyError, setGroupBuyError] = useState('');

  const minWholesale = product.minWholesaleQty || 3;
  const isWholesaleUnlocked = quantity >= minWholesale;
  const activeUnitPrice = isWholesaleUnlocked ? product.priceWholesale : product.priceRetail;
  const totalPrice = activeUnitPrice * quantity;

  const { totalSavings, percentSaved } = calculateWholesaleSavings(
    product.priceRetail,
    product.priceWholesale,
    quantity
  );

  const handleIncrement = () => setQuantity((q) => q + 1);
  const handleDecrement = () => setQuantity((q) => Math.max(1, q - 1));

  const handleAddToCart = () => {
    addToCart(product, quantity);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 1500);
  };

  const handleWhatsAppOrder = () => {
    const wholesaleNote = isWholesaleUnlocked
      ? `\n🎉 *BEI YA JUMLA UNLOCKED* (${quantity} units @ ${formatTZS(product.priceWholesale)} each)`
      : `\n• Bei ya Rejareja: ${formatTZS(product.priceRetail)} each`;

    const msg = encodeURIComponent(
      `Habari UniSoko! Nataka kuagiza gadget hii:\n\n• Bidhaa: ${product.title}\n• Condition: ${product.condition}\n• Idadi: ${quantity} units${wholesaleNote}\n• Jumla Kuu: ${formatTZS(totalPrice)}\n\n📍 Chuo: ${selectedCampus.name} (${selectedCampus.shortCode})\n\nTafadhali thibitisha upatikanaji wa hostel delivery!`
    );
    window.open(`https://wa.me/255754892110?text=${msg}`, '_blank');
  };

  const handleStartGroupBuy = async () => {
    setIsStartingGroupBuy(true);
    setGroupBuyError('');
    try {
      const participantToken = localStorage.getItem('unisoko_group_buyer_token') || crypto.randomUUID();
      localStorage.setItem('unisoko_group_buyer_token', participantToken);
      const response = await fetch('/api/group-buys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: product.id, participantToken }),
      });
      const result = await response.json() as { id?: string; error?: string };
      if (!response.ok || !result.id) throw new Error(result.error || 'Unable to create a group buy.');
      router.push(`/group-buy/${result.id}`);
    } catch (error) {
      setGroupBuyError(error instanceof Error ? error.message : 'Unable to create a group buy.');
    } finally {
      setIsStartingGroupBuy(false);
    }
  };

  // Related products
  const relatedProducts = MOCK_PRODUCTS.filter(
    (p) => p.id !== product.id && p.category === product.category
  ).slice(0, 3);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 flex flex-col font-sans">
      <Header />

      <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6 space-y-10">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Products</span>
          </button>

          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>{product.category}</span>
            <span>/</span>
            <span className="text-slate-700 dark:text-slate-200 font-medium truncate max-w-50">
              {product.title}
            </span>
          </div>
        </div>

        {/* Product Hero Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Left Column: Image Gallery */}
          <div className="lg:col-span-7 space-y-4">
            {/* Main Active Image Display */}
            <div className="relative aspect-4/3 w-full overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-lg dark:border-slate-800 dark:bg-slate-900">
              <Image
                src={product.images[selectedImageIndex] || product.images[0]}
                alt={product.title}
                fill
                priority
                className="object-cover transition-all duration-300"
              />

              {/* Status Pill on Image */}
              <div className="absolute top-4 left-4 flex flex-col gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-900/80 backdrop-blur-md px-3 py-1 text-xs font-bold text-white">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                  {product.condition}
                </span>

                {product.stockStatus === 'Trending' && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-500 px-2.5 py-0.5 text-xs font-extrabold text-slate-950 shadow-md">
                    <Flame className="h-3.5 w-3.5 fill-current" />
                    TRENDING IN MBEYA
                  </span>
                )}
              </div>
            </div>

            {/* Thumbnails Gallery */}
            {product.images.length > 1 && (
              <div className="flex items-center gap-3 overflow-x-auto pb-2">
                {product.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImageIndex(idx)}
                    className={`relative h-20 w-24 shrink-0 overflow-hidden rounded-xl border-2 transition-all ${
                      selectedImageIndex === idx
                        ? 'border-indigo-600 ring-2 ring-indigo-600/30 shadow-md'
                        : 'border-slate-200 opacity-70 hover:opacity-100 dark:border-slate-800'
                    }`}
                  >
                    <Image src={img} alt={`Thumbnail ${idx + 1}`} fill className="object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Condition Guarantee Box */}
            <div className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-5 dark:border-indigo-950/60 dark:bg-indigo-950/20">
              <h4 className="text-xs font-bold text-indigo-900 dark:text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                UniSoko Student Inspection Guarantee
              </h4>
              <p className="mt-1.5 text-xs text-indigo-950/80 dark:text-indigo-200/80 leading-relaxed">
                Every unit undergoes comprehensive 25-point hardware diagnostics: motherboard voltage stability, battery cycle retention, crystal-clear screen panel check, keyboard response, and authentic original power adapter inclusion.
              </p>
            </div>
          </div>

          {/* Right Column: Product Info & Pricing Matrix */}
          <div className="lg:col-span-5 space-y-6">
            {/* Title & Short Description */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  {product.category}
                </span>
                <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" /> In Stock for Delivery
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white leading-tight">
                {product.title}
              </h1>
              <p className="mt-3 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {product.description}
              </p>
            </div>

            {/* Pricing Tier Card */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
              <div className="grid grid-cols-2 gap-3 border-b border-slate-100 pb-4 dark:border-slate-800">
                {/* Retail Tier */}
                <div className={`p-3 rounded-xl border transition-all ${
                  !isWholesaleUnlocked
                    ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/30'
                    : 'border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/40 opacity-70'
                }`}>
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                    Rejareja (1-2 Units)
                  </span>
                  <span className="text-lg font-black text-slate-900 dark:text-white mt-1 block">
                    {formatTZS(product.priceRetail)}
                  </span>
                  <span className="text-[10px] text-slate-400">Unit Price</span>
                </div>

                {/* Wholesale Tier */}
                <div className={`p-3 rounded-xl border transition-all relative overflow-hidden ${
                  isWholesaleUnlocked
                    ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 shadow-sm'
                    : 'border-emerald-200 bg-emerald-50/40 dark:border-emerald-900/40 dark:bg-emerald-950/20'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider flex items-center gap-1">
                      <Sparkles className="h-3 w-3 text-emerald-600" />
                      Jumla (3+ Units)
                    </span>
                  </div>
                  <span className="text-lg font-black text-emerald-700 dark:text-emerald-400 mt-1 block">
                    {formatTZS(product.priceWholesale)}
                  </span>
                  <span className="text-[10px] text-emerald-600/80 dark:text-emerald-300 font-semibold">
                    Save {formatTZS(product.priceRetail - product.priceWholesale)} /pc
                  </span>
                </div>
              </div>

              {/* Dynamic Quantity Selector */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Select Quantity:
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Hostel squad bulk buying supported
                  </span>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center rounded-xl border-2 border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800 p-1">
                    <button
                      onClick={handleDecrement}
                      className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-slate-700 shadow-xs hover:bg-slate-100 dark:bg-slate-700 dark:text-white transition-colors"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="w-14 text-center text-base font-extrabold text-slate-900 dark:text-white">
                      {quantity}
                    </span>
                    <button
                      onClick={handleIncrement}
                      className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-slate-700 shadow-xs hover:bg-slate-100 dark:bg-slate-700 dark:text-white transition-colors"
                      aria-label="Increase quantity"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Quantity Tip */}
                  <div className="text-xs text-slate-500">
                    {quantity < minWholesale ? (
                      <span className="text-indigo-600 dark:text-indigo-400 font-semibold">
                        Add {minWholesale - quantity} more to unlock Bei ya Jumla discount!
                      </span>
                    ) : (
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                        <Check className="h-3.5 w-3.5" />
                        Wholesale discount active ({quantity} units)
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Dynamic Wholesale Banner Animation */}
              <AnimatePresence>
                {isWholesaleUnlocked && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -5 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -5 }}
                    className="rounded-xl bg-emerald-600 p-3.5 text-white shadow-lg shadow-emerald-600/20 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xl">🎉</span>
                      <div>
                        <p className="text-xs font-extrabold tracking-wide">
                          Bei ya Jumla Unlocked!
                        </p>
                        <p className="text-[11px] text-emerald-100">
                          Total Bulk Savings: {formatTZS(totalSavings)} ({percentSaved}% saved)
                        </p>
                      </div>
                    </div>
                    <span className="rounded-lg bg-white/20 px-2.5 py-1 text-[11px] font-bold backdrop-blur-xs">
                      Wholesale Tier
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Order Total & CTA Buttons */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
                <div className="flex items-baseline justify-between">
                  <span className="text-xs text-slate-500 font-medium">Estimated Order Total:</span>
                  <div className="text-right">
                    <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
                      {formatTZS(totalPrice)}
                    </span>
                    <p className="text-[11px] text-emerald-600 font-semibold">
                      Free delivery to {selectedCampus.shortCode} hostels
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <button
                    onClick={handleAddToCart}
                    className={`flex items-center justify-center gap-2 rounded-xl py-3.5 text-xs sm:text-sm font-bold shadow-lg transition-all ${
                      isAdded
                        ? 'bg-emerald-600 text-white shadow-emerald-600/20'
                        : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-600/20 active:scale-95'
                    }`}
                  >
                    {isAdded ? (
                      <>
                        <Check className="h-4 w-4" />
                        <span>Added to Cart!</span>
                      </>
                    ) : (
                      <>
                        <ShoppingBag className="h-4 w-4" />
                        <span>Add {quantity} to Cart</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleWhatsAppOrder}
                    className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3.5 text-xs sm:text-sm font-bold text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 active:scale-95 transition-all"
                  >
                    <MessageCircle className="h-4 w-4" />
                    <span>Order via WhatsApp</span>
                  </button>
                </div>
                <div className="rounded-2xl border border-indigo-100 bg-indigo-50/70 p-4 dark:border-indigo-900 dark:bg-indigo-950/30">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div><p className="flex items-center gap-2 text-sm font-extrabold text-slate-900 dark:text-white"><Users className="h-4 w-4 text-indigo-600" />Start Group-Buy (Split Wholesale)</p><p className="mt-1 text-xs text-slate-600 dark:text-slate-300">Share a 24-hour invite. Two students unlock the group wholesale rate.</p></div>
                    <button onClick={() => void handleStartGroupBuy()} disabled={isStartingGroupBuy} className="shrink-0 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-indigo-700 disabled:opacity-60">{isStartingGroupBuy ? 'Starting…' : 'Start group'}</button>
                  </div>
                  {groupBuyError && <p role="alert" className="mt-2 text-xs font-semibold text-red-700">{groupBuyError}</p>}
                </div>
              </div>
            </div>

            {/* Campus Delivery Location Notice */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
                <MapPin className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white">
                  Campus Hand-Off Point ({selectedCampus.shortCode}):
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Available for pickup at: {selectedCampus.popularSpots.slice(0, 3).join(', ')}.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Specifications Breakdown */}
        {product.specs && (
          <section className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 dark:border-slate-800 dark:bg-slate-900 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Technical Specifications & Diagnostics
              </h3>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                Verified Hardware
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(product.specs).map(([key, val]) => (
                <div
                  key={key}
                  className="flex items-center justify-between rounded-xl bg-slate-50 p-3.5 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800"
                >
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                    {key}
                  </span>
                  <span className="text-xs font-bold text-slate-900 dark:text-white text-right">
                    {val}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Related Gadgets Section */}
        {relatedProducts.length > 0 && (
          <section className="space-y-4 pt-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                More Student Deals in {product.category}
              </h3>
              <Link
                href="/"
                className="text-xs font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
              >
                View All Deals →
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {relatedProducts.map((rel) => (
                <ProductCard key={rel.id} product={rel} />
              ))}
            </div>
          </section>
        )}
      </main>

      <CartDrawer />
    </div>
  );
}
