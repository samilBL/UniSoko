import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

const DEFAULT_ACTIVE_BANNERS = [
  {
    id: 'banner-promo-rush',
    kind: 'Promotion',
    title: 'Semester Rush: Group Wholesale Unlocked',
    body: 'Pool your gadget order with roommates or classmates across MUST, UDSM, and CBE. Wholesale discounts trigger automatically at 3+ units.',
    ctaLabel: 'Explore Bei ya Jumla Deals',
    ctaUrl: '/#products-section',
    imageUrl: 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'banner-sponsor-partner',
    kind: 'Sponsor',
    title: 'Campus Tech Partner: Certified Laptops & Smart Chargers',
    body: 'Official student discounts on inspected ThinkPads and EliteBooks. Tested batteries, 90-day replacement warranty, and free campus delivery.',
    ctaLabel: 'Shop Verified Tech',
    ctaUrl: '/#products-section',
    imageUrl: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80',
  },
];

export async function GET() {
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    return NextResponse.json({ banners: DEFAULT_ACTIVE_BANNERS }, { headers: { 'Cache-Control': 'no-store' } });
  }

  const now = new Date().toISOString();
  try {
    const { data, error } = await supabase
      .from('promo_banners')
      .select('id, kind, title, body, cta_label, cta_url, image_path, starts_at, ends_at')
      .eq('status', 'Active')
      .lte('starts_at', now)
      .gt('ends_at', now)
      .order('starts_at', { ascending: true });

    if (!error && data && data.length > 0) {
      const banners = data.map((banner) => ({
        id: banner.id,
        kind: banner.kind,
        title: banner.title,
        body: banner.body,
        ctaLabel: banner.cta_label,
        ctaUrl: banner.cta_url,
        imageUrl: banner.image_path
          ? supabase.storage.from('promo-banner-images').getPublicUrl(banner.image_path).data.publicUrl
          : '',
      }));
      return NextResponse.json({ banners }, { headers: { 'Cache-Control': 'no-store' } });
    }
  } catch {
    // Fall back to default active campaigns
  }

  return NextResponse.json({ banners: DEFAULT_ACTIVE_BANNERS }, { headers: { 'Cache-Control': 'no-store' } });
}
