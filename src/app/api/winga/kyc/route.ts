import { randomUUID } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { getSupabaseServer } from '@/lib/supabaseServer';

const BUCKET = 'winga-student-ids';
const MAX_FILE_SIZE = 5 * 1024 * 1024;

function detectImage(bytes: Buffer) {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return { mime: 'image/jpeg', extension: 'jpg' };
  if (bytes.length >= 8 && bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return { mime: 'image/png', extension: 'png' };
  if (bytes.length >= 12 && bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP') return { mime: 'image/webp', extension: 'webp' };
  return null;
}

export async function POST(request: NextRequest) {
  const authClient = await getSupabaseServer();
  const supabase = getSupabaseAdmin();
  if (!authClient || !supabase) return NextResponse.json({ error: 'Winga identity verification is not configured.' }, { status: 503 });

  const { data: { user }, error: authError } = await authClient.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: 'Sign in to submit your student ID.' }, { status: 401 });

  let formData: FormData;
  try { formData = await request.formData(); } catch { return NextResponse.json({ error: 'Choose a clear student ID image.' }, { status: 400 }); }
  const file = formData.get('studentId');
  if (!(file instanceof File) || file.size < 128 || file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: 'Choose a student ID photo under 5 MB.' }, { status: 400 });
  }

  const { data: profile, error: profileError } = await supabase.from('winga_applications')
    .select('id, student_id_card_path, student_id_verified')
    .eq('user_id', user.id)
    .maybeSingle();
  if (profileError) return NextResponse.json({ error: 'Could not load your Winga profile.' }, { status: 500 });
  if (!profile) return NextResponse.json({ error: 'Create your Winga account before submitting student ID.' }, { status: 404 });
  if (profile.student_id_verified) return NextResponse.json({ error: 'Your student ID is already verified. Contact support if your details have changed.' }, { status: 409 });

  const bytes = Buffer.from(await file.arrayBuffer());
  const image = detectImage(bytes);
  if (!image || file.type !== image.mime) return NextResponse.json({ error: 'Upload a valid JPG, PNG, or WebP image.' }, { status: 400 });

  const path = `${user.id}/${randomUUID()}.${image.extension}`;
  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, bytes, {
    contentType: image.mime,
    cacheControl: '0',
    upsert: false,
  });
  if (uploadError) return NextResponse.json({ error: 'Could not store your ID image. Please try again later.' }, { status: 503 });

  const { error: updateError } = await supabase.from('winga_applications')
    .update({ student_id_card_path: path, student_id_verified: false, updated_at: new Date().toISOString() })
    .eq('id', profile.id);
  if (updateError) {
    await supabase.storage.from(BUCKET).remove([path]);
    return NextResponse.json({ error: 'Could not submit your ID for review.' }, { status: 500 });
  }

  if (profile.student_id_card_path) await supabase.storage.from(BUCKET).remove([profile.student_id_card_path]);
  return NextResponse.json({ ok: true, verified: false }, { status: 201, headers: { 'Cache-Control': 'no-store' } });
}
