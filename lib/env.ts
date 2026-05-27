/**
 * Typed environment access.
 *
 * Importing from here (rather than reading process.env directly) gives us:
 *  - one place to add a new env var
 *  - a runtime check that required vars are set (server side)
 *  - autocomplete on env var names
 *
 * NEXT_PUBLIC_ vars are inlined at build time by Next.js, so they're available
 * everywhere. Non-public vars are only available on the server (route
 * handlers, server components, server actions).
 */

function required(name: string, value: string | undefined): string {
  if (!value || value.length === 0) {
    throw new Error(
      `Missing required environment variable: ${name}. ` +
        `Check .env.local (local dev) or your Vercel project settings (deployed).`,
    );
  }
  return value;
}

export const env = {
  // Public (available on client and server).
  SUPABASE_URL: required('NEXT_PUBLIC_SUPABASE_URL', process.env.NEXT_PUBLIC_SUPABASE_URL),
  SUPABASE_ANON_KEY: required(
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  ),
  SITE_URL: process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000',

  // Server-only (don't import these into client components). Lazy getters so
  // the client bundle doesn't throw on import — these vars aren't NEXT_PUBLIC_.
  get SUPABASE_SERVICE_ROLE_KEY() {
    return required('SUPABASE_SERVICE_ROLE_KEY', process.env.SUPABASE_SERVICE_ROLE_KEY);
  },
  // The single email allowed to access the app in Phase 1. Enforced in
  // middleware as a belt-and-suspenders allowlist (signup is also disabled in
  // Supabase). Phase 3 replaces this with role-based access.
  get ALLOWED_EMAIL() {
    return required('ALLOWED_EMAIL', process.env.ALLOWED_EMAIL);
  },
} as const;
