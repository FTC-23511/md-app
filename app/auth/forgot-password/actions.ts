'use server';

import { headers } from 'next/headers';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { env } from '@/lib/env';

export type ForgotPasswordState = { sent: boolean };

const schema = z.object({ email: z.string().email() });

/**
 * Build the origin the reset link should return to. We use the request's own
 * host rather than a fixed env var so a reset started on a preview deployment
 * comes back to that preview, and one started on production comes back to
 * production — instead of every reset landing on whatever NEXT_PUBLIC_SITE_URL
 * points at. Falls back to SITE_URL if the headers are somehow absent.
 */
async function requestOrigin(): Promise<string> {
  const h = await headers();
  const host = h.get('x-forwarded-host') ?? h.get('host');
  if (!host) return env.SITE_URL;
  const proto = h.get('x-forwarded-proto') ?? (host.startsWith('localhost') ? 'http' : 'https');
  return `${proto}://${host}`;
}

export async function requestReset(
  _prev: ForgotPasswordState,
  formData: FormData,
): Promise<ForgotPasswordState> {
  const parsed = schema.safeParse({ email: formData.get('email') });

  // Always report success regardless of whether the email is registered, so
  // the form never reveals which accounts exist.
  if (parsed.success) {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.resetPasswordForEmail(parsed.data.email, {
      redirectTo: `${await requestOrigin()}/auth/reset-password`,
    });
  }

  return { sent: true };
}
