import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { StoreSettings } from '@/lib/types';

export async function PATCH(request: NextRequest) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: 'Persistent settings database is not configured.' }, { status: 503 });
  let settings: Partial<StoreSettings>;
  try {
    settings = await request.json() as Partial<StoreSettings>;
  } catch {
    return NextResponse.json({ error: 'Invalid settings payload.' }, { status: 400 });
  }
  if (!settings || typeof settings !== 'object' || !Array.isArray(settings.partnerBadges) || !settings.merchantName || !settings.tillNumber) {
    return NextResponse.json({ error: 'Required store settings are missing.' }, { status: 400 });
  }
  const { error } = await supabase.from('store_settings').upsert({ id: 1, settings }, { onConflict: 'id' });
  if (error) return NextResponse.json({ error: 'Could not persist store settings.' }, { status: 500 });
  return NextResponse.json({ ok: true });
}
