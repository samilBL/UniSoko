'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import { formatTZS } from '@/lib/mockData';
import { AlertTriangle, ArrowLeft, CheckCircle2, Clock3, FileDown, PackageCheck, RefreshCw, ShieldCheck, Truck } from 'lucide-react';
import type { Order } from '@/lib/types';

function getCurrentStage(order: Order) {
  if (order.paymentStatus === 'Failed') return 'Payment Failed';
  if (order.status === 'Cancelled') return 'Cancelled';
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
  const [trackingToken, setTrackingToken] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [cancellationReason, setCancellationReason] = useState('Changed mind');
  const [cancellationDetails, setCancellationDetails] = useState('');
  const [cancellationMessage, setCancellationMessage] = useState('');
  const [cancellationError, setCancellationError] = useState('');
  const [isRequestingCancellation, setIsRequestingCancellation] = useState(false);

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
    Promise.resolve().then(() => setTrackingToken(token));

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

  const refreshStatus = async () => {
    if (!trackingToken || isRefreshing) return;
    setIsRefreshing(true);
    setRefreshError('');
    try {
      const response = await fetch(`/api/orders/${encodeURIComponent(orderId)}?token=${encodeURIComponent(trackingToken)}`, { cache: 'no-store' });
      const result = await response.json() as { order?: Order; error?: string };
      if (!response.ok || !result.order) throw new Error(result.error || 'Could not refresh this order.');
      setOrder(result.order);
    } catch (requestError) {
      setRefreshError(requestError instanceof Error ? requestError.message : 'Could not refresh this order.');
    } finally {
      setIsRefreshing(false);
    }
  };

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
                  <h1 className="mt-1 text-xl font-extrabold text-slate-900 dark:text-white">{order.items && order.items.length > 1 ? `${order.items.length} products` : order.items?.[0]?.productTitle || order.productTitle || order.product?.title || order.productId}</h1>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{order.university} · {order.quantity} unit{order.quantity === 1 ? '' : 's'}</p>
                </div>
              </div>

              <div className="mt-6 rounded-xl border border-indigo-100 bg-indigo-50 p-4 dark:border-indigo-900 dark:bg-indigo-950/40">
                <div className="flex items-center justify-between gap-3"><p className="flex items-center gap-2 text-xs font-semibold text-indigo-800 dark:text-indigo-200"><Clock3 className="h-4 w-4" />Current order status</p><button type="button" onClick={() => void refreshStatus()} disabled={isRefreshing} className="inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-lg border border-indigo-200 bg-white px-2.5 text-[11px] font-bold text-indigo-800 hover:bg-indigo-50 disabled:opacity-60 dark:border-indigo-800 dark:bg-slate-900 dark:text-indigo-200 dark:hover:bg-indigo-950"><RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />{isRefreshing ? 'Updating' : 'Refresh'}</button></div>
                <p className="mt-1 text-lg font-extrabold text-indigo-950 dark:text-white">{currentStage}</p>
                {refreshError && <p role="status" className="mt-2 text-xs font-semibold text-red-700 dark:text-red-300">{refreshError}</p>}
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <StatusSummary icon={<ShieldCheck className="h-4 w-4" />} label="Payment" value={order.paymentStatus || 'Submitted'} />
                <StatusSummary icon={<PackageCheck className="h-4 w-4" />} label="Fulfillment" value={order.fulfillmentStatus || 'Unconfirmed'} />
                <StatusSummary icon={<Truck className="h-4 w-4" />} label="Delivery" value={order.deliveryStatus || 'Not Dispatched'} />
              </div>

              <div className="mt-5 divide-y divide-slate-100 rounded-xl border border-slate-200 px-4 dark:divide-slate-800 dark:border-slate-700">
                {(order.items || [{ productId: order.productId, productTitle: order.productTitle || order.product?.title || order.productId, condition: order.product?.condition || 'Brand New', quantity: order.quantity, unitPrice: order.totalAmount / Math.max(1, order.quantity), lineTotal: order.totalAmount }]).map((item) => (
                  <div key={item.productId} className="flex items-start justify-between gap-4 py-3 text-xs">
                    <div className="min-w-0"><p className="font-semibold text-slate-900 dark:text-white">{item.productTitle}</p><p className="mt-0.5 text-slate-500 dark:text-slate-400">{item.quantity} × {formatTZS(item.unitPrice)}</p></div>
                    <span className="shrink-0 font-bold text-slate-900 dark:text-white">{formatTZS(item.lineTotal)}</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 space-y-1 text-xs">
                <TrackingAmount label="Subtotal" amount={order.subtotalAmount} />
                {(order.shippingFee || 0) > 0 && <TrackingAmount label="Courier delivery" amount={order.shippingFee} />}
                {(order.promoDiscount || 0) > 0 && <TrackingAmount label="Winga discount" amount={-Number(order.promoDiscount)} />}
                <TrackingAmount label="Total" amount={order.totalAmount} strong />
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
            {order.deliveryStatus === 'Delivered' && trackingToken && <section className="rounded-2xl border border-emerald-300 bg-emerald-50 p-5 dark:border-emerald-900 dark:bg-emerald-950/40"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="text-sm font-extrabold text-emerald-950 dark:text-emerald-100">Delivery confirmed</h2><p className="mt-1 text-xs text-emerald-900 dark:text-emerald-200">Your order has been marked delivered. Your item and warranty receipt is ready.</p></div><Link href={`/order/${encodeURIComponent(order.id)}/receipt?token=${encodeURIComponent(trackingToken)}`} className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-indigo-700"><FileDown className="h-4 w-4" />View / Print Receipt</Link></div></section>}
            {order.cancellationStatus && order.cancellationStatus !== 'Not Requested' ? (
              <section className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950" role="status"><p className="font-bold">Cancellation request: {order.cancellationStatus}</p><p className="mt-1 text-xs">UniSoko will review the request. A cancellation does not trigger an automatic refund; the team must verify any payment and record its resolution.</p></section>
            ) : order.status !== 'Completed' && order.status !== 'Cancelled' && order.deliveryStatus === 'Not Dispatched' && order.fulfillmentStatus !== 'Ready for Dispatch' ? (
              <form className="space-y-3 rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900" onSubmit={async (event) => {
                event.preventDefault();
                setCancellationError('');
                setCancellationMessage('');
                setIsRequestingCancellation(true);
                const token = new URLSearchParams(window.location.search).get('token') || '';
                try {
                  const response = await fetch(`/api/orders/${encodeURIComponent(orderId)}/cancellation`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token, reason: cancellationReason, details: cancellationDetails }) });
                  const result = await response.json() as { request?: { status: string }; error?: string };
                  if (!response.ok || !result.request) throw new Error(result.error || 'Could not request cancellation.');
                  setOrder((current) => current ? { ...current, cancellationStatus: 'Pending' } : current);
                  setCancellationMessage('Your request was sent for UniSoko review. No refund has been issued yet.');
                } catch (requestError) {
                  setCancellationError(requestError instanceof Error ? requestError.message : 'Could not request cancellation.');
                } finally {
                  setIsRequestingCancellation(false);
                }
              }}>
                <div><h2 className="text-sm font-bold">Request order cancellation</h2><p className="mt-1 text-xs text-slate-600 dark:text-slate-300">Requests are reviewed before any order or payment is changed.</p></div>
                <label className="block text-xs font-semibold">Reason<select value={cancellationReason} onChange={(event) => setCancellationReason(event.target.value)} className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm">{['Changed mind', 'Ordered by mistake', 'Found another product', 'Delivery taking too long', 'Other'].map((reason) => <option key={reason}>{reason}</option>)}</select></label>
                {cancellationReason === 'Other' && <label className="block text-xs font-semibold">Details<textarea maxLength={1000} rows={3} value={cancellationDetails} onChange={(event) => setCancellationDetails(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" /></label>}
                {cancellationError && <p role="alert" className="text-xs font-semibold text-red-700">{cancellationError}</p>}{cancellationMessage && <p role="status" className="text-xs font-semibold text-emerald-800">{cancellationMessage}</p>}
                <button type="submit" disabled={isRequestingCancellation} className="min-h-11 rounded-lg border border-red-300 px-4 text-xs font-bold text-red-800 hover:bg-red-50 disabled:opacity-50">{isRequestingCancellation ? 'Submitting…' : 'Submit cancellation request'}</button>
              </form>
            ) : null}
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

function TrackingAmount({ label, amount, strong = false }: { label: string; amount?: number; strong?: boolean }) {
  return <div className={`flex justify-between gap-4 ${strong ? 'border-t border-slate-200 pt-2 font-bold dark:border-slate-700' : 'text-slate-600 dark:text-slate-400'}`}><span>{label}</span><span className={strong ? 'text-slate-900 dark:text-white' : ''}>{formatTZS(amount || 0)}</span></div>;
}
