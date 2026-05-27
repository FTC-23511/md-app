'use client';

import { useActionState } from 'react';
import { changePassword, type ChangePasswordState } from './actions';
import { Button } from '@/components/ui/button';

const initialState: ChangePasswordState = { error: null };

const inputClass =
  'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50';

export default function ChangePasswordPage() {
  const [state, formAction, pending] = useActionState(changePassword, initialState);

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-12">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Set a new password</h1>
        <p className="text-sm text-muted-foreground">
          Choose a new password for your account. You&apos;ll sign in with it next.
        </p>
      </div>

      <form action={formAction} className="mt-8 space-y-4">
        <div className="space-y-2">
          <label htmlFor="password" className="text-sm font-medium">
            New password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="new-password"
            disabled={pending}
            className={inputClass}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="confirm" className="text-sm font-medium">
            Confirm new password
          </label>
          <input
            id="confirm"
            name="confirm"
            type="password"
            required
            autoComplete="new-password"
            disabled={pending}
            className={inputClass}
          />
        </div>

        <Button type="submit" disabled={pending} className="w-full">
          {pending ? 'Saving…' : 'Set new password'}
        </Button>

        {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      </form>
    </main>
  );
}
