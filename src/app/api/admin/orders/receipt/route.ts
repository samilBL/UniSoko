import { NextRequest, NextResponse } from 'next/server';
import { hasAdminRequestSession } from '@/lib/adminAuth';
import { writeAdminAuditEvent } from '@/lib/adminAudit';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

const WARRANTY_OPTIONS = [30, 60, 90];

export async function PATCH(request: NextRequest) {
  if (!hasAdminRequestSession(request)) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: 'Order storage is unavailable.' }, { status: 503 });

  let body: { id?: unknown; itemSerialNumber?: unknown; warrantyDays?: unknown };
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Invalid receipt details.' }, { status: 400 }); }
  const id = typeof body.id === 'string' ? body.id.trim() : '';
  const serialNumber = typeof body.itemSerialNumber === 'string' ? body.itemSerialNumber.trim() : '';
  const warrantyDays = Number(body.warrantyDays);
  if (!id || id.length > 100 || serialNumber.length > 100 || !WARRANTY_OPTIONS.includes(warrantyDays)) {
    return NextResponse.json({ error: 'Provide a valid order, serial number, and warranty period.' }, { status: 400 });
  }

  const auditReady = await writeAdminAuditEvent(request, {
    action: 'order.receipt_details.update',
    resourceType: 'order',
    resourceId: id,
    metadata: { warrantyDays, hasSerialNumber: Boolean(serialNumber) },
  });
  if (!auditReady) return NextResponse.json({ error: 'Audit logging is unavailable; receipt details were not changed.' }, { status: 503 });

  const { data, error } = await supabase
    .from('orders')
    .update({ item_serial_number: serialNumber || null, warranty_days: warrantyDays })
    .eq('id', id)
    .select('id, item_serial_number, warranty_days')
    .maybeSingle();
  if (error) return NextResponse.json({ error: 'Could not save receipt details.' }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'Order not found.' }, { status: 404 });

  return NextResponse.json({
    receipt: { orderId: data.id, itemSerialNumber: data.item_serial_number, warrantyDays: data.warranty_days },
  }, { headers: { 'Cache-Control': 'no-store' } });
}
