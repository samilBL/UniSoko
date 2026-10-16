'use client';

import { useEffect, useState } from 'react';
import { Check, MapPin, PackageCheck } from 'lucide-react';

type DispatchOrder = {
  id: string;
  product_title: string;
  quantity: number;
  buyer_name: string;
  buyer_phone: string;
  university: string;
  delivery_spot_type: string;
  delivery_details: string;
  delivery_status: 'With Winga' | 'Ready for Pickup';
  created_at: string;
};

export default function WingaDispatchQueue() {
  const [orders, setOrders] = useState<DispatchOrder[]>([]);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState('');

  const refresh = async () => {
    const response = await fetch('/api/winga/dispatch', { cache: 'no-store' });
    const result = await response.json() as { orders?: DispatchOrder[]; error?: string };
    if (!response.ok) throw new Error(result.error || 'Could not load dispatch assignments.');
    setOrders(result.orders || []);
    setError('');
  };

  useEffect(() => {
    let active = true;
    const load = () => void refresh().catch((reason: unknown) => {
      if (active) setError(reason instanceof Error ? reason.message : 'Could not refresh dispatch assignments.');
    });
    load();
    const timer = window.setInterval(load, 15000);
    return () => { active = false; window.clearInterval(timer); };
  }, []);

  const advance = async (order: DispatchOrder) => {
    setBusyId(order.id);
    setError('');
    const deliveryStatus = order.delivery_status === 'With Winga' ? 'Ready for Pickup' : 'Delivered';
    try {
      const response = await fetch('/api/winga/dispatch', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: order.id, deliveryStatus }),
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || 'Could not update this order.');
      await refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not update this order.');
    } finally {
      setBusyId('');
    }
  };

  return <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
    <div className="flex items-center justify-between gap-3"><div><h2 className="font-bold">Assigned campus deliveries</h2><p className="mt-1 text-xs text-slate-500">Assignments and order updates refresh automatically.</p></div><span className="text-xs font-semibold text-slate-500">{orders.length} active</span></div>
    {error && <p role="alert" className="mt-3 rounded-lg bg-rose-50 p-3 text-xs text-rose-800">{error}</p>}
    {orders.length ? <div className="mt-3 divide-y divide-slate-200 dark:divide-slate-800">{orders.map((order) => <article key={order.id} className="py-4"><div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0"><p className="font-mono text-xs font-bold">{order.id}</p><p className="mt-1 text-sm font-semibold">{order.quantity}x {order.product_title}</p><p className="mt-1 text-xs text-slate-500">{order.buyer_name} · {order.buyer_phone}</p><p className="mt-1 flex items-start gap-1 text-xs text-slate-500"><MapPin className="mt-0.5 h-3 w-3 shrink-0"/>{order.university} · {order.delivery_spot_type}: {order.delivery_details}</p></div><button type="button" disabled={busyId === order.id} onClick={() => void advance(order)} className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-lg bg-emerald-600 px-3 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50">{order.delivery_status === 'With Winga' ? <PackageCheck className="h-4 w-4"/> : <Check className="h-4 w-4"/>}{busyId === order.id ? 'Saving...' : order.delivery_status === 'With Winga' ? 'Ready for pickup' : 'Mark delivered'}</button></div><p className="mt-2 text-[10px] text-slate-400">Current status: {order.delivery_status} · {new Date(order.created_at).toLocaleString()}</p></article>)}</div> : !error && <p className="mt-4 text-sm text-slate-500">No campus dispatch orders are currently assigned to you.</p>}
  </section>;
}
