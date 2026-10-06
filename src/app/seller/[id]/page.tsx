'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BadgeCheck, MapPin, Store } from 'lucide-react';
import Header from '@/components/Header';
import ProductCard from '@/components/ProductCard';
import MarketplaceReportButton from '@/components/MarketplaceReportButton';
import { useStore } from '@/context/StoreContext';
import type { Product } from '@/lib/types';

type Seller = { id: string; display_name: string; university: string; campus: string | null; description: string; verified: boolean; verificationLabel: string | null; productCount: number };
export default function PublicSellerPage({ params }: { params: Promise<{ id: string }> }) {
  const { products } = useStore();
  const [id, setId] = useState('');
  const [seller, setSeller] = useState<Seller | null>(null);
  const [error, setError] = useState('');
  useEffect(() => { void params.then(({ id: value }) => setId(value)); }, [params]);
  useEffect(() => {
    if (!id) return;
    void fetch(`/api/sellers/${encodeURIComponent(id)}`).then(async (r) => { const data = await r.json(); if (!r.ok) throw new Error(data.error); setSeller(data.seller); }).catch((e: Error) => setError(e.message));
  }, [id]);
  const sellerProducts: Product[] = products.filter((product) => product.sellerProfileId === id);
  return <div className="min-h-screen bg-slate-50 dark:bg-slate-950"><Header/><main className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6">
    <Link href="/" className="text-sm font-semibold text-indigo-600">← Marketplace</Link>
    {error ? <p role="alert" className="rounded-xl bg-white p-6 text-rose-700">{error}</p> : !seller ? <p className="rounded-xl bg-white p-6">Loading seller profile…</p> : <>
      <section className="rounded-3xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900"><div className="flex flex-wrap items-start justify-between gap-5"><div className="flex gap-4"><span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"><Store/></span><div><div className="flex flex-wrap items-center gap-2"><h1 className="text-2xl font-black">{seller.display_name}</h1>{seller.verified && <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"><BadgeCheck className="h-4 w-4"/>{seller.verificationLabel || 'Verified seller'}</span>}</div><p className="mt-1 flex items-center gap-1 text-sm text-slate-500"><MapPin className="h-4 w-4"/>{seller.university}{seller.campus ? ` · ${seller.campus}` : ''}</p></div></div><MarketplaceReportButton sellerProfileId={seller.id} label="Report seller"/></div>{seller.description && <p className="mt-5 max-w-3xl whitespace-pre-wrap text-sm leading-6 text-slate-600 dark:text-slate-300">{seller.description}</p>}<p className="mt-4 text-xs font-semibold text-slate-500">{seller.productCount} approved listings</p></section>
      <section><h2 className="mb-4 text-xl font-black">Seller listings</h2>{sellerProducts.length ? <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">{sellerProducts.map((product) => <div key={product.id} className="space-y-2"><ProductCard product={product}/><div className="px-1"><MarketplaceReportButton productId={product.id} sellerProfileId={seller.id}/></div></div>)}</div> : <p className="rounded-2xl border border-dashed p-8 text-center text-sm text-slate-500">No approved listings are currently available.</p>}</section>
    </>}
  </main></div>;
}
