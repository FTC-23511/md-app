import { createClient } from '@supabase/supabase-js';
import { env } from '@/lib/env';

/**
 * The ONLY service-role Supabase client (plan decision 5). Bypasses RLS, so it
 * is confined to the two real call sites that need it — member invite (3D) and
 * the Discord webhook (3G). The fallback importer keeps its own usage.
 *
 * SERVER-ONLY. Never import this into a client component: it reads
 * SUPABASE_SERVICE_ROLE_KEY via the lib/env.ts lazy getter, which throws if it
 * is ever evaluated in a browser bundle (the key is not a NEXT_PUBLIC_* var).
 *
 * No session persistence / token refresh — this client never represents a user.
 */
export function createSupabaseAdminClient() {
  return createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
