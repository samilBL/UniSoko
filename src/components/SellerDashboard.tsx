'use client';

import { type FormEvent, type ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { Archive, ClipboardList, Package, Pencil, Save, ShieldCheck, Store } from 'lucide-react';
import Link from 'next/link';
import WingaSignOutButton from '@/components/WingaSignOutButton';

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
type SellerProduct = { id: string; name: string; category: string; category_id: string | null; subcategory_id: string | null; product_condition_id: string | null; price: number | string; description: string; specs: Record<string, unknown>; images: string[]; imageUrls: string[]; listing_status: string; submitted_at: string | null; moderation_notes: string; created_at: string; updated_at: string };
type Category = { id: string; name: string };
type Subcategory = { id: string; category_id: string; name: string };
type Condition = { id: string; name: string; description: string };
type DynamicAttribute = { id: string; category_id: string | null; subcategory_id: string | null; product_condition_id: string | null; name: string; attribute_key: string; input_type: 'text' | 'number' | 'boolean' | 'select' | 'multiselect'; is_required: boolean; validation_rules: Record<string, unknown>; product_attribute_options: { id: string; value: string; label: string; is_active?: boolean }[] };
type Plan = { id: string; name: string; description: string; plan_type: string; price: number; currency: string; duration_days: number; product_limit: number | null; is_popular: boolean; slug: string; subscription_plan_features?: { feature_key: string; label: string; description: string; is_enabled: boolean }[] };
type PaymentMethod = { id: string; name: string; instructions: string; public_details: Record<string, unknown> };
type Subscription = { id: string; status: string; plan_snapshot: Record<string, unknown>; expires_at: string | null };
type Tab = 'overview' | 'products' | 'profile';

const inputClass = 'mt-1.5 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white';
const emptyProductDraft = { name: '', categoryId: '', subcategoryId: '', conditionId: '', price: '', description: '', specs: {} as Record<string, unknown>, images: [] as string[] };

export default function SellerDashboard({ email, initialProfile }: { email: string; initialProfile: Profile }) {
  const [profile, setProfile] = useState(initialProfile);
  const [products, setProducts] = useState<SellerProduct[]>([]);
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
  const [uploadingImages, setUploadingImages] = useState(false);
  const [profileForm, setProfileForm] = useState({ displayName: initialProfile.display_name, university: initialProfile.university, campus: initialProfile.campus || '', phone: typeof initialProfile.contact_options.phone === 'string' ? initialProfile.contact_options.phone : '', description: initialProfile.description });

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
      setProfileForm({ displayName: profileResult.profile.display_name, university: profileResult.profile.university, campus: profileResult.profile.campus || '', phone: typeof profileResult.profile.contact_options.phone === 'string' ? profileResult.profile.contact_options.phone : '', description: profileResult.profile.description || '' });
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
    setDraft({ name: product.name, categoryId: product.category_id || '', subcategoryId: product.subcategory_id || '', conditionId: product.product_condition_id || '', price: String(product.price), description: product.description || '', specs: product.specs || {}, images });
    setImagePreviews(Object.fromEntries(images.map((path, index) => [path, product.imageUrls[index] || ''])));
    setProductStep(0);
    setTab('products');
  };

  const applicableAttributes = attributes.filter((attribute) =>
    (!attribute.category_id || attribute.category_id === draft.categoryId) &&
    (!attribute.subcategory_id || attribute.subcategory_id === draft.subcategoryId) &&
    (!attribute.product_condition_id || attribute.product_condition_id === draft.conditionId));

  const approved = profile.status === 'approved';
  const statusClass = profile.status === 'approved' ? 'bg-emerald-100 text-emerald-800' : profile.status === 'rejected' ? 'bg-rose-100 text-rose-800' : profile.status === 'suspended' ? 'bg-slate-200 text-slate-800' : 'bg-amber-100 text-amber-900';

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-7 sm:px-6 sm:py-10">
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
        <div><p className="text-xs font-bold uppercase tracking-wider text-emerald-700">Seller dashboard</p><h1 className="mt-1 text-2xl font-black sm:text-3xl">Welcome, {profile.display_name}</h1><p className="mt-1 text-xs text-slate-500">{email}</p></div>
        <WingaSignOutButton />
      </div>
      <nav aria-label="Seller dashboard sections" className="mt-5 flex gap-2 overflow-x-auto border-b border-slate-200 pb-2 dark:border-slate-800">
        {([['overview', 'Overview'], ['products', 'Products'], ['profile', 'Seller profile']] as const).map(([key, label]) => <button key={key} type="button" onClick={() => setTab(key)} className={`min-h-10 shrink-0 rounded-xl px-4 text-xs font-bold ${tab === key ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'}`}>{label}</button>)}
      </nav>

      {error && <p role="alert" className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200">{error}</p>}
      {message && <p role="status" className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200">{message}</p>}
      {loading && <p className="py-8 text-sm text-slate-500" role="status">Loading seller dashboard…</p>}

      {!loading && tab === 'overview' && <div className="mt-5 space-y-5">
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
            <ol className="grid grid-cols-3 gap-2 sm:grid-cols-6" aria-label="Product creation steps">{['Category', 'Condition', 'Specifications', 'Images', 'Description', 'Preview'].map((label, index) => <li key={label}><button type="button" onClick={() => { if (index <= productStep) setProductStep(index); }} className={`min-h-10 w-full rounded-lg px-2 text-[11px] font-bold ${productStep === index ? 'bg-indigo-600 text-white' : index < productStep ? 'bg-indigo-100 text-indigo-800' : 'bg-white text-slate-500 dark:bg-slate-900'}`}>{index + 1}. {label}</button></li>)}</ol>
            {productStep === 0 && <div className="grid gap-4 sm:grid-cols-2"><label className="text-xs font-bold">Category<select className={inputClass} required value={draft.categoryId} onChange={(event) => setDraft({ ...draft, categoryId: event.target.value, subcategoryId: '', specs: {} })}><option value="">Choose category</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label><label className="text-xs font-bold">Subcategory <span className="font-normal text-slate-500">(optional)</span><select className={inputClass} value={draft.subcategoryId} disabled={!draft.categoryId} onChange={(event) => setDraft({ ...draft, subcategoryId: event.target.value, specs: {} })}><option value="">Choose subcategory</option>{subcategories.filter((item) => item.category_id === draft.categoryId).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>{categories.length === 0 && <p className="text-xs text-amber-700 sm:col-span-2">No active categories are configured yet. Ask an administrator to add marketplace categories.</p>}</div>}
            {productStep === 1 && <div className="grid gap-3 sm:grid-cols-2">{conditions.map((condition) => <label key={condition.id} className={`cursor-pointer rounded-xl border p-4 ${draft.conditionId === condition.id ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30' : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900'}`}><input className="mr-2" type="radio" name="productCondition" value={condition.id} checked={draft.conditionId === condition.id} onChange={() => setDraft({ ...draft, conditionId: condition.id, specs: {} })}/><b className="text-sm">{condition.name}</b><p className="mt-1 pl-6 text-xs text-slate-500">{condition.description}</p></label>)}</div>}
            {productStep === 2 && <div className="grid gap-4 sm:grid-cols-2">{!draft.categoryId || !draft.conditionId ? <p className="text-sm text-amber-700 sm:col-span-2">Choose a category and condition first.</p> : applicableAttributes.length === 0 ? <p className="text-sm text-slate-600 sm:col-span-2">No extra specifications are configured for this category and condition.</p> : applicableAttributes.map((attribute) => <label key={attribute.id} className="text-xs font-bold">{attribute.name}{attribute.is_required && <span className="text-rose-600"> *</span>}{attribute.input_type === 'text' && <input className={inputClass} required={attribute.is_required} maxLength={Number(attribute.validation_rules.maxLength || 500)} value={String(draft.specs[attribute.attribute_key] ?? '')} onChange={(event) => setDraft({ ...draft, specs: { ...draft.specs, [attribute.attribute_key]: event.target.value } })}/>}{attribute.input_type === 'number' && <input className={inputClass} required={attribute.is_required} type="number" min={typeof attribute.validation_rules.min === 'number' ? attribute.validation_rules.min : undefined} max={typeof attribute.validation_rules.max === 'number' ? attribute.validation_rules.max : undefined} value={typeof draft.specs[attribute.attribute_key] === 'number' ? String(draft.specs[attribute.attribute_key]) : ''} onChange={(event) => setDraft({ ...draft, specs: { ...draft.specs, [attribute.attribute_key]: event.target.value === '' ? '' : Number(event.target.value) } })}/>}{attribute.input_type === 'boolean' && <select required={attribute.is_required} className={inputClass} value={draft.specs[attribute.attribute_key] === true ? 'true' : draft.specs[attribute.attribute_key] === false ? 'false' : ''} onChange={(event) => setDraft({ ...draft, specs: { ...draft.specs, [attribute.attribute_key]: event.target.value === '' ? '' : event.target.value === 'true' } })}><option value="">Choose</option><option value="true">Yes</option><option value="false">No</option></select>}{attribute.input_type === 'select' && <select required={attribute.is_required} className={inputClass} value={String(draft.specs[attribute.attribute_key] ?? '')} onChange={(event) => setDraft({ ...draft, specs: { ...draft.specs, [attribute.attribute_key]: event.target.value } })}><option value="">Choose option</option>{attribute.product_attribute_options.filter((option) => option.is_active !== false).map((option) => <option key={option.id} value={option.value}>{option.label}</option>)}</select>}{attribute.input_type === 'multiselect' && <select required={attribute.is_required} multiple className={`${inputClass} min-h-28`} value={Array.isArray(draft.specs[attribute.attribute_key]) ? draft.specs[attribute.attribute_key] as string[] : []} onChange={(event) => setDraft({ ...draft, specs: { ...draft.specs, [attribute.attribute_key]: Array.from(event.target.selectedOptions, (option) => option.value) } })}>{attribute.product_attribute_options.filter((option) => option.is_active !== false).map((option) => <option key={option.id} value={option.value}>{option.label}</option>)}</select>}</label>)}</div>}
            {productStep === 3 && <div><label className="block text-xs font-bold">Product images <span className="font-normal text-slate-500">(1–8, JPG/PNG/WebP, up to 5 MB each)</span><input className={`${inputClass} py-2`} type="file" accept="image/jpeg,image/png,image/webp" multiple disabled={uploadingImages || draft.images.length >= 8} onChange={(event) => { void uploadImages(event.target.files); event.currentTarget.value = ''; }}/></label>{uploadingImages && <p className="mt-2 text-xs text-indigo-600">Uploading images…</p>}<div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">{draft.images.map((path) => <article key={path} className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900"><img className="aspect-square w-full object-cover" src={imagePreviews[path] || '/favicon.svg'} alt="Product upload preview"/><button type="button" onClick={() => void removeImage(path)} className="w-full p-2 text-xs font-bold text-rose-700">Remove image</button></article>)}</div></div>}
            {productStep === 4 && <div className="grid gap-4 sm:grid-cols-2"><label className="text-xs font-bold">Product name<input className={inputClass} required minLength={2} maxLength={300} value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })}/></label><label className="text-xs font-bold">Price (TZS)<input className={inputClass} required type="number" inputMode="decimal" min="1" step="1" value={draft.price} onChange={(event) => setDraft({ ...draft, price: event.target.value })}/></label><label className="text-xs font-bold sm:col-span-2">Description <span className="font-normal text-slate-500">({draft.description.length}/4,000)</span><textarea className={`${inputClass} min-h-32 py-3`} required minLength={10} maxLength={4000} value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })}/></label></div>}
            {productStep === 5 && <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900"><h4 className="text-lg font-black">{draft.name || 'Product preview'}</h4><p className="mt-1 text-sm text-slate-600">{categories.find((item) => item.id === draft.categoryId)?.name}{draft.subcategoryId ? ` · ${subcategories.find((item) => item.id === draft.subcategoryId)?.name || ''}` : ''} · {conditions.find((item) => item.id === draft.conditionId)?.name || 'Condition not selected'}</p><p className="mt-2 text-lg font-bold">TZS {Number(draft.price || 0).toLocaleString('en-TZ')}</p><div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">{draft.images.map((path) => <img key={path} className="aspect-square w-full rounded-lg object-cover" src={imagePreviews[path] || '/favicon.svg'} alt="Product preview"/>)}</div><p className="mt-3 whitespace-pre-wrap text-sm leading-6">{draft.description || 'Add a product description.'}</p>{Object.keys(draft.specs).length > 0 && <dl className="mt-4 grid gap-2 sm:grid-cols-2">{Object.entries(draft.specs).filter(([, value]) => value !== '' && value !== undefined).map(([key, value]) => <div key={key} className="rounded-lg bg-slate-50 p-2 text-xs dark:bg-slate-800"><dt className="font-bold">{applicableAttributes.find((attribute) => attribute.attribute_key === key)?.name || key}</dt><dd>{Array.isArray(value) ? value.join(', ') : String(value)}</dd></div>)}</dl>}<p className="mt-4 rounded-lg bg-indigo-50 p-3 text-xs text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-200">This preview will be saved as a private draft. Product submission for moderation is part of the next phase.</p></div>}
            <div className="flex flex-wrap justify-between gap-2"><div className="flex gap-2">{productStep > 0 && <button type="button" onClick={() => { setProductStep((step) => Math.max(0, step - 1)); }} className="min-h-10 rounded-xl border border-slate-300 px-4 text-xs font-bold">Back</button>}{productStep < 5 && <button type="button" onClick={() => { if (productStep === 0 && !draft.categoryId) { setError('Choose a category to continue.'); return; } if (productStep === 1 && !draft.conditionId) { setError('Choose a product condition to continue.'); return; } if (productStep === 2 && applicableAttributes.some((attribute) => attribute.is_required && (draft.specs[attribute.attribute_key] === undefined || draft.specs[attribute.attribute_key] === '' || (Array.isArray(draft.specs[attribute.attribute_key]) && !(draft.specs[attribute.attribute_key] as unknown[]).length)))) { setError('Complete each required specification to continue.'); return; } if (productStep === 3 && draft.images.length === 0) { setError('Add at least one product image to continue.'); return; } if (productStep === 4 && (!draft.name.trim() || Number(draft.price) <= 0 || draft.description.trim().length < 10)) { setError('Add the product name, a positive price, and a description of at least 10 characters.'); return; } setError(''); setProductStep((step) => step + 1); }} className="min-h-10 rounded-xl bg-slate-900 px-4 text-xs font-bold text-white dark:bg-white dark:text-slate-900">Continue</button>}</div><div className="flex gap-2">{editingId && <button type="button" onClick={() => { setEditingId(null); setDraft(emptyProductDraft); setImagePreviews({}); setProductStep(0); }} className="min-h-10 rounded-xl border border-slate-300 px-4 text-xs font-bold">Cancel edit</button>}{productStep === 5 && <button type="submit" disabled={busy || uploadingImages || !draft.images.length} className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-indigo-600 px-4 text-xs font-bold text-white disabled:opacity-50"><Save className="h-4 w-4"/>{busy ? 'Saving…' : 'Save private draft'}</button>}</div></div>
          </form> : <p className="mt-5 rounded-xl bg-slate-50 p-4 text-sm text-slate-700 dark:bg-slate-800 dark:text-slate-200">Your application must be approved before you can create product drafts.</p>}
        </section>
        <section className="divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white px-5 dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-900" aria-label="Seller products">
          {visibleProducts.length === 0 ? <p className="py-8 text-center text-sm text-slate-500">No products in this status.</p> : visibleProducts.map((product) => <article key={product.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><h3 className="truncate text-sm font-bold">{product.name}</h3><p className="mt-1 text-xs text-slate-500">{product.category}{product.subcategory_id ? ` · ${subcategories.find((subcategory) => subcategory.id === product.subcategory_id)?.name || ''}` : ''} · TZS {Number(product.price).toLocaleString('en-TZ')} · <span className="capitalize">{product.listing_status.replaceAll('_', ' ')}</span></p><p className="mt-1 line-clamp-2 text-xs text-slate-600 dark:text-slate-300">{product.description}</p>{product.moderation_notes && <p className="mt-2 rounded-lg bg-amber-50 p-2 text-xs text-amber-900 dark:bg-amber-950/40 dark:text-amber-100">Admin feedback: {product.moderation_notes}</p>}</div><div className="flex shrink-0 gap-2">{['draft', 'rejected', 'changes_requested'].includes(product.listing_status) && <button type="button" disabled={busy} onClick={() => void submitProduct(product)} className="inline-flex min-h-10 items-center gap-1.5 rounded-lg bg-indigo-600 px-3 text-xs font-bold text-white disabled:opacity-50">Submit for review</button>}{['draft', 'rejected', 'changes_requested'].includes(product.listing_status) && <button type="button" onClick={() => startEdit(product)} className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-slate-300 px-3 text-xs font-bold"><Pencil className="h-3.5 w-3.5" />Edit</button>}{['draft', 'rejected', 'changes_requested'].includes(product.listing_status) && <button type="button" disabled={busy} onClick={() => void archiveProduct(product)} className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-slate-300 px-3 text-xs font-bold disabled:opacity-50"><Archive className="h-3.5 w-3.5" />Archive</button>}</div></article>)}
        </section>
      </div>}

      {!loading && tab === 'profile' && <form onSubmit={saveProfile} className="mt-5 max-w-3xl space-y-5 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 sm:p-6">
        <div><h2 className="text-lg font-extrabold">Seller profile</h2><p className="mt-1 text-sm text-slate-600 dark:text-slate-300">These fields can be updated by the approved seller account owner.</p></div>
        <div className="grid gap-4 sm:grid-cols-2"><label className="text-xs font-bold">Seller or shop name<input className={inputClass} required minLength={2} maxLength={120} value={profileForm.displayName} onChange={(event) => setProfileForm({ ...profileForm, displayName: event.target.value })} /></label><label className="text-xs font-bold">University<input className={inputClass} required minLength={2} maxLength={160} value={profileForm.university} onChange={(event) => setProfileForm({ ...profileForm, university: event.target.value })} /></label><label className="text-xs font-bold">Campus<input className={inputClass} maxLength={160} value={profileForm.campus} onChange={(event) => setProfileForm({ ...profileForm, campus: event.target.value })} /></label><label className="text-xs font-bold">Buyer contact phone<input className={inputClass} maxLength={32} value={profileForm.phone} onChange={(event) => setProfileForm({ ...profileForm, phone: event.target.value })} /></label></div>
        <label className="block text-xs font-bold">About your shop<textarea className={`${inputClass} min-h-28 py-3`} maxLength={2000} value={profileForm.description} onChange={(event) => setProfileForm({ ...profileForm, description: event.target.value })} /></label>
        <p className="text-xs text-slate-500">Verified email: {email}</p>
        <button type="submit" disabled={busy || !approved} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-50"><Save className="h-4 w-4" />Save profile</button>
      </form>}
    </main>
  );
}

function StatCard({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return <article className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"><div className="flex items-center gap-2 text-indigo-600">{icon}<span className="text-[11px] font-bold uppercase tracking-wide text-slate-500">{label}</span></div><p className="mt-3 text-lg font-black capitalize">{value}</p></article>;
}
