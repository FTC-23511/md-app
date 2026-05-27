'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { requestReset, type ForgotPasswordState } from './actions';
import { Button } from '@/components/ui/button';

const initialState: ForgotPasswordState = { sent: false };

const inputClass =
  'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50';

export default function ForgotPasswordPage() {
  const [state, formAction, pending] = useActionState(requestReset, initialState);

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-12">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Reset your password</h1>
        <p className="text-sm text-muted-foreground">
          Enter your email and we&apos;ll send a reset link.
        </p>
      </div>

      {state.sent ? (
        <div className="mt-8 space-y-4">
          <p className="text-sm text-muted-foreground">
            If an account exists for that email, a reset link has been sent. Check your inbox.
          </p>
          <Button asChild variant="outline" className="w-full">
            <Link href="/auth/sign-in">Back to sign in</Link>
          </Button>
        </div>
      ) : (
        <form action={formAction} className="mt-8 space-y-4">
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

          <Button type="submit" disabled={pending} className="w-full">
            {pending ? 'Sending…' : 'Send reset link'}
          </Button>

          <p className="text-sm">
            <Link
              href="/auth/sign-in"
              className="text-muted-foreground underline-offset-4 hover:underline"
            >
              Back to sign in
            </Link>
          </p>
        </form>
      )}
    </main>
  );
}
