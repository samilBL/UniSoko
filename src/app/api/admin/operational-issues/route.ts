import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_SESSION_COOKIE, isValidAdminSession } from '@/lib/adminAuth';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { writeAdminAuditEvent } from '@/lib/adminAudit';

function isAdmin(req: NextRequest) {
  return isValidAdminSession(req.cookies.get(ADMIN_SESSION_COOKIE)?.value);
}

export async function GET(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ issues: [], configured: false });

  const { data, error } = await supabase
    .from('operational_issues')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: 'Could not load operational issues.' }, { status: 500 });
  return NextResponse.json({ issues: data || [] }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: 'Not configured.' }, { status: 503 });

  let body: { category?: string; title?: string; description?: string; relatedId?: string; assignedTo?: string; status?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid body.' }, { status: 400 }); }

  const validCategories = ['Payment', 'Delivery', 'Refund', 'Winga dispute', 'Inventory', 'Trade-in', 'Support', 'Other'];
  if (!body.category || !validCategories.includes(body.category) || !body.title || !body.description) {
    return NextResponse.json({ error: 'Category, title, and description are required.' }, { status: 400 });
  }

  const newIssue = {
    category: body.category,
    title: String(body.title).trim().slice(0, 300),
    description: String(body.description).trim().slice(0, 3000),
    related_id: body.relatedId ? String(body.relatedId).trim().slice(0, 200) : null,
    assigned_to: body.assignedTo ? String(body.assignedTo).trim().slice(0, 120) : null,
    status: body.status || 'Open',
    internal_notes: '',
  };

  const { data, error } = await supabase
    .from('operational_issues')
    .insert(newIssue)
    .select()
    .single();

  if (error || !data) return NextResponse.json({ error: 'Could not create operational issue.' }, { status: 500 });

  await writeAdminAuditEvent(req, {
    action: 'operational_issue.create',
    resourceType: 'operational_issue',
    resourceId: String(data.id),
    metadata: { title: data.title, category: data.category },
  });

  return NextResponse.json({ issue: data }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: 'Not configured.' }, { status: 503 });

  let body: { id?: string; status?: string; assignedTo?: string; internalNotes?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid body.' }, { status: 400 }); }

  if (!body.id) return NextResponse.json({ error: 'Issue ID is required.' }, { status: 400 });

  const validStatuses = ['Open', 'Investigating', 'Waiting', 'Resolved', 'Closed'];
  if (body.status && !validStatuses.includes(body.status)) {
    return NextResponse.json({ error: 'Invalid status value.' }, { status: 400 });
  }

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (body.status) updates.status = body.status;
  if (body.assignedTo !== undefined) updates.assigned_to = body.assignedTo ? String(body.assignedTo).slice(0, 120) : null;
  if (body.internalNotes !== undefined) updates.internal_notes = String(body.internalNotes).slice(0, 5000);

  const { data, error } = await supabase
    .from('operational_issues')
    .update(updates)
    .eq('id', body.id)
    .select()
    .single();

  if (error || !data) return NextResponse.json({ error: 'Could not update operational issue.' }, { status: 500 });

  await writeAdminAuditEvent(req, {
    action: `operational_issue.${(body.status || 'update').toLowerCase()}`,
    resourceType: 'operational_issue',
    resourceId: String(data.id),
    metadata: { status: data.status },
  });

  return NextResponse.json({ issue: data }, { headers: { 'Cache-Control': 'no-store' } });
}
