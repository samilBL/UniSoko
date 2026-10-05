import { NextResponse } from 'next/server';
import { DEFAULT_STORE_SETTINGS } from '@/lib/mockData';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET() {
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ settings: DEFAULT_STORE_SETTINGS, configured: false });
  const { data, error } = await supabase.from('store_settings').select('settings').eq('id', 1).maybeSingle();
  if (error) return NextResponse.json({ error: 'Unable to load store settings.' }, { status: 500 });
  const storedSettings = data?.settings || {};
  const settings = {
    ...DEFAULT_STORE_SETTINGS,
    ...storedSettings,
    developerProfile: { ...DEFAULT_STORE_SETTINGS.developerProfile, ...storedSettings.developerProfile },
  };
  if (settings.developerProfile.imagePath) {
    settings.developerProfile.imageUrl = supabase.storage.from('developer-profile-images').getPublicUrl(settings.developerProfile.imagePath).data.publicUrl;
  }
  return NextResponse.json({ settings, configured: true, persisted: Boolean(data) }, {
    headers: { 'Cache-Control': 'no-store' },
  });
}
