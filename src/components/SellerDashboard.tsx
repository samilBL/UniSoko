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
type SellerProduct = { id: string; name: string; category: string; category_id: string | null; price: number | string; description: string; listing_status: string; created_at: string; updated_at: string };
type Category = { id: string; name: string };
type Plan = { id: string; name: string; description: string; plan_type: string; price: number; currency: string; duration_days: number; product_limit: number | null; is_popular: boolean; slug: string; subscription_plan_features?: { feature_key: string; label: string; description: string; is_enabled: boolean }[] };
type PaymentMethod = { id: string; name: string; instructions: string; public_details: Record<string, unknown> };
type Subscription = { id: string; status: string; plan_snapshot: Record<string, unknown>; expires_at: string | null };
type Tab = 'overview' | 'products' | 'profile';

const inputClass = 'mt-1.5 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white';

export default function SellerDashboard({ email, initialProfile }: { email: string; initialProfile: Profile }) {
  const [profile, setProfile] = useState(initialProfile);
  const [products, setProducts] = useState<SellerProduct[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
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
  const [draft, setDraft] = useState({ name: '', categoryId: '', price: '', description: '' });
  const [profileForm, setProfileForm] = useState({ displayName: initialProfile.display_name, university: initialProfile.university, campus: initialProfile.campus || '', phone: typeof initialProfile.contact_options.phone === 'string' ? initialProfile.contact_options.phone : '', description: initialProfile.description });

  const load = useCallback(async () => {
    const [profileResponse, productsResponse, subscriptionResponse] = await Promise.all([
      fetch('/api/seller/profile', { cache: 'no-store' }),
      fetch('/api/seller/products', { cache: 'no-store' }),
      fetch('/api/seller/subscriptions', { cache: 'no-store' }),
    ]);
    const profileResult = await profileResponse.json() as { profile?: Profile; verification?: { status?: string }; error?: string };
    const productsResult = await productsResponse.json() as { products?: SellerProduct[]; categories?: Category[]; error?: string };
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
    setPlans(subscriptionResult.plans || []);
    setPaymentMethods(subscriptionResult.paymentMethods || []);
    setSubscription(subscriptionResult.subscription || null);
    setPendingPayment(subscriptionResult.payment || null);
    if (subscriptionResult.plans?.length) setSelectedPlan((current) => current || subscriptionResult.plans?.find((plan) => plan.is_popular)?.id || subscriptionResult.plans?.find((plan) => plan.plan_type === 'paid')?.id || '');
    if (subscriptionResult.paymentMethods?.length) setSelectedMethod((current) => current || subscriptionResult.paymentMethods?.[0].id || '');
    setCurrentTime(Date.now());
  }, []);

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
      await load();
      setDraft({ name: '', categoryId: '', price: '', description: '' });
      setEditingId(null);
      setMessage('Draft saved. It is private and is not visible in the marketplace.');
    } catch (err) { setError(err instanceof Error ? err.message : 'Could not save product draft.'); }
    finally { setBusy(false); }
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
    setDraft({ name: product.name, categoryId: product.category_id || '', price: String(product.price), description: product.description || '' });
    setTab('products');
  };

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
          {approved ? <form onSubmit={saveProduct} className="mt-5 grid gap-4 rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/70 sm:grid-cols-2">
            <div className="sm:col-span-2"><h3 className="font-bold">{editingId ? 'Edit draft' : 'Create a product draft'}</h3><p className="mt-1 text-xs text-slate-500">This basic draft form is temporary. Phase 4 adds category-specific fields and product images.</p></div>
            <label className="text-xs font-bold">Product name<input className={inputClass} required minLength={2} maxLength={300} value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} /></label>
            <label className="text-xs font-bold">Category<select className={inputClass} required value={draft.categoryId} onChange={(event) => setDraft({ ...draft, categoryId: event.target.value })}><option value="">Choose category</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
            <label className="text-xs font-bold">Price (TZS)<input className={inputClass} required type="number" inputMode="decimal" min="1" step="1" value={draft.price} onChange={(event) => setDraft({ ...draft, price: event.target.value })} /></label>
            <label className="text-xs font-bold sm:col-span-2">Description<textarea className={`${inputClass} min-h-24 py-3`} maxLength={4000} value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} /></label>
            {categories.length === 0 && <p className="text-xs text-amber-700 sm:col-span-2">No active marketplace categories are available. Ask an administrator to configure categories.</p>}
            <div className="flex flex-wrap gap-2 sm:col-span-2"><button type="submit" disabled={busy || !categories.length} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-50"><Save className="h-4 w-4" />{busy ? 'Saving…' : 'Save private draft'}</button>{editingId && <button type="button" onClick={() => { setEditingId(null); setDraft({ name: '', categoryId: '', price: '', description: '' }); }} className="min-h-11 rounded-xl border border-slate-300 px-4 text-xs font-bold">Cancel edit</button>}</div>
          </form> : <p className="mt-5 rounded-xl bg-slate-50 p-4 text-sm text-slate-700 dark:bg-slate-800 dark:text-slate-200">Your application must be approved before you can create product drafts.</p>}
        </section>
        <section className="divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white px-5 dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-900" aria-label="Seller products">
          {visibleProducts.length === 0 ? <p className="py-8 text-center text-sm text-slate-500">No products in this status.</p> : visibleProducts.map((product) => <article key={product.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><h3 className="truncate text-sm font-bold">{product.name}</h3><p className="mt-1 text-xs text-slate-500">{product.category} · TZS {Number(product.price).toLocaleString('en-TZ')} · <span className="capitalize">{product.listing_status.replaceAll('_', ' ')}</span></p><p className="mt-1 line-clamp-2 text-xs text-slate-600 dark:text-slate-300">{product.description}</p></div><div className="flex shrink-0 gap-2">{['draft', 'rejected', 'changes_requested'].includes(product.listing_status) && <button type="button" onClick={() => startEdit(product)} className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-slate-300 px-3 text-xs font-bold"><Pencil className="h-3.5 w-3.5" />Edit</button>}{['draft', 'rejected', 'changes_requested'].includes(product.listing_status) && <button type="button" disabled={busy} onClick={() => void archiveProduct(product)} className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-slate-300 px-3 text-xs font-bold disabled:opacity-50"><Archive className="h-3.5 w-3.5" />Archive</button>}</div></article>)}
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
