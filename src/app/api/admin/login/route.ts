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
  const username = typeof credentials.username === 'string' ? credentials.username.slice(0, 100) : '';
  const password = typeof credentials.password === 'string' ? credentials.password.slice(0, 1024) : '';
  if (!isAdminAuthConfigured()) {
    return NextResponse.json({ error: 'Admin sign-in is not configured for this deployment. Check that all three ADMIN variables are available to this deployment, including a session secret of at least 32 characters, then redeploy.' }, { status: 503 });
  }
  if (!verifyAdminCredentials(username, password)) {
    return NextResponse.json({ error: 'The username or password does not match the admin credentials configured for this deployment.' }, { status: 401 });
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
