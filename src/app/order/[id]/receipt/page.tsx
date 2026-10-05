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

const WARRANTY_OPTIONS = [30, 60, 90] as const;

export default function DigitalReceiptPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const orderId = decodeURIComponent(params.id);
  const { orders, storeSettings, updateOrderReceipt } = useStore();
  const order = useMemo(() => orders.find((item) => item.id === orderId), [orders, orderId]);
  const [serialNumber, setSerialNumber] = useState(order?.itemSerialNumber || '');
  const [warrantyDays, setWarrantyDays] = useState<30 | 60 | 90>(order?.warrantyDays || 90);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (order) {
        setSerialNumber(order.itemSerialNumber || '');
        setWarrantyDays(order.warrantyDays || 90);
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [order]);

  const saveReceipt = () => {
    if (!order) return;
    updateOrderReceipt(order.id, serialNumber, warrantyDays);
    setSaved(true);
  };

  if (!order) {
    return <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6"><div className="max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-xl"><h1 className="text-xl font-bold text-slate-900">Order not found</h1><p className="mt-2 text-sm text-slate-600">This order is not available in the current store session.</p><button onClick={() => router.push('/admin')} className="mt-5 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white">Return to admin</button></div></main>;
  }

  const merchantName = storeSettings.merchantName || 'UniSoko Tanzania';
  const tillNumber = storeSettings.tillNumber || '—';
  const buyerMessage = [
    `Habari ${order.buyerName}, asante kwa kununua UniSoko.`,
    `Risiti: ${order.id}`,
    `Bidhaa: ${order.product?.title || order.productId} (${order.quantity} unit${order.quantity === 1 ? '' : 's'})`,
    `Jumla: ${formatTZS(order.totalAmount)}`,
    ...(order.tradeInRequestId ? [`Trade-in estimate: -${formatTZS(order.tradeInEstimate || 0)} (pending physical inspection)`, `DISCLAIMER: ${TRADE_IN_INSPECTION_DISCLAIMER}`] : []),
    `Chuo / sehemu ya kupokea: ${order.university} · ${order.deliveryDetails}`,
    `Namba ya kifaa: ${serialNumber || 'Itawekwa wakati wa makabidhiano'}`,
    `Dhamana: ${warrantyDays} siku kuanzia tarehe ya idhini${order.approvedAt ? ` (${new Date(order.approvedAt).toLocaleDateString('en-GB')})` : ''}`,
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
            <div className="mt-6 flex flex-wrap justify-between gap-3 border-t border-white/15 pt-4 text-xs"><span>Receipt <strong className="ml-1 font-mono text-white">{order.id}</strong></span><span>Approved {order.approvedAt ? new Date(order.approvedAt).toLocaleDateString('en-GB') : 'today'}</span></div>
          </div>

          <div className="space-y-7 p-6 sm:p-9">
            <div className="grid gap-5 sm:grid-cols-2">
              <div><p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Customer</p><p className="mt-1 font-bold text-slate-900">{order.buyerName}</p><p className="text-sm text-slate-600">{order.buyerPhone}</p></div>
              <div><p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Campus & hand-off</p><p className="mt-1 font-bold text-slate-900">{order.university}</p><p className="text-sm text-slate-600">{order.deliveryDetails}</p></div>
            </div>
            <div className="overflow-hidden rounded-2xl border border-slate-200">
              <div className="grid grid-cols-[1fr_auto] gap-4 bg-slate-50 px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500"><span>Item</span><span>Total</span></div>
              <div className="grid grid-cols-[1fr_auto] gap-4 px-4 py-4 text-sm"><div><p className="font-bold text-slate-900">{order.product?.title || order.productId}</p><p className="mt-1 text-xs text-slate-500">Quantity: {order.quantity} · Payment reference: {order.lipaNambaTxId}</p></div><p className="font-black text-slate-900">{formatTZS(order.totalAmount)}</p></div>
            </div>

            {order.tradeInRequestId && <div className="rounded-xl border-2 border-amber-400 bg-amber-50 p-4 text-xs font-semibold leading-5 text-amber-950"><p className="font-extrabold">Trade-in pending physical inspection</p><p className="mt-1">Estimate applied: -{formatTZS(order.tradeInEstimate || 0)}</p><p className="mt-2">⚠️ DISCLAIMER: {TRADE_IN_INSPECTION_DISCLAIMER}</p></div>}

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-xs font-bold text-slate-700">Item serial number
                <input value={serialNumber} onChange={(event) => { setSerialNumber(event.target.value); setSaved(false); }} placeholder="Enter serial / IMEI" className="mt-1.5 w-full rounded-xl p-3 text-sm" />
              </label>
              <label className="text-xs font-bold text-slate-700">Warranty period
                <select value={warrantyDays} onChange={(event) => { setWarrantyDays(Number(event.target.value) as 30 | 60 | 90); setSaved(false); }} className="mt-1.5 w-full rounded-xl p-3 text-sm">
                  {WARRANTY_OPTIONS.map((days) => <option key={days} value={days}>{days} days</option>)}
                </select>
              </label>
            </div>
            <div className="flex flex-wrap items-center gap-3 border-t border-slate-100 pt-5">
              <button onClick={saveReceipt} className="rounded-xl border border-slate-300 px-4 py-3 text-sm font-bold text-slate-800 hover:bg-slate-50">{saved ? 'Receipt details saved' : 'Save receipt details'}</button>
              <a href={createWhatsAppLink(order.buyerPhone, buyerMessage)} target="_blank" rel="noreferrer" onClick={saveReceipt} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white hover:bg-emerald-700"><CheckCircle2 className="h-4 w-4" />Send Receipt via WhatsApp</a>
              <button onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white hover:bg-indigo-700"><Printer className="h-4 w-4" />Print / Save PDF</button>
              <Link href="/admin" className="ml-auto text-sm font-semibold text-indigo-700 hover:underline">Back to admin</Link>
            </div>
            <p className="text-[11px] leading-5 text-slate-500">Warranty is subject to UniSoko’s published terms. Keep this receipt and contact support for after-sales assistance.</p>
          </div>
        </section>
      </main>
    </div>
  );
}
