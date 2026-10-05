import 'server-only';
import type { NextRequest } from 'next/server';
import { hasAdminRequestSession } from '@/lib/adminAuth';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

type AdminAuditEvent = {
  action: string;
  resourceType: string;
  resourceId: string;
  metadata?: Record<string, string | number | boolean | null>;
};

export async function writeAdminAuditEvent(request: NextRequest, event: AdminAuditEvent) {
  if (!hasAdminRequestSession(request)) return false;
  const supabase = getSupabaseAdmin();
  if (!supabase) return false;
  const { error } = await supabase.from('admin_audit_logs').insert({
    actor: process.env.ADMIN_USERNAME || 'admin',
    action: event.action.slice(0, 100),
    resource_type: event.resourceType.slice(0, 80),
    resource_id: event.resourceId.slice(0, 160),
    metadata: event.metadata || {},
  });
  if (error) {
    console.error('Admin audit write failed', { action: event.action, resourceType: event.resourceType, code: error.code });
    return false;
  }
  return true;
}
