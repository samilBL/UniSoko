import Link from 'next/link';
import Header from '@/components/Header';
import CartDrawer from '@/components/CartDrawer';
import { MOCK_PRODUCTS, formatTZS } from '@/lib/mockData';
import { ArrowRight, Users } from 'lucide-react';

export default function GroupBuyHubPage() {
  const products = MOCK_PRODUCTS.filter((product) => product.stockStatus !== 'Coming Soon');
  return <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100"><Header /><main className="mx-auto w-full max-w-6xl flex-1 space-y-8 px-4 py-8 sm:px-6 lg:px-8">
    <section className="rounded-3xl bg-linear-to-br from-emerald-800 via-teal-800 to-slate-950 p-6 text-white shadow-xl sm:p-9"><span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-bold"><Users className="h-4 w-4" />Campus group buying</span><h1 className="mt-4 max-w-2xl text-3xl font-black tracking-tight sm:text-4xl">Bring your campus squad. Everyone picks what they need.</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-emerald-50 sm:text-base">Start with a product, invite classmates, and let each member choose an available gadget. When enough students join, any member can close the deal and UniSoko coordinates the pooled order.</p></section>
    <section className="space-y-4"><div><h2 className="text-xl font-black text-slate-900 dark:text-white">Choose a product to start your group</h2><p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Your classmates can add a different product after they join your group link.</p></div><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{products.map((product) => <article key={product.id} className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"><span className="text-xs font-bold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">{product.category}</span><h3 className="mt-2 flex-1 text-base font-extrabold text-slate-900 dark:text-white">{product.title}</h3><p className="mt-3 text-sm text-slate-600 dark:text-slate-300">From {formatTZS(product.priceWholesale)} per unit at the group rate</p><Link href={`/product/${encodeURIComponent(product.id)}`} className="mt-4 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-3 text-sm font-bold text-white hover:bg-emerald-800">Start with this product <ArrowRight className="h-4 w-4" /></Link></article>)}</div></section>
  </main><CartDrawer /></div>;
}
