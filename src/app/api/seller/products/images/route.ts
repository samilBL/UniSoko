import { randomUUID } from 'node:crypto';
import { Buffer } from 'node:buffer';
import { NextRequest, NextResponse } from 'next/server';
import { getSellerActor, getSellerProfile } from '@/lib/sellerAuth';
import { entitlementAllows, getSellerEntitlement } from '@/lib/sellerEntitlements';

export const dynamic = 'force-dynamic';
const bucket = 'seller-product-images';
const imageTypes = new Map([['image/jpeg', 'jpg'], ['image/png', 'png'], ['image/webp', 'webp']]);

async function authorizedSeller() {
  const actor = await getSellerActor();
  if (actor.kind !== 'ok') return { response: NextResponse.json({ error: actor.kind === 'unavailable' ? 'Seller accounts are not configured.' : 'Sign in with your verified UniSoko account.' }, { status: actor.kind === 'unavailable' ? 503 : 401 }) };
  const { data: profile, error } = await getSellerProfile(actor.serviceClient, actor.user.id);
  if (error || !profile) return { response: NextResponse.json({ error: 'Approved seller access is required.' }, { status: error ? 500 : 403 }) };
  if (profile.status !== 'approved') return { response: NextResponse.json({ error: 'Your seller account must be approved before uploading images.' }, { status: 403 }) };
  const { entitlement } = await getSellerEntitlement(actor.serviceClient, profile.id);
  if (!entitlementAllows(entitlement, 'product_listings')) return { response: NextResponse.json({ error: 'An active plan is required to upload product images.' }, { status: 402 }) };
  return { actor, profile };
}

export async function POST(request: NextRequest) {
  const seller = await authorizedSeller();
  if ('response' in seller) return seller.response;
  let form: FormData;
  try { form = await request.formData(); } catch { return NextResponse.json({ error: 'Choose a valid image file.' }, { status: 400 }); }
  const file = form.get('image');
  if (!(file instanceof File) || file.size < 1 || file.size > 5 * 1024 * 1024 || !imageTypes.has(file.type)) return NextResponse.json({ error: 'Upload a JPG, PNG, or WebP image up to 5 MB.' }, { status: 400 });
  const bytes = Buffer.from(await file.arrayBuffer());
  const isJpeg = bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  const isPng = bytes.length >= 8 && bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  const isWebp = bytes.length >= 12 && bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP';
  if ((file.type === 'image/jpeg' && !isJpeg) || (file.type === 'image/png' && !isPng) || (file.type === 'image/webp' && !isWebp)) return NextResponse.json({ error: 'The image content does not match its file type.' }, { status: 400 });
  const path = `${seller.profile.id}/${randomUUID()}.${imageTypes.get(file.type)}`;
  const { error } = await seller.actor.serviceClient.storage.from(bucket).upload(path, bytes, { contentType: file.type, cacheControl: '31536000', upsert: false });
  if (error) {
    console.error('Seller product image upload failed', { code: error.name });
    return NextResponse.json({ error: 'Could not upload this image. Confirm the Phase 4 storage migration has been applied.' }, { status: 503 });
  }
  const { data } = seller.actor.serviceClient.storage.from(bucket).getPublicUrl(path);
  return NextResponse.json({ path, url: data.publicUrl }, { status: 201, headers: { 'Cache-Control': 'no-store' } });
}

export async function DELETE(request: NextRequest) {
  const seller = await authorizedSeller();
  if ('response' in seller) return seller.response;
  let body: { path?: unknown };
  try { body = await request.json() as typeof body; } catch { return NextResponse.json({ error: 'Choose a valid image.' }, { status: 400 }); }
  const path = typeof body.path === 'string' ? body.path : '';
  if (!path.startsWith(`${seller.profile.id}/`) || path.length > 300 || path.includes('..')) return NextResponse.json({ error: 'Image not found in your seller storage.' }, { status: 403 });
  const { error } = await seller.actor.serviceClient.storage.from(bucket).remove([path]);
  if (error) return NextResponse.json({ error: 'Could not remove this image.' }, { status: 500 });
  return NextResponse.json({ ok: true });
}
