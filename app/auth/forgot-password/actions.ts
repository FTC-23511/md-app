'use server';

import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { env } from '@/lib/env';

export type ForgotPasswordState = { sent: boolean };

const schema = z.object({ email: z.string().email() });

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
      redirectTo: `${env.SITE_URL}/auth/reset-password`,
    });
  }

  return { sent: true };
}
