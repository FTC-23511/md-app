'use client';

import { createBrowserClient } from '@supabase/ssr';
import { env } from '@/lib/env';

/**
 * Browser Supabase client. Use this in Client Components (files marked with
 * 'use client'). Returns a singleton — fine to call from multiple components.
 */
export function createSupabaseBrowserClient() {
  return createBrowserClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);
}
