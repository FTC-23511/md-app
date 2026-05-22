import { NextResponse, type NextRequest } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

/**
 * Supabase magic-link redirect target. Exchanges the `code` query param for a
 * real session and sets the auth cookies, then redirects on to the dashboard
 * (or wherever the `next` param points).
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';

  if (code) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // No code, or exchange failed — back to sign-in with an error indicator.
  return NextResponse.redirect(`${origin}/auth/sign-in?error=callback`);
}
