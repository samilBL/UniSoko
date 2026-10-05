'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import Header from '@/components/Header';
import CartDrawer from '@/components/CartDrawer';
import { formatTZS, MOCK_PRODUCTS } from '@/lib/mockData';
import { Clock3, Copy, RefreshCw, Share2, Users } from 'lucide-react';

interface GroupBuy {
  id: string;
  productId: string;
  productTitle: string;
  retailPrice: number;
  wholesalePrice: number;
  minimumQuantity: number;
  participantCount: number;
  createdAt: string;
  expiresAt: string;
  status: 'open' | 'closed';
  products?: Array<{ product_id: string; product_title: string; retail_price: number; wholesale_price: number }>;
}

const TOKEN_KEY = 'unisoko_group_buyer_token';

function getParticipantToken() {
  let token = localStorage.getItem(TOKEN_KEY);
  if (!token) {
    token = crypto.randomUUID();
    localStorage.setItem(TOKEN_KEY, token);
  }
  return token;
}

export default function GroupBuyPage() {
  const params = useParams<{ id: string }>();
  const groupId = params.id;
  const [group, setGroup] = useState<GroupBuy | null>(null);
  const [remainingMs, setRemainingMs] = useState(0);
  const [isJoining, setIsJoining] = useState(false);
  const [hasJoined, setHasJoined] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [isClosing, setIsClosing] = useState(false);

  const loadGroup = useCallback(async () => {
    try {
      const response = await fetch(`/api/group-buys/${encodeURIComponent(groupId)}`, { cache: 'no-store' });
      const body = await response.json() as { group?: GroupBuy; error?: string };
      if (!response.ok || !body.group) throw new Error(body.error || 'This group buy is unavailable.');
      setGroup(body.group);
      setRemainingMs(Math.max(0, new Date(body.group.expiresAt).getTime() - Date.now()));
      setError('');
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not load the group buy.');
    }
  }, [groupId]);

  useEffect(() => {
    const timer = window.setTimeout(() => { void loadGroup(); }, 0);
    return () => window.clearTimeout(timer);
  }, [loadGroup]);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      try { setHasJoined(localStorage.getItem(`unisoko_group_buy_${groupId}_joined`) === 'true'); } catch { setHasJoined(false); }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [groupId]);
  useEffect(() => {
    const interval = window.setInterval(() => { void loadGroup(); }, 15000);
    return () => window.clearInterval(interval);
  }, [loadGroup]);
  useEffect(() => {
    const timer = window.setInterval(() => {
      setRemainingMs(group ? Math.max(0, new Date(group.expiresAt).getTime() - Date.now()) : 0);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [group]);

  const countdown = useMemo(() => {
    const seconds = Math.floor(remainingMs / 1000);
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
  }, [remainingMs]);

  const joinGroup = async () => {
    setIsJoining(true);
    setError('');
    try {
      const response = await fetch(`/api/group-buys/${encodeURIComponent(groupId)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ participantToken: getParticipantToken(), productId: selectedProductId }),
      });
      const body = await response.json() as { group?: GroupBuy; error?: string };
      if (!response.ok || !body.group) throw new Error(body.error || 'Could not join this group.');
      setGroup(body.group);
      setSelectedProductId((current) => current || body.group!.productId);
      setHasJoined(true);
      localStorage.setItem(`unisoko_group_buy_${groupId}_joined`, 'true');
      setNotice('You joined the group buy. Share it with another student to unlock the bulk rate.');
    } catch (joinError) {
      setError(joinError instanceof Error ? joinError.message : 'Could not join this group buy.');
    } finally {
      setIsJoining(false);
    }
  };

  const closeGroup = async () => {
    setIsClosing(true); setError('');
    try {
      const response = await fetch(`/api/group-buys/${encodeURIComponent(groupId)}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ participantToken: getParticipantToken(), action: 'close' }) });
      const body = await response.json() as { group?: GroupBuy; error?: string };
      if (!response.ok || !body.group) throw new Error(body.error || 'Could not close this group buy.');
      setGroup(body.group); setNotice('The group deal is closed. UniSoko can now coordinate the pooled order.');
    } catch (closeError) { setError(closeError instanceof Error ? closeError.message : 'Could not close this group buy.'); }
    finally { setIsClosing(false); }
  };

  const copyInvite = async () => {
    await navigator.clipboard.writeText(window.location.href);
    setNotice('Group-buy link copied. Share it with your classmates.');
  };

  const wholesaleUnlocked = Boolean(group && group.participantCount >= group.minimumQuantity);
  const participantsRemaining = group ? Math.max(0, group.minimumQuantity - group.participantCount) : 0;

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <Header />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-10 sm:px-6">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl shadow-indigo-950/5 sm:p-9">
          <span className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-800"><Users className="h-4 w-4" />Split wholesale group buy</span>
          <h1 className="mt-4 text-2xl font-black text-slate-950 dark:text-white sm:text-3xl">Bring your campus squad together.</h1>
          {group ? <>
            <p className="mt-3 text-lg font-bold text-slate-900 dark:text-white">Products selected by group members</p>
            <ul className="mt-2 space-y-2">{(group.products || []).map((item, index) => <li key={`${item.product_id}-${index}`} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"><span className="font-semibold text-slate-800 dark:text-slate-100">{item.product_title}</span><span className="shrink-0 text-xs font-bold text-emerald-800 dark:text-emerald-300">{formatTZS(item.wholesale_price)} bulk</span></li>)}</ul>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-slate-50 p-4"><p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Retail per unit</p><p className="mt-1 text-lg font-black text-slate-800">{formatTZS(group.retailPrice)}</p></div>
              <div className={`rounded-2xl p-4 ${wholesaleUnlocked ? 'bg-emerald-50' : 'bg-slate-50'}`}><p className="text-[10px] font-bold uppercase tracking-wide text-emerald-800">Bei ya Jumla per unit</p><p className="mt-1 text-lg font-black text-slate-900">{formatTZS(group.wholesalePrice)}</p></div>
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-slate-950 p-4 text-white">
              <div className="flex items-center gap-2"><Users className="h-5 w-5 text-indigo-300" /><div><p className="text-xl font-black">{group.participantCount} / {group.minimumQuantity} students</p><p className="text-xs text-slate-300">{participantsRemaining === 0 ? 'Wholesale threshold reached' : `${participantsRemaining} more to unlock wholesale`}</p></div></div>
              <div className="text-right"><p className="flex items-center justify-end gap-1 text-xs text-slate-300"><Clock3 className="h-3.5 w-3.5" />Time left</p><p className="font-mono text-lg font-black text-amber-300">{countdown}</p></div>
            </div>
            <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
              <span>Group status refreshes automatically every 15 seconds.</span>
              <button type="button" onClick={async () => { setIsRefreshing(true); await loadGroup(); setIsRefreshing(false); }} disabled={isRefreshing} className="inline-flex shrink-0 items-center gap-1.5 font-bold text-indigo-700 disabled:opacity-60 dark:text-indigo-300"><RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />{isRefreshing ? 'Refreshing' : 'Refresh'}</button>
            </div>
            <div className={`mt-4 rounded-2xl p-4 text-sm font-bold ${wholesaleUnlocked ? 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-100' : 'bg-indigo-50 text-indigo-900 dark:bg-indigo-950 dark:text-indigo-100'}`}>
              {group.status === 'closed' ? 'This group deal is closed. UniSoko can coordinate the pooled order.' : remainingMs <= 0 ? 'This 24-hour group buy has expired.' : wholesaleUnlocked ? 'Wholesale unlocked! Members can close the deal and ask UniSoko to coordinate hand-off.' : `Invite ${participantsRemaining} more student${participantsRemaining === 1 ? '' : 's'}. The group rate unlocks at ${group.minimumQuantity} participants.`}
            </div>
            {remainingMs > 0 && group.status === 'open' && !hasJoined && <div className="mt-5 space-y-3"><label className="block text-sm font-bold text-slate-800 dark:text-slate-100" htmlFor="group-product">Choose the product you want to buy</label><select id="group-product" value={selectedProductId} onChange={(event) => setSelectedProductId(event.target.value)} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm font-medium text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white">{MOCK_PRODUCTS.filter((item) => item.stockStatus !== 'Coming Soon').map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select><button disabled={isJoining || !selectedProductId} onClick={() => void joinGroup()} className="min-h-11 w-full rounded-xl bg-indigo-600 px-4 py-3.5 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-60">{isJoining ? 'Joining…' : 'Join this group buy'}</button></div>}
            {wholesaleUnlocked && group.status === 'open' && hasJoined && <button disabled={isClosing} onClick={() => void closeGroup()} className="mt-5 min-h-11 w-full rounded-xl bg-emerald-700 px-4 py-3.5 text-sm font-bold text-white hover:bg-emerald-800 disabled:opacity-60">{isClosing ? 'Closing deal…' : 'Close the group deal'}</button>}
            <button onClick={() => void copyInvite()} className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-300 px-4 py-3 text-sm font-bold text-slate-800 hover:bg-slate-50"><Share2 className="h-4 w-4" /><Copy className="h-4 w-4" />Copy invite link</button>
          </> : <p className="mt-4 text-sm text-slate-600">Loading group details…</p>}
          {notice && <p role="status" className="mt-4 text-center text-xs font-semibold text-emerald-700">{notice}</p>}
          {error && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-xs font-semibold text-red-800">{error}</p>}
          <p className="mt-5 text-[11px] leading-5 text-slate-500">The group-buy link expires after 24 hours. Pricing is confirmed by UniSoko when the pooled order is placed.</p>
        </section>
      </main>
      <CartDrawer />
    </div>
  );
}
