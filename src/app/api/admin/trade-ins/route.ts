import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

const ALLOWED_STATUSES = new Set(['Pending Review', 'Inspecting', 'Offer Made', 'Accepted', 'Rejected']);

export async function GET() {
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ requests: [], configured: false });

  const { data, error } = await supabase.from('trade_in_requests').select('*').order('submitted_at', { ascending: false });
  if (error) return NextResponse.json({ error: 'Could not load trade-in requests.' }, { status: 500 });

  const requests = await Promise.all((data || []).map(async (row) => {
    const imageUrls = await Promise.all(((row.image_paths || []) as string[]).map(async (path) => {
      const { data: signed } = await supabase.storage.from('trade-in-photos').createSignedUrl(path, 60 * 10);
      return signed?.signedUrl || '';
    }));
    return {
      id: row.id,
      studentName: row.student_name,
      phone: row.phone,
      university: row.university,
      itemTitle: row.item_title,
      category: row.category,
      condition: row.condition,
      specs: row.specs,
      expectedPrice: row.expected_price,
      offeredPrice: row.offered_price,
      imageUrls: imageUrls.filter(Boolean),
      status: row.status,
      adminNotes: row.admin_notes,
      submittedAt: row.submitted_at,
    };
  }));

  return NextResponse.json({ requests, configured: true }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function PATCH(request: NextRequest) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: 'Trade-in database is not configured.' }, { status: 503 });

  let body: { id?: string; status?: string; adminNotes?: string; offeredPrice?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }
  if (!body.id || !body.status || !ALLOWED_STATUSES.has(body.status)) return NextResponse.json({ error: 'Invalid trade-in update.' }, { status: 400 });

  const { error } = await supabase.from('trade_in_requests').update({
    status: body.status,
    admin_notes: body.adminNotes || '',
    offered_price: Number.isFinite(body.offeredPrice) ? body.offeredPrice : null,
  }).eq('id', body.id);
  if (error) return NextResponse.json({ error: 'Could not update trade-in request.' }, { status: 500 });
  return NextResponse.json({ ok: true });
}
