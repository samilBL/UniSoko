import { randomUUID } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { hasAdminRequestSession } from '@/lib/adminAuth';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

const extensions: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };

async function validImage(file: File) {
  const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  if (file.type === 'image/jpeg') return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (file.type === 'image/png') return bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
  if (file.type === 'image/webp') return String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF' && String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP';
  return false;
}

export async function POST(request: NextRequest) {
  if (!hasAdminRequestSession(request)) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: 'Institution logo storage is not configured.' }, { status: 503 });
  const formData = await request.formData();
  const file = formData.get('image');
  if (!(file instanceof File) || !extensions[file.type] || file.size < 1 || file.size > 3_000_000 || !await validImage(file)) {
    return NextResponse.json({ error: 'Choose a valid JPG, PNG, or WebP logo smaller than 3 MB.' }, { status: 400 });
  }
  const path = `${randomUUID()}.${extensions[file.type]}`;
  const { error } = await supabase.storage.from('trusted-institution-logos').upload(path, Buffer.from(await file.arrayBuffer()), { contentType: file.type, cacheControl: '31536000', upsert: false });
  if (error) return NextResponse.json({ error: 'Could not upload the logo. Apply the trusted-logo storage migration.' }, { status: 503 });
  const url = supabase.storage.from('trusted-institution-logos').getPublicUrl(path).data.publicUrl;
  return NextResponse.json({ url }, { headers: { 'Cache-Control': 'no-store' } });
}
