import { NextResponse } from 'next/server';

/**
 * Lightweight health endpoint. Returns 200 OK with basic info. Used by:
 *   - Playwright E2E smoke test (proves the test infra works)
 *   - Vercel deploy verification (could be added to a checks workflow)
 *
 * Does NOT touch the database, so it can succeed even if Supabase is mid-deploy.
 */
export const dynamic = 'force-dynamic';

export function GET() {
  return NextResponse.json({
    ok: true,
    service: 'md-app',
    timestamp: new Date().toISOString(),
  });
}
