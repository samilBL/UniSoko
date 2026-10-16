'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import CartDrawer from '@/components/CartDrawer';
import { formatTZS, MOCK_PRODUCTS } from '@/lib/mockData';
import { useStore } from '@/context/StoreContext';
import {
  Clock3,
  Copy,
  Share2,
  Users,
  PlusCircle,
  ShoppingBag,
  Check,
  Search,
  Sparkles,
  ArrowRight,
  Store,
  AlertCircle,
  Tag,
} from 'lucide-react';
import type { Product } from '@/lib/types';
import { getGroupBuyUnitPrice } from '@/lib/pricing';

interface GroupBuyParticipant {
  id: string;
  productId: string;
  productTitle: string;
  retailPrice: number;
  groupBuyPrice: number;
  createdAt: string;
}

interface GroupBuy {
  id: string;
  productId: string;
  productTitle: string;
  retailPrice: number;
  groupBuyPrice: number;
  minimumQuantity: number;
  participantCount: number;
  createdAt: string;
  expiresAt: string;
  status: string;
  isExpired?: boolean;
  participants?: GroupBuyParticipant[];
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
  const router = useRouter();
  const groupId = params.id;
  const { products: storeProducts } = useStore();

  const [group, setGroup] = useState<GroupBuy | null>(null);
  const [remainingMs, setRemainingMs] = useState(0);
  const [isJoining, setIsJoining] = useState(false);
  const [hasJoined, setHasJoined] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  // Multi-store product selection state
  const [isProductPickerOpen, setIsProductPickerOpen] = useState(false);
  const [selectedProductForJoin, setSelectedProductForJoin] = useState<Product | null>(null);
  const [searchFilter, setSearchFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');

  // Combined product catalog
  const allAvailableProducts = useMemo(() => {
    const list = storeProducts && storeProducts.length > 0 ? storeProducts : MOCK_PRODUCTS;
    return list.filter((p) => p.stockStatus !== 'Coming Soon');
  }, [storeProducts]);

  const filteredCatalog = useMemo(() => {
    return allAvailableProducts.filter((product) => {
      const matchSearch =
        !searchFilter.trim() ||
        product.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
        product.category.toLowerCase().includes(searchFilter.toLowerCase());
      const matchCategory =
        categoryFilter === 'All' ||
        product.category === categoryFilter ||
        (categoryFilter === 'Laptops' && product.category.includes('Laptops')) ||
        (categoryFilter === 'Phones' && product.category.includes('Phones'));
      return matchSearch && matchCategory;
    });
  }, [allAvailableProducts, searchFilter, categoryFilter]);

  const loadGroup = useCallback(async () => {
    try {
      const response = await fetch(`/api/group-buys/${encodeURIComponent(groupId)}`, {
        cache: 'no-store',
      });
      const body = (await response.json()) as { group?: GroupBuy; error?: string };
      if (!response.ok || !body.group) throw new Error(body.error || 'This group buy is unavailable.');
      setGroup(body.group);
      setRemainingMs(Math.max(0, new Date(body.group.expiresAt).getTime() - Date.now()));
      setError('');
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not load the group buy.');
    }
  }, [groupId]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadGroup();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadGroup]);

  useEffect(() => {
    const expirationTimer = group
      ? window.setTimeout(
          () => setRemainingMs(0),
          Math.max(0, new Date(group.expiresAt).getTime() - Date.now())
        )
      : undefined;
    const countdownTimer = window.setInterval(() => {
      if (group) {
        const diff = Math.max(0, new Date(group.expiresAt).getTime() - Date.now());
        setRemainingMs(diff);
      }
    }, 1000);
    return () => {
      if (expirationTimer !== undefined) window.clearTimeout(expirationTimer);
      window.clearInterval(countdownTimer);
    };
  }, [group]);

  const isExpired = remainingMs <= 0 || group?.status === 'closed' || Boolean(group?.isExpired);

  const countdown = useMemo(() => {
    if (isExpired) return '00:00:00 (Expired)';
    const seconds = Math.floor(remainingMs / 1000);
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
  }, [remainingMs, isExpired]);

  const joinGroup = async () => {
    if (isExpired) return;
    setIsJoining(true);
    setError('');
    try {
      const chosenProduct = selectedProductForJoin;
      const response = await fetch(`/api/group-buys/${encodeURIComponent(groupId)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          participantToken: getParticipantToken(),
          productId: chosenProduct ? chosenProduct.id : undefined,
        }),
      });
      const body = (await response.json()) as { group?: GroupBuy; error?: string };
      if (!response.ok || !body.group) throw new Error(body.error || 'Could not join this group.');
      setGroup(body.group);
      setHasJoined(true);
      setNotice(
        chosenProduct
          ? `You joined the squad with "${chosenProduct.title}"! Invite classmates to unlock bulk rates.`
          : 'You joined the group buy. Share it with another student to unlock the bulk rate.'
      );
    } catch (joinError) {
      setError(joinError instanceof Error ? joinError.message : 'Could not join this group buy.');
    } finally {
      setIsJoining(false);
    }
  };

  const copyInvite = async () => {
    if (isExpired) return;
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setNotice('Group-buy link copied! Share it on WhatsApp or your class group.');
    setTimeout(() => setCopied(false), 3000);
  };

  const groupBuyUnlocked = Boolean(group && group.participantCount >= group.minimumQuantity);
  const participantsRemaining = group ? Math.max(0, group.minimumQuantity - group.participantCount) : 0;

  // Active product to display (either user-selected or group default)
  const displayProduct = selectedProductForJoin || {
    id: group?.productId || '',
    title: group?.productTitle || '',
    priceRetail: group?.retailPrice || 0,
  };
  const displayGroupBuyPrice = getGroupBuyUnitPrice(displayProduct.priceRetail);

  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-slate-100">
      <Header />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6">
        <section className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl shadow-indigo-950/20 sm:p-9">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="inline-flex items-center gap-2 rounded-full bg-indigo-500/10 px-3.5 py-1.5 text-xs font-bold text-indigo-400 border border-indigo-500/20">
              <Users className="h-4 w-4" /> Multi-Store Campus Group Buy
            </span>
            {isExpired ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/10 px-3 py-1 text-xs font-bold text-red-400 border border-red-500/20">
                <Clock3 className="h-3.5 w-3.5" /> Session Expired
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-400 border border-emerald-500/20">
                <Sparkles className="h-3.5 w-3.5" /> Active 24h Session
              </span>
            )}
          </div>

          <h1 className="mt-4 text-2xl font-black text-white sm:text-3xl">
            Bring your campus squad together.
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-slate-400">
            Pool orders with students across your campus. Each squad member can pick products from{' '}
            <strong className="text-white">any store</strong> across UniSoko!
          </p>

          {group ? (
            <>
              {/* Selected Item Card */}
              <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950/70 p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800/80">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-400">
                      {selectedProductForJoin ? 'Your Chosen Item' : "Host's Featured Item"}
                    </span>
                    <h2 className="mt-1 text-base sm:text-lg font-bold text-white">
                      {displayProduct.title}
                    </h2>
                  </div>

                  {!isExpired && (
                    <button
                      type="button"
                      onClick={() => setIsProductPickerOpen(true)}
                      className="inline-flex items-center gap-2 rounded-xl border border-indigo-500/30 bg-indigo-600/10 px-3.5 py-2 text-xs font-bold text-indigo-300 hover:bg-indigo-600/20 transition-all"
                    >
                      <Store className="h-4 w-4 text-indigo-400" />
                      <span>{selectedProductForJoin ? 'Change Product' : 'Pick from Any Store'}</span>
                    </button>
                  )}
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-slate-900 p-3.5 border border-slate-800">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                      Retail per unit
                    </p>
                    <p className="mt-1 text-base sm:text-lg font-black text-slate-200">
                      {formatTZS(displayProduct.priceRetail)}
                    </p>
                  </div>
                  <div
                    className={`rounded-xl p-3.5 border ${
                      groupBuyUnlocked
                        ? 'bg-emerald-950/40 border-emerald-500/40'
                        : 'bg-indigo-950/30 border-indigo-500/30'
                    }`}
                  >
                    <p className="text-[10px] font-bold uppercase tracking-wide text-emerald-400">
                      Group Buy price per unit
                    </p>
                    <p className="mt-1 text-base sm:text-lg font-black text-emerald-300">
                      {formatTZS(displayGroupBuyPrice)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Progress & Countdown Counter */}
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-black p-4 text-white border border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600/20 text-indigo-400">
                    <Users className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-lg sm:text-xl font-black">
                      {group.participantCount} / {group.minimumQuantity} students
                    </p>
                    <p className="text-xs text-slate-400">
                      {participantsRemaining === 0
                        ? '🎉 Group Buy discount unlocked!'
                        : `${participantsRemaining} more student${participantsRemaining === 1 ? '' : 's'} needed for discount`}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="flex items-center justify-end gap-1 text-xs text-slate-400">
                    <Clock3 className="h-3.5 w-3.5" /> Time left
                  </p>
                  <p
                    className={`font-mono text-base sm:text-lg font-black ${
                      isExpired ? 'text-red-400' : 'text-amber-400'
                    }`}
                  >
                    {countdown}
                  </p>
                </div>
              </div>

              {/* Status Message */}
              <div
                className={`mt-4 rounded-2xl p-4 text-xs sm:text-sm font-semibold border ${
                  isExpired
                    ? 'bg-red-950/30 border-red-900/50 text-red-300'
                    : groupBuyUnlocked
                    ? 'bg-emerald-950/40 border-emerald-900/60 text-emerald-300'
                    : 'bg-indigo-950/30 border-indigo-900/50 text-indigo-200'
                }`}
              >
                {isExpired
                  ? '⚠️ This 24-hour group buy session has expired. Invite links are now closed.'
                  : groupBuyUnlocked
                  ? '✨ Group Buy discount unlocked! You and your classmates save on your selected products. UniSoko operations will coordinate your shared campus delivery.'
                  : `Invite ${participantsRemaining} more student${
                      participantsRemaining === 1 ? '' : 's'
                    }. The group rate unlocks at ${group.minimumQuantity} participants.`}
              </div>

              {/* Participants & Multi-Store Items List */}
              {group.participants && group.participants.length > 0 && (
                <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
                  <p className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <ShoppingBag className="h-3.5 w-3.5 text-indigo-400" />
                    <span>Squad Members &amp; Items Selected ({group.participants.length})</span>
                  </p>
                  <div className="divide-y divide-slate-800/60">
                    {group.participants.map((participant, index) => (
                      <div
                        key={participant.id || index}
                        className="py-2.5 flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-600/20 text-[10px] font-extrabold text-indigo-300">
                            #{index + 1}
                          </span>
                          <div className="truncate">
                            <p className="font-semibold text-white truncate">
                              {participant.productTitle}
                            </p>
                            <span className="text-[10px] text-slate-400">
                              {index === 0 ? 'Squad Host' : 'Classmate'}
                            </span>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="font-bold text-emerald-400">
                            {formatTZS(participant.groupBuyPrice)}
                          </p>
                          <p className="text-[10px] text-slate-500 line-through">
                            {formatTZS(participant.retailPrice)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="mt-6 space-y-3">
                {/* Join Button (Only if active and not already joined) */}
                {!isExpired && !hasJoined && (
                  <button
                    disabled={isJoining}
                    onClick={() => void joinGroup()}
                    className="min-h-12 w-full rounded-xl bg-indigo-600 px-4 py-3.5 text-sm font-bold text-white hover:bg-indigo-500 disabled:opacity-50 transition-all shadow-lg shadow-indigo-600/20"
                  >
                    {isJoining
                      ? 'Joining Group Buy…'
                      : selectedProductForJoin
                      ? `Join Squad with ${selectedProductForJoin.title.slice(0, 30)}…`
                      : 'Join this group buy'}
                  </button>
                )}

                {/* Expiration-Driven Action Buttons */}
                {isExpired ? (
                  // Prominent "Create New Group Buy" button shown in place of Copy Link
                  <div className="space-y-3 pt-2">
                    <Link
                      href="/#products-section"
                      className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-500 transition-all"
                    >
                      <PlusCircle className="h-5 w-5" />
                      <span>Create New Group Buy</span>
                    </Link>
                    <p className="text-center text-xs text-slate-400">
                      Start a new 24-hour pool on any device or product to unlock the group-buy rate with your friends.
                    </p>
                  </div>
                ) : (
                  // Active: Copy Invite Link button
                  <button
                    onClick={() => void copyInvite()}
                    className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-sm font-bold text-white hover:bg-slate-700 transition-all"
                  >
                    {copied ? (
                      <>
                        <Check className="h-4 w-4 text-emerald-400" />
                        <span className="text-emerald-400">Link Copied!</span>
                      </>
                    ) : (
                      <>
                        <Share2 className="h-4 w-4 text-indigo-400" />
                        <Copy className="h-4 w-4 text-slate-400" />
                        <span>Copy Invite Link</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </>
          ) : (
            <div className="py-12 text-center text-sm text-slate-400">
              <Clock3 className="mx-auto h-6 w-6 animate-spin text-indigo-500" />
              <p className="mt-2">Loading group details…</p>
            </div>
          )}

          {notice && (
            <p
              role="status"
              className="mt-4 rounded-xl bg-emerald-950/40 border border-emerald-800 p-3 text-center text-xs font-semibold text-emerald-300"
            >
              {notice}
            </p>
          )}

          {error && (
            <p
              role="alert"
              className="mt-4 rounded-xl bg-red-950/40 border border-red-900 p-3 text-xs font-semibold text-red-300 flex items-center gap-2"
            >
              <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
              <span>{error}</span>
            </p>
          )}

          <div className="mt-6 border-t border-slate-800/80 pt-4 text-xs text-slate-400 leading-relaxed space-y-1">
            <p className="font-semibold text-slate-300">How Multi-Store Group Buys Work:</p>
            <p>1. The link expires 24 hours from creation.</p>
            <p>2. Each joining classmate can pick any approved product across the platform.</p>
            <p>3. Once the minimum threshold is met, group-buy rates unlock for all participants.</p>
          </div>
        </section>

        {/* Multi-Store Product Picker Modal */}
        {isProductPickerOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
            <div className="relative w-full max-w-2xl max-h-[85vh] flex flex-col rounded-3xl border border-slate-800 bg-slate-900 shadow-2xl text-white overflow-hidden">
              <div className="p-5 border-b border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Store className="h-4 w-4 text-indigo-400" />
                    <span>Select Any Product From Any Store</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Choose what you want to order as part of this campus group buy.
                  </p>
                </div>
                <button
                  onClick={() => setIsProductPickerOpen(false)}
                  className="rounded-full p-1.5 text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  ✕
                </button>
              </div>

              {/* Filters */}
              <div className="p-4 bg-slate-950/60 border-b border-slate-800 space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="search"
                    placeholder="Search by title, brand, category..."
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 py-2 pl-9 pr-3 text-xs text-white placeholder-slate-400 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div className="flex gap-2 overflow-x-auto no-scrollbar text-xs">
                  {['All', 'Laptops', 'Phones', 'Accessories', 'Room Gear', 'Power & Audio'].map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategoryFilter(cat)}
                      className={`px-3 py-1.5 rounded-full font-semibold shrink-0 text-xs transition-colors ${
                        categoryFilter === cat
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Product List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-2.5 max-h-96">
                {filteredCatalog.map((product) => {
                  const isSelected = selectedProductForJoin?.id === product.id;
                  return (
                    <div
                      key={product.id}
                      onClick={() => {
                        setSelectedProductForJoin(product);
                        setIsProductPickerOpen(false);
                        setNotice(`Selected "${product.title}". Click "Join" to submit.`);
                      }}
                      className={`cursor-pointer rounded-2xl border p-3.5 transition-all flex items-center justify-between gap-3 ${
                        isSelected
                          ? 'border-indigo-500 bg-indigo-950/30'
                          : 'border-slate-800 bg-slate-950/40 hover:border-slate-700 hover:bg-slate-800/60'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">
                          {product.category}
                        </span>
                        <h4 className="text-xs sm:text-sm font-bold text-white truncate">
                          {product.title}
                        </h4>
                        <div className="mt-1 flex items-center gap-2 text-xs">
                          <span className="font-extrabold text-emerald-400">
                            Group Buy: {formatTZS(getGroupBuyUnitPrice(product.priceRetail))}
                          </span>
                          <span className="text-[11px] text-slate-500 line-through">
                            {formatTZS(product.priceRetail)}
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        className="shrink-0 rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-indigo-500"
                      >
                        Select
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </main>
      <CartDrawer />
    </div>
  );
}
