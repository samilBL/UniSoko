import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

function cleanText(value: unknown, maxLength: number) {
  return typeof value === 'string' && value.trim().length > 0 && value.trim().length <= maxLength ? value.trim() : null;
}

export async function POST(request: NextRequest) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: 'Room finder submissions are not configured.' }, { status: 503 });
  let body: Record<string, unknown>;
  try {
    const parsed: unknown = await request.json();
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('Invalid payload.');
    body = parsed as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: 'Invalid room submission.' }, { status: 400 });
  }
  const studentName = cleanText(body.studentName, 120);
  const phone = cleanText(body.phone, 32);
  const university = cleanText(body.university, 180);
  const location = cleanText(body.location, 300);
  const details = cleanText(body.details, 1500);
  if (!studentName || studentName.length < 2 || !phone || phone.replace(/\D/g, '').length < 7 || !university || !location || location.length < 4 || !details || details.length < 5) {
    return NextResponse.json({ error: 'Complete your name, contact number, campus, room location, and details.' }, { status: 400 });
  }
  const { data, error } = await supabase.from('room_bounty_submissions').insert({
    student_name: studentName,
    phone,
    university,
    location,
    landlord_name: cleanText(body.landlordName, 120) || '',
    landlord_phone: cleanText(body.landlordPhone, 32) || '',
    details,
  }).select('id').single();
  if (error) return NextResponse.json({ error: 'Could not submit this room lead.' }, { status: 500 });
  return NextResponse.json({ id: data.id }, { status: 201, headers: { 'Cache-Control': 'no-store' } });
}
