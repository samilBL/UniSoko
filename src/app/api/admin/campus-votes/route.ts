import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET() {
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ votes: {}, configured: false });
  const { data, error } = await supabase.from('campus_votes').select('campus_id');
  if (error) return NextResponse.json({ error: 'Could not load campus demand.' }, { status: 500 });
  const votes = (data || []).reduce<Record<string, number>>((counts, vote) => {
    counts[vote.campus_id] = (counts[vote.campus_id] || 0) + 1;
    return counts;
  }, {});
  return NextResponse.json({ votes, configured: true }, { headers: { 'Cache-Control': 'no-store' } });
}
