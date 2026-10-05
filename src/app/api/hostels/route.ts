import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET() {
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ listings: [], configured: false }, { status: 503 });
  const { data, error } = await supabase.from('hostel_listings')
    .select('id, campus_id, campus_name, title, address, description, price_per_term, distance_km, amenities, photo_paths, verified')
    .eq('status', 'Published')
    .eq('verified', true)
    .order('price_per_term', { ascending: true });
  if (error) return NextResponse.json({ error: 'Could not load hostel listings.' }, { status: 500 });
  const listings = await Promise.all((data || []).map(async (listing) => {
    const photos = await Promise.all((listing.photo_paths || []).map(async (path: string) => {
      const { data: signed } = await supabase.storage.from('hostel-photos').createSignedUrl(path, 60 * 60);
      return signed?.signedUrl || '';
    }));
    return {
    id: listing.id,
    campusId: listing.campus_id,
    campusName: listing.campus_name,
    title: listing.title,
    address: listing.address,
    description: listing.description,
    pricePerTerm: Number(listing.price_per_term),
    distanceKm: Number(listing.distance_km),
    amenities: listing.amenities,
    photos: photos.filter(Boolean),
    verified: listing.verified,
    };
  }));
  return NextResponse.json({ listings }, { headers: { 'Cache-Control': 'no-store' } });
}
