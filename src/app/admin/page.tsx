'use client';

import React, { useState, useMemo } from 'react';
import Header from '@/components/Header';
import CartDrawer from '@/components/CartDrawer';
import { useStore } from '@/context/StoreContext';
import { formatTZS } from '@/lib/mockData';
import {
  Product,
  ProductCategory,
  ProductCondition,
  StockStatus,
  Order,
  TradeInRequest,
  TradeInStatus,
  StoreSettings,
} from '@/lib/types';
import {
  Package,
  ShoppingBag,
  Wallet,
  CheckCircle2,
  Truck,
  Plus,
  Edit2,
  Search,
  Check,
  X,
  ShieldCheck,
  CreditCard,
  Phone,
  MapPin,
  Settings,
  Repeat,
  MessageCircle,
  Save,
  Building,
  Eye,
} from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { getLegacyOrderStatus, getNextOrderAction } from '@/lib/orderTracking';

export default function AdminPanelPage() {
  const router = useRouter();
  const {
    orders,
    approveOrder,
    updateOrderStatus,
    updateOrderReceipt,
    products,
    addProduct,
    updateProduct,
    payoutRequests,
    markPayoutPaid,
    wingaAgents,
    verifyKycStudentId,
    tradeInRequests,
    updateTradeInStatus,
    storeSettings,
    updateStoreSettings,
  } = useStore();

  const [activeTab, setActiveTab] = useState<'orders' | 'inventory' | 'trade-ins' | 'payouts' | 'settings'>('orders');

  // Orders Tab Filter & Search
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('All');

  // Inventory Tab Edit/Add Modal
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [prodFormTitle, setProdFormTitle] = useState('');
  const [prodFormCategory, setProdFormCategory] = useState<ProductCategory>('Laptops');
  const [prodFormRetail, setProdFormRetail] = useState<number>(650000);
  const [prodFormWholesale, setProdFormWholesale] = useState<number>(580000);
  const [prodFormCondition, setProdFormCondition] = useState<ProductCondition>('Grade A Like-New');
  const [prodFormStockStatus, setProdFormStockStatus] = useState<StockStatus>('In Stock');
  const [prodFormDesc, setProdFormDesc] = useState('');
  const [prodFormImage, setProdFormImage] = useState('https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=800&q=80');

  // Trade-In state
  const [tradeInSearch, setTradeInSearch] = useState('');
  const [tradeInFilter, setTradeInFilter] = useState<string>('All');
  const [activeTradeInModal, setActiveTradeInModal] = useState<TradeInRequest | null>(null);
  const [offerPriceInput, setOfferPriceInput] = useState<number>(0);
  const [adminNotesInput, setAdminNotesInput] = useState<string>('');

  // Settings form state
  const [settingsForm, setSettingsForm] = useState<StoreSettings>(storeSettings);
  const [settingsSavedToast, setSettingsSavedToast] = useState(false);
  const [settingsSaveWarning, setSettingsSaveWarning] = useState('');
  const [campusVotes, setCampusVotes] = useState<Record<string, number>>({});
  const [remoteTradeIns, setRemoteTradeIns] = useState<TradeInRequest[]>([]);
  const [remoteOrders, setRemoteOrders] = useState<Order[]>([]);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [orderUpdateError, setOrderUpdateError] = useState('');

  // Sync settings form when storeSettings updates
  React.useEffect(() => {
    const syncTimer = window.setTimeout(() => setSettingsForm(storeSettings), 0);
    return () => window.clearTimeout(syncTimer);
  }, [storeSettings]);

  React.useEffect(() => {
    const syncTimer = window.setTimeout(() => {
      try {
        setCampusVotes(JSON.parse(localStorage.getItem('unisoko_campus_votes') || '{}') as Record<string, number>);
      } catch {
        setCampusVotes({});
      }
    }, 0);
    return () => window.clearTimeout(syncTimer);
  }, []);

  React.useEffect(() => {
    fetch('/api/admin/campus-votes', { cache: 'no-store' })
      .then(async (response) => response.ok ? response.json() as Promise<{ votes?: Record<string, number> }> : null)
      .then((result) => { if (result?.votes) setCampusVotes(result.votes); })
      .catch(() => undefined);
  }, []);

  React.useEffect(() => {
    fetch('/api/admin/trade-ins', { cache: 'no-store' })
      .then(async (response) => response.ok ? response.json() as Promise<{ requests?: TradeInRequest[] }> : null)
      .then((result) => { if (result?.requests) setRemoteTradeIns(result.requests); })
      .catch(() => undefined);
  }, []);

  React.useEffect(() => {
    fetch('/api/admin/orders', { cache: 'no-store' })
      .then(async (response) => response.ok ? response.json() as Promise<{ orders?: Order[]; configured?: boolean }> : null)
      .then((result) => { if (result?.configured && result.orders) setRemoteOrders(result.orders); })
      .catch(() => undefined);
  }, []);

  const allOrders = useMemo(() => [...remoteOrders, ...orders.filter((order) => !remoteOrders.some((remote) => remote.id === order.id))], [remoteOrders, orders]);

  const allTradeInRequests = useMemo(() => [...remoteTradeIns, ...tradeInRequests.filter((request) => !remoteTradeIns.some((remote) => remote.id === request.id))], [remoteTradeIns, tradeInRequests]);

  // Filtered Orders
  const filteredOrders = useMemo(() => {
    return allOrders.filter((ord) => {
      if (orderStatusFilter !== 'All' && ord.status !== orderStatusFilter) return false;
      if (orderSearch.trim()) {
        const q = orderSearch.toLowerCase();
        const matchesBuyer = ord.buyerName.toLowerCase().includes(q);
        const matchesTx = ord.lipaNambaTxId.toLowerCase().includes(q);
        const matchesUni = ord.university.toLowerCase().includes(q);
        const matchesId = ord.id.toLowerCase().includes(q);
        if (!matchesBuyer && !matchesTx && !matchesUni && !matchesId) return false;
      }
      return true;
    });
  }, [allOrders, orderStatusFilter, orderSearch]);

  const handlePersistedOrderTransition = async (order: Order) => {
    const next = getNextOrderAction(order);
    if (!next) return;
    setUpdatingOrderId(order.id);
    setOrderUpdateError('');
    try {
      const response = await fetch('/api/admin/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: order.id, statusType: next.type, status: next.status }),
      });
      const result = await response.json() as { order?: Order; error?: string };
      if (!response.ok || !result.order) throw new Error(result.error || 'Could not update this order.');
      setRemoteOrders((previous) => previous.map((existing) => existing.id === order.id ? result.order! : existing));
    } catch (error) {
      setOrderUpdateError(error instanceof Error ? error.message : 'Could not update this order.');
    } finally {
      setUpdatingOrderId(null);
    }
  };

  // Filtered Trade-Ins
  const filteredTradeIns = useMemo(() => {
    return allTradeInRequests.filter((req) => {
      if (tradeInFilter !== 'All' && req.status !== tradeInFilter) return false;
      if (tradeInSearch.trim()) {
        const q = tradeInSearch.toLowerCase();
        const matchesName = req.studentName.toLowerCase().includes(q);
        const matchesItem = req.itemTitle.toLowerCase().includes(q);
        const matchesPhone = req.phone.toLowerCase().includes(q);
        const matchesUni = req.university.toLowerCase().includes(q);
        if (!matchesName && !matchesItem && !matchesPhone && !matchesUni) return false;
      }
      return true;
    });
  }, [allTradeInRequests, tradeInFilter, tradeInSearch]);

  // Handle Edit Product Setup
  const openEditModal = (prod: Product) => {
    setEditingProduct(prod);
    setProdFormTitle(prod.title);
    setProdFormCategory(prod.category);
    setProdFormRetail(prod.priceRetail);
    setProdFormWholesale(prod.priceWholesale);
    setProdFormCondition(prod.condition);
    setProdFormStockStatus(prod.stockStatus);
    setProdFormDesc(prod.description);
    setProdFormImage(prod.images[0] || '');
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingProduct) {
      const updated: Product = {
        ...editingProduct,
        title: prodFormTitle,
        category: prodFormCategory,
        priceRetail: Number(prodFormRetail),
        priceWholesale: Number(prodFormWholesale),
        condition: prodFormCondition,
        stockStatus: prodFormStockStatus,
        description: prodFormDesc,
        images: [prodFormImage || editingProduct.images[0]],
      };
      updateProduct(updated);
      setEditingProduct(null);
    } else {
      const newProd: Product = {
        id: `prod-${Date.now()}`,
        title: prodFormTitle,
        category: prodFormCategory,
        priceRetail: Number(prodFormRetail),
        priceWholesale: Number(prodFormWholesale),
        condition: prodFormCondition,
        stockStatus: prodFormStockStatus,
        description: prodFormDesc,
        minWholesaleQty: 3,
        images: [prodFormImage || 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=800&q=80'],
      };
      addProduct(newProd);
      setIsAddProductOpen(false);
    }
  };

  const handleOpenTradeInDetail = (req: TradeInRequest) => {
    setActiveTradeInModal(req);
    setOfferPriceInput(req.offeredPrice || req.expectedPrice);
    setAdminNotesInput(req.adminNotes || '');
  };

  const handleUpdateTradeIn = (newStatus: TradeInStatus) => {
    if (!activeTradeInModal) return;
    if (remoteTradeIns.some((request) => request.id === activeTradeInModal.id)) {
      void fetch('/api/admin/trade-ins', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: activeTradeInModal.id, status: newStatus, adminNotes: adminNotesInput, offeredPrice: offerPriceInput }),
      }).then((response) => {
        if (!response.ok) throw new Error('Unable to save trade-in decision.');
        setRemoteTradeIns((requests) => requests.map((request) => request.id === activeTradeInModal.id ? { ...request, status: newStatus, adminNotes: adminNotesInput, offeredPrice: offerPriceInput } : request));
      }).catch(() => window.alert('Could not save this decision to the trade-in database.'));
    }
    updateTradeInStatus(
      activeTradeInModal.id,
      newStatus,
      adminNotesInput,
      offerPriceInput
    );
    setActiveTradeInModal(null);
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    const primaryMethod = settingsForm.paymentMethods?.find((method) => method.enabled && method.tillNumber.trim());
    const updatedSettings = {
      ...settingsForm,
      tillNumber: primaryMethod?.tillNumber || settingsForm.tillNumber,
      accountName: primaryMethod?.accountName || settingsForm.accountName,
      supportWhatsApp: (settingsForm.officialWhatsAppNumbers?.[0] || settingsForm.supportWhatsApp).trim(),
    };
    updateStoreSettings(updatedSettings);
    setSettingsSaveWarning('');
    try {
      const response = await fetch('/api/admin/store-settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedSettings),
      });
      if (response.status === 503) setSettingsSaveWarning('Saved in this browser only: configure Supabase for durable shared settings.');
      else if (!response.ok) setSettingsSaveWarning('Changes are active in this browser, but cloud save failed. Please retry.');
    } catch {
      setSettingsSaveWarning('Changes are active in this browser, but cloud save was unavailable. Please retry.');
    }
    setSettingsSavedToast(true);
    setTimeout(() => setSettingsSavedToast(false), 3500);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      <Header />

      <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Admin Header Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-3xl bg-slate-900 p-6 sm:p-8 text-white shadow-xl">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-bold text-emerald-400 border border-emerald-500/30">
                Staff Control
              </span>
              <span className="text-xs text-slate-400">UniSoko Central Admin</span>
            </div>
            <h1 className="mt-2 text-2xl sm:text-3xl font-black text-white font-heading">
              Campus Operations & Store Management
            </h1>
            <p className="text-xs text-slate-300 mt-1">
              Verify Lipa Namba payments, inspect trade-ins, disburse Winga commissions, and configure live store settings.
            </p>
          </div>

          {/* Quick Stats Pills */}
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <div className="rounded-2xl bg-white/10 px-4 py-2.5 backdrop-blur-md border border-white/10">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Pending Orders</span>
              <span className="text-base font-black text-amber-400">
                {orders.filter((o) => o.status === 'Pending Verification').length}
              </span>
            </div>
            <div className="rounded-2xl bg-white/10 px-4 py-2.5 backdrop-blur-md border border-white/10">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Trade-In Queue</span>
              <span className="text-base font-black text-indigo-400">
                {allTradeInRequests.filter((t) => t.status === 'Pending Review' || t.status === 'Inspecting').length}
              </span>
            </div>
            <div className="rounded-2xl bg-white/10 px-4 py-2.5 backdrop-blur-md border border-white/10">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Pending Payouts</span>
              <span className="text-base font-black text-emerald-400">
                {payoutRequests.filter((p) => p.status === 'Pending').length}
              </span>
            </div>
            <button onClick={() => { void fetch('/api/admin/logout', { method: 'POST' }).finally(() => router.replace('/admin/login')); }} className="rounded-xl border border-white/20 px-3 py-2.5 font-bold text-white transition hover:bg-white/10">Sign out</button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('orders')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold whitespace-nowrap transition-all ${
              activeTab === 'orders'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <ShoppingBag className="h-4 w-4" />
            <span>Orders & Verification ({orders.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('trade-ins')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold whitespace-nowrap transition-all ${
              activeTab === 'trade-ins'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Repeat className="h-4 w-4" />
            <span>Trade-In Requests ({allTradeInRequests.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('inventory')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold whitespace-nowrap transition-all ${
              activeTab === 'inventory'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Package className="h-4 w-4" />
            <span>Catalog & Pricing ({products.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('payouts')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold whitespace-nowrap transition-all ${
              activeTab === 'payouts'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Wallet className="h-4 w-4" />
            <span>Winga KYC & Payouts ({payoutRequests.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold whitespace-nowrap transition-all ${
              activeTab === 'settings'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Settings className="h-4 w-4" />
            <span>Store Settings</span>
          </button>
        </div>

        {/* 1. ORDERS TAB */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            {orderUpdateError && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold text-red-800">{orderUpdateError}</p>}

            {/* Search & Filter Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by student name, transaction ID, or campus..."
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-9 pr-4 text-xs text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-600 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
                {['All', 'Pending Verification', 'Approved', 'Out for Delivery', 'Completed'].map((status) => (
                  <button
                    key={status}
                    onClick={() => setOrderStatusFilter(status)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-all ${
                      orderStatusFilter === status
                        ? 'bg-slate-900 text-white'
                        : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>

            {/* Orders Table */}
            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-100 bg-slate-50/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <tr>
                      <th className="p-4">Order ID & Date</th>
                      <th className="p-4">Customer & Campus</th>
                      <th className="p-4">Delivery Spot</th>
                      <th className="p-4">Lipa Namba Tx ID</th>
                      <th className="p-4">Winga Attribution</th>
                      <th className="p-4">Amount</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {filteredOrders.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="p-8 text-center text-slate-400">
                          No orders found matching the filter.
                        </td>
                      </tr>
                    ) : (
                      filteredOrders.map((ord) => {
                        const isPending = ord.status === 'Pending Verification';
                        const commission = Math.round(ord.totalAmount * 0.05);
                        const isPersistedOrder = remoteOrders.some((remote) => remote.id === ord.id);
                        const nextOrderAction = isPersistedOrder ? getNextOrderAction(ord) : null;
                        const nextOrderActionLabel = nextOrderAction?.status === 'Verification' ? 'Start Payment Verification'
                          : nextOrderAction?.status === 'Verified' ? 'Verify Payment'
                            : nextOrderAction?.status === 'Preparing' ? 'Start Preparing'
                              : nextOrderAction?.status === 'Ready for Dispatch' ? 'Ready for Dispatch'
                                : nextOrderAction?.status === 'With Winga' ? 'Dispatch to Winga'
                                  : nextOrderAction?.status === 'With Courier' ? 'Dispatch to Courier'
                                    : nextOrderAction?.status === 'Ready for Pickup' ? 'Ready for Pickup'
                                      : nextOrderAction?.status === 'Delivered' ? 'Mark Delivered' : '';

                        return (
                          <tr key={ord.id} className="hover:bg-slate-50/60 transition-colors">
                            {/* Order ID & Date */}
                            <td className="p-4">
                              <span className="font-mono font-bold text-slate-900">
                                {ord.id}
                              </span>
                              <span className="text-[10px] text-slate-400 block mt-0.5">
                                {new Date(ord.createdAt).toLocaleDateString('en-GB', {
                                  day: '2-digit',
                                  month: 'short',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </td>

                            {/* Customer & Campus */}
                            <td className="p-4">
                              <span className="font-bold text-slate-900 block">
                                {ord.buyerName}
                              </span>
                              <span className="text-[11px] text-slate-500">{ord.buyerPhone}</span>
                              <span className="text-[10px] text-indigo-600 block font-semibold">
                                {ord.university}
                              </span>
                            </td>

                            {/* Delivery Spot */}
                            <td className="p-4 max-w-45">
                              <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-700">
                                <MapPin className="h-2.5 w-2.5 text-indigo-500" />
                                {ord.deliverySpotType}
                              </span>
                              <p className="text-[11px] text-slate-600 mt-1 truncate">
                                {ord.deliveryDetails}
                              </p>
                            </td>

                            {/* Submitted Lipa Namba Tx ID */}
                            <td className="p-4">
                              <span className="rounded-md bg-amber-50 px-2 py-1 font-mono font-bold text-amber-900 border border-amber-200">
                                {ord.lipaNambaTxId}
                              </span>
                            </td>

                            {/* Winga Attribution */}
                            <td className="p-4">
                              {ord.wingaCodeUsed ? (
                                <div>
                                  <span className="font-mono font-bold text-indigo-600">
                                    {ord.wingaCodeUsed}
                                  </span>
                                  <span className="text-[10px] text-emerald-600 block font-semibold">
                                    +{formatTZS(commission)} cut
                                  </span>
                                </div>
                              ) : (
                                <span className="text-slate-400 text-[11px]">Direct / Organic</span>
                              )}
                            </td>

                            {/* Amount */}
                            <td className="p-4 font-black text-slate-900">
                              {formatTZS(ord.totalAmount)}
                            </td>

                            {/* Status */}
                            <td className="p-4">
                              <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                                getLegacyOrderStatus(ord) === 'Approved'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : getLegacyOrderStatus(ord) === 'Out for Delivery'
                                  ? 'bg-indigo-100 text-indigo-800'
                                  : getLegacyOrderStatus(ord) === 'Completed'
                                  ? 'bg-slate-100 text-slate-800'
                                  : 'bg-amber-100 text-amber-800 animate-pulse'
                              }`}>
                                {ord.paymentStatus ? `${ord.paymentStatus} · ${ord.fulfillmentStatus} · ${ord.deliveryStatus}` : ord.status}
                              </span>
                            </td>

                            {/* Actions */}
                            <td className="p-4 text-right space-x-1.5">
                              {isPersistedOrder ? nextOrderAction ? (
                                <button
                                  onClick={() => void handlePersistedOrderTransition(ord)}
                                  disabled={updatingOrderId === ord.id}
                                  className="inline-flex items-center gap-1 rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                  {nextOrderAction.type === 'payment' ? <Check className="h-3.5 w-3.5" /> : <Truck className="h-3.5 w-3.5" />}
                                  <span>{updatingOrderId === ord.id ? 'Updating…' : nextOrderActionLabel}</span>
                                </button>
                              ) : (
                                <span className="text-slate-400 text-xs font-semibold">Done</span>
                              ) : isPending ? (
                                <button
                                  onClick={() => {
                                    approveOrder(ord.id);
                                    updateOrderReceipt(ord.id, ord.itemSerialNumber || '', ord.warrantyDays || 90);
                                    router.push(`/order/${encodeURIComponent(ord.id)}/receipt`);
                                  }}
                                  className="inline-flex items-center gap-1 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 active:scale-95 transition-all"
                                  title="Approve Order and Credit Winga Commission"
                                >
                                  <Check className="h-3.5 w-3.5" />
                                  <span>Approve Order</span>
                                </button>
                              ) : ord.status === 'Approved' ? (
                                <button
                                  onClick={() => updateOrderStatus(ord.id, 'Out for Delivery')}
                                  className="inline-flex items-center gap-1 rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-indigo-700 transition-all"
                                >
                                  <Truck className="h-3.5 w-3.5" />
                                  <span>Dispatch Runner</span>
                                </button>
                              ) : ord.status === 'Out for Delivery' ? (
                                <button
                                  onClick={() => updateOrderStatus(ord.id, 'Completed')}
                                  className="inline-flex items-center gap-1 rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-bold text-white hover:bg-slate-800 transition-all"
                                >
                                  <CheckCircle2 className="h-3.5 w-3.5" />
                                  <span>Mark Delivered</span>
                                </button>
                              ) : (
                                <span className="text-slate-400 text-xs font-semibold">Done</span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 2. TRADE-IN REQUESTS TAB */}
        {activeTab === 'trade-ins' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by student, gadget name, or campus..."
                  value={tradeInSearch}
                  onChange={(e) => setTradeInSearch(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-9 pr-4 text-xs text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-600 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
                {['All', 'Pending Review', 'Inspecting', 'Offer Made', 'Accepted', 'Rejected'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setTradeInFilter(st)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-all ${
                      tradeInFilter === st
                        ? 'bg-slate-900 text-white'
                        : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* Trade In Table */}
            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-100 bg-slate-50/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <tr>
                      <th className="p-4">Ref & Date</th>
                      <th className="p-4">Student & Campus</th>
                      <th className="p-4">Gadget & Specs</th>
                      <th className="p-4">Condition</th>
                      <th className="p-4">Expected Price</th>
                      <th className="p-4">UniSoko Offer</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Review & Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {filteredTradeIns.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="p-8 text-center text-slate-400">
                          No trade-in submissions found matching the filter.
                        </td>
                      </tr>
                    ) : (
                      filteredTradeIns.map((req) => {
                        return (
                          <tr key={req.id} className="hover:bg-slate-50/60 transition-colors">
                            <td className="p-4">
                              <span className="font-mono font-bold text-slate-900 block">{req.id}</span>
                              <span className="text-[10px] text-slate-400">
                                {new Date(req.submittedAt).toLocaleDateString('en-GB')}
                              </span>
                            </td>

                            <td className="p-4">
                              <span className="font-bold text-slate-900 block">{req.studentName}</span>
                              <a
                                href={`https://wa.me/${req.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Habari ${req.studentName}, tumepokea maombi yako ya kuuza kifaa UniSoko (${req.itemTitle}).`)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-[11px] text-emerald-600 font-semibold hover:underline"
                              >
                                <MessageCircle className="h-3 w-3" />
                                {req.phone}
                              </a>
                              <span className="text-[10px] text-indigo-600 block">{req.university}</span>
                            </td>

                            <td className="p-4 max-w-50">
                              <span className="font-bold text-slate-900 block truncate">{req.itemTitle}</span>
                              <span className="text-[11px] text-slate-500 line-clamp-1">{req.specs}</span>
                            </td>

                            <td className="p-4">
                              <span className="inline-block rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700">
                                {req.condition}
                              </span>
                            </td>

                            <td className="p-4 font-bold text-slate-900">
                              {formatTZS(req.expectedPrice)}
                            </td>

                            <td className="p-4">
                              {req.offeredPrice ? (
                                <span className="font-black text-emerald-600 text-sm">
                                  {formatTZS(req.offeredPrice)}
                                </span>
                              ) : (
                                <span className="text-slate-400 text-xs italic">Awaiting appraisal</span>
                              )}
                            </td>

                            <td className="p-4">
                              <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                                req.status === 'Accepted'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : req.status === 'Offer Made'
                                  ? 'bg-indigo-100 text-indigo-800'
                                  : req.status === 'Inspecting'
                                  ? 'bg-sky-100 text-sky-800'
                                  : req.status === 'Rejected'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-amber-100 text-amber-800 animate-pulse'
                              }`}>
                                {req.status}
                              </span>
                            </td>

                            <td className="p-4 text-right">
                              <button
                                onClick={() => handleOpenTradeInDetail(req)}
                                className="inline-flex items-center gap-1 rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-bold text-white hover:bg-indigo-600 transition-all shadow-xs"
                              >
                                <Eye className="h-3.5 w-3.5" />
                                <span>Inspect & Offer</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 3. INVENTORY TAB */}
        {activeTab === 'inventory' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 font-heading">
                  Gadget Catalog & Wholesale Price Matrix
                </h3>
                <p className="text-xs text-slate-500">
                  Manage Retail prices, Bei ya Jumla tiers (min 3 units), and stock statuses across all categories.
                </p>
              </div>

              <button
                onClick={() => {
                  setEditingProduct(null);
                  setProdFormTitle('');
                  setProdFormCategory('Laptops');
                  setProdFormRetail(650000);
                  setProdFormWholesale(580000);
                  setProdFormCondition('Grade A Like-New');
                  setProdFormStockStatus('In Stock');
                  setProdFormDesc('');
                  setIsAddProductOpen(true);
                }}
                className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-700 active:scale-95 transition-all"
              >
                <Plus className="h-4 w-4" />
                <span>Add New Product</span>
              </button>
            </div>

            {/* Product Grid Table */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {products.map((prod) => (
                <div
                  key={prod.id}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold text-slate-600">
                        {prod.category}
                      </span>
                      <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700">
                        {prod.condition}
                      </span>
                    </div>

                    <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-slate-100">
                      <Image src={prod.images[0]} alt={prod.title} fill className="object-cover" />
                    </div>

                    <h4 className="text-sm font-bold text-slate-900 line-clamp-2">
                      {prod.title}
                    </h4>

                    <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Retail Price:</span>
                        <span className="font-extrabold text-slate-900">
                          {formatTZS(prod.priceRetail)}
                        </span>
                      </div>
                      <div className="flex justify-between text-emerald-600 font-bold">
                        <span>Wholesale (Jumla 3+):</span>
                        <span>{formatTZS(prod.priceWholesale)}</span>
                      </div>
                      <div className="flex justify-between text-[11px] text-slate-400">
                        <span>Stock Status:</span>
                        <span className="font-semibold text-slate-700">
                          {prod.stockStatus}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => openEditModal(prod)}
                    className="mt-4 flex items-center justify-center gap-1.5 rounded-xl border border-slate-300 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                    <span>Edit Price & Stock</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 4. WINGA PAYOUTS & KYC TAB */}
        {activeTab === 'payouts' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-bold text-slate-900 font-heading">
                Winga Ambassador KYC Verification & Payouts
              </h3>
              <p className="text-xs text-slate-500">
                Verify student identity cards, review mobile money cash-out requests, and disburse via M-Pesa / Tigo Pesa.
              </p>
            </div>

            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-100 bg-slate-50/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <tr>
                      <th className="p-4">Payout Ref & Date</th>
                      <th className="p-4">Ambassador Details</th>
                      <th className="p-4">Student ID & KYC</th>
                      <th className="p-4">Disbursement Mobile</th>
                      <th className="p-4">Amount</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">B2C Reference</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {payoutRequests.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="p-8 text-center text-slate-400">
                          No payout requests in queue.
                        </td>
                      </tr>
                    ) : (
                      payoutRequests.map((payout) => {
                        const isPending = payout.status === 'Pending';
                        const agent = wingaAgents.find((a) => a.id === payout.agentId || a.promoCode === payout.promoCode);
                        const isKycVerified = (agent?.kycStatus || payout.kycStatus) === 'Verified';

                        return (
                          <tr key={payout.id} className="hover:bg-slate-50/60 transition-colors">
                            <td className="p-4">
                              <span className="font-mono font-bold text-slate-900">
                                {payout.id}
                              </span>
                              <span className="text-[10px] text-slate-400 block">
                                {new Date(payout.requestedAt).toLocaleDateString('en-GB')}
                              </span>
                            </td>

                            <td className="p-4">
                              <span className="font-bold text-slate-900 block">
                                {payout.agentName}
                              </span>
                              <span className="font-mono text-indigo-600 text-[11px] font-bold">
                                {payout.promoCode}
                              </span>
                              <span className="text-[10px] text-slate-400 block truncate max-w-45">
                                {payout.university}
                              </span>
                            </td>

                            <td className="p-4">
                              <div className="flex items-center gap-1.5">
                                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                  isKycVerified
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-amber-100 text-amber-800'
                                }`}>
                                  <ShieldCheck className="h-3 w-3" />
                                  {isKycVerified ? 'Verified' : 'Pending KYC'}
                                </span>
                                {!isKycVerified && agent && (
                                  <button
                                    onClick={() => verifyKycStudentId(agent.id)}
                                    className="rounded bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700 hover:bg-indigo-100 transition-colors"
                                  >
                                    Approve ID
                                  </button>
                                )}
                              </div>
                              {agent?.studentIdCardUrl && (
                                <a
                                  href={agent.studentIdCardUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[10px] text-indigo-600 hover:underline block mt-1"
                                >
                                  View Student ID Scan
                                </a>
                              )}
                            </td>

                            <td className="p-4 font-mono font-bold text-slate-800">
                              {payout.phone}
                            </td>

                            <td className="p-4 font-black text-emerald-600 text-sm">
                              {formatTZS(payout.amount)}
                            </td>

                            <td className="p-4">
                              <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                                payout.status === 'Paid'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-amber-100 text-amber-800 animate-pulse'
                              }`}>
                                {payout.status}
                              </span>
                            </td>

                            <td className="p-4 font-mono text-[11px] text-slate-600">
                              {payout.b2cReferenceId || 'Pending Transfer'}
                            </td>

                            <td className="p-4 text-right">
                              {isPending ? (
                                <button
                                  onClick={() => markPayoutPaid(payout.id)}
                                  className="inline-flex items-center gap-1 rounded-xl bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 active:scale-95 transition-all"
                                >
                                  <Check className="h-3.5 w-3.5" />
                                  <span>Mark as Paid</span>
                                </button>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-emerald-600 font-bold text-xs">
                                  <CheckCircle2 className="h-4 w-4" /> Paid
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 5. STORE SETTINGS TAB */}
        {activeTab === 'settings' && (
          <div className="space-y-6 max-w-4xl">
            <div>
              <h3 className="text-base font-bold text-slate-900 font-heading">
                Dynamic Store Configuration
              </h3>
              <p className="text-xs text-slate-500">
                Update Lipa Namba till numbers, account holder names, WhatsApp contact numbers, and payout thresholds.
              </p>
            </div>

            {settingsSavedToast && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-emerald-800 text-xs font-bold flex items-center gap-2"
              >
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                {settingsSaveWarning || 'Store settings updated successfully.'}
              </motion.div>
            )}

            <form onSubmit={handleSaveSettings} className="space-y-6">
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div><h4 className="text-sm font-bold text-slate-900">Mobile money till numbers</h4><p className="mt-1 text-xs text-slate-500">Configure enabled networks and the registered name shown to students.</p></div>
                  <CreditCard className="h-5 w-5 text-indigo-600" />
                </div>
                {(settingsForm.paymentMethods || []).map((method, idx) => (
                  <div key={method.network} className="grid grid-cols-1 gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 md:grid-cols-[1fr_1fr_1.5fr_auto] md:items-end">
                    <div><label className="mb-1 block text-xs font-bold text-slate-700">Network</label><input readOnly value={method.network} className="w-full rounded-xl p-2.5 text-xs" /></div>
                    <div><label className="mb-1 block text-xs font-bold text-slate-700">Till / Lipa number</label><input value={method.tillNumber} onChange={(event) => setSettingsForm({ ...settingsForm, paymentMethods: settingsForm.paymentMethods?.map((item, i) => i === idx ? { ...item, tillNumber: event.target.value } : item) })} className="w-full rounded-xl p-2.5 text-xs" /></div>
                    <div><label className="mb-1 block text-xs font-bold text-slate-700">Account holder</label><input value={method.accountName} onChange={(event) => setSettingsForm({ ...settingsForm, paymentMethods: settingsForm.paymentMethods?.map((item, i) => i === idx ? { ...item, accountName: event.target.value } : item) })} className="w-full rounded-xl p-2.5 text-xs" /></div>
                    <label className="flex items-center gap-2 pb-2 text-xs font-semibold text-slate-700"><input type="checkbox" checked={method.enabled} onChange={(event) => setSettingsForm({ ...settingsForm, paymentMethods: settingsForm.paymentMethods?.map((item, i) => i === idx ? { ...item, enabled: event.target.checked } : item) })} />Enabled</label>
                  </div>
                ))}
              </div>

              {/* Payment Gateways / Lipa Namba */}
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                  <CreditCard className="h-5 w-5 text-indigo-600" />
                  <h4 className="text-sm font-bold text-slate-900">
                    Payment Gateway & Lipa Namba Till
                  </h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Merchant Till Number (Lipa Namba) *
                    </label>
                    <input
                      type="text"
                      required
                      value={settingsForm.tillNumber}
                      onChange={(e) =>
                        setSettingsForm({ ...settingsForm, tillNumber: e.target.value })
                      }
                      className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-xs text-slate-900 font-mono font-bold focus:ring-2 focus:ring-indigo-600"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">Displayed to students during checkout copy-till prompt.</p>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Merchant Store Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={settingsForm.merchantName}
                      onChange={(e) =>
                        setSettingsForm({ ...settingsForm, merchantName: e.target.value })
                      }
                      className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-xs text-slate-900 focus:ring-2 focus:ring-indigo-600"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Account Holder / Registered Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={settingsForm.accountName}
                      onChange={(e) =>
                        setSettingsForm({ ...settingsForm, accountName: e.target.value })
                      }
                      className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-xs text-slate-900 focus:ring-2 focus:ring-indigo-600"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">Name shown on M-Pesa / Tigo confirmation SMS.</p>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Minimum Winga Payout Threshold (TZS) *
                    </label>
                    <input
                      type="number"
                      required
                      value={settingsForm.minPayoutThreshold}
                      onChange={(e) =>
                        setSettingsForm({
                          ...settingsForm,
                          minPayoutThreshold: Number(e.target.value),
                        })
                      }
                      className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-xs text-slate-900 font-bold focus:ring-2 focus:ring-indigo-600"
                    />
                  </div>
                </div>
              </div>

              {/* Customer Support & WhatsApp */}
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                  <Phone className="h-5 w-5 text-emerald-600" />
                  <h4 className="text-sm font-bold text-slate-900">
                    Official Support & WhatsApp Deep Links
                  </h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Support Phone Number
                    </label>
                    <input
                      type="text"
                      value={settingsForm.supportPhone}
                      onChange={(e) =>
                        setSettingsForm({ ...settingsForm, supportPhone: e.target.value })
                      }
                      className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-xs text-slate-900 focus:ring-2 focus:ring-indigo-600"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Support WhatsApp Number (local 06… / 07… or international 255…)
                    </label>
                    <input
                      type="text"
                      value={settingsForm.supportWhatsApp}
                      onChange={(e) =>
                        setSettingsForm({
                          ...settingsForm,
                          supportWhatsApp: e.target.value,
                        })
                      }
                      className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-xs text-slate-900 font-mono focus:ring-2 focus:ring-indigo-600"
                    />
                  </div>
                </div>
                <div><label className="mb-1 block text-xs font-bold text-slate-700">Official WhatsApp numbers (comma-separated)</label><input value={(settingsForm.officialWhatsAppNumbers || []).join(', ')} onChange={(event) => setSettingsForm({ ...settingsForm, officialWhatsAppNumbers: event.target.value.split(',').map((number) => number.trim()).filter(Boolean) })} className="w-full rounded-xl p-2.5 text-xs" placeholder="0616961511" /></div>
              </div>

              {/* Partner Badges & Sponsor Logos */}
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                  <Building className="h-5 w-5 text-indigo-600" />
                  <h4 className="text-sm font-bold text-slate-900">
                    Institutional Partners & Verified Badges
                  </h4>
                </div>

                <div className="space-y-3 text-xs">
                  <p className="text-slate-500">
                    Verified campus unions and financial sponsors displayed across the homepage footer and checkout guarantee cards.
                  </p>
                  <div className="space-y-3">
                    {settingsForm.partnerBadges?.map((partner, idx: number) => (
                      <div key={`${partner.shortCode}-${idx}`} className="grid grid-cols-1 gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-3 md:grid-cols-5">
                        <input aria-label="Partner name" value={partner.name} onChange={(event) => setSettingsForm({ ...settingsForm, partnerBadges: settingsForm.partnerBadges.map((item, i) => i === idx ? { ...item, name: event.target.value } : item) })} className="rounded-xl p-2 text-xs" placeholder="Partner name" />
                        <input aria-label="Short code" value={partner.shortCode} onChange={(event) => setSettingsForm({ ...settingsForm, partnerBadges: settingsForm.partnerBadges.map((item, i) => i === idx ? { ...item, shortCode: event.target.value } : item) })} className="rounded-xl p-2 text-xs" placeholder="Short code" />
                        <input aria-label="Logo image URL" value={partner.logoUrl || ''} onChange={(event) => setSettingsForm({ ...settingsForm, partnerBadges: settingsForm.partnerBadges.map((item, i) => i === idx ? { ...item, logoUrl: event.target.value } : item) })} className="rounded-xl p-2 text-xs" placeholder="Logo image URL" />
                        <input aria-label="Partner website or social link" value={partner.url || ''} onChange={(event) => setSettingsForm({ ...settingsForm, partnerBadges: settingsForm.partnerBadges.map((item, i) => i === idx ? { ...item, url: event.target.value } : item) })} className="rounded-xl p-2 text-xs" placeholder="Website / social link" />
                        <div className="flex gap-2"><input aria-label="Partner type" value={partner.category} onChange={(event) => setSettingsForm({ ...settingsForm, partnerBadges: settingsForm.partnerBadges.map((item, i) => i === idx ? { ...item, category: event.target.value } : item) })} className="min-w-0 flex-1 rounded-xl p-2 text-xs" placeholder="Type" /><button type="button" onClick={() => setSettingsForm({ ...settingsForm, partnerBadges: settingsForm.partnerBadges.filter((_, i) => i !== idx) })} className="rounded-xl px-3 text-red-700 hover:bg-red-50" aria-label={`Remove ${partner.name}`}><X className="h-4 w-4" /></button></div>
                      </div>
                    ))}
                    <button type="button" onClick={() => setSettingsForm({ ...settingsForm, partnerBadges: [...settingsForm.partnerBadges, { name: '', shortCode: '', category: 'Sponsor', logoUrl: '', url: '' }] })} className="inline-flex items-center gap-2 rounded-xl border border-indigo-200 px-3 py-2 text-xs font-bold text-indigo-700 hover:bg-indigo-50"><Plus className="h-4 w-4" />Add partner / sponsor</button>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-3">
                <div className="flex items-center gap-2"><MapPin className="h-5 w-5 text-indigo-600" /><h4 className="text-sm font-bold text-slate-900">Campus expansion demand</h4></div>
                {Object.keys(campusVotes).length ? Object.entries(campusVotes).sort((a, b) => b[1] - a[1]).map(([id, count]) => <div key={id} className="flex justify-between rounded-xl bg-slate-50 px-3 py-2 text-xs"><span>{id}</span><strong>{count} votes</strong></div>) : <p className="text-xs text-slate-500">No saved campus votes yet. Votes are currently stored in this browser only.</p>}
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-6 py-3 text-xs font-bold text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 active:scale-95 transition-all"
                >
                  <Save className="h-4 w-4" />
                  <span>Save All Settings</span>
                </button>
              </div>
            </form>
          </div>
        )}
      </main>

      {/* Trade-In Detail / Action Modal */}
      <AnimatePresence>
        {activeTradeInModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveTradeInModal(null)}
              className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-white p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">
                    Trade-In Appraisal
                  </span>
                  <h3 className="text-base font-bold text-slate-900 font-heading">
                    {activeTradeInModal.itemTitle}
                  </h3>
                </div>
                <button
                  onClick={() => setActiveTradeInModal(null)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="mt-4 space-y-4 text-xs">
                {/* Image preview */}
                {(activeTradeInModal.imageUrls?.length || activeTradeInModal.imageUrl) && (
                  <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-slate-100 border border-slate-200">
                    {activeTradeInModal.imageUrls?.length ? (
                      <div className="grid h-full grid-cols-3 gap-2 p-2">
                        {activeTradeInModal.imageUrls.map((image, index) => <div key={index} className="relative overflow-hidden rounded-xl"><Image src={image} alt={`${activeTradeInModal.itemTitle} photo ${index + 1}`} fill unoptimized className="object-cover" /></div>)}
                      </div>
                    ) : activeTradeInModal.imageUrl ? <Image src={activeTradeInModal.imageUrl} alt={activeTradeInModal.itemTitle} fill className="object-cover" /> : null}
                  </div>
                )}

                {/* Details grid */}
                <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Student Name</span>
                    <span className="font-bold text-slate-900">{activeTradeInModal.studentName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Campus</span>
                    <span className="font-bold text-indigo-600">{activeTradeInModal.university}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Condition</span>
                    <span className="font-bold text-slate-900">{activeTradeInModal.condition}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Expected Price</span>
                    <span className="font-bold text-slate-900">{formatTZS(activeTradeInModal.expectedPrice)}</span>
                  </div>
                </div>

                <div>
                  <span className="text-slate-500 font-bold block mb-1">Specifications / Notes:</span>
                  <p className="text-slate-700 bg-white p-3 rounded-xl border border-slate-200">
                    {activeTradeInModal.specs}
                  </p>
                </div>

                {/* Set UniSoko Offer Price */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    UniSoko Cash Offer (TZS) *
                  </label>
                  <input
                    type="number"
                    value={offerPriceInput}
                    onChange={(e) => setOfferPriceInput(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-xs text-slate-900 font-bold focus:ring-2 focus:ring-indigo-600"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Internal Appraisal Notes
                  </label>
                  <textarea
                    rows={2}
                    value={adminNotesInput}
                    onChange={(e) => setAdminNotesInput(e.target.value)}
                    placeholder="Battery health tested at 88%, minor scuff on corner..."
                    className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-xs text-slate-900 focus:ring-2 focus:ring-indigo-600"
                  />
                </div>

                {/* Status action buttons */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                    Update Workflow Status
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <button
                      type="button"
                      onClick={() => handleUpdateTradeIn('Inspecting')}
                      className="rounded-xl bg-sky-50 text-sky-700 font-bold py-2 text-[11px] hover:bg-sky-100 border border-sky-200 transition-colors"
                    >
                      Inspecting
                    </button>
                    <button
                      type="button"
                      onClick={() => handleUpdateTradeIn('Offer Made')}
                      className="rounded-xl bg-indigo-50 text-indigo-700 font-bold py-2 text-[11px] hover:bg-indigo-100 border border-indigo-200 transition-colors"
                    >
                      Offer Made
                    </button>
                    <button
                      type="button"
                      onClick={() => handleUpdateTradeIn('Accepted')}
                      className="rounded-xl bg-emerald-600 text-white font-bold py-2 text-[11px] hover:bg-emerald-700 transition-colors"
                    >
                      Accept & Pay
                    </button>
                    <button
                      type="button"
                      onClick={() => handleUpdateTradeIn('Rejected')}
                      className="rounded-xl bg-red-50 text-red-700 font-bold py-2 text-[11px] hover:bg-red-100 border border-red-200 transition-colors"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit / Add Product Modal */}
      <AnimatePresence>
        {(editingProduct || isAddProductOpen) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setEditingProduct(null);
                setIsAddProductOpen(false);
              }}
              className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-white p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-base font-bold text-slate-900 font-heading">
                  {editingProduct ? 'Edit Gadget Specs & Pricing' : 'Add New Gadget to Catalog'}
                </h3>
                <button
                  onClick={() => {
                    setEditingProduct(null);
                    setIsAddProductOpen(false);
                  }}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSaveProduct} className="mt-4 space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Gadget Title & Model *
                  </label>
                  <input
                    type="text"
                    required
                    value={prodFormTitle}
                    onChange={(e) => setProdFormTitle(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-xs text-slate-900 focus:ring-2 focus:ring-indigo-600"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Category
                    </label>
                    <select
                      value={prodFormCategory}
                      onChange={(e) => setProdFormCategory(e.target.value as ProductCategory)}
                      className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-xs text-slate-900 focus:ring-2 focus:ring-indigo-600"
                    >
                      <option value="Laptops">Laptops</option>
                      <option value="Laptops & Computers">Laptops & Computers</option>
                      <option value="Phones">Phones</option>
                      <option value="Smart Phones & Accessories">Smart Phones & Accessories</option>
                      <option value="Accessories">Accessories</option>
                      <option value="Power & Audio">Power & Audio</option>
                      <option value="Room Gear">Room Gear</option>
                      <option value="Student Lifestyle Gear">Student Lifestyle Gear</option>
                      <option value="Campus Essentials">Campus Essentials</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Condition
                    </label>
                    <select
                      value={prodFormCondition}
                      onChange={(e) => setProdFormCondition(e.target.value as ProductCondition)}
                      className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-xs text-slate-900 focus:ring-2 focus:ring-indigo-600"
                    >
                      <option value="Grade A Like-New">Grade A Like-New</option>
                      <option value="Brand New">Brand New</option>
                      <option value="Refurbished">Refurbished</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Retail Price (TZS) *
                    </label>
                    <input
                      type="number"
                      required
                      value={prodFormRetail}
                      onChange={(e) => setProdFormRetail(Number(e.target.value))}
                      className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-xs text-slate-900 font-bold focus:ring-2 focus:ring-indigo-600"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Wholesale Price (3+ units) *
                    </label>
                    <input
                      type="number"
                      required
                      value={prodFormWholesale}
                      onChange={(e) => setProdFormWholesale(Number(e.target.value))}
                      className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-xs text-slate-900 font-bold focus:ring-2 focus:ring-indigo-600"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Stock Status
                    </label>
                    <select
                      value={prodFormStockStatus}
                      onChange={(e) => setProdFormStockStatus(e.target.value as StockStatus)}
                      className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-xs text-slate-900 focus:ring-2 focus:ring-indigo-600"
                    >
                      <option value="In Stock">In Stock</option>
                      <option value="New Stock">New Stock</option>
                      <option value="Trending">Trending</option>
                      <option value="Coming Soon">Coming Soon</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Image URL (Unsplash/Direct)
                    </label>
                    <input
                      type="text"
                      value={prodFormImage}
                      onChange={(e) => setProdFormImage(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-xs text-slate-900 focus:ring-2 focus:ring-indigo-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Product Description
                  </label>
                  <textarea
                    rows={3}
                    value={prodFormDesc}
                    onChange={(e) => setProdFormDesc(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-xs text-slate-900 focus:ring-2 focus:ring-indigo-600"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingProduct(null);
                      setIsAddProductOpen(false);
                    }}
                    className="rounded-xl border border-slate-300 py-3 text-xs font-bold text-slate-700 hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-indigo-600 py-3 text-xs font-bold text-white shadow-md hover:bg-indigo-700 transition-all"
                  >
                    {editingProduct ? 'Save Changes' : 'Publish Product'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <CartDrawer />
    </div>
  );
}
