import 'server-only';

import type { getSupabaseAdmin } from '@/lib/supabaseAdmin';

type SupabaseAdmin = NonNullable<ReturnType<typeof getSupabaseAdmin>>;
export type SellerEntitlement = { id: string; status: 'free_trial' | 'active' | 'expired' | 'pending' | 'rejected' | 'cancelled'; plan_snapshot: Record<string, unknown>; starts_at: string | null; expires_at: string | null };

export async function getSellerEntitlement(client: SupabaseAdmin, sellerProfileId: string) {
  const { data, error } = await client.from('subscriptions')
    .select('id,status,plan_snapshot,starts_at,expires_at')
    .eq('seller_profile_id', sellerProfileId)
    .in('status', ['free_trial', 'active'])
    .order('created_at', { ascending: false }).limit(1).maybeSingle();
  if (error || !data) return { entitlement: null as SellerEntitlement | null, error };
  if (data.expires_at && new Date(data.expires_at).getTime() <= Date.now()) {
    await client.from('subscriptions').update({ status: 'expired', updated_at: new Date().toISOString() }).eq('id', data.id).in('status', ['free_trial', 'active']);
    return { entitlement: { ...data, status: 'expired' } as SellerEntitlement, error: null };
  }
  return { entitlement: data as SellerEntitlement, error: null };
}

export function entitlementAllows(entitlement: SellerEntitlement | null, key: string) {
  const features = entitlement?.plan_snapshot.features;
  return Boolean(entitlement && ['free_trial', 'active'].includes(entitlement.status) && Array.isArray(features) && features.some((feature) => {
    if (!feature || typeof feature !== 'object') return false;
    const value = feature as { key?: unknown; enabled?: unknown };
    return value.key === key && value.enabled === true;
  }));
}
