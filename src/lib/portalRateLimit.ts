import 'server-only';

import { createHash } from 'node:crypto';
import type { NextRequest } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';

export async function allowPortalAuthAttempt(request: NextRequest, admin: SupabaseClient, action: 'register' | 'login', limit: number) {
  const address = request.headers.get('x-real-ip') || request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const subjectHash = createHash('sha256').update(address).digest('hex');
  const { data, error } = await admin.rpc('consume_portal_auth_rate_limit', {
    p_subject_hash: subjectHash,
    p_action: action,
    p_limit: limit,
    p_window_seconds: 900,
  });
  if (error) return 'unavailable' as const;
  return data === true ? 'allowed' as const : 'limited' as const;
}
