import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_SESSION_COOKIE, isValidAdminSession } from '@/lib/adminAuth';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(request: NextRequest) {
  if (!isValidAdminSession(request.cookies.get(ADMIN_SESSION_COOKIE)?.value)) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ events: [], configured: false });
  const { data, error } = await supabase.from('admin_audit_logs')
    .select('id, actor, action, resource_type, resource_id, metadata, created_at')
    .order('created_at', { ascending: false })
    .limit(100);
  if (error) return NextResponse.json({ error: 'Could not load audit log.' }, { status: 500 });
  return NextResponse.json({ events: (data || []).map((event) => ({
    id: event.id,
    actor: event.actor,
    action: event.action,
    resourceType: event.resource_type,
    resourceId: event.resource_id,
    metadata: event.metadata,
    createdAt: event.created_at,
  })) }, { headers: { 'Cache-Control': 'no-store' } });
}
