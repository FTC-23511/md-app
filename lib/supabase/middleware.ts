import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { env } from '@/lib/env';
import { canAccessApp } from '@/lib/auth';

// Paths reachable without an authenticated, allowlisted session. Everything
// else is protected. The auth pages, the forbidden page, the public showcase,
// the health probe, and the root (which does its own auth-aware redirect) all
// live here. Note: /api/health must stay public — redirecting it to the HTML
// sign-in page makes it return HTML instead of JSON and breaks the probe.
const PUBLIC_PREFIXES = ['/auth', '/forbidden', '/showcase', '/api/health'];

function isPublicPath(pathname: string): boolean {
  if (pathname === '/') return true;
  return PUBLIC_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

/**
 * Called from middleware.ts (at repo root) on every request. Refreshes the
 * Supabase auth session if needed, ensures the response carries any updated
 * auth cookies, and enforces the single-email allowlist on protected routes.
 *
 * Without the refresh, expired access tokens would silently fail and users
 * would get unexplained "not authorized" errors on protected routes. The
 * membership gate (Phase 3) replaces the Phase 1 single-email allowlist: a
 * signed-in user reaches protected pages only if they are an active member (or
 * the ALLOWED_EMAIL bootstrap account). See lib/auth.ts.
 */
export async function updateSupabaseSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  // Refresh the session if expired. This call is what actually rotates the
  // tokens — must run on every request.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (isPublicPath(request.nextUrl.pathname)) {
    return response;
  }

  if (!user) {
    return NextResponse.redirect(new URL('/auth/sign-in', request.url));
  }

  // Membership gate: an active member row must exist (or the ALLOWED_EMAIL
  // bootstrap pass). A deactivated / unknown user is signed out and bounced.
  if (!(await canAccessApp(supabase, user))) {
    await supabase.auth.signOut();
    return NextResponse.redirect(new URL('/forbidden', request.url));
  }

  return response;
}
