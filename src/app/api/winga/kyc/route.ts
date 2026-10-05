import { randomUUID } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { getSupabaseServer } from '@/lib/supabaseServer';

const BUCKET = 'winga-student-ids';
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const IMAGE_TYPES = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
} as const;

function detectImage(bytes: Buffer) {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'image/jpeg';
  if (bytes.length >= 8 && bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'image/png';
  if (bytes.length >= 12 && bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP') return 'image/webp';
  return null;
}

export async function POST(request: NextRequest) {
  const authClient = await getSupabaseServer();
  const supabase = getSupabaseAdmin();
  if (!authClient || !supabase) return NextResponse.json({ error: 'Winga ID verification is not configured. Contact UniSoko support.' }, { status: 503 });

  const { data: { user }, error: authError } = await authClient.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: 'Your Winga session has expired. Sign in again, then retry the ID upload.' }, { status: 401 });

  let body: { action?: unknown; size?: unknown; contentType?: unknown; path?: unknown };
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'The ID upload request was incomplete. Select your photo and try again.' }, { status: 400 }); }

  const { data: profile, error: profileError } = await supabase.from('winga_applications')
    .select('id, student_id_card_path, student_id_verified')
    .eq('user_id', user.id)
    .maybeSingle();
  if (profileError) return NextResponse.json({ error: `Could not load your Winga profile: ${profileError.message.slice(0, 160)}` }, { status: 500 });
  if (!profile) return NextResponse.json({ error: 'Create your Winga account before submitting a student ID.' }, { status: 404 });
  if (profile.student_id_verified) return NextResponse.json({ error: 'Your student ID is already verified. Contact support if your details have changed.' }, { status: 409 });

  const uploadPath = typeof body.path === 'string' ? body.path : '';
  const ownedUploadPath = new RegExp(`^${user.id}/[0-9a-f-]{36}\\.(jpg|png|webp)$`, 'i').test(uploadPath);
  if (body.action === 'discard') {
    if (!ownedUploadPath) return NextResponse.json({ error: 'Could not identify the incomplete upload to clean up.' }, { status: 400 });
    const { error } = await supabase.storage.from(BUCKET).remove([uploadPath]);
    if (error) return NextResponse.json({ error: `Could not remove the incomplete upload: ${error.message.slice(0, 120)}` }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  if (body.action === 'prepare') {
    const contentType = typeof body.contentType === 'string' ? body.contentType : '';
    const size = typeof body.size === 'number' ? body.size : 0;
    const extension = IMAGE_TYPES[contentType as keyof typeof IMAGE_TYPES];
    if (!extension || size < 128 || size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'Choose a clear JPG, PNG, or WebP student ID photo under 5 MB.' }, { status: 400 });
    }
    const path = `${user.id}/${randomUUID()}.${extension}`;
    const { data, error } = await supabase.storage.from(BUCKET).createSignedUploadUrl(path, { upsert: false });
    if (error || !data?.token) {
      return NextResponse.json({ error: `Could not prepare private ID storage: ${error?.message || 'storage did not return an upload token'}. Check the Winga ID storage migration.` }, { status: 503 });
    }
    return NextResponse.json({ path, token: data.token }, { headers: { 'Cache-Control': 'no-store' } });
  }

  if (body.action !== 'complete' || !ownedUploadPath) {
    return NextResponse.json({ error: 'The uploaded ID could not be matched to your account. Select the photo again and retry.' }, { status: 400 });
  }

  const { data: file, error: downloadError } = await supabase.storage.from(BUCKET).download(uploadPath);
  if (downloadError || !file) {
    return NextResponse.json({ error: `The photo did not reach private storage: ${downloadError?.message || 'file not found'}. Please retry the upload.` }, { status: 400 });
  }
  if (file.size < 128 || file.size > MAX_FILE_SIZE) {
    await supabase.storage.from(BUCKET).remove([uploadPath]);
    return NextResponse.json({ error: 'The uploaded photo must be between 128 bytes and 5 MB.' }, { status: 400 });
  }
  const bytes = Buffer.from(await file.arrayBuffer());
  const imageType = detectImage(bytes);
  if (!imageType || file.type !== imageType) {
    await supabase.storage.from(BUCKET).remove([uploadPath]);
    return NextResponse.json({ error: 'This file is not a valid JPG, PNG, or WebP image. Choose a clear photo of your student ID.' }, { status: 400 });
  }

  const { error: updateError } = await supabase.from('winga_applications')
    .update({ student_id_card_path: uploadPath, student_id_verified: false, updated_at: new Date().toISOString() })
    .eq('id', profile.id);
  if (updateError) {
    await supabase.storage.from(BUCKET).remove([uploadPath]);
    return NextResponse.json({ error: `Could not submit your ID for review: ${updateError.message.slice(0, 160)}` }, { status: 500 });
  }

  if (profile.student_id_card_path) await supabase.storage.from(BUCKET).remove([profile.student_id_card_path]);
  return NextResponse.json({ ok: true, verified: false }, { status: 201, headers: { 'Cache-Control': 'no-store' } });
}
