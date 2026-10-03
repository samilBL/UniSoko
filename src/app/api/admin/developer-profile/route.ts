import { randomUUID } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { DEFAULT_STORE_SETTINGS } from '@/lib/mockData';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { hasAdminRequestSession } from '@/lib/adminAuth';
import { writeAdminAuditEvent } from '@/lib/adminAudit';
import type { DeveloperProfileSettings } from '@/lib/types';

const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_IMAGE_BYTES = 3_000_000;

async function hasValidImageSignature(file: File) {
  const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  if (file.type === 'image/jpeg') return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (file.type === 'image/png') return bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
  return String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF' && String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP';
}

function validateProfile(value: unknown): DeveloperProfileSettings | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const profile = value as Partial<DeveloperProfileSettings>;
  const name = typeof profile.name === 'string' ? profile.name.trim() : '';
  const story = typeof profile.story === 'string' ? profile.story.trim() : '';
  const phone = typeof profile.phone === 'string' ? profile.phone.trim() : '';
  const whatsapp = typeof profile.whatsapp === 'string' ? profile.whatsapp.trim() : '';
  const email = typeof profile.email === 'string' ? profile.email.trim() : '';
  const link = typeof profile.link === 'string' ? profile.link.trim() : '';
  if (name.length < 2 || name.length > 100 || story.length > 1_200 ||
      !/^\+[1-9]\d{7,14}$/.test(phone) || !/^\+[1-9]\d{7,14}$/.test(whatsapp) ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || (link && !/^https:\/\//i.test(link))) return null;
  return {
    name,
    story,
    phone,
    whatsapp,
    email,
    link,
    imageUrl: '',
    imagePath: typeof profile.imagePath === 'string' && /^[A-Za-z0-9-]+\/[A-Za-z0-9-]+\.(jpg|png|webp)$/i.test(profile.imagePath) ? profile.imagePath : '',
  };
}

export async function POST(request: NextRequest) {
  if (!hasAdminRequestSession(request)) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: 'Persistent settings database is not configured.' }, { status: 503 });

  try {
    const formData = await request.formData();
    const parsed: unknown = JSON.parse(String(formData.get('profile') || '{}'));
    const profile = validateProfile(parsed);
    if (!profile) return NextResponse.json({ error: 'Check the name, contact details, story length, and HTTPS developer link.' }, { status: 400 });

    const image = formData.get('image');
    const imageFile = image instanceof File && image.size > 0 ? image : null;
    const removeImage = formData.get('removeImage') === 'true';
    if (imageFile && (!IMAGE_TYPES.has(imageFile.type) || imageFile.size > MAX_IMAGE_BYTES || !await hasValidImageSignature(imageFile))) {
      return NextResponse.json({ error: 'Upload a valid JPG, PNG, or WebP image no larger than 3 MB.' }, { status: 400 });
    }

    const { data: existing, error: readError } = await supabase.from('store_settings').select('settings').eq('id', 1).maybeSingle();
    if (readError) return NextResponse.json({ error: 'Could not load current store settings.' }, { status: 500 });
    const settings = { ...DEFAULT_STORE_SETTINGS, ...(existing?.settings || {}) };
    const oldProfile = { ...DEFAULT_STORE_SETTINGS.developerProfile, ...(settings.developerProfile || {}) };
    let imagePath = oldProfile.imagePath || '';
    if (imageFile) {
      const extension = imageFile.type === 'image/jpeg' ? 'jpg' : imageFile.type.split('/')[1];
      imagePath = `${randomUUID()}/${randomUUID()}.${extension}`;
      const { error } = await supabase.storage.from('developer-profile-images').upload(imagePath, Buffer.from(await imageFile.arrayBuffer()), { contentType: imageFile.type, upsert: false });
      if (error) return NextResponse.json({ error: 'Could not upload the profile image. Apply the developer profile storage migration.' }, { status: 500 });
    } else if (removeImage) {
      imagePath = '';
    }

    const savedProfile = { ...profile, imagePath, imageUrl: '' };
    const { error: saveError } = await supabase.from('store_settings').upsert({
      id: 1,
      settings: { ...settings, developerProfile: savedProfile },
    }, { onConflict: 'id' });
    if (saveError) {
      if (imageFile) await supabase.storage.from('developer-profile-images').remove([imagePath]);
      return NextResponse.json({ error: 'Could not save developer profile.' }, { status: 500 });
    }
    if (oldProfile.imagePath && oldProfile.imagePath !== imagePath) await supabase.storage.from('developer-profile-images').remove([oldProfile.imagePath]);

    const imageUrl = imagePath ? supabase.storage.from('developer-profile-images').getPublicUrl(imagePath).data.publicUrl : '';
    await writeAdminAuditEvent(request, { action: 'developer_profile.update', resourceType: 'store_settings', resourceId: '1', metadata: { imageChanged: Boolean(imageFile || removeImage), storyUpdated: Boolean(profile.story) } });
    return NextResponse.json({ profile: { ...savedProfile, imageUrl } }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json({ error: 'Could not save developer profile.' }, { status: 400 });
  }
}
