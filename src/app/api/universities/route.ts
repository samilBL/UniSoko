import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { ALL_UNIVERSITIES } from '@/lib/mockData';

export async function GET() {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({
      universities: ALL_UNIVERSITIES,
      source: 'mock'
    });
  }

  const { data, error } = await supabase
    .from('universities')
    .select('*')
    .eq('is_active', true)
    .order('name', { ascending: true });

  if (error || !data || data.length === 0) {
    return NextResponse.json({
      universities: ALL_UNIVERSITIES,
      source: 'fallback'
    });
  }

  // Format database rows into UniversityLocation shape
  const formatted = data.map((u: any) => ({
    id: u.id,
    name: u.name,
    shortCode: u.short_name,
    city: u.city,
    campus: `${u.city} Campus`,
    popularSpots: Array.isArray(u.landmarks) ? u.landmarks : [],
    isMbeya: u.city.toLowerCase().includes('mbeya'),
    region: u.city,
    deliveryFee: Number(u.delivery_fee) || 0,
    estimatedDeliveryTime: u.estimated_delivery_time,
    hostels: Array.isArray(u.hostels) ? u.hostels : []
  }));

  return NextResponse.json({
    universities: formatted,
    source: 'database'
  }, {
    headers: { 'Cache-Control': 'public, max-age=60, s-maxage=300' }
  });
}
