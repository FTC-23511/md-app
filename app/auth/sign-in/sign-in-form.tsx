'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { signIn, type SignInState } from './actions';
import { Button } from '@/components/ui/button';

const initialState: SignInState = { error: null };

const inputClass =
  'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50';

export function SignInForm({
  resetSuccess,
  linkError,
}: {
  resetSuccess: boolean;
  linkError: boolean;
}) {
  const [state, formAction, pending] = useActionState(signIn, initialState);

  return (
    <form action={formAction} className="mt-8 space-y-4">
      {resetSuccess && (
        <p className="rounded-md bg-muted px-3 py-2 text-sm">
          Password updated. Sign in with your new password.
        </p>
      )}
      {linkError && (
        <p className="text-sm text-destructive">
          That reset link was invalid or has expired. Request a new one below.
        </p>
      )}

      <div className="space-y-2">
        <label htmlFor="email" className="text-sm font-medium">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          disabled={pending}
          className={inputClass}
          placeholder="you@example.com"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="password" className="text-sm font-medium">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          disabled={pending}
          className={inputClass}
        />
      </div>

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? 'Signing in…' : 'Sign in'}
      </Button>

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}

      <p className="text-sm">
        <Link
          href="/auth/forgot-password"
          className="text-muted-foreground underline-offset-4 hover:underline"
        >
          Forgot password?
        </Link>
      </p>
    </form>
  );
}
