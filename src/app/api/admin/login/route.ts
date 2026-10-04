import { NextRequest, NextResponse } from 'next/server';
import {
  ADMIN_SESSION_COOKIE,
  adminSessionTtl,
  createAdminSession,
  isAdminAuthConfigured,
  verifyAdminCredentials,
} from '@/lib/adminAuth';

export async function POST(request: NextRequest) {
  let credentials: { username?: string; password?: string } | null;
  try {
    credentials = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  if (!credentials || typeof credentials !== 'object' || Array.isArray(credentials)) {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }
  if (!isAdminAuthConfigured()) {
    return NextResponse.json({ error: 'Admin sign-in is not configured on this deployment. Set ADMIN_USERNAME and ADMIN_PASSWORD, plus a unique ADMIN_SESSION_SECRET of at least 32 characters.' }, { status: 503 });
  }
  const username = typeof credentials.username === 'string' ? credentials.username.slice(0, 100) : '';
  const password = typeof credentials.password === 'string' ? credentials.password.slice(0, 1024) : '';
  if (!verifyAdminCredentials(username, password)) {
    return NextResponse.json({ error: 'Username or password is incorrect.' }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_SESSION_COOKIE, createAdminSession(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: adminSessionTtl,
  });
  response.headers.set('Cache-Control', 'no-store');
  return response;
}
