'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

type ModerationProduct = {
  id: string; name: string; category: string; price: number | string; description: string; specs: Record<string, unknown>;
  image: string; images: unknown; imageUrls: string[]; listing_status: string; submitted_at: string | null; moderation_notes: string;
  sellerProfile: { display_name: string; university: string; status: string };
};

export default function AdminProductModeration() {
  const [products, setProducts] = useState<ModerationProduct[]>([]);
  const [filter, setFilter] = useState('pending_approval');
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState('');
  const load = useCallback(async () => {
    const response = await fetch('/api/admin/product-moderation', { cache: 'no-store' });
    const result = await response.json() as { products?: ModerationProduct[]; error?: string };
    if (!response.ok) throw new Error(result.error || 'Could not load seller products.');
    setProducts(result.products || []);
  }, []);
  useEffect(() => { void Promise.resolve().then(load).catch((reason: unknown) => setError(reason instanceof Error ? reason.message : 'Could not load products.')); }, [load]);
  const counts = useMemo(() => products.reduce<Record<string, number>>((result, product) => { result[product.listing_status] = (result[product.listing_status] || 0) + 1; return result; }, {}), [products]);
  const visible = products.filter((product) => filter === 'all' || product.listing_status === filter);
  const review = async (product: ModerationProduct, action: 'approve' | 'reject' | 'request_changes') => {
    const notes = action === 'approve' ? '' : window.prompt(action === 'reject' ? 'Why is this product rejected?' : 'What must the seller change?')?.trim() || '';
    if (action !== 'approve' && notes.length < 3) return;
    setBusyId(product.id); setError('');
    try {
      const response = await fetch('/api/admin/product-moderation', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: product.id, action, notes }) });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || 'Could not save this moderation decision.');
      await load();
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Could not save this moderation decision.'); }
    finally { setBusyId(''); }
  };
  return <main className="mx-auto max-w-6xl space-y-5 px-4 py-8 sm:px-6">
    <header><p className="text-xs font-bold uppercase tracking-wider text-indigo-600">Marketplace administration</p><h1 className="mt-1 text-2xl font-black">Seller product moderation</h1><p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Only approved seller products are activated for public marketplace listings.</p></header>
    {error && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}
    <nav aria-label="Filter seller products" className="flex flex-wrap gap-2">{[['pending_approval', 'Needs review'], ['approved', 'Approved'], ['changes_requested', 'Changes requested'], ['rejected', 'Rejected'], ['all', 'All']].map(([status, label]) => <button key={status} type="button" onClick={() => setFilter(status)} className={`min-h-10 rounded-full px-4 text-xs font-bold ${filter === status ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200'}`}>{label} ({status === 'all' ? products.length : counts[status] || 0})</button>)}</nav>
    <section className="space-y-4">{visible.length === 0 && <p className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900">No products in this queue.</p>}{visible.map((product) => {
      const images = product.imageUrls || [];
      return <article key={product.id} className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-5 md:flex-row"><div className="grid grid-cols-3 gap-2 md:w-1/3">{(images.length ? images : [product.image]).map((image, index) => <img key={`${product.id}-${index}`} src={image} alt={`${product.name} ${index + 1}`} className="aspect-square w-full rounded-xl bg-slate-100 object-cover dark:bg-slate-800"/>)}</div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-lg font-extrabold">{product.name}</h2><p className="mt-1 text-xs text-slate-500">{product.category} · TZS {Number(product.price).toLocaleString()} · Submitted {product.submitted_at ? new Date(product.submitted_at).toLocaleString() : '—'}</p></div><span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold capitalize text-amber-900">{product.listing_status.replaceAll('_', ' ')}</span></div><p className="mt-3 text-sm font-semibold">{product.sellerProfile.display_name} · {product.sellerProfile.university}</p><p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700 dark:text-slate-200">{product.description}</p>{Object.keys(product.specs || {}).length > 0 && <dl className="mt-3 grid gap-2 sm:grid-cols-2">{Object.entries(product.specs).map(([key, value]) => <div key={key} className="rounded-lg bg-slate-50 p-2 text-xs dark:bg-slate-800"><dt className="font-bold">{key}</dt><dd>{Array.isArray(value) ? value.join(', ') : String(value)}</dd></div>)}</dl>}{product.moderation_notes && <p className="mt-3 rounded-lg bg-amber-50 p-3 text-xs text-amber-900 dark:bg-amber-950/40 dark:text-amber-100">Previous feedback: {product.moderation_notes}</p>}
          {product.listing_status === 'pending_approval' && <div className="mt-4 flex flex-wrap gap-2"><button type="button" disabled={busyId === product.id || product.sellerProfile.status !== 'approved'} onClick={() => void review(product, 'approve')} className="min-h-10 rounded-lg bg-emerald-600 px-4 text-xs font-bold text-white disabled:opacity-50">Approve and publish</button><button type="button" disabled={busyId === product.id} onClick={() => void review(product, 'request_changes')} className="min-h-10 rounded-lg border border-amber-500 px-4 text-xs font-bold text-amber-800 disabled:opacity-50">Request changes</button><button type="button" disabled={busyId === product.id} onClick={() => void review(product, 'reject')} className="min-h-10 rounded-lg border border-rose-500 px-4 text-xs font-bold text-rose-800 disabled:opacity-50">Reject</button>{product.sellerProfile.status !== 'approved' && <p className="basis-full text-xs text-rose-700">Approve the seller account before publishing this listing.</p>}</div>}
        </div></div>
      </article>;
    })}</section>
  </main>;
}
