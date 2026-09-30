'use client';

import Link from 'next/link';
import Header from '@/components/Header';
import CartDrawer from '@/components/CartDrawer';
import { useStore } from '@/context/StoreContext';
import { OrderStatus, WingaAgent } from '@/lib/types';
import { ArrowLeft, BadgeCheck, Medal, PackageCheck, ShoppingBag, Sparkles } from 'lucide-react';

const SUCCESSFUL_STATUSES: OrderStatus[] = ['Approved', 'Out for Delivery', 'Completed'];

function agentStats(agent: WingaAgent, orders: ReturnType<typeof useStore>['orders']) {
  const referredOrders = orders.filter((order) => order.wingaCodeUsed?.toUpperCase() === agent.promoCode.toUpperCase());
  const successfulOrders = referredOrders.filter((order) => SUCCESSFUL_STATUSES.includes(order.status));
  return {
    orders: successfulOrders.length,
    products: successfulOrders.reduce((total, order) => total + Math.max(0, order.quantity), 0),
  };
}

export default function WingaLeaderboardPage() {
  const { wingaAgents, orders } = useStore();
  const rankedAgents = wingaAgents
    .map((agent) => ({ agent, ...agentStats(agent, orders) }))
    .sort((left, right) => right.products - left.products || right.orders - left.orders || right.agent.totalEarnings - left.agent.totalEarnings);

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <Header />
      <main className="mx-auto w-full max-w-5xl flex-1 space-y-8 px-4 py-10 sm:px-6 lg:px-8">
        <Link href="/winga" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 transition hover:text-indigo-600"><ArrowLeft className="h-4 w-4" />Winga programme</Link>
        <section className="relative overflow-hidden rounded-3xl bg-slate-950 p-7 text-white shadow-2xl shadow-indigo-500/10 sm:p-10">
          <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-indigo-600/30 blur-3xl" />
          <div className="relative">
            <span className="inline-flex items-center gap-2 rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1 text-xs font-bold text-amber-200"><Sparkles className="h-4 w-4" />Student agent rankings</span>
            <h1 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">Campus Winga leaderboard</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">Ranked by products sold through approved, dispatched, and completed referred orders. Rankings update from the orders visible to this store.</p>
          </div>
        </section>
        <section className="space-y-3" aria-label="Winga rankings">
          {rankedAgents.length === 0 ? <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">No Winga agents have registered yet.</div> : rankedAgents.map(({ agent, orders: successfulOrders, products }, index) => {
            const joinedDate = agent.joinedAt ? new Date(agent.joinedAt) : null;
            const joined = joinedDate && !Number.isNaN(joinedDate.getTime())
              ? `Joined ${new Intl.DateTimeFormat('en', { month: 'short', year: 'numeric' }).format(joinedDate)}`
              : 'Join date unavailable';
            const verified = agent.kycStatus === 'Verified';
            return (
              <article key={agent.id} className="grid gap-4 rounded-3xl border border-slate-200/80 bg-white/85 p-5 shadow-xl shadow-indigo-950/[0.03] backdrop-blur-xl sm:grid-cols-[auto_1fr_auto] sm:items-center sm:p-6">
                <div className={`flex h-12 w-12 items-center justify-center rounded-2xl font-black ${index < 3 ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-500'}`} aria-label={`Rank ${index + 1}`}>
                  {index < 3 ? <Medal className="h-6 w-6" /> : `#${index + 1}`}
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="truncate text-base font-extrabold text-slate-950">{agent.fullName}</h2>
                    {verified ? <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-800"><BadgeCheck className="h-3.5 w-3.5" />Verified Student ID</span> : <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-bold text-amber-800">ID not verified</span>}
                  </div>
                  <p className="mt-1 truncate text-sm text-slate-500">{agent.university}</p>
                  <p className="mt-1 text-xs font-medium text-slate-400">{joined}</p>
                </div>
                <div className="grid grid-cols-2 gap-2 sm:min-w-52">
                  <div className="rounded-2xl bg-indigo-50 p-3"><p className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-indigo-700"><PackageCheck className="h-3.5 w-3.5" />Products sold</p><p className="mt-1 text-lg font-black text-slate-950">{products}</p></div>
                  <div className="rounded-2xl bg-emerald-50 p-3"><p className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-emerald-800"><ShoppingBag className="h-3.5 w-3.5" />Successful orders</p><p className="mt-1 text-lg font-black text-slate-950">{successfulOrders}</p></div>
                </div>
              </article>
            );
          })}
        </section>
        <div className="text-center"><Link href="/winga" className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-indigo-700">Join as a Winga</Link></div>
      </main>
      <CartDrawer />
    </div>
  );
}
