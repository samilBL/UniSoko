import { randomUUID } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { hasAdminRequestSession } from '@/lib/adminAuth';
import { writeAdminAuditEvent } from '@/lib/adminAudit';

const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const BANNER_KINDS = new Set(['Promotion', 'Sponsor', 'Flash Deal']);
const BANNER_STATUSES = new Set(['Draft', 'Active', 'Paused']);

function isAdmin(request: NextRequest) {
  return hasAdminRequestSession(request);
}

function safeCtaUrl(value: unknown) {
  if (typeof value !== 'string' || !value.trim()) return '';
  const url = value.trim();
  return (url.startsWith('/') && !url.startsWith('//')) || /^https:\/\//i.test(url) ? url : null;
}

function mapBanner(row: Record<string, unknown>, supabase: NonNullable<ReturnType<typeof getSupabaseAdmin>>) {
  const imagePath = String(row.image_path || '');
  return {
    id: String(row.id),
    kind: String(row.kind),
    title: String(row.title),
    body: String(row.body || ''),
    ctaLabel: String(row.cta_label || ''),
    ctaUrl: String(row.cta_url || ''),
    imagePath,
    imageUrl: imagePath ? supabase.storage.from('promo-banner-images').getPublicUrl(imagePath).data.publicUrl : '',
    status: String(row.status),
    startsAt: String(row.starts_at),
    endsAt: String(row.ends_at),
  };
}

export async function GET(request: NextRequest) {
  if (!isAdmin(request)) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ banners: [], configured: false });
  const { data, error } = await supabase.from('promo_banners').select('*').order('created_at', { ascending: false });
  if (error) return NextResponse.json({ error: 'Could not load banners.' }, { status: 500 });
  return NextResponse.json({ banners: (data || []).map((row) => mapBanner(row, supabase)) }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(request: NextRequest) {
  if (!isAdmin(request)) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: 'Banner storage is not configured.' }, { status: 503 });
  try {
    const formData = await request.formData();
    const parsed: unknown = JSON.parse(String(formData.get('banner') || '{}'));
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return NextResponse.json({ error: 'Invalid banner details.' }, { status: 400 });
    const body = parsed as Record<string, unknown>;
    const title = typeof body.title === 'string' ? body.title.trim() : '';
    const text = typeof body.body === 'string' ? body.body.trim() : '';
    const ctaLabel = typeof body.ctaLabel === 'string' ? body.ctaLabel.trim() : '';
    const ctaUrl = safeCtaUrl(body.ctaUrl);
    const startsAt = new Date(String(body.startsAt));
    const endsAt = new Date(String(body.endsAt));
    const status = String(body.status || 'Draft');
    const image = formData.get('image');
    const imageFile = image instanceof File && image.size > 0 ? image : null;
    if (!BANNER_KINDS.has(String(body.kind)) || title.length < 2 || title.length > 120 || text.length > 500 || ctaLabel.length > 40 || ctaUrl === null ||
        !BANNER_STATUSES.has(status) || Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime()) || endsAt <= startsAt ||
        (imageFile && (!IMAGE_TYPES.has(imageFile.type) || imageFile.size > 5_000_000))) {
      return NextResponse.json({ error: 'Check banner text, link, schedule, status, and image (JPG, PNG, or WebP under 5 MB).' }, { status: 400 });
    }
    const id = typeof body.id === 'string' && body.id ? body.id : randomUUID();
    let imagePath = '';
    let oldImagePath = '';
    if (body.id) {
      const { data: existing, error } = await supabase.from('promo_banners').select('image_path').eq('id', id).maybeSingle();
      if (error) return NextResponse.json({ error: 'Could not load the banner being edited.' }, { status: 500 });
      if (!existing) return NextResponse.json({ error: 'Banner not found.' }, { status: 404 });
      oldImagePath = existing.image_path || '';
      imagePath = oldImagePath;
    }
    if (imageFile) {
      const extension = imageFile.type === 'image/jpeg' ? 'jpg' : imageFile.type.split('/')[1];
      imagePath = `${id}/${randomUUID()}.${extension}`;
      const { error } = await supabase.storage.from('promo-banner-images').upload(imagePath, Buffer.from(await imageFile.arrayBuffer()), { contentType: imageFile.type, upsert: false });
      if (error) return NextResponse.json({ error: 'Could not upload banner image.' }, { status: 500 });
    }
    const values = {
      kind: body.kind,
      title,
      body: text,
      cta_label: ctaLabel,
      cta_url: ctaUrl,
      image_path: imagePath,
      status,
      starts_at: startsAt.toISOString(),
      ends_at: endsAt.toISOString(),
      updated_at: new Date().toISOString(),
    };
    const { error } = body.id
      ? await supabase.from('promo_banners').update(values).eq('id', id)
      : await supabase.from('promo_banners').insert({ ...values, id });
    if (error) return NextResponse.json({ error: 'Could not save banner.' }, { status: 500 });
    if (imageFile && oldImagePath) await supabase.storage.from('promo-banner-images').remove([oldImagePath]);
    await writeAdminAuditEvent(request, { action: body.id ? 'promo_banner.update' : 'promo_banner.create', resourceType: 'promo_banner', resourceId: id, metadata: { kind: String(body.kind), status, startsAt: startsAt.toISOString(), endsAt: endsAt.toISOString() } });
    return NextResponse.json({ id }, { status: body.id ? 200 : 201, headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json({ error: 'Could not save banner.' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  if (!isAdmin(request)) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: 'Banner storage is not configured.' }, { status: 503 });
  let body: { id?: string; status?: string };
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Invalid banner update.' }, { status: 400 }); }
  if (!body.id || !BANNER_STATUSES.has(body.status || '')) return NextResponse.json({ error: 'Choose a valid banner status.' }, { status: 400 });
  const { error } = await supabase.from('promo_banners').update({ status: body.status, updated_at: new Date().toISOString() }).eq('id', body.id);
  if (error) return NextResponse.json({ error: 'Could not update banner.' }, { status: 500 });
  await writeAdminAuditEvent(request, { action: 'promo_banner.status', resourceType: 'promo_banner', resourceId: body.id, metadata: { status: body.status ?? null } });
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest) {
  if (!isAdmin(request)) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: 'Banner storage is not configured.' }, { status: 503 });
  const id = request.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Banner ID is required.' }, { status: 400 });
  const { data, error: lookupError } = await supabase.from('promo_banners').select('image_path').eq('id', id).maybeSingle();
  if (lookupError) return NextResponse.json({ error: 'Could not load banner.' }, { status: 500 });
  const { error } = await supabase.from('promo_banners').delete().eq('id', id);
  if (error) return NextResponse.json({ error: 'Could not delete banner.' }, { status: 500 });
  if (data?.image_path) await supabase.storage.from('promo-banner-images').remove([data.image_path]);
  await writeAdminAuditEvent(request, { action: 'promo_banner.delete', resourceType: 'promo_banner', resourceId: id });
  return NextResponse.json({ ok: true });
}
