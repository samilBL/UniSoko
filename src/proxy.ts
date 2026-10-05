import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { ADMIN_SESSION_COOKIE, isValidAdminSession } from '@/lib/adminAuth';

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname === '/admin/login' || pathname === '/api/admin/login') return NextResponse.next();

  if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
    const session = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
    if (isValidAdminSession(session)) return NextResponse.next();

    const loginUrl = new URL('/admin/login', request.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (['/winga', '/winga/leaderboard', '/winga/login', '/winga/register', '/api/winga/leaderboard', '/api/winga/accounts'].includes(pathname)) {
    return NextResponse.next();
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) {
    if (pathname === '/winga' || pathname === '/api/winga/applications') return NextResponse.next();
    if (pathname.startsWith('/api/winga')) return NextResponse.json({ error: 'Winga access is not configured.' }, { status: 503 });
    const signInUrl = new URL('/winga', request.url);
    signInUrl.searchParams.set('auth', 'unavailable');
    return NextResponse.redirect(signInUrl);
  }

  let response = NextResponse.next({ request });
  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const { data: { user } } = await supabase.auth.getUser();
  if (pathname === '/winga' || user) return response;

  if (pathname.startsWith('/api/winga')) return NextResponse.json({ error: 'Sign in to your Winga account.' }, { status: 401 });
  const signInUrl = new URL('/winga', request.url);
  signInUrl.searchParams.set('auth', 'required');
  return NextResponse.redirect(signInUrl);
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*', '/order/:path*', '/winga/:path*', '/api/winga/:path*'],
};
