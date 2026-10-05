'use client';

import { useState } from 'react';
import Image from 'next/image';
import Header from '@/components/Header';
import CartDrawer from '@/components/CartDrawer';
import { useStore } from '@/context/StoreContext';
import { formatTZS } from '@/lib/mockData';
import { STUDENT_BUNDLES } from '@/lib/studentBundles';
import { PackageCheck } from 'lucide-react';
import OfferCard from '@/components/OfferCard';

export default function StudentBundlesPage() {
  const { addToCart } = useStore();
  const [course, setCourse] = useState('All bundles');
  const [addedBundle, setAddedBundle] = useState('');
  const courses = ['All bundles', ...STUDENT_BUNDLES.map((bundle) => bundle.course)];
  const visibleBundles = course === 'All bundles' ? STUDENT_BUNDLES : STUDENT_BUNDLES.filter((bundle) => bundle.course === course);

  return (
    <div className="flex min-h-screen flex-col bg-black text-white">
      <Header />
      <main className="mx-auto w-full max-w-6xl flex-1 space-y-8 px-4 py-8 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-end sm:justify-between dark:border-slate-800">
          <div><p className="text-xs font-bold uppercase text-emerald-700">Curated for campus life</p><h1 className="mt-1 text-2xl font-black sm:text-3xl">Student bundles</h1><p className="mt-2 max-w-2xl text-sm text-slate-600 dark:text-slate-300">Room essentials and course-ready kits with one clear package price.</p></div>
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-200">Shop by academic course<select value={course} onChange={(event) => setCourse(event.target.value)} className="mt-1 block min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm sm:min-w-64">{courses.map((item) => <option key={item}>{item}</option>)}</select></label>
        </header>
        {addedBundle && <p role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-900">{addedBundle} added to your cart.</p>}
        <section className="grid gap-5 md:grid-cols-2" aria-label="Available student bundles">
          {visibleBundles.map((bundle) => <article key={bundle.id} className="overflow-hidden rounded-xl border border-white/10 bg-[#0A0A0E]">
            <div className="relative aspect-16/8 bg-slate-200"><Image src={bundle.images[0]} alt={bundle.title} fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover" /></div>
            <div className="space-y-4 p-5">
              <div className="flex items-start justify-between gap-3"><div><p className="text-[10px] font-bold uppercase text-emerald-700">{bundle.course}</p><h2 className="mt-1 text-lg font-extrabold">{bundle.title}</h2></div><span className="inline-flex shrink-0 items-center gap-1 rounded-md bg-emerald-100 px-2 py-1 text-xs font-bold text-emerald-900"><PackageCheck className="h-3.5 w-3.5" />10% off</span></div>
              <p className="text-sm text-slate-600 dark:text-slate-300">{bundle.description}</p>
              <ul className="space-y-1 border-y border-slate-100 py-3 text-xs text-slate-700 dark:border-slate-800 dark:text-slate-200">{bundle.bundleContents.map((item) => <li key={item}>• {item}</li>)}</ul>
              <OfferCard badge="LIMITED TIME BUNDLE" title={`${bundle.title} bundle price`} originalPrice={formatTZS(bundle.listPrice)} dealPrice={formatTZS(bundle.priceRetail)} savings={formatTZS(bundle.listPrice - bundle.priceRetail)} actionLabel="Add bundle" onAction={() => { addToCart(bundle, 1); setAddedBundle(bundle.title); }} />
            </div>
          </article>)}
        </section>
      </main>
      <CartDrawer />
    </div>
  );
}
