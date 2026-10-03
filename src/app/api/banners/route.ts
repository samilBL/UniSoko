import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET() {
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ banners: [] });
  const now = new Date().toISOString();
  const { data, error } = await supabase.from('promo_banners')
    .select('id, kind, title, body, cta_label, cta_url, image_path, starts_at, ends_at')
    .eq('status', 'Active')
    .lte('starts_at', now)
    .gt('ends_at', now)
    .order('starts_at', { ascending: true });
  if (error) return NextResponse.json({ error: 'Could not load promotional banners.' }, { status: 500 });
  const banners = (data || []).map((banner) => ({
    id: banner.id,
    kind: banner.kind,
    title: banner.title,
    body: banner.body,
    ctaLabel: banner.cta_label,
    ctaUrl: banner.cta_url,
    imageUrl: banner.image_path ? supabase.storage.from('promo-banner-images').getPublicUrl(banner.image_path).data.publicUrl : '',
  }));
  return NextResponse.json({ banners }, { headers: { 'Cache-Control': 'no-store' } });
}
