'use client';

import { useCallback, useEffect, useState } from 'react';
import { Bell, CheckCheck, Package, ShieldCheck } from 'lucide-react';

type Notification = { id: string; kind: string; title: string; message: string; resource_id: string; created_at: string; read_at: string | null };
type Insights = { listings: { total: number; approved: number; pending_approval: number; rejected: number; changes_requested: number; activeValue: number }; commissions: { payable: number; paid: number }; notifications: Notification[] };
const blank: Insights = { listings: { total: 0, approved: 0, pending_approval: 0, rejected: 0, changes_requested: 0, activeValue: 0 }, commissions: { payable: 0, paid: 0 }, notifications: [] };
export default function SellerMarketplaceInsights() {
  const [data, setData] = useState(blank);
  const [error, setError] = useState('');
  const load = useCallback(async () => { const response = await fetch('/api/seller/insights', { cache: 'no-store' }); const result = await response.json(); if (!response.ok) throw new Error(result.error || 'Could not load seller insights.'); setData(result as Insights); }, []);
  useEffect(() => { const timer = window.setTimeout(() => { void load().catch((e: Error) => setError(e.message)); }, 0); return () => window.clearTimeout(timer); }, [load]);
  const markRead = async () => { const response = await fetch('/api/seller/insights', { method: 'PATCH' }); if (response.ok) await load(); };
  const unread = data.notifications.filter((item) => !item.read_at).length;
  return <section className="mt-5 space-y-4" aria-label="Seller analytics and notifications">
    <div><h2 className="text-lg font-extrabold">Marketplace insights</h2><p className="mt-1 text-xs text-slate-500">Listing status and Winga commission records for this seller account.</p></div>
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{[['Approved listings',data.listings.approved],['Awaiting review',data.listings.pending_approval],['Needs changes',data.listings.changes_requested],['Rejected listings',data.listings.rejected],['Active listing value (TZS)',data.listings.activeValue.toLocaleString('en-TZ')],['Winga commissions payable (TZS)',data.commissions.payable.toLocaleString('en-TZ')]].map(([label,value])=><article key={String(label)} className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"><p className="text-xs text-slate-500">{label}</p><p className="mt-1 text-xl font-black">{value}</p></article>)}</div>
    {error && <p role="alert" className="rounded-xl bg-amber-50 p-3 text-xs text-amber-900">{error}</p>}
    <article className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"><div className="flex flex-wrap items-center justify-between gap-2"><h3 className="flex items-center gap-2 font-bold"><Bell className="h-4 w-4"/>Moderation notifications{unread > 0 && <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] text-indigo-800">{unread} new</span>}</h3>{unread > 0 && <button type="button" onClick={() => void markRead()} className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600"><CheckCheck className="h-4 w-4"/>Mark all read</button>}</div>
      {data.notifications.length ? <div className="mt-3 divide-y dark:divide-slate-800">{data.notifications.map((item)=><div key={item.id} className={`flex gap-3 py-3 ${item.read_at ? 'opacity-70' : ''}`}><span className="mt-0.5 text-indigo-600">{item.kind === 'product_approved' ? <ShieldCheck className="h-4 w-4"/> : <Package className="h-4 w-4"/>}</span><div><p className="text-sm font-bold">{item.title}</p><p className="mt-1 text-xs text-slate-600 dark:text-slate-300">{item.message}</p><time className="mt-1 block text-[10px] text-slate-500">{new Date(item.created_at).toLocaleString()}</time></div></div>)}</div> : <p className="mt-3 text-sm text-slate-500">No moderation notifications yet.</p>}
    </article>
    <p className="text-[11px] text-slate-500">Listing value is the asking price total of approved listings, not sales revenue. Commission totals are Winga ledger records and depend on order status review.</p>
  </section>;
}
