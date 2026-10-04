'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import { useStore } from '@/context/StoreContext';
import { formatTZS } from '@/lib/mockData';
import { createWhatsAppLink } from '@/lib/whatsapp';
import { CheckCircle2, Printer, ShieldCheck } from 'lucide-react';
import { TRADE_IN_INSPECTION_DISCLAIMER } from '@/lib/tradeInValuation';
import type { Order } from '@/lib/types';

const WARRANTY_OPTIONS = [30, 60, 90] as const;

export default function DigitalReceiptPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const orderId = decodeURIComponent(params.id);
  const { orders, storeSettings, updateOrderReceipt } = useStore();
  const localOrder = useMemo(() => orders.find((item) => item.id === orderId), [orders, orderId]);
  const [customerToken] = useState(() => typeof window === 'undefined' ? '' : new URLSearchParams(window.location.search).get('token') || '');
  const [remoteOrder, setRemoteOrder] = useState<Order | null>(null);
  const [isLoadingReceipt, setIsLoadingReceipt] = useState(true);
  const [receiptError, setReceiptError] = useState('');
  const order = customerToken ? remoteOrder : remoteOrder || localOrder;
  const [serialNumber, setSerialNumber] = useState(order?.itemSerialNumber || '');
  const [warrantyDays, setWarrantyDays] = useState<30 | 60 | 90>(order?.warrantyDays || 90);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const token = customerToken;
    if (!token) {
      const controller = new AbortController();
      fetch('/api/admin/orders', { cache: 'no-store', signal: controller.signal })
        .then(async (response) => response.ok ? response.json() as Promise<{ orders?: Order[] }> : null)
        .then((result) => {
          const persistedOrder = result?.orders?.find((item) => item.id === orderId);
          if (persistedOrder) setRemoteOrder(persistedOrder);
        })
        .catch(() => undefined)
        .finally(() => { if (!controller.signal.aborted) setIsLoadingReceipt(false); });
      return () => controller.abort();
    }

    const controller = new AbortController();
    fetch(`/api/orders/${encodeURIComponent(orderId)}?token=${encodeURIComponent(token)}`, { cache: 'no-store', signal: controller.signal })
      .then(async (response) => {
        const result = await response.json() as { order?: Order; error?: string };
        if (!response.ok || !result.order) throw new Error(result.error || 'Could not load this receipt.');
        setRemoteOrder(result.order);
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted) setReceiptError(error instanceof Error ? error.message : 'Could not load this receipt.');
      })
      .finally(() => { if (!controller.signal.aborted) setIsLoadingReceipt(false); });
    return () => controller.abort();
  }, [customerToken, orderId]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (order) {
        setSerialNumber(order.itemSerialNumber || '');
        setWarrantyDays(order.warrantyDays || 90);
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [order]);

  const saveReceipt = async () => {
    if (!order) return;
    setReceiptError('');
    if (remoteOrder) {
      try {
        const response = await fetch('/api/admin/orders/receipt', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: order.id, itemSerialNumber: serialNumber, warrantyDays }),
        });
        const result = await response.json() as { error?: string };
        if (!response.ok) throw new Error(result.error || 'Could not save receipt details.');
      } catch (error) {
        setReceiptError(error instanceof Error ? error.message : 'Could not save receipt details.');
        setSaved(false);
        return;
      }
      setRemoteOrder((current) => current ? { ...current, itemSerialNumber: serialNumber, warrantyDays } : current);
    }
    updateOrderReceipt(order.id, serialNumber, warrantyDays);
    setSaved(true);
  };

  if (isLoadingReceipt) return <main className="flex min-h-screen items-center justify-center p-6 text-sm text-slate-500">Loading secure receipt…</main>;

  if (customerToken && order && order.deliveryStatus !== 'Delivered') {
    return <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6 dark:bg-slate-950"><div className="max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-xl dark:border-slate-800 dark:bg-slate-900"><h1 className="text-xl font-bold text-slate-900 dark:text-white">Receipt available after delivery</h1><p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Your order is currently {order.deliveryStatus || 'being prepared'}. Open this private receipt link again after the delivery is marked complete.</p><Link href={`/track/${encodeURIComponent(order.id)}?token=${encodeURIComponent(customerToken)}`} className="mt-5 inline-flex min-h-11 items-center rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white">Return to order tracking</Link></div></main>;
  }

  if (!order) {
    return <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6 dark:bg-slate-950"><div className="max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-xl dark:border-slate-800 dark:bg-slate-900"><h1 className="text-xl font-bold text-slate-900 dark:text-white">Receipt unavailable</h1><p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{receiptError || (customerToken ? 'This secure receipt link is invalid or expired.' : 'This order is not available in the current store session.')}</p><button onClick={() => router.push(customerToken ? '/' : '/admin')} className="mt-5 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white">{customerToken ? 'Return to store' : 'Return to admin'}</button></div></main>;
  }

  const merchantName = storeSettings.merchantName || 'UniSoko Tanzania';
  const tillNumber = storeSettings.tillNumber || '—';
  const deliveredAt = order.statusHistory?.findLast((event) => event.statusType === 'delivery' && event.status === 'Delivered')?.changedAt;
  const buyerMessage = [
    `Habari ${order.buyerName}, asante kwa kununua UniSoko.`,
    `Risiti: ${order.id}`,
    `Bidhaa: ${order.product?.title || order.productId} (${order.quantity} unit${order.quantity === 1 ? '' : 's'})`,
    `Jumla: ${formatTZS(order.totalAmount)}`,
    ...(order.tradeInRequestId ? [`Trade-in estimate: -${formatTZS(order.tradeInEstimate || 0)} (pending physical inspection)`, `DISCLAIMER: ${TRADE_IN_INSPECTION_DISCLAIMER}`] : []),
    `Chuo / sehemu ya kupokea: ${order.university} · ${order.deliveryDetails}`,
    `Namba ya kifaa: ${serialNumber || 'Itawekwa wakati wa makabidhiano'}`,
    `Dhamana: ${warrantyDays} siku kuanzia tarehe ya kupokea bidhaa`,
    `Lipa Namba: ${tillNumber} (${merchantName})`,
  ].join('\n');

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <Header />
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-indigo-950/5">
          <div className="bg-slate-950 px-6 py-7 text-white sm:px-9">
            <div className="flex items-start justify-between gap-4">
              <div><p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-300">Digital purchase receipt</p><h1 className="mt-2 text-3xl font-black">UniSoko</h1><p className="mt-1 text-sm text-slate-300">{merchantName}</p></div>
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border-2 border-emerald-300 text-emerald-300"><ShieldCheck className="h-9 w-9" /></div>
            </div>
            <div className="mt-6 flex flex-wrap justify-between gap-3 border-t border-white/15 pt-4 text-xs"><span>Receipt <strong className="ml-1 font-mono text-white">{order.id}</strong></span><span>Delivered {deliveredAt ? new Date(deliveredAt).toLocaleDateString('en-TZ', { timeZone: 'Africa/Dar_es_Salaam' }) : '—'}</span></div>
          </div>

          <div className="space-y-7 p-6 sm:p-9">
              <div className="grid gap-5 sm:grid-cols-2">
              <div><p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Customer</p><p className="mt-1 font-bold text-slate-900">{order.buyerName}</p><p className="text-sm text-slate-600">{order.buyerPhone}</p></div>
              <div><p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Campus & hand-off</p><p className="mt-1 font-bold text-slate-900">{order.university}</p><p className="text-sm text-slate-600">{order.deliveryDetails}</p></div>
            </div>
            <div className="overflow-hidden rounded-2xl border border-slate-200">
              <div className="grid grid-cols-[1fr_auto] gap-4 bg-slate-50 px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500"><span>Item</span><span>Total</span></div>
              {(order.items?.length ? order.items : [{ productId: order.productId, productTitle: order.productTitle || order.product?.title || order.productId, quantity: order.quantity, lineTotal: order.totalAmount }]).map((item) => <div key={item.productId} className="grid grid-cols-[1fr_auto] gap-4 border-t border-slate-100 px-4 py-4 text-sm"><div><p className="font-bold text-slate-900">{item.productTitle}</p><p className="mt-1 text-xs text-slate-500">Quantity: {item.quantity}</p></div><p className="font-black text-slate-900">{formatTZS(item.lineTotal)}</p></div>)}
              <div className="border-t border-slate-100 px-4 py-3 text-xs text-slate-600">Payment reference: <span className="font-mono font-bold text-slate-900">{order.lipaNambaTxId}</span></div>
            </div>

            <div className="grid gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 text-sm dark:border-emerald-900 dark:bg-emerald-950/30 sm:grid-cols-2">
              <div><p className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">Device serial / IMEI</p><p className="mt-1 break-all font-semibold text-slate-900 dark:text-white">{order.itemSerialNumber || 'Not recorded'}</p></div>
              <div><p className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">Warranty</p><p className="mt-1 font-semibold text-slate-900 dark:text-white">{order.warrantyDays || 90} days from delivery</p></div>
            </div>

            {order.tradeInRequestId && <div className="rounded-xl border-2 border-amber-400 bg-amber-50 p-4 text-xs font-semibold leading-5 text-amber-950"><p className="font-extrabold">Trade-in pending physical inspection</p><p className="mt-1">Estimate applied: -{formatTZS(order.tradeInEstimate || 0)}</p><p className="mt-2">⚠️ DISCLAIMER: {TRADE_IN_INSPECTION_DISCLAIMER}</p></div>}

            {!customerToken && <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-xs font-bold text-slate-700">Item serial number
                <input value={serialNumber} onChange={(event) => { setSerialNumber(event.target.value); setSaved(false); }} placeholder="Enter serial / IMEI" className="mt-1.5 w-full rounded-xl p-3 text-sm" />
              </label>
              <label className="text-xs font-bold text-slate-700">Warranty period
                <select value={warrantyDays} onChange={(event) => { setWarrantyDays(Number(event.target.value) as 30 | 60 | 90); setSaved(false); }} className="mt-1.5 w-full rounded-xl p-3 text-sm">
                  {WARRANTY_OPTIONS.map((days) => <option key={days} value={days}>{days} days</option>)}
                </select>
              </label>
            </div>}
            {!customerToken && receiptError && <p role="alert" className="text-xs font-semibold text-red-700">{receiptError}</p>}
            <div className="flex flex-wrap items-center gap-3 border-t border-slate-100 pt-5">
              {!customerToken && <button onClick={() => void saveReceipt()} className="rounded-xl border border-slate-300 px-4 py-3 text-sm font-bold text-slate-800 hover:bg-slate-50">{saved ? 'Receipt details saved' : 'Save receipt details'}</button>}
              {!customerToken && <a href={createWhatsAppLink(order.buyerPhone, buyerMessage)} target="_blank" rel="noreferrer" onClick={() => void saveReceipt()} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white hover:bg-emerald-700"><CheckCircle2 className="h-4 w-4" />Send Receipt via WhatsApp</a>}
              <button onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white hover:bg-indigo-700"><Printer className="h-4 w-4" />Print / Save PDF</button>
              {!customerToken && <Link href="/admin" className="ml-auto text-sm font-semibold text-indigo-700 hover:underline">Back to admin</Link>}
            </div>
            <p className="text-[11px] leading-5 text-slate-500">Warranty is subject to UniSoko’s published terms. Keep this receipt and contact support for after-sales assistance.</p>
          </div>
        </section>
      </main>
    </div>
  );
}
