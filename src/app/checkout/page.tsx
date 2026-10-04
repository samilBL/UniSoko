'use client';

import React, { useState, useMemo, useRef } from 'react';
import Header from '@/components/Header';
import CartDrawer from '@/components/CartDrawer';
import { useStore } from '@/context/StoreContext';
import {
  ALL_UNIVERSITIES,
  MBEYA_UNIVERSITIES,
  NON_MBEYA_UNIVERSITIES,
  formatTZS,
} from '@/lib/mockData';
import { Order, DeliverySpotType } from '@/lib/types';
import {
  MapPin,
  School,
  Truck,
  Sparkles,
  CheckCircle2,
  Copy,
  Check,
  Download,
  CreditCard,
  User,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  Clock,
  MessageCircle,
  ShoppingBag,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { createWhatsAppLink } from '@/lib/whatsapp';
import { UNISOKO_CONTACT } from '@/lib/siteConfig';
import TradeInModal from '@/components/TradeInModal';
import { TRADE_IN_INSPECTION_DISCLAIMER } from '@/lib/tradeInValuation';
import type { TradeInQuoteAttachment } from '@/lib/types';

export default function CheckoutPage() {
  const {
    cart,
    selectedCampus,
    setSelectedCampus,
    allUniversities = ALL_UNIVERSITIES,
    clearCart,
    storeSettings,
    tradeInQuote,
    setTradeInQuote,
  } = useStore();

  const checkoutItems = useMemo(() => cart || [], [cart]);

  // Safe fallback for selected campus
  const safeCampus = useMemo(() => {
    if (selectedCampus && selectedCampus.id) return selectedCampus;
    return MBEYA_UNIVERSITIES[0];
  }, [selectedCampus]);

  // Form State
  const [buyerName, setBuyerName] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');
  const [deliverySpotType, setDeliverySpotType] = useState<DeliverySpotType>('Hostel');
  const [hostelName, setHostelName] = useState('');
  const [roomNumber, setRoomNumber] = useState('');
  const [landmarkDetail, setLandmarkDetail] = useState('');
  const [regionalHubAddress, setRegionalHubAddress] = useState('');

  // Winga Promo Code State
  const [promoInput, setPromoInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<{
    code: string;
    agentName: string;
    university: string;
    discountAmount: number;
  } | null>(null);
  const [promoError, setPromoError] = useState('');
  const [promoSuccess, setPromoSuccess] = useState('');
  const [isApplyingPromo, setIsApplyingPromo] = useState(false);

  // Lipa Namba State
  const [isLipaModalOpen, setIsLipaModalOpen] = useState(false);
  const [copiedTill, setCopiedTill] = useState(false);
  const [lipaTxId, setLipaTxId] = useState('');
  const [txError, setTxError] = useState('');

  // Completed Order State
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);
  const [trackingToken, setTrackingToken] = useState<string | null>(null);
  const [trackingSaveMessage, setTrackingSaveMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
    const [isTradeInModalOpen, setIsTradeInModalOpen] = useState(false);
  const paymentModalRef = useRef<HTMLDivElement>(null);
  const proceedButtonRef = useRef<HTMLButtonElement>(null);

  // University determination with defensive checks
  const isMbeyaUni = Boolean(safeCampus?.isMbeya);
  const configuredPaymentMethods = storeSettings?.paymentMethods?.filter((method) => method.enabled && method.tillNumber.trim()) || [];
  const paymentMethods = configuredPaymentMethods.length > 0
    ? configuredPaymentMethods
    : [{ network: 'M-Pesa' as const, tillNumber: storeSettings?.tillNumber || '5849201', accountName: storeSettings?.accountName || 'UNISOKO TECH CAMPUS HUB', enabled: true }];

  // Pricing Calculation
  const rawSubtotal = checkoutItems.reduce((sum, item) => {
    const minQty = item.product?.minWholesaleQty || 3;
    const isWholesale = item.quantity >= minQty;
    const unitPrice = isWholesale ? (item.product?.priceWholesale || item.product?.priceRetail || 0) : (item.product?.priceRetail || 0);
    return sum + unitPrice * item.quantity;
  }, 0);

  const promoDiscount = appliedPromo ? appliedPromo.discountAmount : 0;
  const tradeInDiscount = Math.min(tradeInQuote?.estimatedPrice || 0, rawSubtotal);
  const shippingFee = isMbeyaUni ? 0 : 7000; // Free for Mbeya hostels, TZS 7,000 for regional courier
  const finalTotal = Math.max(0, rawSubtotal + shippingFee - promoDiscount - tradeInDiscount);

  const handleTradeInQuote = (quote: TradeInQuoteAttachment) => setTradeInQuote(quote);

  // Handle Promo Validation
  const handleApplyPromo = async () => {
    setPromoError('');
    setPromoSuccess('');
    setAppliedPromo(null);
    const code = promoInput.trim().toUpperCase();

    if (!code) {
      setPromoError('Please enter a promo code');
      return;
    }

    setIsApplyingPromo(true);
    try {
      const response = await fetch(`/api/winga/promo/${encodeURIComponent(code)}`, { cache: 'no-store' });
      const result = await response.json() as { code?: string; discountAmount?: number; error?: string };
      if (!response.ok || !result.code || !Number.isFinite(result.discountAmount)) {
        setPromoError(response.status === 404 ? 'Invalid promo code' : result.error || 'Could not verify the promo code. Try again.');
        return;
      }
      setAppliedPromo({
        code: result.code,
        agentName: 'Campus Student Ambassador',
        university: safeCampus.shortCode || 'Uni',
        discountAmount: result.discountAmount as number,
      });
      setPromoSuccess(`Code ${result.code} applied.`);
    } catch {
      setPromoError('Could not verify the promo code. Try again.');
    } finally {
      setIsApplyingPromo(false);
    }
  };

  const handleCopyTill = (tillToCopy: string = paymentMethods[0].tillNumber) => {
    navigator.clipboard.writeText(tillToCopy);
    setCopiedTill(true);
    setTimeout(() => setCopiedTill(false), 2000);
  };

  const getTrackingPath = () => completedOrder && trackingToken
    ? `/track/${encodeURIComponent(completedOrder.id)}?token=${encodeURIComponent(trackingToken)}`
    : '';

  const copyTrackingLink = async () => {
    const path = getTrackingPath();
    if (!path) return;
    try {
      await navigator.clipboard.writeText(new URL(path, window.location.origin).toString());
      setTrackingSaveMessage('Secure tracking link copied. Save it somewhere private.');
    } catch {
      setTrackingSaveMessage('Copy is unavailable in this browser. Download your tracking details below.');
    }
  };

  const downloadTrackingDetails = () => {
    const path = getTrackingPath();
    if (!completedOrder || !trackingToken || !path) return;
    const text = [
      'UniSoko private order tracking details',
      `Order number: ${completedOrder.id}`,
      `Tracking access token: ${trackingToken}`,
      `Private tracking link: ${new URL(path, window.location.origin).toString()}`,
      '',
      'Keep this file private. Anyone with this link or token can view your order status.',
    ].join('\n');
    const blobUrl = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = `unisoko-order-${completedOrder.id}-tracking.txt`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
    setTrackingSaveMessage('Tracking details downloaded. Keep the file private.');
  };

  const handleStartPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!buyerName.trim() || !buyerPhone.trim()) {
      alert('Please fill in your recipient name and phone number.');
      return;
    }
    setIsLipaModalOpen(true);
  };

  const closePaymentModal = () => {
    setIsLipaModalOpen(false);
    window.requestAnimationFrame(() => proceedButtonRef.current?.focus());
  };

  const handlePaymentModalKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      closePaymentModal();
      return;
    }
    if (event.key !== 'Tab') return;
    const focusable = Array.from(paymentModalRef.current?.querySelectorAll<HTMLElement>(
      'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'
    ) || []).filter((element) => element.offsetParent !== null);
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  const handleCompleteOrder = async () => {
    if (!lipaTxId.trim()) {
      setTxError('Please enter the M-Pesa / Tigo Pesa Transaction Reference ID from your SMS.');
      return;
    }

    setTxError('');
    setIsSubmitting(true);

    const defaultSpot = safeCampus?.popularSpots?.[0] || 'Campus Gate Landmark';
    const defaultHub = safeCampus?.courierHub || 'Regional Central Bus Station';

    const deliveryDetailsFormatted = isMbeyaUni
      ? deliverySpotType === 'Hostel'
        ? `Hostel: ${hostelName || 'Hostel Block'}, Room: ${roomNumber || 'N/A'}`
        : `Landmark Spot: ${landmarkDetail || defaultSpot}`
      : `Regional Courier Hub: ${regionalHubAddress || defaultHub}`;

    const newOrder: Order = {
      id: '',
      productId: checkoutItems[0]?.product?.id || 'prod-custom',
      product: checkoutItems[0]?.product,
      items: checkoutItems.map(({ product, quantity }) => ({
        productId: product.id,
        productTitle: product.title,
        condition: product.condition,
        quantity,
        unitPrice: quantity >= (product.minWholesaleQty || 3) ? product.priceWholesale : product.priceRetail,
        lineTotal: (quantity >= (product.minWholesaleQty || 3) ? product.priceWholesale : product.priceRetail) * quantity,
      })),
      subtotalAmount: rawSubtotal,
      shippingFee,
      promoDiscount,
        tradeInRequestId: tradeInQuote?.requestId,
        tradeInEstimate: tradeInDiscount,
        tradeInInspectionStatus: tradeInQuote ? 'Trade-In Pending Inspection' : 'Not Required',
      buyerName: buyerName.trim(),
      buyerPhone: buyerPhone.trim(),
      university: `${safeCampus.name} (${safeCampus.shortCode})`,
      deliverySpotType: isMbeyaUni ? deliverySpotType : 'Courier',
      deliveryDetails: deliveryDetailsFormatted,
      quantity: checkoutItems.reduce((s, i) => s + i.quantity, 0),
      totalAmount: finalTotal,
      wingaCodeUsed: appliedPromo?.code,
      lipaNambaTxId: lipaTxId.trim().toUpperCase(),
      status: 'Pending Verification',
      paymentStatus: 'Submitted',
      fulfillmentStatus: 'Unconfirmed',
      deliveryStatus: 'Not Dispatched',
      statusHistory: [{
        statusType: 'payment',
        status: 'Submitted',
        label: 'Payment Submitted',
        changedBy: 'customer',
        changedAt: new Date().toISOString(),
      }],
      createdAt: new Date().toISOString(),
    };

    let orderCreated = false;
    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          buyerName: newOrder.buyerName,
          buyerPhone: newOrder.buyerPhone,
          campusId: safeCampus.id,
          deliverySpotType: newOrder.deliverySpotType,
          deliveryDetails: newOrder.deliveryDetails,
          items: checkoutItems.map(({ product, quantity }) => ({ productId: product.id, quantity })),
          wingaCodeUsed: appliedPromo?.code,
          lipaNambaTxId: newOrder.lipaNambaTxId,
          tradeIn: tradeInQuote ? { requestId: tradeInQuote.requestId, token: tradeInQuote.token } : null,
        }),
      });
      const result = await response.json() as {
        orderId?: string;
        trackingToken?: string;
        items?: Order['items'];
        subtotalAmount?: number;
        shippingFee?: number;
        promoDiscount?: number;
        tradeInRequestId?: string | null;
        tradeInEstimate?: number;
        totalAmount?: number;
        error?: string;
      };
      if (!response.ok || !result.orderId || !result.trackingToken || !Number.isFinite(result.totalAmount)) {
        const serverError = result.error?.toLowerCase() || '';
        const message = appliedPromo && (serverError.includes('invalid') || serverError.includes('waiting for student id')) ? 'Invalid promo code' : result.error;
        setTxError(message || 'UniSoko could not securely submit this order. Please retry.');
        return;
      }
      const acceptedOrder: Order = {
        ...newOrder,
        id: result.orderId,
        items: result.items,
        subtotalAmount: result.subtotalAmount,
        shippingFee: result.shippingFee,
        promoDiscount: result.promoDiscount,
        tradeInRequestId: result.tradeInRequestId || undefined,
        tradeInEstimate: result.tradeInEstimate,
        tradeInInspectionStatus: result.tradeInRequestId ? 'Trade-In Pending Inspection' : 'Not Required',
        totalAmount: result.totalAmount as number,
      };
      setTrackingToken(result.trackingToken);
      clearCart();
      setCompletedOrder(acceptedOrder);
      orderCreated = true;
    } catch {
      setTxError('Network error. Your order was not submitted; check your connection and retry.');
    } finally {
      setIsSubmitting(false);
      if (orderCreated) setIsLipaModalOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 flex flex-col font-sans">
      <Header />

      <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* If Order is Completed -> Display Rich Confirmation Receipt with Confetti Ripple */}
        {completedOrder ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative max-w-2xl mx-auto rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-10 shadow-2xl dark:border-slate-800 dark:bg-slate-900 text-center space-y-6 overflow-hidden"
          >
            {/* Animated Confetti Ripple Rings */}
            <div className="absolute top-12 left-1/2 -translate-x-1/2 h-32 w-32 rounded-full border-4 border-emerald-400/40 animate-ripple pointer-events-none" />

            <div className="relative mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 z-10 shadow-md">
              <CheckCircle2 className="h-10 w-10" />
            </div>

            <div className="relative z-10">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3.5 py-1 text-xs font-extrabold text-amber-900 dark:bg-amber-950/60 dark:text-amber-300">
                <Clock className="h-3.5 w-3.5 animate-spin" />
                Status: Pending Verification
              </span>
              <h1 className="mt-3 text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                Hongera {completedOrder.buyerName}!
              </h1>
              <p className="mt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                Your order is placed. Order Reference ID:{' '}
                <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                  #{completedOrder.id}
                </span>
              </p>
            </div>

            {/* Receipt Summary Card */}
            <div className="relative z-10 rounded-2xl bg-slate-50 p-5 dark:bg-slate-800/60 text-left space-y-3 border border-slate-200/80 dark:border-slate-800 text-xs">
              <div className="flex justify-between pb-2 border-b border-slate-200 dark:border-slate-700">
                <span className="text-slate-500 font-medium">Lipa Namba Reference:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">
                  {completedOrder.lipaNambaTxId}
                </span>
              </div>
              <div className="flex justify-between pb-2 border-b border-slate-200 dark:border-slate-700">
                <span className="text-slate-500 font-medium">Destination Campus:</span>
                <span className="font-bold text-slate-900 dark:text-white text-right max-w-60">
                  {completedOrder.university}
                </span>
              </div>
              <div className="flex justify-between pb-2 border-b border-slate-200 dark:border-slate-700">
                <span className="text-slate-500 font-medium">Delivery Landmark / Room:</span>
                <span className="font-bold text-slate-900 dark:text-white text-right max-w-60">
                  {completedOrder.deliveryDetails}
                </span>
              </div>
              {completedOrder.wingaCodeUsed && (
                <div className="flex justify-between pb-2 border-b border-slate-200 dark:border-slate-700">
                  <span className="text-slate-500 font-medium">Winga Promo Applied:</span>
                  <span className="font-mono font-bold text-emerald-600">
                    {completedOrder.wingaCodeUsed} (TZS 5,000 Off)
                  </span>
                </div>
              )}
                            {completedOrder.tradeInRequestId && <div className="flex justify-between pb-2 border-b border-slate-200 dark:border-slate-700"><span className="text-slate-500 font-medium">Trade-in estimate:</span><span className="font-bold text-emerald-700">-{formatTZS(completedOrder.tradeInEstimate || 0)} · Pending inspection</span></div>}

                          {completedOrder.tradeInRequestId && <p className="relative z-10 rounded-xl border-2 border-amber-400 bg-amber-50 p-4 text-left text-xs font-semibold leading-5 text-amber-950">⚠️ DISCLAIMER: {TRADE_IN_INSPECTION_DISCLAIMER}</p>}
              <div className="flex justify-between items-baseline pt-1">
                <span className="font-extrabold text-slate-900 dark:text-slate-100 text-sm">
                  Total Amount Paid:
                </span>
                <span className="text-xl font-black text-indigo-600 dark:text-indigo-400">
                  {formatTZS(completedOrder.totalAmount)}
                </span>
              </div>
            </div>

            {/* Next Steps Card */}
            <div className="relative z-10 rounded-2xl bg-indigo-50/80 p-4 text-xs text-indigo-950 dark:bg-indigo-950/40 dark:text-indigo-300 text-left border border-indigo-100 dark:border-indigo-900 flex items-start gap-3">
              <ShieldCheck className="h-5 w-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">What happens next?</p>
                <p className="mt-0.5 leading-relaxed text-[11px] text-indigo-900/80 dark:text-indigo-200">
                  Our operations team will verify your Lipa reference ({completedOrder.lipaNambaTxId}). A student runner will contact{' '}
                  <span className="font-bold">{completedOrder.buyerPhone}</span> for delivery hand-off within 24 hours.
                </p>
              </div>
            </div>

            {trackingToken && (
              <section className="relative z-10 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-left dark:border-emerald-900 dark:bg-emerald-950/30" aria-labelledby="tracking-save-heading">
                <h2 id="tracking-save-heading" className="text-sm font-bold text-emerald-950 dark:text-emerald-100">Save your private tracking details</h2>
                <p className="mt-1 text-xs leading-5 text-emerald-900/80 dark:text-emerald-200">Your order number and access token are shown here and are also included in the secure tracking link. Save or screenshot this card so you can track the order later.</p>
                <dl className="mt-4 grid gap-3 rounded-xl bg-white p-4 text-xs dark:bg-slate-900">
                  <div><dt className="font-semibold text-slate-500 dark:text-slate-400">Order number</dt><dd className="mt-1 break-all font-mono font-bold text-slate-950 dark:text-white">{completedOrder.id}</dd></div>
                  <div><dt className="font-semibold text-slate-500 dark:text-slate-400">43-character tracking token</dt><dd className="mt-1 break-all font-mono font-bold text-slate-950 dark:text-white">{trackingToken}</dd></div>
                </dl>
                <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                  <button type="button" onClick={() => void copyTrackingLink()} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700"><Copy className="h-4 w-4" />Copy secure tracking link</button>
                  <button type="button" onClick={downloadTrackingDetails} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-emerald-300 bg-white px-4 py-2 text-xs font-bold text-emerald-900 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-slate-900 dark:text-emerald-100 dark:hover:bg-emerald-950"><Download className="h-4 w-4" />Download text copy</button>
                </div>
                {trackingSaveMessage && <p role="status" className="mt-3 text-xs font-semibold text-emerald-900 dark:text-emerald-200">{trackingSaveMessage}</p>}
                <p className="mt-3 text-[11px] leading-5 text-emerald-900/80 dark:text-emerald-300">Treat the token like a password. UniSoko staff will never ask you to post it publicly.</p>
              </section>
            )}

            {/* Action Buttons */}
            <div className="relative z-10 flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              {trackingToken ? (
                <Link
                  href={getTrackingPath()}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3.5 text-xs font-bold text-white shadow-lg hover:bg-indigo-700 transition-all"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Track Order</span>
                </Link>
              ) : null}
              <a
                href={createWhatsAppLink(UNISOKO_CONTACT.phoneDigits, `Habari UniSoko! Nimekamilisha malipo ya Order #${completedOrder.id} (Tx: ${completedOrder.lipaNambaTxId}) kwa ${completedOrder.university}. Tafadhali thibitisha delivery!`)}
                target="_blank"
                rel="noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3.5 text-xs font-bold text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition-all"
              >
                <MessageCircle className="h-4 w-4" />
                <span>Notify Support on WhatsApp</span>
              </a>

              <Link
                href="/"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-6 py-3.5 text-xs font-bold text-slate-800 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 transition-all"
              >
                <span>Back to Storefront</span>
              </Link>
            </div>
          </motion.div>
        ) : checkoutItems.length === 0 ? (
          <section className="mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <ShoppingBag className="mx-auto h-8 w-8 text-slate-400" />
            <h1 className="mt-3 text-xl font-bold text-slate-900 dark:text-white">Your cart is empty</h1>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">Add an available UniSoko product before starting checkout.</p>
            <Link href="/" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white hover:bg-indigo-700">Browse products<ArrowRight className="h-4 w-4" /></Link>
          </section>
        ) : (
          /* Checkout Input Form */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Form & University Logistics */}
            <div className="lg:col-span-7 space-y-6">
              {/* Top Title */}
              <div>
                <Link
                  href="/"
                  className="inline-flex items-center gap-1 text-xs font-bold text-slate-600 hover:text-indigo-600 mb-2 transition-colors dark:text-slate-400"
                >
                  <ArrowLeft className="h-3.5 w-3.5" /> Back to store
                </Link>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                  UniSoko Campus Checkout
                </h1>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                  Confirm campus details, apply ambassador promo code, and pay securely via Lipa Namba.
                </p>
              </div>

              <form onSubmit={handleStartPayment} className="space-y-6">
                <section className="rounded-2xl border border-emerald-200 bg-white p-5 dark:border-emerald-900 dark:bg-slate-900">
                  <div className="flex items-start justify-between gap-4">
                    <div><h2 className="text-sm font-bold text-slate-950 dark:text-white">Trade In Your Existing Device for an Instant Discount</h2><p className="mt-1 text-xs text-slate-600 dark:text-slate-300">Get a provisional discount for a phone, tablet, or laptop.</p></div>
                    <button type="button" role="switch" aria-checked={Boolean(tradeInQuote)} aria-label="Trade in your existing device for an instant discount" onClick={() => tradeInQuote ? setTradeInQuote(null) : setIsTradeInModalOpen(true)} className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${tradeInQuote ? 'bg-emerald-700' : 'bg-slate-300'}`}><span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-transform ${tradeInQuote ? 'translate-x-6' : 'translate-x-1'}`} /></button>
                  </div>
                  {tradeInQuote && <div className="mt-4 rounded-xl bg-emerald-50 p-3 text-xs text-emerald-950"><div className="flex items-center justify-between gap-3"><span className="font-semibold">{tradeInQuote.itemTitle}</span><strong>-{formatTZS(tradeInDiscount)}</strong></div><button type="button" onClick={() => setIsTradeInModalOpen(true)} className="mt-2 font-bold text-emerald-800 underline">Update estimate</button><p className="mt-2 border-t border-emerald-200 pt-2 leading-5">⚠️ DISCLAIMER: {TRADE_IN_INSPECTION_DISCLAIMER}</p></div>}
                </section>

                {/* 1. Buyer Contact Details */}
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-4">
                  <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
                      <User className="h-4 w-4" />
                    </div>
                    <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                      1. Recipient Student Details
                    </h2>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Kelvin Mwambene"
                        value={buyerName}
                        onChange={(e) => setBuyerName(e.target.value)}
                        className="w-full rounded-xl border border-slate-300 bg-white p-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white transition-all font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                        Phone Number (WhatsApp / Calling) *
                      </label>
                      <input
                        type="tel"
                        required
                        placeholder="+255 7XX XXX XXX"
                        value={buyerPhone}
                        onChange={(e) => setBuyerPhone(e.target.value)}
                        className="w-full rounded-xl border border-slate-300 bg-white p-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white transition-all font-medium"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. University Selection & Campus Logistics Flow */}
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-5">
                  <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
                      <School className="h-4 w-4" />
                    </div>
                    <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                      2. University & Campus Drop Point
                    </h2>
                  </div>

                  {/* University Selector Dropdown with Defensive Lookup */}
                  <div>
                    <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                      Select University Institution
                    </label>
                    <select
                      value={safeCampus.id}
                      onChange={(e) => {
                        const found = allUniversities.find((u) => u.id === e.target.value);
                        if (found) {
                          setSelectedCampus(found);
                        }
                      }}
                      className="min-h-14 w-full rounded-xl border-2 border-indigo-300 bg-white px-4 py-3 text-sm font-bold text-slate-900 shadow-sm focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 focus:outline-none dark:border-indigo-800 dark:bg-slate-900 dark:text-white transition-all cursor-pointer"
                    >
                      <optgroup label="📍 Mbeya Region Campuses (Direct Hostel Hand-off)">
                        {MBEYA_UNIVERSITIES.map((uni) => (
                          <option key={uni.id} value={uni.id}>
                            {uni.name} ({uni.shortCode}) - {uni.campus}
                          </option>
                        ))}
                      </optgroup>
                      <optgroup label="🚚 National Universities (Regional Bus / Courier)">
                        {NON_MBEYA_UNIVERSITIES.map((uni) => (
                          <option key={uni.id} value={uni.id}>
                            {uni.name} ({uni.shortCode}) - {uni.city}
                          </option>
                        ))}
                      </optgroup>
                    </select>
                  </div>

                  <CampusConfirmation key={safeCampus.id} campusName={`${safeCampus.name} (${safeCampus.shortCode})`} />

                  {/* Dynamic Conditional Delivery Fields */}
                  {isMbeyaUni ? (
                    /* Mbeya Campus: Unlock Hostel / Landmark Fields */
                    <div className="space-y-4 rounded-2xl bg-indigo-50/50 p-4 border border-indigo-100 dark:bg-indigo-950/30 dark:border-indigo-900/50">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                        <span className="text-xs font-bold text-indigo-950 dark:text-indigo-200">
                          {safeCampus.shortCode} Campus Delivery Spot
                        </span>
                        <span className="ml-auto rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-extrabold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                          Free Hand-off
                        </span>
                      </div>

                      {/* Delivery Spot Type Tabs */}
                      <div className="grid grid-cols-3 gap-2">
                        {(['Hostel', 'Landmark', 'Off-Campus'] as DeliverySpotType[]).map((type) => (
                          <button
                            type="button"
                            key={type}
                            onClick={() => setDeliverySpotType(type)}
                            className={`min-h-11 rounded-xl py-2 text-xs font-bold transition-all ${
                              deliverySpotType === type
                                ? 'bg-indigo-600 text-white shadow-xs'
                                : 'bg-white text-slate-800 border border-slate-300 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700'
                            }`}
                          >
                            {type}
                          </button>
                        ))}
                      </div>

                      {deliverySpotType === 'Hostel' && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-800 dark:text-slate-200 mb-1">
                              Hostel Name / Block *
                            </label>
                            <input
                              type="text"
                              required
                              placeholder="e.g. Block A / New Hostel"
                              value={hostelName}
                              onChange={(e) => setHostelName(e.target.value)}
                              className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white font-medium"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-800 dark:text-slate-200 mb-1">
                              Room Number *
                            </label>
                            <input
                              type="text"
                              required
                              placeholder="e.g. Room 214"
                              value={roomNumber}
                              onChange={(e) => setRoomNumber(e.target.value)}
                              className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white font-medium"
                            />
                          </div>
                        </div>
                      )}

                      {deliverySpotType === 'Landmark' && (
                        <div>
                          <label className="block text-[11px] font-bold text-slate-800 dark:text-slate-200 mb-1">
                            Campus Landmark Meeting Spot *
                          </label>
                          <input
                            type="text"
                            required
                            placeholder={`e.g. ${safeCampus.popularSpots?.[0] || 'Library Entrance Landmark'}`}
                            value={landmarkDetail}
                            onChange={(e) => setLandmarkDetail(e.target.value)}
                            className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white font-medium"
                          />
                        </div>
                      )}

                      {deliverySpotType === 'Off-Campus' && (
                        <div>
                          <label className="block text-[11px] font-bold text-slate-800 dark:text-slate-200 mb-1">
                            Off-Campus Street / Apartment Landmark *
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Iyunga near Total Petrol Station"
                            value={landmarkDetail}
                            onChange={(e) => setLandmarkDetail(e.target.value)}
                            className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white font-medium"
                          />
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Non-Mbeya University: Encouraging Coming Soon & Courier Card */
                    <div className="rounded-2xl bg-linear-to-r from-amber-500/10 via-indigo-500/10 to-transparent p-5 border border-amber-500/30 dark:border-amber-500/20 space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-slate-950 font-bold">
                          <Truck className="h-5 w-5" />
                        </div>
                        <div>
                          <h4 className="text-xs font-black text-amber-900 dark:text-amber-300 uppercase tracking-wide">
                            In-Person Campus Delivery Coming Soon!
                          </h4>
                          <p className="mt-1 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                            We currently deliver to{' '}
                            <span className="font-bold">{safeCampus.name}</span> via regional bus and secure courier parcel shipping.
                          </p>
                        </div>
                      </div>

                      <div className="mt-2 rounded-xl bg-white p-3 text-xs dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                        <p className="font-bold text-slate-900 dark:text-white">
                          Designated Parcel Hub for {safeCampus.shortCode}:
                        </p>
                        <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                          {safeCampus.courierHub || 'Regional Bus Stand Terminal'}
                        </p>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-800 dark:text-slate-200 mb-1">
                          Pickup Recipient / Bus Terminal Preference
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Ubungo / Magufuli Terminal (Recipient: Kelvin)"
                          value={regionalHubAddress}
                          onChange={(e) => setRegionalHubAddress(e.target.value)}
                          className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white font-medium"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* 3. Winga Promo Code Input Box */}
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                      Have a Campus Winga Promo Code?
                    </h3>
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="e.g. WINGA-5A19BF"
                      value={promoInput}
                      onChange={(e) => { setPromoInput(e.target.value); setAppliedPromo(null); setPromoError(''); setPromoSuccess(''); }}
                      className="flex-1 rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs font-mono uppercase text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white font-bold"
                    />
                    <button
                      type="button"
                      onClick={() => void handleApplyPromo()}
                      disabled={isApplyingPromo}
                      className="min-w-20 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white hover:bg-slate-800 active:scale-95 disabled:cursor-wait disabled:opacity-60 dark:bg-indigo-600 dark:hover:bg-indigo-700 transition-all shadow-xs"
                    >
                      {isApplyingPromo ? 'Checking…' : 'Apply'}
                    </button>
                  </div>

                  {promoError && (
                    <p className="text-xs font-medium text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3.5 w-3.5" />
                      {promoError}
                    </p>
                  )}

                  {promoSuccess && (
                    <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <Check className="h-3.5 w-3.5" />
                      {promoSuccess}
                    </p>
                  )}
                </div>

                {/* Proceed to Payment CTA */}
                <button
                  type="submit"
                  ref={proceedButtonRef}
                  className="w-full rounded-2xl bg-indigo-600 py-4 text-sm font-black text-white shadow-xl shadow-indigo-600/25 hover:bg-indigo-700 active:scale-98 transition-all flex items-center justify-center gap-2"
                >
                  <CreditCard className="h-4 w-4" />
                  <span>Proceed to Lipa Namba ({formatTZS(finalTotal)})</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </form>
            </div>

            {/* Right Column: Order Summary & Review */}
            <div className="lg:col-span-5 space-y-6">
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg dark:border-slate-800 dark:bg-slate-900 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Order Summary ({checkoutItems.length} {checkoutItems.length === 1 ? 'item' : 'items'})
                  </h3>
                  <span className="text-xs text-slate-400 font-medium">UniSoko Direct</span>
                </div>

                {/* Items preview list */}
                <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                  {checkoutItems.map(({ product, quantity }, itemIndex) => {
                    const minQty = product?.minWholesaleQty || 3;
                    const isWholesale = quantity >= minQty;
                    const unitPrice = isWholesale ? (product?.priceWholesale || product?.priceRetail || 0) : (product?.priceRetail || 0);
                    return (
                      <div
                        key={product?.id || `checkout-item-${itemIndex}`}
                        className="flex items-center gap-3 rounded-xl bg-slate-50 p-2.5 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800"
                      >
                        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-slate-200 dark:bg-slate-700">
                          {product?.images?.[0] && (
                            <Image src={product.images[0]} alt={product.title} fill sizes="48px" className="object-cover" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                            {product?.title}
                          </h4>
                          <p className="text-[11px] text-slate-500">
                            {quantity}x @ {formatTZS(unitPrice)}
                            {isWholesale && (
                              <span className="ml-1 text-emerald-600 font-bold">(Jumla)</span>
                            )}
                          </p>
                        </div>
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          {formatTZS(unitPrice * quantity)}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Pricing Calculations */}
                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300">
                  <div className="flex justify-between">
                    <span>Items Subtotal</span>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {formatTZS(rawSubtotal)}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span>Campus Delivery ({safeCampus.shortCode})</span>
                    {isMbeyaUni ? (
                      <span className="font-bold text-emerald-600">FREE Campus Drop</span>
                    ) : (
                      <span className="font-semibold">{formatTZS(shippingFee)} (Courier)</span>
                    )}
                  </div>

                  {appliedPromo && (
                    <div className="flex justify-between font-bold text-emerald-600">
                      <span>Winga Discount ({appliedPromo.code})</span>
                      <span>-{formatTZS(appliedPromo.discountAmount)}</span>
                    </div>
                  )}

                  {tradeInDiscount > 0 && <div className="flex justify-between font-bold text-emerald-700"><span>Trade-in estimate</span><span>-{formatTZS(tradeInDiscount)}</span></div>}

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between items-baseline">
                    <span className="text-sm font-bold text-slate-900 dark:text-white">
                      Total Payable
                    </span>
                    <span className="text-xl font-black text-indigo-600 dark:text-indigo-400">
                      {formatTZS(finalTotal)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Security & Guarantee Strip */}
              <div className="rounded-2xl bg-emerald-50/70 p-4 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-900/50 space-y-2 text-xs text-emerald-950 dark:text-emerald-200">
                <div className="flex items-center gap-1.5 font-bold">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  <span>UniSoko Student Buyer Protection</span>
                </div>
                <p className="text-[11px] text-emerald-800 dark:text-emerald-300 leading-relaxed">
                  Your payment reference is verified with our on-campus logistics desk. If device condition does not match description upon delivery, instant 100% money-back is guaranteed.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Lipa Namba Payment Modal */}
      <AnimatePresence>
        {isLipaModalOpen && (
          <div className="fixed inset-0 z-50 flex h-[100dvh] items-start justify-center overflow-y-auto overscroll-contain p-3 pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:items-center sm:p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closePaymentModal}
              className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm"
            />

            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              ref={paymentModalRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby="lipa-payment-title"
              onKeyDown={handlePaymentModalKeyDown}
              className="relative my-auto max-h-[calc(100dvh-1.5rem)] w-full max-w-lg overflow-y-auto overscroll-contain rounded-3xl border border-slate-200 bg-white p-4 shadow-2xl sm:p-6 dark:border-slate-800 dark:bg-slate-900"
            >
              {/* Header */}
              <div className="text-center pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400 mb-2">
                  <CreditCard className="h-6 w-6" />
                </div>
                <h3 id="lipa-payment-title" className="text-lg font-black text-slate-900 dark:text-white">
                  Lipa Namba (Till Number) Payment
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Amount to Pay:{' '}
                  <span className="font-extrabold text-indigo-600 dark:text-indigo-400 text-sm">
                    {formatTZS(finalTotal)}
                  </span>
                </p>
              </div>

              <div className="mt-4 space-y-3">
                {paymentMethods.map((method, index) => (
                  <div key={method.id || `${method.network}-${method.tillNumber}-${index}`} className="rounded-2xl bg-slate-900 p-4 text-white shadow-md">
                    <div className="flex items-center justify-between gap-3 text-xs text-indigo-200"><span>{method.network}</span><span className="text-right">Merchant: {method.accountName || storeSettings?.merchantName || 'UniSoko'}</span></div>
                    <div className="mt-3 flex items-center justify-between gap-3">
                      <div><span className="block text-[10px] uppercase tracking-widest text-slate-400">Till / Lipa number</span><span className="font-mono text-2xl font-black tracking-wider text-amber-300">{method.tillNumber}</span></div>
                      <button onClick={() => handleCopyTill(method.tillNumber)} className="flex min-h-11 items-center gap-1 rounded-xl bg-indigo-600 px-3 py-2 text-xs font-bold text-white hover:bg-indigo-500">{copiedTill ? <Check className="h-3.5 w-3.5 text-emerald-300" /> : <Copy className="h-3.5 w-3.5" />}<span>{copiedTill ? 'Copied!' : 'Copy Till'}</span></button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 space-y-1.5 text-xs">
                <p className="font-bold text-slate-800 dark:text-slate-200">USSD payment shortcuts:</p>
                {paymentMethods.map((method, index) => <div key={method.id || `${method.network}-${method.tillNumber}-${index}`} className="rounded-lg border border-slate-200 bg-slate-50 p-2 text-[11px] text-slate-700 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-300"><span className="font-bold text-indigo-600 dark:text-indigo-400">{method.network}:</span> {method.network === 'M-Pesa' ? '*150*00# > Lipa kwa M-Pesa' : method.network === 'Tigo Pesa' ? '*150*01# > Lipa kwa Simu' : '*150*60# > Lipa kwa Airtel Money'} &gt; Lipa Namba ({method.tillNumber})</div>)}
              </div>

              {/* Transaction ID Input with Explicit High Contrast */}
              <div className="mt-5 space-y-2">
                <label className="block text-xs font-bold text-slate-900 dark:text-white">
                  Enter M-Pesa / Tigo Pesa Transaction Reference ID *
                </label>
                <input
                  autoFocus
                  type="text"
                  required
                  placeholder="e.g. QA78XX99YY or MP8921034"
                  value={lipaTxId}
                  onChange={(e) => {
                    setLipaTxId(e.target.value);
                    setTxError('');
                  }}
                  className="w-full rounded-xl border border-slate-300 bg-white p-3 text-xs font-mono uppercase text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white font-bold"
                />
                {txError && (
                  <p className="text-xs font-medium text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3.5 w-3.5" />
                    {txError}
                  </p>
                )}
                <p className="text-[10px] text-slate-500">
                  Paste the reference code from the confirmation SMS received from your mobile network.
                </p>
              </div>

              {/* Modal Buttons */}
              <div className="mt-6 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={closePaymentModal}
                  className="min-h-11 rounded-xl border border-slate-300 py-3 text-xs font-bold text-slate-800 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCompleteOrder}
                  disabled={isSubmitting}
                  className="min-h-11 rounded-xl bg-emerald-600 py-3 text-xs font-black text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-1.5"
                >
                  {isSubmitting ? (
                    <span>Submitting Order...</span>
                  ) : (
                    <>
                      <Check className="h-4 w-4" />
                      <span>Complete Order</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

  <TradeInModal isOpen={isTradeInModalOpen} onClose={() => setIsTradeInModalOpen(false)} onQuoted={handleTradeInQuote} selectedCampus={safeCampus} purchasePrice={rawSubtotal} />

      <CartDrawer />
    </div>
  );
}

function CampusConfirmation({ campusName }: { campusName: string }) {
  const [confirmed, setConfirmed] = useState(false);
  return (
    <label className="flex min-h-12 items-center gap-3 rounded-xl border border-indigo-200 bg-indigo-50/70 px-3 py-2 text-xs font-semibold text-indigo-950 dark:border-indigo-900 dark:bg-indigo-950/40 dark:text-indigo-100">
      <input type="checkbox" required checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} className="h-4 w-4 shrink-0 accent-indigo-600" />
      <span>I confirm delivery to {campusName}.</span>
    </label>
  );
}
