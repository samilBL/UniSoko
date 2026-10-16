'use client';

import { type FormEvent, type ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { Archive, Check, ClipboardList, Headphones, Home, Laptop, Package, Pencil, Save, ShieldCheck, Smartphone, Store, Zap } from 'lucide-react';
import Link from 'next/link';
import AccountSignOutButton from '@/components/AccountSignOutButton';
import SellerMarketplaceInsights from '@/components/SellerMarketplaceInsights';
import type { Order } from '@/lib/types';
type Tab = 'overview' | 'orders' | 'products' | 'profile';

type Profile = {
  id: string;
  user_id: string;
  display_name: string;
  university: string;
  campus: string | null;
  description: string;
  contact_options: Record<string, unknown>;
  status: string;
  created_at: string;
  updated_at: string;
};
type SellerProduct = { id: string; name: string; category: string; category_id: string | null; subcategory_id: string | null; product_condition_id: string | null; price: number | string; description: string; specs: Record<string, unknown>; images: string[]; imageUrls: string[]; listing_status: string; submitted_at: string | null; moderation_notes: string; created_at: string; updated_at: string; seller_winga_campaign_enabled?: boolean; seller_winga_commission_rate?: number | string; seller_group_buy_enabled?: boolean; seller_group_buy_minimum?: number; seller_wholesale_enabled?: boolean; seller_wholesale_discount_percent?: number | string; seller_wholesale_minimum?: number };
type Category = { id: string; name: string };
type Subcategory = { id: string; category_id: string; name: string };
type Condition = { id: string; name: string; description: string };
type DynamicAttribute = { id: string; category_id: string | null; subcategory_id: string | null; product_condition_id: string | null; name: string; attribute_key: string; input_type: 'text' | 'number' | 'boolean' | 'select' | 'multiselect'; is_required: boolean; validation_rules: Record<string, unknown>; product_attribute_options: { id: string; value: string; label: string; is_active?: boolean }[] };
type Plan = { id: string; name: string; description: string; plan_type: string; price: number; currency: string; duration_days: number; product_limit: number | null; is_popular: boolean; slug: string; subscription_plan_features?: { feature_key: string; label: string; description: string; is_enabled: boolean }[] };
type PaymentMethod = { id: string; name: string; instructions: string; public_details: Record<string, unknown> };
type Subscription = { id: string; status: string; plan_snapshot: Record<string, unknown>; expires_at: string | null };

const DEFAULT_FALLBACK_CATEGORIES: Category[] = [
  { id: 'cat-laptops', name: 'Laptops & Computers' },
  { id: 'cat-phones', name: 'Phones & Tablets' },
  { id: 'cat-audio', name: 'Audio & Sound' },
  { id: 'cat-power', name: 'Power & Cables' },
  { id: 'cat-room', name: 'Room & Hostel Gear' },
  { id: 'cat-campus', name: 'Campus Essentials' },
];

const DEFAULT_FALLBACK_SUBCATEGORIES: Subcategory[] = [
  { id: 'sub-macbooks', category_id: 'cat-laptops', name: 'MacBooks & Laptops' },
  { id: 'sub-desktops', category_id: 'cat-laptops', name: 'Desktops & Monitors' },
  { id: 'sub-laptopacc', category_id: 'cat-laptops', name: 'Laptop Bags & Accessories' },
  { id: 'sub-smartphones', category_id: 'cat-phones', name: 'Smartphones & iPhones' },
  { id: 'sub-tablets', category_id: 'cat-phones', name: 'iPads & Tablets' },
  { id: 'sub-cases', category_id: 'cat-phones', name: 'Phone Cases & Screen Protectors' },
  { id: 'sub-earbuds', category_id: 'cat-audio', name: 'AirPods & Earbuds' },
  { id: 'sub-headphones', category_id: 'cat-audio', name: 'Over-Ear Headphones' },
  { id: 'sub-speakers', category_id: 'cat-audio', name: 'Bluetooth Speakers' },
  { id: 'sub-powerbanks', category_id: 'cat-power', name: 'Power Banks' },
  { id: 'sub-chargers', category_id: 'cat-power', name: 'Fast Chargers' },
  { id: 'sub-cables', category_id: 'cat-power', name: 'Cables & Hub Adapters' },
  { id: 'sub-desklamps', category_id: 'cat-room', name: 'Desk Lamps & Lights' },
  { id: 'sub-extensions', category_id: 'cat-room', name: 'Extension Cables' },
  { id: 'sub-kettles', category_id: 'cat-room', name: 'Kettles & Cookware' },
  { id: 'sub-fans', category_id: 'cat-room', name: 'Mini Fans' },
  { id: 'sub-backpacks', category_id: 'cat-campus', name: 'Backpacks & Bags' },
  { id: 'sub-calculators', category_id: 'cat-campus', name: 'Calculators & Tech Tools' },
  { id: 'sub-storage', category_id: 'cat-campus', name: 'Flash Drives & External SSDs' },
  { id: 'sub-stationery', category_id: 'cat-campus', name: 'Stationery & Study Gear' },
];

const DEFAULT_FALLBACK_CONDITIONS: Condition[] = [
  { id: 'cond-brand-new', name: 'Brand New', description: 'Factory sealed in original packaging with manufacturer warranty.' },
  { id: 'cond-grade-a', name: 'Grade A Like-New', description: 'Flawless condition, fully tested and inspected with no visible wear.' },
  { id: 'cond-refurbished', name: 'Refurbished', description: 'Professionally restored, cleaned, tested and fully functional.' },
];

function getCategoryIcon(name: string) {
  const lower = name.toLowerCase();
  if (lower.includes('laptop') || lower.includes('computer')) return <Laptop className="h-4 w-4" />;
  if (lower.includes('phone') || lower.includes('tablet')) return <Smartphone className="h-4 w-4" />;
  if (lower.includes('audio') || lower.includes('sound') || lower.includes('ear') || lower.includes('head')) return <Headphones className="h-4 w-4" />;
  if (lower.includes('power') || lower.includes('cable') || lower.includes('charge')) return <Zap className="h-4 w-4" />;
  if (lower.includes('room') || lower.includes('hostel') || lower.includes('home')) return <Home className="h-4 w-4" />;
  return <Package className="h-4 w-4" />;
}

const inputClass = 'mt-1.5 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white';
const emptyProductDraft = { name: '', categoryId: '', subcategoryId: '', conditionId: '', price: '', description: '', specs: {} as Record<string, unknown>, images: [] as string[], wholesaleEnabled: false, wholesaleDiscountPercent: '5', wholesaleMinimum: '3' };

export default function SellerDashboard({ email, initialProfile }: { email: string; initialProfile: Profile }) {
  const [profile, setProfile] = useState(initialProfile);
  const [products, setProducts] = useState<SellerProduct[]>([]);
  const [sellerOrders, setSellerOrders] = useState<Order[]>([]);
  const [sellerOrdersError, setSellerOrdersError] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [conditions, setConditions] = useState<Condition[]>([]);
  const [attributes, setAttributes] = useState<DynamicAttribute[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [pendingPayment, setPendingPayment] = useState<Record<string, unknown> | null>(null);
  const [selectedPlan, setSelectedPlan] = useState('');
  const [selectedMethod, setSelectedMethod] = useState('');
  const [transactionReference, setTransactionReference] = useState('');
  const [currentTime, setCurrentTime] = useState(0);
  const [verification, setVerification] = useState('unverified');
  const [tab, setTab] = useState<Tab>('overview');
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState(emptyProductDraft);
  const [imagePreviews, setImagePreviews] = useState<Record<string, string>>({});
  const [productStep, setProductStep] = useState(0);
  const [maxStepReached, setMaxStepReached] = useState(0);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [profileForm, setProfileForm] = useState({ displayName: initialProfile.display_name, university: initialProfile.university, campus: initialProfile.campus || '', phone: typeof initialProfile.contact_options.phone === 'string' ? initialProfile.contact_options.phone : '', tillNetwork: typeof initialProfile.contact_options.tillNetwork === 'string' ? initialProfile.contact_options.tillNetwork : 'M-Pesa', tillNumber: typeof initialProfile.contact_options.tillNumber === 'string' ? initialProfile.contact_options.tillNumber : '', tillAccountName: typeof initialProfile.contact_options.tillAccountName === 'string' ? initialProfile.contact_options.tillAccountName : '', description: initialProfile.description });

  const load = useCallback(async () => {
    const [profileResponse, productsResponse, subscriptionResponse] = await Promise.all([
      fetch('/api/seller/profile', { cache: 'no-store' }),
      fetch('/api/seller/products', { cache: 'no-store' }),
      fetch('/api/seller/subscriptions', { cache: 'no-store' }),
    ]);
    const profileResult = await profileResponse.json() as { profile?: Profile; verification?: { status?: string }; error?: string };
    const productsResult = await productsResponse.json() as { products?: SellerProduct[]; categories?: Category[]; subcategories?: Subcategory[]; conditions?: Condition[]; attributes?: DynamicAttribute[]; error?: string };
    const subscriptionResult = await subscriptionResponse.json() as { plans?: Plan[]; paymentMethods?: PaymentMethod[]; subscription?: Subscription | null; payment?: Record<string, unknown> | null; error?: string };
    if (!profileResponse.ok) throw new Error(profileResult.error || 'Could not load your seller profile.');
    if (!productsResponse.ok) throw new Error(productsResult.error || 'Could not load your seller products.');
    if (!subscriptionResponse.ok) throw new Error(subscriptionResult.error || 'Could not load subscription plans.');
    if (profileResult.profile) {
      setProfile(profileResult.profile);
      setProfileForm({ displayName: profileResult.profile.display_name, university: profileResult.profile.university, campus: profileResult.profile.campus || '', phone: typeof profileResult.profile.contact_options.phone === 'string' ? profileResult.profile.contact_options.phone : '', tillNetwork: typeof profileResult.profile.contact_options.tillNetwork === 'string' ? profileResult.profile.contact_options.tillNetwork : 'M-Pesa', tillNumber: typeof profileResult.profile.contact_options.tillNumber === 'string' ? profileResult.profile.contact_options.tillNumber : '', tillAccountName: typeof profileResult.profile.contact_options.tillAccountName === 'string' ? profileResult.profile.contact_options.tillAccountName : '', description: profileResult.profile.description || '' });
    }
    setVerification(profileResult.verification?.status || 'unverified');
    setProducts(productsResult.products || []);
    setCategories(productsResult.categories || []);
    setSubcategories(productsResult.subcategories || []);
    setConditions(productsResult.conditions || []);
    setAttributes(productsResult.attributes || []);
    setPlans(subscriptionResult.plans || []);
    setPaymentMethods(subscriptionResult.paymentMethods || []);
    setSubscription(subscriptionResult.subscription || null);
    setPendingPayment(subscriptionResult.payment || null);
    if (subscriptionResult.plans?.length) setSelectedPlan((current) => current || subscriptionResult.plans?.find((plan) => plan.is_popular)?.id || subscriptionResult.plans?.find((plan) => plan.plan_type === 'paid')?.id || '');
    if (subscriptionResult.paymentMethods?.length) setSelectedMethod((current) => current || subscriptionResult.paymentMethods?.[0].id || '');
    setCurrentTime(Date.now());
  }, []);

  const refreshSellerOrders = useCallback(async () => {
    const response = await fetch('/api/seller/orders', { cache: 'no-store' });
    const result = await response.json() as { orders?: Order[]; error?: string };
    if (!response.ok) throw new Error(result.error || 'Could not load seller orders.');
    setSellerOrders(result.orders || []);
    setSellerOrdersError('');
  }, []);

  useEffect(() => {
    void Promise.resolve().then(() => {
      const storageKey = `unisoko:seller-product-draft:${initialProfile.id}`;
      try { const saved = localStorage.getItem(storageKey); if (saved) { const parsed: unknown = JSON.parse(saved); if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) { const restored = parsed as Partial<typeof emptyProductDraft> & { imagePreviews?: Record<string, string> }; setDraft({ ...emptyProductDraft, ...restored }); setImagePreviews(restored.imagePreviews || {}); } } } catch { localStorage.removeItem(storageKey); }
    });
  }, [initialProfile.id]);

  useEffect(() => {
    const storageKey = `unisoko:seller-product-draft:${profile.id}`;
    if (!editingId && (draft.name || draft.categoryId || draft.description || draft.images.length)) localStorage.setItem(storageKey, JSON.stringify({ ...draft, imagePreviews }));
  }, [draft, editingId, imagePreviews, profile.id]);

  useEffect(() => {
    let active = true;
    void Promise.resolve().then(load).catch((err: unknown) => { if (active) setError(err instanceof Error ? err.message : 'Could not load your dashboard.'); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [load]);

  useEffect(() => {
    if (profile.status !== 'approved') return;
    const initialTimer = window.setTimeout(() => {
      void refreshSellerOrders().catch((reason: unknown) => setSellerOrdersError(reason instanceof Error ? reason.message : 'Could not load seller orders.'));
    }, 0);
    const timer = window.setInterval(() => {
      void refreshSellerOrders().catch((reason: unknown) => setSellerOrdersError(reason instanceof Error ? reason.message : 'Could not refresh seller orders.'));
    }, 15000);
    return () => { window.clearTimeout(initialTimer); window.clearInterval(timer); };
  }, [profile.status, refreshSellerOrders]);

  const counts = useMemo(() => products.reduce<Record<string, number>>((result, product) => {
    result[product.listing_status] = (result[product.listing_status] || 0) + 1;
    return result;
  }, {}), [products]);
  const visibleProducts = products.filter((product) => filter === 'all' || product.listing_status === filter);

  const saveProduct = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true); setError(''); setMessage('');
    try {
      const response = await fetch('/api/seller/products', {
        method: editingId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...draft, ...(editingId ? { id: editingId } : {}) }),
      });
      const result = await response.json() as { product?: SellerProduct; error?: string };
      if (!response.ok) throw new Error(result.error || 'Could not save product draft.');
      if (editingId) {
        const previousImages = products.find((product) => product.id === editingId)?.images || [];
        const removedImages = previousImages.filter((image) => !draft.images.includes(image) && image.startsWith(`${profile.id}/`));
        await Promise.all(removedImages.map((path) => fetch('/api/seller/products/images', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ path }) })));
      }
      await load();
      setDraft(emptyProductDraft);
      setEditingId(null);
      setProductStep(0); setImagePreviews({}); localStorage.removeItem(`unisoko:seller-product-draft:${profile.id}`);
      setMessage('Draft saved privately. It is not visible in the marketplace.');
    } catch (err) { setError(err instanceof Error ? err.message : 'Could not save product draft.'); }
    finally { setBusy(false); }
  };

  const uploadImages = async (files: FileList | null) => {
    if (!files?.length) return;
    const remaining = 8 - draft.images.length;
    if (files.length > remaining) { setError(`You can add ${remaining} more image${remaining === 1 ? '' : 's'} (maximum 8).`); return; }
    setUploadingImages(true); setError('');
    try {
      const uploaded: string[] = [];
      for (const file of Array.from(files)) {
        const form = new FormData(); form.append('image', file);
        const response = await fetch('/api/seller/products/images', { method: 'POST', body: form });
        const result = await response.json() as { path?: string; url?: string; error?: string };
        if (!response.ok || !result.path) throw new Error(result.error || 'Could not upload a product image.');
        uploaded.push(result.path);
        setImagePreviews((current) => ({ ...current, [result.path as string]: result.url || '' }));
      }
      setDraft((current) => ({ ...current, images: [...current.images, ...uploaded] }));
    } catch (err) { setError(err instanceof Error ? err.message : 'Could not upload the selected images.'); }
    finally { setUploadingImages(false); }
  };

  const removeImage = async (path: string) => {
    setDraft((current) => ({ ...current, images: current.images.filter((image) => image !== path) }));
    setImagePreviews((current) => { const next = { ...current }; delete next[path]; return next; });
    if (!path.startsWith('http') && !products.some((product) => product.images.includes(path))) await fetch('/api/seller/products/images', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ path }) });
  };

  const archiveProduct = async (product: SellerProduct) => {
    setBusy(true); setError(''); setMessage('');
    try {
      const response = await fetch('/api/seller/products', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: product.id, action: 'archive' }) });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || 'Could not archive this draft.');
      await load(); setMessage('Draft archived.');
    } catch (err) { setError(err instanceof Error ? err.message : 'Could not archive this draft.'); }
    finally { setBusy(false); }
  };

  const submitProduct = async (product: SellerProduct) => {
    setBusy(true); setError(''); setMessage('');
    try {
      const response = await fetch('/api/seller/products', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: product.id, action: 'submit' }) });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || 'Could not submit this product for review.');
      await load(); setMessage('Product submitted. It will appear in the marketplace only after admin approval.');
    } catch (err) { setError(err instanceof Error ? err.message : 'Could not submit this product for review.'); }
    finally { setBusy(false); }
  };

  const saveProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setBusy(true); setError(''); setMessage('');
    try {
      const response = await fetch('/api/seller/profile', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(profileForm) });
      const result = await response.json() as { profile?: Profile; error?: string };
      if (!response.ok || !result.profile) throw new Error(result.error || 'Could not save your seller profile.');
      setProfile(result.profile); setMessage('Seller profile saved.');
    } catch (err) { setError(err instanceof Error ? err.message : 'Could not save your seller profile.'); }
    finally { setBusy(false); }
  };

  const submitPlanPayment = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setBusy(true); setError(''); setMessage('');
    try {
      const response = await fetch('/api/seller/subscriptions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ planId: selectedPlan, paymentMethodId: selectedMethod, transactionReference }) });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || 'Could not submit payment.');
      setTransactionReference(''); await load(); setMessage('Payment reference submitted. Your plan starts after admin review.');
    } catch (err) { setError(err instanceof Error ? err.message : 'Could not submit payment.'); }
    finally { setBusy(false); }
  };

  const startEdit = (product: SellerProduct) => {
    setEditingId(product.id);
    const images = (product.images || []).filter((path) => path.startsWith(`${profile.id}/`));
    setDraft({ name: product.name, categoryId: product.category_id || '', subcategoryId: product.subcategory_id || '', conditionId: product.product_condition_id || '', price: String(product.price), description: product.description || '', specs: product.specs || {}, images, wholesaleEnabled: Boolean(product.seller_wholesale_enabled), wholesaleDiscountPercent: String(product.seller_wholesale_discount_percent ?? 5), wholesaleMinimum: String(product.seller_wholesale_minimum || 3) });
    setImagePreviews(Object.fromEntries(images.map((path, index) => [path, product.imageUrls[index] || ''])));
    setProductStep(0);
    setMaxStepReached(5);
    setTab('products');
  };

  const effectiveCategories = categories.length > 0 ? categories : DEFAULT_FALLBACK_CATEGORIES;
  const effectiveSubcategories = subcategories.length > 0 ? subcategories : DEFAULT_FALLBACK_SUBCATEGORIES;
  const effectiveConditions = conditions.length > 0 ? conditions : DEFAULT_FALLBACK_CONDITIONS;

  const applicableAttributes = attributes.filter((attribute) =>
    (!attribute.category_id || attribute.category_id === draft.categoryId) &&
    (!attribute.subcategory_id || attribute.subcategory_id === draft.subcategoryId) &&
    (!attribute.product_condition_id || attribute.product_condition_id === draft.conditionId));

  const addSpecification = () => {
    setDraft((current) => {
      let number = Object.keys(current.specs).length + 1;
      while (`Specification ${number}` in current.specs) number += 1;
      return { ...current, specs: { ...current.specs, [`Specification ${number}`]: '' } };
    });
  };

  const approved = profile.status === 'approved';
  const statusClass = profile.status === 'approved' ? 'bg-emerald-100 text-emerald-800' : profile.status === 'rejected' ? 'bg-rose-100 text-rose-800' : profile.status === 'suspended' ? 'bg-slate-200 text-slate-800' : 'bg-amber-100 text-amber-900';

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-7 sm:px-6 sm:py-10">
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
        <div><p className="text-xs font-bold uppercase tracking-wider text-emerald-700">Seller dashboard</p><h1 className="mt-1 text-2xl font-black sm:text-3xl">Welcome, {profile.display_name}</h1><p className="mt-1 text-xs text-slate-500">{email}</p></div>
        <AccountSignOutButton returnTo="/seller/login" />
      </div>
      <nav aria-label="Seller dashboard sections" className="mt-5 flex gap-2 overflow-x-auto border-b border-slate-200 pb-2 dark:border-slate-800">
        {([['overview', 'Overview'], ['orders', 'Orders'], ['products', 'Products'], ['profile', 'Seller profile']] as const).map(([key, label]) => <button key={key} type="button" disabled={key === 'orders' && !approved} onClick={() => setTab(key)} className={`min-h-10 shrink-0 rounded-xl px-4 text-xs font-bold ${tab === key ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'} disabled:cursor-not-allowed disabled:opacity-40`}>{label}</button>)}
      </nav>

      {!loading && tab === 'orders' && approved && <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-end justify-between gap-3"><div><h2 className="text-lg font-extrabold">Orders and dispatch</h2><p className="mt-1 text-xs text-slate-500">Order status refreshes automatically every 15 seconds.</p></div><span className="text-xs font-semibold text-slate-500">{sellerOrders.length} orders</span></div>
        {sellerOrdersError && <p role="alert" className="mt-4 rounded-lg bg-rose-50 p-3 text-xs text-rose-800">{sellerOrdersError}</p>}
        {sellerOrders.length ? <div className="mt-4 divide-y divide-slate-200 dark:divide-slate-800">{sellerOrders.map((order) => <article key={order.id} className="grid gap-3 py-4 sm:grid-cols-[1fr_auto] sm:items-center"><div><p className="font-mono text-xs font-bold">{order.id}</p><p className="mt-1 text-sm font-semibold">{order.items?.map((item) => `${item.quantity}x ${item.productTitle}`).join(', ')}</p><p className="mt-1 text-xs text-slate-500">{order.university} · {order.deliverySpotType} · {order.deliveryDetails}</p><p className="mt-1 text-xs text-slate-500">Buyer: {order.buyerName} · {order.buyerPhone}</p></div><div className="text-xs sm:text-right"><p><strong>Payment:</strong> {order.paymentStatus || order.status}</p><p className="mt-1"><strong>Fulfillment:</strong> {order.fulfillmentStatus || 'Unconfirmed'}</p><p className="mt-1"><strong>Delivery:</strong> {order.deliveryStatus || 'Not Dispatched'}</p><p className="mt-1"><strong>Assigned:</strong> {order.dispatchAssigneeName || 'Not assigned'}</p><p className="mt-1 text-slate-500">{new Date(order.createdAt).toLocaleString()}</p></div></article>)}</div> : !sellerOrdersError && <p className="mt-5 rounded-xl border border-dashed p-8 text-center text-sm text-slate-500">No orders have been placed for your products yet.</p>}
      </section>}

      {error && <p role="alert" className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200">{error}</p>}
      {message && <p role="status" className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200">{message}</p>}
      {loading && <p className="py-8 text-sm text-slate-500" role="status">Loading seller dashboard…</p>}

      {!loading && tab === 'overview' && <div className="mt-5 space-y-5">
        {approved && <SellerMarketplaceInsights />}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wide text-slate-500">Seller account</p><h2 className="mt-1 text-xl font-extrabold">{profile.display_name}</h2><p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{profile.university}{profile.campus ? ` · ${profile.campus}` : ''}</p></div><span className={`rounded-full px-3 py-1.5 text-xs font-bold capitalize ${statusClass}`}>{profile.status}</span></div>
          {profile.status === 'pending' && <p className="mt-4 rounded-xl bg-amber-50 p-4 text-sm leading-6 text-amber-900 dark:bg-amber-950/40 dark:text-amber-100">Your application is waiting for UniSoko review. You’ll be able to manage product drafts after approval.</p>}
          {profile.status === 'rejected' && <p className="mt-4 rounded-xl bg-rose-50 p-4 text-sm text-rose-900 dark:bg-rose-950/40 dark:text-rose-100">Your application was not approved. <Link href="/seller/apply" className="font-bold underline">Update and apply again</Link>.</p>}
          {profile.status === 'suspended' && <p className="mt-4 rounded-xl bg-slate-100 p-4 text-sm text-slate-700 dark:bg-slate-800 dark:text-slate-200">Seller access is suspended. Contact UniSoko support for assistance.</p>}
        </section>
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={<Store className="h-5 w-5" />} label="Seller status" value={profile.status} />
          <StatCard icon={<ShieldCheck className="h-5 w-5" />} label="Verification" value={verification.replaceAll('_', ' ')} />
          <StatCard icon={<Package className="h-5 w-5" />} label="Product drafts" value={String(counts.draft || 0)} />
          <StatCard icon={<ClipboardList className="h-5 w-5" />} label="Products total" value={String(products.length)} />
        </section>
        {profile.status === 'approved' && <SellerCommissionSummary />}
        <section className="grid gap-4 lg:grid-cols-2">
          <article className="rounded-2xl border border-indigo-100 bg-indigo-50 p-5 dark:border-indigo-900 dark:bg-indigo-950/30"><h2 className="font-bold">Subscription</h2>{subscription ? <><p className="mt-2 text-sm font-semibold capitalize">{String(subscription.plan_snapshot.name || subscription.status)} · {subscription.status.replaceAll('_', ' ')}</p><p className="mt-1 text-sm text-slate-700 dark:text-slate-300">{subscription.expires_at ? `${Math.max(0, Math.ceil((new Date(subscription.expires_at).getTime() - currentTime) / 86400000))} days remaining · Expires ${new Date(subscription.expires_at).toLocaleDateString()}` : 'No expiry date'}</p>{subscription.expires_at && (new Date(subscription.expires_at).getTime() - currentTime) < 7 * 86400000 && <p className="mt-2 text-xs font-bold text-amber-700">Your plan expires soon. Choose a plan below to continue.</p>}</> : <p className="mt-2 text-sm leading-6">{profile.status === 'approved' ? 'Your trial has expired or is not active. Choose a paid plan to continue.' : 'Subscription access starts after your seller application is approved.'}</p>}
            {profile.status === 'approved' && plans.filter((plan) => plan.plan_type === 'paid').map((plan) => { const currentKeys = Array.isArray(subscription?.plan_snapshot.features) ? (subscription?.plan_snapshot.features as { key?: string; enabled?: boolean }[]).filter((feature) => feature.enabled).map((feature) => feature.key) : []; const locked = (plan.subscription_plan_features || []).filter((feature) => feature.is_enabled && !currentKeys.includes(feature.feature_key)); return locked.length ? <p key={plan.id} className="mt-2 text-xs text-slate-600 dark:text-slate-300"><b>{plan.name} unlocks:</b> {locked.map((feature) => feature.label).join(', ')}</p> : null; })}
            {pendingPayment && <p className="mt-3 rounded-xl bg-amber-100 p-3 text-sm text-amber-900">A payment is awaiting review. {String(pendingPayment.status || '')}</p>}
            {profile.status === 'approved' && !pendingPayment && plans.some((plan) => plan.plan_type === 'paid') && <form onSubmit={submitPlanPayment} className="mt-4 space-y-3"><label className="block text-xs font-bold">Choose a plan<select className={inputClass} value={selectedPlan} onChange={(event) => setSelectedPlan(event.target.value)}>{plans.filter((plan) => plan.plan_type === 'paid').map((plan) => <option key={plan.id} value={plan.id}>{plan.name}{plan.is_popular ? ' · Popular' : ''} — {plan.currency} {Number(plan.price).toLocaleString()} / {plan.duration_days} days</option>)}</select></label>{paymentMethods.length > 0 ? <><label className="block text-xs font-bold">Payment method<select className={inputClass} value={selectedMethod} onChange={(event) => setSelectedMethod(event.target.value)}>{paymentMethods.map((method) => <option key={method.id} value={method.id}>{method.name}</option>)}</select></label>{paymentMethods.find((method) => method.id === selectedMethod) && <div className="rounded-xl bg-white p-3 text-xs leading-5 dark:bg-slate-900"><p className="whitespace-pre-wrap">{paymentMethods.find((method) => method.id === selectedMethod)?.instructions}</p>{Object.entries(paymentMethods.find((method) => method.id === selectedMethod)?.public_details || {}).map(([key, value]) => <p key={key}><b>{key.replaceAll('_', ' ')}:</b> {String(value)}</p>)}</div>}<label className="block text-xs font-bold">Transaction ID / reference<input className={inputClass} required minLength={3} maxLength={200} value={transactionReference} onChange={(event) => setTransactionReference(event.target.value)} /></label><button disabled={busy} className="min-h-10 rounded-xl bg-indigo-600 px-4 text-xs font-bold text-white disabled:opacity-50">Submit for manual review</button></> : <p className="text-sm">Payment instructions are not configured yet. Contact UniSoko support.</p>}</form>}
          </article>
          <article className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"><h2 className="font-bold">Product workflow</h2><p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">Phase 2 supports private drafts. Dynamic product details and listing review will be added in later phases.</p><button type="button" onClick={() => setTab('products')} className="mt-4 min-h-10 rounded-xl bg-slate-900 px-4 text-xs font-bold text-white dark:bg-white dark:text-slate-900">View products</button></article>
        </section>
      </div>}

      {!loading && tab === 'products' && <div className="mt-5 space-y-5">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-lg font-extrabold">Product drafts</h2><p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Drafts are private and will not appear in marketplace search.</p></div><div className="flex flex-wrap gap-2">{['all', 'draft', 'pending_approval', 'approved', 'rejected', 'changes_requested', 'archived'].map((status) => <button type="button" key={status} onClick={() => setFilter(status)} className={`min-h-9 rounded-full px-3 text-[11px] font-bold capitalize ${filter === status ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200'}`}>{status === 'all' ? `All (${products.length})` : `${status.replaceAll('_', ' ')} (${counts[status] || 0})`}</button>)}</div></div>
          {approved ? <form onSubmit={saveProduct} className="mt-5 space-y-5 rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/70">
            <div><h3 className="font-bold">{editingId ? 'Edit product draft' : 'Create a product draft'}</h3><p className="mt-1 text-xs text-slate-500">Your progress is saved in this browser while you work. Saving creates a private draft.</p></div>
            <ol className="grid grid-cols-3 gap-2 sm:grid-cols-6" aria-label="Product creation steps">
              {['Category', 'Condition', 'Specifications', 'Images', 'Description', 'Preview'].map((label, index) => {
                const canVisit = index <= Math.max(productStep, maxStepReached) || Boolean(editingId);
                return (
                  <li key={label}>
                    <button
                      type="button"
                      onClick={() => {
                        if (canVisit) setProductStep(index);
                      }}
                      className={`min-h-10 w-full rounded-lg px-2 text-[11px] font-bold transition cursor-pointer ${
                        productStep === index
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : canVisit
                          ? 'bg-indigo-100 text-indigo-800 hover:bg-indigo-200 dark:bg-indigo-950/50 dark:text-indigo-300'
                          : 'bg-white text-slate-400 dark:bg-slate-900 dark:text-slate-600 cursor-not-allowed opacity-75'
                      }`}
                    >
                      {index + 1}. {label}
                    </button>
                  </li>
                );
              })}
            </ol>

            {/* STEP 0: PRESSABLE CATEGORY & SUBCATEGORY SELECTION */}
            {productStep === 0 && (
              <div className="space-y-5">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Product Category <span className="text-rose-500">*</span>
                    </label>
                    {draft.categoryId && (
                      <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <Check className="h-3 w-3 stroke-[3]" />
                        Selected: {effectiveCategories.find((c) => c.id === draft.categoryId)?.name}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mb-3">
                    Press a category card to assign the department for your item:
                  </p>

                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {effectiveCategories.map((category) => {
                      const isSelected = draft.categoryId === category.id;
                      return (
                        <button
                          key={category.id}
                          type="button"
                          onClick={() => {
                            setDraft({ ...draft, categoryId: category.id, subcategoryId: '', specs: {} });
                            setError('');
                          }}
                          className={`group relative flex flex-col items-start p-3.5 rounded-xl border-2 text-left transition-all cursor-pointer ${
                            isSelected
                              ? 'border-indigo-600 bg-indigo-50/90 dark:bg-indigo-950/60 text-indigo-950 dark:text-indigo-100 shadow-md ring-2 ring-indigo-500/20'
                              : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 hover:border-indigo-400 dark:hover:border-indigo-600 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                          }`}
                        >
                          <div className="flex items-center justify-between w-full mb-2">
                            <span
                              className={`p-2 rounded-lg transition-colors ${
                                isSelected
                                  ? 'bg-indigo-600 text-white shadow-sm'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 group-hover:bg-indigo-100 group-hover:text-indigo-700 dark:group-hover:bg-indigo-900/50 dark:group-hover:text-indigo-300'
                              }`}
                            >
                              {getCategoryIcon(category.name)}
                            </span>
                            {isSelected && (
                              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-white shadow-sm">
                                <Check className="h-3 w-3 stroke-[3]" />
                              </span>
                            )}
                          </div>
                          <span className="text-xs font-bold leading-snug line-clamp-2">{category.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Subcategory Pills */}
                {draft.categoryId && (
                  <div className="pt-4 border-t border-slate-200 dark:border-slate-700/80">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        Subcategory <span className="font-normal text-slate-500">(Press to filter or specialize)</span>
                      </label>
                      {draft.subcategoryId && (
                        <button
                          type="button"
                          onClick={() => setDraft({ ...draft, subcategoryId: '', specs: {} })}
                          className="text-xs font-semibold text-indigo-600 hover:underline dark:text-indigo-400"
                        >
                          Reset to General
                        </button>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setDraft({ ...draft, subcategoryId: '', specs: {} })}
                        className={`px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                          !draft.subcategoryId
                            ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm ring-1 ring-slate-900 dark:ring-white'
                            : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-400'
                        }`}
                      >
                        All / General {effectiveCategories.find((c) => c.id === draft.categoryId)?.name || ''}
                      </button>

                      {effectiveSubcategories
                        .filter((item) => item.category_id === draft.categoryId)
                        .map((item) => {
                          const isSubSelected = draft.subcategoryId === item.id;
                          return (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => {
                                setDraft({ ...draft, subcategoryId: item.id, specs: {} });
                                setError('');
                              }}
                              className={`px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                                isSubSelected
                                  ? 'bg-indigo-600 text-white shadow-sm ring-1 ring-indigo-500'
                                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-indigo-400 dark:hover:border-indigo-600'
                              }`}
                            >
                              {isSubSelected && <Check className="h-3 w-3 stroke-[3]" />}
                              <span>{item.name}</span>
                            </button>
                          );
                        })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* STEP 1: PRESSABLE CONDITION SELECTION */}
            {productStep === 1 && (
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold block text-slate-800 dark:text-slate-200 mb-1">
                    Product Condition <span className="text-rose-500">*</span>
                  </label>
                  <p className="text-xs text-slate-500 mb-3">Press a condition card to describe the physical state of your gadget:</p>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  {effectiveConditions.map((condition) => {
                    const isCondSelected = draft.conditionId === condition.id;
                    return (
                      <button
                        key={condition.id}
                        type="button"
                        onClick={() => {
                          setDraft({ ...draft, conditionId: condition.id, specs: {} });
                          setError('');
                        }}
                        className={`cursor-pointer rounded-xl border-2 p-4 text-left transition-all ${
                          isCondSelected
                            ? 'border-indigo-600 bg-indigo-50/90 dark:bg-indigo-950/50 shadow-sm ring-2 ring-indigo-500/20 text-indigo-950 dark:text-indigo-100'
                            : 'border-slate-200 bg-white hover:border-indigo-300 dark:border-slate-700 dark:bg-slate-900 text-slate-800 dark:text-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <b className="text-sm font-bold">{condition.name}</b>
                          {isCondSelected && (
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-white shadow-sm">
                              <Check className="h-3 w-3 stroke-[3]" />
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{condition.description}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* STEP 2: DYNAMIC SPECIFICATIONS */}
            {productStep === 2 && (
              <div className="grid gap-4 sm:grid-cols-2">
                {!draft.categoryId || !draft.conditionId ? (
                  <p className="text-sm text-amber-700 sm:col-span-2">Choose a category and condition first.</p>
                ) : applicableAttributes.length === 0 ? (
                  <div className="rounded-xl bg-slate-100 p-4 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300 sm:col-span-2">
                    <p className="font-semibold text-slate-800 dark:text-slate-200 mb-1">Standard Item Specs</p>
                    <p>Add useful details such as processor, memory, storage, or included accessories.</p>
                    <div className="mt-3 space-y-2">
                      {Object.entries(draft.specs).map(([name, value]) => (
                        <div key={name} className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)_auto]">
                          <input aria-label="Specification name" maxLength={80} value={name} onChange={(event) => {
                            const nextName = event.target.value;
                            setDraft((current) => {
                              const specs = { ...current.specs };
                              const currentValue = specs[name];
                              delete specs[name];
                              specs[nextName] = currentValue;
                              return { ...current, specs };
                            });
                          }} className="min-h-10 rounded-lg border border-slate-300 bg-white px-3 text-xs dark:border-slate-700 dark:bg-slate-950" />
                          <input aria-label={`${name} value`} maxLength={300} value={String(value ?? '')} onChange={(event) => setDraft((current) => ({ ...current, specs: { ...current.specs, [name]: event.target.value } }))} className="min-h-10 rounded-lg border border-slate-300 bg-white px-3 text-xs dark:border-slate-700 dark:bg-slate-950" />
                          <button type="button" onClick={() => setDraft((current) => { const specs = { ...current.specs }; delete specs[name]; return { ...current, specs }; })} className="min-h-10 rounded-lg border border-slate-300 px-3 text-xs font-semibold hover:bg-white dark:border-slate-700 dark:hover:bg-slate-900">Remove</button>
                        </div>
                      ))}
                      <button type="button" onClick={addSpecification} className="min-h-10 rounded-lg border border-slate-300 px-3 text-xs font-bold hover:bg-white dark:border-slate-700 dark:hover:bg-slate-900">Add specification</button>
                    </div>
                  </div>
                ) : (
                  applicableAttributes.map((attribute) => (
                    <label key={attribute.id} className="text-xs font-bold">
                      {attribute.name}
                      {attribute.is_required && <span className="text-rose-600"> *</span>}
                      {attribute.input_type === 'text' && (
                        <input
                          className={inputClass}
                          required={attribute.is_required}
                          maxLength={Number(attribute.validation_rules.maxLength || 500)}
                          value={String(draft.specs[attribute.attribute_key] ?? '')}
                          onChange={(event) =>
                            setDraft({ ...draft, specs: { ...draft.specs, [attribute.attribute_key]: event.target.value } })
                          }
                        />
                      )}
                      {attribute.input_type === 'number' && (
                        <input
                          className={inputClass}
                          required={attribute.is_required}
                          type="number"
                          min={typeof attribute.validation_rules.min === 'number' ? attribute.validation_rules.min : undefined}
                          max={typeof attribute.validation_rules.max === 'number' ? attribute.validation_rules.max : undefined}
                          value={typeof draft.specs[attribute.attribute_key] === 'number' ? String(draft.specs[attribute.attribute_key]) : ''}
                          onChange={(event) =>
                            setDraft({
                              ...draft,
                              specs: {
                                ...draft.specs,
                                [attribute.attribute_key]: event.target.value === '' ? '' : Number(event.target.value),
                              },
                            })
                          }
                        />
                      )}
                      {attribute.input_type === 'boolean' && (
                        <select
                          required={attribute.is_required}
                          className={inputClass}
                          value={draft.specs[attribute.attribute_key] === true ? 'true' : draft.specs[attribute.attribute_key] === false ? 'false' : ''}
                          onChange={(event) =>
                            setDraft({
                              ...draft,
                              specs: {
                                ...draft.specs,
                                [attribute.attribute_key]: event.target.value === '' ? '' : event.target.value === 'true',
                              },
                            })
                          }
                        >
                          <option value="">Choose</option>
                          <option value="true">Yes</option>
                          <option value="false">No</option>
                        </select>
                      )}
                      {attribute.input_type === 'select' && (
                        <select
                          required={attribute.is_required}
                          className={inputClass}
                          value={String(draft.specs[attribute.attribute_key] ?? '')}
                          onChange={(event) =>
                            setDraft({ ...draft, specs: { ...draft.specs, [attribute.attribute_key]: event.target.value } })
                          }
                        >
                          <option value="">Choose option</option>
                          {attribute.product_attribute_options.filter((option) => option.is_active !== false).map((option) => (
                            <option key={option.id} value={option.value}>{option.label}</option>
                          ))}
                        </select>
                      )}
                      {attribute.input_type === 'multiselect' && (
                        <select
                          required={attribute.is_required}
                          multiple
                          className={`${inputClass} min-h-28`}
                          value={Array.isArray(draft.specs[attribute.attribute_key]) ? (draft.specs[attribute.attribute_key] as string[]) : []}
                          onChange={(event) =>
                            setDraft({
                              ...draft,
                              specs: {
                                ...draft.specs,
                                [attribute.attribute_key]: Array.from(event.target.selectedOptions, (option) => option.value),
                              },
                            })
                          }
                        >
                          {attribute.product_attribute_options.filter((option) => option.is_active !== false).map((option) => (
                            <option key={option.id} value={option.value}>{option.label}</option>
                          ))}
                        </select>
                      )}
                    </label>
                  ))
                )}
              </div>
            )}

            {/* STEP 3: IMAGES */}
            {productStep === 3 && (
              <div>
                <label className="block text-xs font-bold">
                  Product images <span className="font-normal text-slate-500">(1–8, JPG/PNG/WebP, up to 5 MB each)</span>
                  <input
                    className={`${inputClass} py-2`}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    disabled={uploadingImages || draft.images.length >= 8}
                    onChange={(event) => {
                      void uploadImages(event.target.files);
                      event.currentTarget.value = '';
                    }}
                  />
                </label>
                {uploadingImages && <p className="mt-2 text-xs text-indigo-600">Uploading images…</p>}
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {draft.images.map((path) => (
                    <article key={path} className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
                      <img className="aspect-square w-full object-cover" src={imagePreviews[path] || '/favicon.svg'} alt="Product upload preview" />
                      <button type="button" onClick={() => void removeImage(path)} className="w-full p-2 text-xs font-bold text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40">
                        Remove image
                      </button>
                    </article>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 4: DESCRIPTION & DETAILS */}
            {productStep === 4 && (
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="text-xs font-bold">
                  Product name <span className="text-rose-500">*</span>
                  <input
                    className={inputClass}
                    required
                    minLength={2}
                    maxLength={300}
                    placeholder="e.g. MacBook Air M2 13-inch 8GB/256GB Midnight"
                    value={draft.name}
                    onChange={(event) => setDraft({ ...draft, name: event.target.value })}
                  />
                </label>
                <label className="text-xs font-bold">
                  Price (TZS) <span className="text-rose-500">*</span>
                  <input
                    className={inputClass}
                    required
                    type="number"
                    inputMode="decimal"
                    min="1"
                    step="1"
                    placeholder="e.g. 1850000"
                    value={draft.price}
                    onChange={(event) => setDraft({ ...draft, price: event.target.value })}
                  />
                </label>
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 dark:border-emerald-900 dark:bg-emerald-950/20 sm:col-span-2">
                  <label className="flex items-center gap-2 text-xs font-bold"><input type="checkbox" checked={draft.wholesaleEnabled} onChange={(event) => setDraft({ ...draft, wholesaleEnabled: event.target.checked })} />Enable Bei ya Jumla for this product</label>
                  {draft.wholesaleEnabled && <div className="mt-3 grid gap-3 sm:grid-cols-2"><label className="text-xs font-semibold">Wholesale discount (%)<input className={inputClass} type="number" min="0" max="5" step="0.5" value={draft.wholesaleDiscountPercent} onChange={(event) => setDraft({ ...draft, wholesaleDiscountPercent: event.target.value })} /></label><label className="text-xs font-semibold">Minimum units<input className={inputClass} type="number" min="2" max="12" step="1" value={draft.wholesaleMinimum} onChange={(event) => setDraft({ ...draft, wholesaleMinimum: event.target.value })} /></label><p className="text-[11px] text-slate-600 dark:text-slate-300 sm:col-span-2">Final reductions remain capped at 5% and TZS 10,000 per unit.</p></div>}
                </div>
                <label className="text-xs font-bold sm:col-span-2">
                  Description <span className="text-rose-500">*</span> <span className="font-normal text-slate-500">({draft.description.length}/4,000)</span>
                  <textarea
                    className={`${inputClass} min-h-32 py-3`}
                    required
                    minLength={10}
                    maxLength={4000}
                    placeholder="Describe condition, battery health, accessories included, and pickup points..."
                    value={draft.description}
                    onChange={(event) => setDraft({ ...draft, description: event.target.value })}
                  />
                </label>
              </div>
            )}

            {/* STEP 5: PREVIEW */}
            {productStep === 5 && (
              <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
                <h4 className="text-lg font-black">{draft.name || 'Product preview'}</h4>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                  {effectiveCategories.find((item) => item.id === draft.categoryId)?.name}
                  {draft.subcategoryId ? ` · ${effectiveSubcategories.find((item) => item.id === draft.subcategoryId)?.name || ''}` : ''}
                  {' · '}
                  {effectiveConditions.find((item) => item.id === draft.conditionId)?.name || 'Condition not selected'}
                </p>
                <p className="mt-2 text-xl font-black text-indigo-600 dark:text-indigo-400">
                  TZS {Number(draft.price || 0).toLocaleString('en-TZ')}
                </p>
                <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {draft.images.map((path) => (
                    <img key={path} className="aspect-square w-full rounded-lg object-cover" src={imagePreviews[path] || '/favicon.svg'} alt="Product preview" />
                  ))}
                </div>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700 dark:text-slate-300">
                  {draft.description || 'Add a product description.'}
                </p>
                {Object.keys(draft.specs).length > 0 && (
                  <dl className="mt-4 grid gap-2 sm:grid-cols-2">
                    {Object.entries(draft.specs)
                      .filter(([, value]) => value !== '' && value !== undefined)
                      .map(([key, value]) => (
                        <div key={key} className="rounded-lg bg-slate-50 p-2.5 text-xs dark:bg-slate-800">
                          <dt className="font-bold text-slate-600 dark:text-slate-400">
                            {applicableAttributes.find((attribute) => attribute.attribute_key === key)?.name || key}
                          </dt>
                          <dd className="font-semibold text-slate-900 dark:text-slate-100 mt-0.5">
                            {Array.isArray(value) ? value.join(', ') : String(value)}
                          </dd>
                        </div>
                      ))}
                  </dl>
                )}
                <p className="mt-4 rounded-lg bg-indigo-50 p-3 text-xs text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-200">
                  This preview will be saved as a private draft. Once ready, you can submit it for listing approval.
                </p>
              </div>
            )}

            {/* FORM CONTROLS & CONTINUATION */}
            <div className="flex flex-wrap justify-between gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <div className="flex gap-2">
                {productStep > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setProductStep((step) => Math.max(0, step - 1));
                    }}
                    className="min-h-11 rounded-xl border border-slate-300 px-5 text-xs font-bold cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                  >
                    Back
                  </button>
                )}
                {productStep < 5 && (
                  <button
                    type="button"
                    onClick={() => {
                      if (productStep === 0 && !draft.categoryId) {
                        setError('Please press a category card to choose a product department.');
                        return;
                      }
                      if (productStep === 1 && !draft.conditionId) {
                        setError('Please press a condition card to describe product quality.');
                        return;
                      }
                      if (
                        productStep === 2 &&
                        applicableAttributes.some(
                          (attribute) =>
                            attribute.is_required &&
                            (draft.specs[attribute.attribute_key] === undefined ||
                              draft.specs[attribute.attribute_key] === '' ||
                              (Array.isArray(draft.specs[attribute.attribute_key]) &&
                                !(draft.specs[attribute.attribute_key] as unknown[]).length))
                        )
                      ) {
                        setError('Complete each required specification to continue.');
                        return;
                      }
                      if (productStep === 3 && draft.images.length === 0) {
                        setError('Add at least one product image to continue.');
                        return;
                      }
                      if (
                        productStep === 4 &&
                        (!draft.name.trim() || Number(draft.price) <= 0 || draft.description.trim().length < 10)
                      ) {
                        setError('Add the product name, a positive price, and a description of at least 10 characters.');
                        return;
                      }
                      setError('');
                      setMaxStepReached((prev) => Math.max(prev, productStep + 1));
                      setProductStep((step) => step + 1);
                    }}
                    className="min-h-11 rounded-xl bg-slate-900 px-5 text-xs font-bold text-white dark:bg-white dark:text-slate-900 hover:bg-slate-800 cursor-pointer transition shadow-sm"
                  >
                    Continue
                  </button>
                )}
              </div>
              <div className="flex gap-2">
                {editingId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingId(null);
                      setDraft(emptyProductDraft);
                      setImagePreviews({});
                      setProductStep(0);
                    }}
                    className="min-h-11 rounded-xl border border-slate-300 px-4 text-xs font-bold cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                  >
                    Cancel edit
                  </button>
                )}
                {productStep === 5 && (
                  <button
                    type="submit"
                    disabled={busy || uploadingImages || !draft.images.length}
                    className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-indigo-600 px-5 text-xs font-bold text-white disabled:opacity-50 hover:bg-indigo-700 transition cursor-pointer shadow-md shadow-indigo-600/20"
                  >
                    <Save className="h-4 w-4" />
                    {busy ? 'Saving…' : 'Save private draft'}
                  </button>
                )}
              </div>
            </div>
          </form> : <p className="mt-5 rounded-xl bg-slate-50 p-4 text-sm text-slate-700 dark:bg-slate-800 dark:text-slate-200">Your application must be approved before you can create product drafts.</p>}
        </section>
        <section className="divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white px-5 dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-900" aria-label="Seller products">
        {visibleProducts.length === 0 ? <p className="py-8 text-center text-sm text-slate-500">No products in this status.</p> : visibleProducts.map((product) => <article key={product.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><h3 className="truncate text-sm font-bold">{product.name}</h3><p className="mt-1 text-xs text-slate-500">{product.category}{product.subcategory_id ? ` · ${subcategories.find((subcategory) => subcategory.id === product.subcategory_id)?.name || ''}` : ''} · TZS {Number(product.price).toLocaleString('en-TZ')} · <span className="capitalize">{product.listing_status.replaceAll('_', ' ')}</span></p><p className="mt-1 line-clamp-2 text-xs text-slate-600 dark:text-slate-300">{product.description}</p>{product.listing_status === 'approved' && <SellerPromotionSettings product={product} onSaved={() => void load().catch(() => undefined)} />}{product.moderation_notes && <p className="mt-2 rounded-lg bg-amber-50 p-2 text-xs text-amber-900 dark:bg-amber-950/40 dark:text-amber-100">Admin feedback: {product.moderation_notes}</p>}</div><div className="flex shrink-0 gap-2">{['draft', 'rejected', 'changes_requested'].includes(product.listing_status) && <button type="button" disabled={busy} onClick={() => void submitProduct(product)} className="inline-flex min-h-10 items-center gap-1.5 rounded-lg bg-indigo-600 px-3 text-xs font-bold text-white disabled:opacity-50">Submit for review</button>}{['draft', 'rejected', 'changes_requested'].includes(product.listing_status) && <button type="button" onClick={() => startEdit(product)} className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-slate-300 px-3 text-xs font-bold"><Pencil className="h-3.5 w-3.5" />Edit</button>}{['draft', 'rejected', 'changes_requested'].includes(product.listing_status) && <button type="button" disabled={busy} onClick={() => void archiveProduct(product)} className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-slate-300 px-3 text-xs font-bold disabled:opacity-50"><Archive className="h-3.5 w-3.5" />Archive</button>}</div></article>)}
        </section>
      </div>}

      {!loading && tab === 'profile' && <form onSubmit={saveProfile} className="mt-5 max-w-3xl space-y-5 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 sm:p-6">
        <div><h2 className="text-lg font-extrabold">Seller profile</h2><p className="mt-1 text-sm text-slate-600 dark:text-slate-300">These fields can be updated by the approved seller account owner.</p></div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-xs font-bold">Shop WhatsApp number<input className={inputClass} maxLength={32} placeholder="+255..." value={profileForm.phone} onChange={(event) => setProfileForm({ ...profileForm, phone: event.target.value })} /></label>
          <label className="text-xs font-bold">Till network<select className={inputClass} value={profileForm.tillNetwork} onChange={(event) => setProfileForm({ ...profileForm, tillNetwork: event.target.value })}><option>M-Pesa</option><option>Tigo Pesa</option><option>Airtel Money</option></select></label>
          <label className="text-xs font-bold">Till number<input className={inputClass} inputMode="numeric" maxLength={20} placeholder="Mobile-money till" value={profileForm.tillNumber} onChange={(event) => setProfileForm({ ...profileForm, tillNumber: event.target.value })} /></label>
          <label className="text-xs font-bold">Till account name<input className={inputClass} maxLength={120} value={profileForm.tillAccountName} onChange={(event) => setProfileForm({ ...profileForm, tillAccountName: event.target.value })} /></label>
        </div>
        <label className="block text-xs font-bold">About your shop<textarea className={`${inputClass} min-h-28 py-3`} maxLength={2000} value={profileForm.description} onChange={(event) => setProfileForm({ ...profileForm, description: event.target.value })} /></label>
        <p className="text-xs text-slate-500">Verified email: {email}</p>
        <button type="submit" disabled={busy || !approved} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-50"><Save className="h-4 w-4" />Save profile</button>
      </form>}
    </main>
  );
}

function SellerPromotionSettings({ product, onSaved }: { product: SellerProduct; onSaved: () => void }) {
  const [wingaEnabled, setWingaEnabled] = useState(Boolean(product.seller_winga_campaign_enabled));
  const [rate, setRate] = useState(Number(product.seller_winga_commission_rate || 0.05) * 100);
  const [wholesaleEnabled, setWholesaleEnabled] = useState(Boolean(product.seller_wholesale_enabled));
  const [wholesaleDiscountPercent, setWholesaleDiscountPercent] = useState(Number(product.seller_wholesale_discount_percent ?? 5));
  const [wholesaleMinimum, setWholesaleMinimum] = useState(Number(product.seller_wholesale_minimum || 3));
  const [groupBuyEnabled, setGroupBuyEnabled] = useState(Boolean(product.seller_group_buy_enabled));
  const [groupBuyMinimum, setGroupBuyMinimum] = useState(Number(product.seller_group_buy_minimum || 3));
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const save = async (event: FormEvent) => {
    event.preventDefault(); setBusy(true); setError(''); setMessage('');
    try {
      const response = await fetch('/api/seller/marketing', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: product.id, wingaEnabled, wingaRatePercent: rate, wholesaleEnabled, wholesaleDiscountPercent, wholesaleMinimum, groupBuyEnabled, groupBuyMinimum }) });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || 'Could not save promotion settings.');
      setMessage('Product pricing and campaign settings saved.'); onSaved();
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Could not save promotion settings.'); }
    finally { setBusy(false); }
  };
  return (
    <form onSubmit={save} className="mt-3 max-w-2xl rounded-xl border border-indigo-100 bg-indigo-50/60 p-3 dark:border-indigo-900 dark:bg-indigo-950/20">
      <p className="text-xs font-bold">Product pricing and promotions</p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <label className="flex items-start gap-2 text-xs"><input type="checkbox" checked={wholesaleEnabled} onChange={(event) => setWholesaleEnabled(event.target.checked)} /><span>Enable Bei ya Jumla for this product.</span></label>
        {wholesaleEnabled && <>
          <label className="text-xs font-semibold">Wholesale discount (%)<input type="number" min="0" max="5" step="0.5" value={wholesaleDiscountPercent} onChange={(event) => setWholesaleDiscountPercent(Number(event.target.value))} className="mt-1 block min-h-9 w-full rounded-lg border px-2 dark:bg-slate-950" /></label>
          <label className="text-xs font-semibold">Minimum units<input type="number" min="2" max="12" step="1" value={wholesaleMinimum} onChange={(event) => setWholesaleMinimum(Number(event.target.value))} className="mt-1 block min-h-9 w-full rounded-lg border px-2 dark:bg-slate-950" /></label>
        </>}
        <label className="flex items-start gap-2 text-xs"><input type="checkbox" checked={groupBuyEnabled} onChange={(event) => setGroupBuyEnabled(event.target.checked)} /><span>Offer this product through Group Buy.</span></label>
        {groupBuyEnabled && <label className="text-xs font-semibold">Students needed<input type="number" min="2" max="100" required value={groupBuyMinimum} onChange={(event) => setGroupBuyMinimum(Number(event.target.value))} className="mt-1 block min-h-9 w-full rounded-lg border px-2 dark:bg-slate-950" /></label>}
        <label className="flex items-start gap-2 text-xs"><input type="checkbox" checked={wingaEnabled} onChange={(event) => setWingaEnabled(event.target.checked)} /><span>Allow Campus Wingas to promote this product and earn a seller-funded commission.</span></label>
        {wingaEnabled && <label className="text-xs font-semibold">Winga commission rate (%)<input type="number" min="1" max="30" step="0.5" required value={rate} onChange={(event) => setRate(Number(event.target.value))} className="mt-1 block min-h-9 w-full rounded-lg border px-2 dark:bg-slate-950" /></label>}
      </div>
      <p className="mt-2 text-[11px] text-slate-500">Wholesale reductions are capped at 5% and TZS 10,000 per unit. Group Buy uses a separate platform rate. Winga commission is payable after payment verification and delivery.</p>
      {error && <p role="alert" className="mt-2 text-xs text-rose-700">{error}</p>}
      {message && <p role="status" className="mt-2 text-xs text-emerald-700">{message}</p>}
      <button disabled={busy} className="mt-3 min-h-9 rounded-lg bg-indigo-600 px-3 text-xs font-bold text-white disabled:opacity-50">{busy ? 'Saving...' : 'Save settings'}</button>
    </form>
  );
}

function SellerCommissionSummary() {
  const [summary, setSummary] = useState<{ payable: number; paid: number } | null>(null);
  useEffect(() => { void Promise.resolve().then(async () => { const response = await fetch('/api/seller/marketing', { cache: 'no-store' }); if (response.ok) { const result = await response.json() as { totals?: { payable: number; paid: number } }; setSummary(result.totals || null); } }).catch(() => undefined); }, []);
  if (!summary) return null;
  return <section className="grid gap-3 sm:grid-cols-2"><StatCard icon={<Store className="h-5 w-5"/>} label="Winga commissions payable" value={`TZS ${summary.payable.toLocaleString('en-TZ')}`}/><StatCard icon={<ShieldCheck className="h-5 w-5"/>} label="Winga commissions paid" value={`TZS ${summary.paid.toLocaleString('en-TZ')}`}/></section>;
}

function StatCard({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return <article className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"><div className="flex items-center gap-2 text-indigo-600">{icon}<span className="text-[11px] font-bold uppercase tracking-wide text-slate-500">{label}</span></div><p className="mt-3 text-lg font-black capitalize">{value}</p></article>;
}
