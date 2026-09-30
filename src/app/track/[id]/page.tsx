'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import { AlertTriangle, ArrowLeft, CheckCircle2, Clock3, PackageCheck, ShieldCheck, Truck } from 'lucide-react';
import type { Order } from '@/lib/types';

function getCurrentStage(order: Order) {
  if (order.paymentStatus === 'Failed') return 'Payment Failed';
  if (!order.paymentStatus || order.paymentStatus === 'Submitted') return 'Payment Submitted';
  if (order.paymentStatus === 'Verification') return 'Payment Verification';
  if (order.deliveryStatus === 'Delivered') return 'Delivered';
  if (order.deliveryStatus === 'Ready for Pickup') return 'Ready for Pickup';
  if (order.deliveryStatus === 'With Winga' || order.deliveryStatus === 'With Courier') return order.deliveryStatus;
  if (order.fulfillmentStatus === 'Ready for Dispatch') return 'Ready for Dispatch';
  if (order.fulfillmentStatus === 'Preparing') return 'Preparing Order';
  if (order.fulfillmentStatus === 'Confirmed') return 'Order Confirmed';
  return 'Payment Verified';
}

export default function OrderTrackingPage() {
  const params = useParams<{ id: string }>();
  const orderId = decodeURIComponent(params.id);
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    const token = new URLSearchParams(window.location.search).get('token');
    if (!token) {
      void Promise.resolve().then(() => {
        setError('This private tracking link is missing its access token.');
        setLoading(false);
      });
      return () => controller.abort();
    }

    fetch(`/api/orders/${encodeURIComponent(orderId)}?token=${encodeURIComponent(token)}`, {
      cache: 'no-store',
      signal: controller.signal,
    })
      .then(async (response) => {
        const result = await response.json() as { order?: Order; error?: string };
        if (!response.ok || !result.order) throw new Error(result.error || 'Unable to load order tracking.');
        setOrder(result.order);
      })
      .catch((requestError: unknown) => {
        if (!controller.signal.aborted) setError(requestError instanceof Error ? requestError.message : 'Unable to load order tracking.');
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [orderId]);

  const currentStage = order ? getCurrentStage(order) : '';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <Header />
      <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
        <Link href="/" className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-indigo-600 dark:text-slate-300">
          <ArrowLeft className="h-4 w-4" /> Storefront
        </Link>

        {loading ? (
          <section className="rounded-2xl border border-slate-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-slate-900" aria-live="polite">
            <Clock3 className="mx-auto h-6 w-6 animate-spin text-indigo-600" />
            <p className="mt-3 text-sm font-semibold text-slate-700 dark:text-slate-200">Loading order status…</p>
          </section>
        ) : error ? (
          <section className="rounded-2xl border border-amber-200 bg-white p-8 text-center dark:border-amber-900 dark:bg-slate-900" role="alert">
            <AlertTriangle className="mx-auto h-7 w-7 text-amber-600" />
            <h1 className="mt-3 text-lg font-bold text-slate-900 dark:text-white">Tracking unavailable</h1>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{error}</p>
          </section>
        ) : order ? (
          <div className="space-y-5">
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-300">
                  <PackageCheck className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Order {order.id}</p>
                  <h1 className="mt-1 text-xl font-extrabold text-slate-900 dark:text-white">{order.productTitle || order.product?.title || order.productId}</h1>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{order.university} · {order.quantity} unit{order.quantity === 1 ? '' : 's'}</p>
                </div>
              </div>

              <div className="mt-6 rounded-xl border border-indigo-100 bg-indigo-50 p-4 dark:border-indigo-900 dark:bg-indigo-950/40">
                <p className="flex items-center gap-2 text-xs font-semibold text-indigo-800 dark:text-indigo-200"><Clock3 className="h-4 w-4" />Current order status</p>
                <p className="mt-1 text-lg font-extrabold text-indigo-950 dark:text-white">{currentStage}</p>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <StatusSummary icon={<ShieldCheck className="h-4 w-4" />} label="Payment" value={order.paymentStatus || 'Submitted'} />
                <StatusSummary icon={<PackageCheck className="h-4 w-4" />} label="Fulfillment" value={order.fulfillmentStatus || 'Unconfirmed'} />
                <StatusSummary icon={<Truck className="h-4 w-4" />} label="Delivery" value={order.deliveryStatus || 'Not Dispatched'} />
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 sm:p-8" aria-labelledby="order-history-heading">
              <h2 id="order-history-heading" className="text-base font-bold text-slate-900 dark:text-white">Order history</h2>
              <ol className="mt-5 space-y-0">
                {(order.statusHistory || []).map((event, index) => {
                  const isLatest = index === (order.statusHistory?.length || 0) - 1;
                  return (
                    <li key={`${event.statusType}-${event.status}-${event.changedAt}`} className="relative flex gap-3 pb-5 last:pb-0">
                      {index < (order.statusHistory?.length || 0) - 1 && <span aria-hidden="true" className="absolute left-2.25 top-5 h-full w-px bg-slate-200 dark:bg-slate-700" />}
                      <span className="relative z-10 mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                        {isLatest ? <Clock3 className="h-3 w-3" /> : <CheckCircle2 className="h-3 w-3" />}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">{event.label}</p>
                        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{new Date(event.changedAt).toLocaleString('en-TZ')}</p>
                      </div>
                    </li>
                  );
                })}
              </ol>
              <div className="mt-6 border-t border-slate-100 pt-4 text-xs dark:border-slate-800">
                <p className="font-semibold text-slate-800 dark:text-slate-200">Delivery destination</p>
                <p className="mt-1 text-slate-600 dark:text-slate-400">{order.deliveryDetails}</p>
                <p className="mt-3 flex items-center gap-1.5 text-slate-500 dark:text-slate-400"><Truck className="h-3.5 w-3.5" />{order.deliverySpotType === 'Courier' ? 'Courier delivery' : 'Campus hand-off'}</p>
              </div>
            </section>
          </div>
        ) : null}
      </main>
    </div>
  );
}

function StatusSummary({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">
      <p className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400">{icon}{label}</p>
      <p className="mt-1 text-xs font-bold text-slate-900 dark:text-white">{value}</p>
    </div>
  );
}