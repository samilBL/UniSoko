import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabaseServer';

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');
  const auth = await getSupabaseServer();
  if (code && auth) {
    const { error } = await auth.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL('/auth/update-password', request.url));
  }
  return NextResponse.redirect(new URL('/auth/reset-password?error=link', request.url));
}
