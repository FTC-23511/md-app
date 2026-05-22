import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { env } from '@/lib/env';

/**
 * Server-side Supabase client. Use this in:
 *   - Server Components
 *   - Server Actions
 *   - Route Handlers (app/**\/route.ts)
 *
 * Cookie handling: this client reads the user's session from request cookies
 * and writes refreshed cookies back on the response. Next.js's `cookies()`
 * helper is used for both sides.
 *
 * Note: each call returns a new client. Don't memoize at module scope (the
 * cookies are per-request).
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // The `setAll` method was called from a Server Component. This can
          // be ignored if middleware is refreshing user sessions (it is).
        }
      },
    },
  });
}
