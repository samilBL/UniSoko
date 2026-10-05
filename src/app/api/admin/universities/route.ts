import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_SESSION_COOKIE, isValidAdminSession } from '@/lib/adminAuth';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { writeAdminAuditEvent } from '@/lib/adminAudit';
import { ALL_UNIVERSITIES } from '@/lib/mockData';

function isAdmin(req: NextRequest) {
  return isValidAdminSession(req.cookies.get(ADMIN_SESSION_COOKIE)?.value);
}

export async function GET(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({
      universities: ALL_UNIVERSITIES,
      configured: false
    });
  }

  const { data, error } = await supabase
    .from('universities')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    return NextResponse.json({
      universities: ALL_UNIVERSITIES,
      configured: true,
      fallback: true
    });
  }

  return NextResponse.json({ universities: data || [] }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: 'Database not configured.' }, { status: 503 });

  let body: {
    id?: string;
    name?: string;
    shortName?: string;
    city?: string;
    deliveryFee?: number;
    estimatedDeliveryTime?: string;
    hostels?: string[];
    landmarks?: string[];
    isActive?: boolean;
  };

  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid body.' }, { status: 400 }); }

  if (!body.name || !body.city || !body.shortName) {
    return NextResponse.json({ error: 'Name, short name, and city are required.' }, { status: 400 });
  }

  const id = body.id?.trim() || body.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
  const newRow = {
    id,
    name: body.name.trim().slice(0, 200),
    short_name: body.shortName.trim().slice(0, 50),
    city: body.city.trim().slice(0, 100),
    delivery_fee: typeof body.deliveryFee === 'number' ? body.deliveryFee : 0,
    estimated_delivery_time: body.estimatedDeliveryTime || 'Same-day delivery (under 2 hrs)',
    hostels: Array.isArray(body.hostels) ? body.hostels : [],
    landmarks: Array.isArray(body.landmarks) ? body.landmarks : [],
    is_active: body.isActive !== undefined ? body.isActive : true,
  };

  const { data, error } = await supabase
    .from('universities')
    .upsert(newRow)
    .select()
    .single();

  if (error || !data) {
    return NextResponse.json({ error: 'Could not save university: ' + (error?.message || '') }, { status: 500 });
  }

  await writeAdminAuditEvent(req, {
    action: 'university.upsert',
    resourceType: 'university',
    resourceId: data.id,
    metadata: { name: data.name, city: data.city },
  });

  return NextResponse.json({ university: data }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: 'Not configured.' }, { status: 503 });

  let body: {
    id?: string;
    isActive?: boolean;
    deliveryFee?: number;
    estimatedDeliveryTime?: string;
    hostels?: string[];
    landmarks?: string[];
  };

  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid body.' }, { status: 400 }); }

  if (!body.id) return NextResponse.json({ error: 'University ID is required.' }, { status: 400 });

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (body.isActive !== undefined) updates.is_active = body.isActive;
  if (body.deliveryFee !== undefined) updates.delivery_fee = body.deliveryFee;
  if (body.estimatedDeliveryTime !== undefined) updates.estimated_delivery_time = body.estimatedDeliveryTime;
  if (Array.isArray(body.hostels)) updates.hostels = body.hostels;
  if (Array.isArray(body.landmarks)) updates.landmarks = body.landmarks;

  const { data, error } = await supabase
    .from('universities')
    .update(updates)
    .eq('id', body.id)
    .select()
    .single();

  if (error || !data) return NextResponse.json({ error: 'Could not update university.' }, { status: 500 });

  await writeAdminAuditEvent(req, {
    action: 'university.update',
    resourceType: 'university',
    resourceId: String(data.id),
    metadata: { name: data.name, is_active: data.is_active },
  });

  return NextResponse.json({ university: data }, { headers: { 'Cache-Control': 'no-store' } });
}
