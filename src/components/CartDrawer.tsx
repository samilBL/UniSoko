'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '@/context/StoreContext';
import { formatTZS } from '@/lib/mockData';
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight, Sparkles, MessageCircle } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { createWhatsAppLink } from '@/lib/whatsapp';
import { UNISOKO_CONTACT } from '@/lib/siteConfig';

export default function CartDrawer() {
  const {
    cart,
    isCartOpen,
    setIsCartOpen,
    removeFromCart,
    updateQuantity,
    cartSubtotal,
    cartTotalSavings,
    selectedCampus,
    cartCount,
    storeSettings,
  } = useStore();

  const handleWhatsAppCheckout = () => {
    if (cart.length === 0) return;
    const itemsText = cart
      .map((item) => {
        const isWholesale = item.quantity >= (item.product.minWholesaleQty || 3);
        const price = isWholesale ? item.product.priceWholesale : item.product.priceRetail;
        return `• ${item.quantity}x ${item.product.title} (${isWholesale ? 'Wholesale' : 'Retail'}) @ ${formatTZS(price)}`;
      })
      .join('\n');

    const message =
      `Habari UniSoko! Nataka kuagiza kupitia Campus Store:\n\n${itemsText}\n\n📍 Chuo: ${selectedCampus.name} (${selectedCampus.shortCode})\n💵 Jumla Kuu: ${formatTZS(cartSubtotal)}${
        cartTotalSavings > 0 ? ` (Umeokoa ${formatTZS(cartTotalSavings)})` : ''
      }\n\nTafadhali nithibitishie namba ya Lipa na muda wa kupokea mzigo!`;
    window.open(createWhatsAppLink(UNISOKO_CONTACT.phoneDigits, message), '_blank', 'noopener,noreferrer');
  };

  return (
    <AnimatePresence>
      {isCartOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsCartOpen(false)}
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity"
          />

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="w-screen max-w-md bg-white shadow-2xl flex flex-col dark:bg-slate-900"
            >
              {/* Drawer Header */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
                    <ShoppingBag className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900 dark:text-white">
                      Your Shopping Cart
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {cartCount} {cartCount === 1 ? 'item' : 'items'} • Delivering to {selectedCampus.shortCode}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="flex min-h-11 min-w-11 items-center justify-center rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Cart Items List */}
              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                {cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center py-12">
                    <div className="h-20 w-20 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-4 dark:bg-slate-800">
                      <ShoppingBag className="h-10 w-10 stroke-[1.5]" />
                    </div>
                    <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                      Your cart is empty
                    </h3>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 max-w-60">
                      Explore Grade-A laptops, smartphones, and student gear at unbeatable campus prices.
                    </p>
                    <button
                      onClick={() => setIsCartOpen(false)}
                      className="mt-6 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-colors"
                    >
                      Start Shopping
                    </button>
                  </div>
                ) : (
                  cart.map(({ product, quantity }) => {
                    const isWholesale = quantity >= (product.minWholesaleQty || 3);
                    const unitPrice = isWholesale ? product.priceWholesale : product.priceRetail;
                    const itemTotal = unitPrice * quantity;

                    return (
                      <div
                        key={product.id}
                        className="rounded-xl border border-slate-100 bg-slate-50/50 p-3.5 transition-all dark:border-slate-800 dark:bg-slate-800/40"
                      >
                        <div className="flex gap-3">
                          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-slate-200 dark:bg-slate-700">
                            <Image
                              src={product.images[0]}
                              alt={product.title}
                              fill
                              sizes="64px"
                              className="object-cover"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-1">
                              <h4 className="text-xs font-semibold text-slate-900 dark:text-white line-clamp-2">
                                {product.title}
                              </h4>
                              <button
                                onClick={() => removeFromCart(product.id)}
                                className="flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 transition-colors"
                                aria-label="Remove item"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>

                            <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                              <span className="rounded bg-indigo-50 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
                                {product.condition}
                              </span>
                              {isWholesale ? (
                                <span className="inline-flex items-center gap-0.5 rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                                  <Sparkles className="h-2.5 w-2.5 text-emerald-600" />
                                  Bei ya Jumla Unlocked
                                </span>
                              ) : (
                                <span className="text-[10px] text-slate-500">
                                  Add {Math.max(0, (product.minWholesaleQty || 3) - quantity)} more for Jumla discount
                                </span>
                              )}
                            </div>

                            <div className="mt-3 flex items-center justify-between">
                              <div className="flex items-center rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
                                <button
                                  onClick={() => updateQuantity(product.id, quantity - 1)}
                                  className="flex h-11 w-11 items-center justify-center text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-l-lg transition-colors"
                                >
                                  <Minus className="h-3 w-3" />
                                </button>
                                <span className="px-2 text-xs font-bold text-slate-800 dark:text-slate-200">
                                  {quantity}
                                </span>
                                <button
                                  onClick={() => updateQuantity(product.id, quantity + 1)}
                                  className="flex h-11 w-11 items-center justify-center text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-r-lg transition-colors"
                                >
                                  <Plus className="h-3 w-3" />
                                </button>
                              </div>

                              <div className="text-right">
                                <div className="text-xs font-bold text-slate-900 dark:text-white">
                                  {formatTZS(itemTotal)}
                                </div>
                                <div className="text-[10px] text-slate-400">
                                  {formatTZS(unitPrice)} each
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Drawer Footer */}
              {cart.length > 0 && (
                <div className="border-t border-slate-100 bg-white px-6 py-5 dark:border-slate-800 dark:bg-slate-900 space-y-3">
                  {cartTotalSavings > 0 && (
                    <div className="flex items-center justify-between rounded-lg bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-900/50">
                      <span className="flex items-center gap-1.5">
                        <Sparkles className="h-3.5 w-3.5" />
                        Wholesale Savings Applied:
                      </span>
                      <span>-{formatTZS(cartTotalSavings)}</span>
                    </div>
                  )}

                  <div className="space-y-1.5 text-xs text-slate-500 dark:text-slate-400">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span className="font-semibold text-slate-900 dark:text-white">
                        {formatTZS(cartSubtotal)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Campus Delivery ({selectedCampus.shortCode})</span>
                      <span className="font-bold text-emerald-600">FREE Hand-off</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between items-baseline">
                    <span className="text-sm font-bold text-slate-900 dark:text-white">Total Amount</span>
                    <span className="text-lg font-extrabold text-indigo-600 dark:text-indigo-400">
                      {formatTZS(cartSubtotal)}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <button
                      onClick={handleWhatsAppCheckout}
                      className="flex min-h-11 items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-3 text-xs font-bold text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition-all"
                    >
                      <MessageCircle className="h-4 w-4" />
                      WhatsApp
                    </button>
                    <Link
                      href="/checkout"
                      onClick={() => setIsCartOpen(false)}
                      className="flex min-h-11 items-center justify-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-3 text-xs font-bold text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all"
                    >
                      <span>Checkout</span>
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>

                  <p className="text-center text-[10px] text-slate-400">
                    Lipa Namba: AzamPesa / M-Pesa / Tigo Pesa supported
                  </p>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}
