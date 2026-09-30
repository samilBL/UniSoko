import { NextResponse } from 'next/server';
import { DEFAULT_STORE_SETTINGS } from '@/lib/mockData';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET() {
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ settings: DEFAULT_STORE_SETTINGS, configured: false });
  const { data, error } = await supabase.from('store_settings').select('settings').eq('id', 1).maybeSingle();
  if (error) return NextResponse.json({ error: 'Unable to load store settings.' }, { status: 500 });
  return NextResponse.json({ settings: { ...DEFAULT_STORE_SETTINGS, ...(data?.settings || {}) }, configured: true, persisted: Boolean(data) }, {
    headers: { 'Cache-Control': 'no-store' },
  });
}
