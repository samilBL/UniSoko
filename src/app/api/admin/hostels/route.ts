import { randomUUID } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { ALL_UNIVERSITIES } from '@/lib/mockData';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { hasAdminRequestSession } from '@/lib/adminAuth';
import { writeAdminAuditEvent } from '@/lib/adminAudit';

const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_IMAGES = 6;
const MAX_IMAGE_BYTES = 5_000_000;

function isAdmin(request: NextRequest) {
  return hasAdminRequestSession(request);
}

export async function GET(request: NextRequest) {
  if (!isAdmin(request)) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ listings: [], configured: false });
  const { data, error } = await supabase.from('hostel_listings').select('*').order('created_at', { ascending: false });
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
    photoPaths: listing.photo_paths || [],
    photos: photos.filter(Boolean),
    status: listing.status,
    verified: listing.verified,
    };
  }));
  return NextResponse.json({ listings }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(request: NextRequest) {
  if (!isAdmin(request)) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: 'Hostel storage is not configured.' }, { status: 503 });
  try {
    const formData = await request.formData();
    const metadata = JSON.parse(String(formData.get('listing') || '{}')) as Record<string, unknown>;
    const campus = ALL_UNIVERSITIES.find((item) => item.id === metadata.campusId);
    const title = typeof metadata.title === 'string' ? metadata.title.trim() : '';
    const address = typeof metadata.address === 'string' ? metadata.address.trim() : '';
    const description = typeof metadata.description === 'string' ? metadata.description.trim() : '';
    const pricePerTerm = Number(metadata.pricePerTerm);
    const distanceKm = Number(metadata.distanceKm);
    const amenities = Array.isArray(metadata.amenities) ? metadata.amenities.filter((item): item is string => typeof item === 'string').map((item) => item.trim()).filter(Boolean).slice(0, 20) : [];
    const photos = formData.getAll('photos').filter((value): value is File => value instanceof File);
    if (!campus || title.length < 3 || title.length > 140 || address.length < 3 || address.length > 300 || description.length > 1500 ||
        !Number.isFinite(pricePerTerm) || pricePerTerm <= 0 || !Number.isFinite(distanceKm) || distanceKm < 0 || photos.length < 1 || photos.length > MAX_IMAGES ||
        photos.some((photo) => !IMAGE_TYPES.has(photo.type) || photo.size <= 0 || photo.size > MAX_IMAGE_BYTES)) {
      return NextResponse.json({ error: 'Check listing details and add 1 to 6 JPG, PNG, or WebP photos under 5 MB each.' }, { status: 400 });
    }
    const id = randomUUID();
    const photoPaths: string[] = [];
    for (const photo of photos) {
      const extension = photo.type === 'image/jpeg' ? 'jpg' : photo.type.split('/')[1];
      const path = `${id}/${randomUUID()}.${extension}`;
      const { error } = await supabase.storage.from('hostel-photos').upload(path, Buffer.from(await photo.arrayBuffer()), { contentType: photo.type, upsert: false });
      if (error) throw error;
      photoPaths.push(path);
    }
    const status = metadata.status === 'Published' ? 'Published' : 'Draft';
    const verified = metadata.verified === true;
    const { error } = await supabase.from('hostel_listings').insert({
      id,
      campus_id: campus.id,
      campus_name: campus.name,
      title,
      address,
      description,
      price_per_term: pricePerTerm,
      distance_km: distanceKm,
      amenities,
      photo_paths: photoPaths,
      status,
      verified,
    });
    if (error) throw error;
    await writeAdminAuditEvent(request, { action: 'hostel_listing.create', resourceType: 'hostel_listing', resourceId: id, metadata: { status, verified, campusId: campus.id } });
    return NextResponse.json({ id }, { status: 201, headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json({ error: 'Could not save the hostel listing.' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  if (!isAdmin(request)) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: 'Hostel storage is not configured.' }, { status: 503 });
  let body: Record<string, unknown>;
  try {
    const parsed: unknown = await request.json();
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('Invalid payload.');
    body = parsed as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: 'Invalid listing update.' }, { status: 400 });
  }
  if (typeof body.id !== 'string' || !['Draft', 'Published', 'Archived'].includes(String(body.status)) || typeof body.verified !== 'boolean') {
    return NextResponse.json({ error: 'Choose a valid listing status and verification state.' }, { status: 400 });
  }
  const { error } = await supabase.from('hostel_listings').update({ status: body.status, verified: body.verified, updated_at: new Date().toISOString() }).eq('id', body.id);
  if (error) return NextResponse.json({ error: 'Could not update listing status.' }, { status: 500 });
  await writeAdminAuditEvent(request, { action: 'hostel_listing.update', resourceType: 'hostel_listing', resourceId: body.id, metadata: { status: String(body.status), verified: Boolean(body.verified) } });
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest) {
  if (!isAdmin(request)) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: 'Hostel storage is not configured.' }, { status: 503 });
  const id = request.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Listing ID is required.' }, { status: 400 });
  const { data, error: lookupError } = await supabase.from('hostel_listings').select('photo_paths').eq('id', id).maybeSingle();
  if (lookupError) return NextResponse.json({ error: 'Could not load listing.' }, { status: 500 });
  const { error } = await supabase.from('hostel_listings').delete().eq('id', id);
  if (error) return NextResponse.json({ error: 'Could not delete listing.' }, { status: 500 });
  if (data?.photo_paths?.length) await supabase.storage.from('hostel-photos').remove(data.photo_paths);
  await writeAdminAuditEvent(request, { action: 'hostel_listing.delete', resourceType: 'hostel_listing', resourceId: id });
  return NextResponse.json({ ok: true });
}
