import { NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabaseServer';

export async function POST() {
  const auth = await getSupabaseServer();
  if (!auth) return NextResponse.json({ error: 'Sign-out is not configured.' }, { status: 503 });
  const { error } = await auth.auth.signOut();
  if (error) return NextResponse.json({ error: 'Could not sign out.' }, { status: 500 });
  return NextResponse.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } });
}
