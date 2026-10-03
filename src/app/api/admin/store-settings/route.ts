import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { DEFAULT_STORE_SETTINGS } from '@/lib/mockData';
import type { StoreSettings } from '@/lib/types';
import { hasAdminRequestSession } from '@/lib/adminAuth';
import { writeAdminAuditEvent } from '@/lib/adminAudit';

export async function PATCH(request: NextRequest) {
  if (!hasAdminRequestSession(request)) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: 'Persistent settings database is not configured.' }, { status: 503 });
  let settings: Partial<StoreSettings>;
  try {
    settings = await request.json() as Partial<StoreSettings>;
  } catch {
    return NextResponse.json({ error: 'Invalid settings payload.' }, { status: 400 });
  }
  if (!settings || typeof settings !== 'object' || !Array.isArray(settings.partnerBadges) || !settings.merchantName || !settings.tillNumber) {
    return NextResponse.json({ error: 'Required store settings are missing.' }, { status: 400 });
  }
  const profile = { ...DEFAULT_STORE_SETTINGS.developerProfile, ...settings.developerProfile };
  if (typeof profile.name !== 'string' || typeof profile.story !== 'string' || typeof profile.phone !== 'string' ||
      typeof profile.whatsapp !== 'string' || typeof profile.email !== 'string' || typeof profile.link !== 'string' ||
      typeof profile.imagePath !== 'string') {
    return NextResponse.json({ error: 'Developer profile details are invalid.' }, { status: 400 });
  }
  const safeLink = profile.link.trim();
  const validLink = !safeLink || /^https:\/\//i.test(safeLink);
  if (profile.name.trim().length < 2 || profile.name.length > 100 || profile.story.length > 1_200 ||
      !/^\+[1-9]\d{7,14}$/.test(profile.phone) || !/^\+[1-9]\d{7,14}$/.test(profile.whatsapp) ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email) || !validLink ||
      (profile.imagePath && !/^[A-Za-z0-9-]+\/[A-Za-z0-9-]+\.(jpg|png|webp)$/i.test(profile.imagePath))) {
    return NextResponse.json({ error: 'Developer profile details are invalid.' }, { status: 400 });
  }
  settings.developerProfile = { ...profile, name: profile.name.trim(), story: profile.story.trim(), link: safeLink, imageUrl: '' };
  const { error } = await supabase.from('store_settings').upsert({ id: 1, settings }, { onConflict: 'id' });
  if (error) return NextResponse.json({ error: 'Could not persist store settings.' }, { status: 500 });
  await writeAdminAuditEvent(request, {
    action: 'store_settings.update',
    resourceType: 'store_settings',
    resourceId: '1',
    metadata: { paymentMethodCount: settings.paymentMethods?.length || 0, partnerCount: settings.partnerBadges.length },
  });
  return NextResponse.json({ ok: true });
}
