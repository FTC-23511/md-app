import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { env } from '@/lib/env';

/**
 * Called from middleware.ts (at repo root) on every request. Refreshes the
 * Supabase auth session if needed and ensures the response carries any
 * updated auth cookies.
 *
 * Without this, expired access tokens would silently fail and users would
 * get unexplained "not authorized" errors on protected routes.
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
  // tokens — must run on every protected-route request.
  await supabase.auth.getUser();

  return response;
}
