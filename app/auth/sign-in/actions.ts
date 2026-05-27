'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export type SignInState = { error: string | null };

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function signIn(_prev: SignInState, formData: FormData): Promise<SignInState> {
  const parsed = schema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });
  // Supabase returns the same error for "wrong password" and "no such account",
  // so we keep the message generic to avoid revealing which emails exist.
  if (!parsed.success) {
    return { error: 'Invalid email or password.' };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    return { error: 'Invalid email or password.' };
  }

  redirect('/dashboard');
}
