import { NextRequest, NextResponse } from 'next/server';
import { CAMPUS_EXPANSION_UNIVERSITIES } from '@/lib/mockData';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET() {
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ votes: {}, configured: false });
  const { data, error } = await supabase.from('campus_votes').select('campus_id');
  if (error) return NextResponse.json({ error: 'Could not load campus votes.' }, { status: 500 });
  const universityIds = new Set(CAMPUS_EXPANSION_UNIVERSITIES.map((university) => university.id));
  const votes = (data || []).filter((row) => universityIds.has(row.campus_id)).reduce<Record<string, number>>((counts, row) => {
    counts[row.campus_id] = (counts[row.campus_id] || 0) + 1;
    return counts;
  }, {});
  return NextResponse.json({ votes }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(request: NextRequest) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: 'Campus voting database is not configured.' }, { status: 503 });
  let body: { campusId?: string; voterId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid vote.' }, { status: 400 });
  }
  if (!body.voterId || !/^[0-9a-f-]{36}$/i.test(body.voterId) || !CAMPUS_EXPANSION_UNIVERSITIES.some((university) => university.id === body.campusId)) {
    return NextResponse.json({ error: 'Choose a supported campus.' }, { status: 400 });
  }

  const { error } = await supabase.from('campus_votes').insert({ voter_id: body.voterId, campus_id: body.campusId });
  if (error?.code === '23505') return NextResponse.json({ error: 'A vote has already been recorded from this browser.' }, { status: 409 });
  if (error) return NextResponse.json({ error: 'Could not record campus vote.' }, { status: 500 });
  return NextResponse.json({ ok: true }, { status: 201 });
}
