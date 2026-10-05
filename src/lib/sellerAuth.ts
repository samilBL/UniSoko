import 'server-only';

import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { getSupabaseServer } from '@/lib/supabaseServer';

export async function getSellerActor() {
  const authClient = await getSupabaseServer();
  const serviceClient = getSupabaseAdmin();
  if (!authClient || !serviceClient) return { kind: 'unavailable' as const };

  const { data: { user }, error } = await authClient.auth.getUser();
  if (error || !user || !user.email_confirmed_at) return { kind: 'unauthorized' as const };

  return { kind: 'ok' as const, user, serviceClient };
}

export async function getSellerProfile(serviceClient: NonNullable<ReturnType<typeof getSupabaseAdmin>>, userId: string) {
  return serviceClient
    .from('seller_profiles')
    .select('id, user_id, display_name, university, campus, description, contact_options, status, created_at, updated_at')
    .eq('user_id', userId)
    .maybeSingle();
}
