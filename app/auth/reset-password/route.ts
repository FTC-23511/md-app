import { NextResponse, type NextRequest } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * Redirect target for the password-reset email. Exchanges the recovery code
 * for a temporary session and forwards the user to the change-password form.
 */
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');
  if (!code) {
    return NextResponse.redirect(new URL('/auth/sign-in?error=no_code', request.url));
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(new URL('/auth/sign-in?error=reset_failed', request.url));
  }

  return NextResponse.redirect(new URL('/auth/change-password', request.url));
}
