# Authentication

Phase 1 auth is intentionally the simplest viable design: email + password sign-in via Supabase Auth, with sign-up disabled and a single-email allowlist enforced at the application layer.

## 1. What Phase 1 auth is

- **Sign-in method.** Email and password. One form, one submit, instant sign-in. No inbox round trip.
- **Authorized users.** Exactly one — the App Lead's account, created manually in the Supabase dashboard. The App Lead's email is also stored in the `ALLOWED_EMAIL` environment variable for a belt-and-suspenders allowlist check at the middleware layer.
- **Sign-up disabled.** No user can create an account through the application. The only way an account exists is if the App Lead created it manually in the Supabase dashboard. This is the answer to the "I don't want other emails messing with our data" requirement: with signup disabled, no extra accounts get created, period.
- **Session persistence.** Standard Supabase Auth session cookies. Sessions persist across browser restarts until explicit sign-out or expiry.
- **Forgot password.** Supabase's built-in password-reset flow is enabled. It sends a one-time reset link to the user's email (yes, ironically a magic link — but only triggered when the password is forgotten, not on every sign-in).

## 2. Why this design (and what it isn't)

The full role-and-permission model in `MD_App_Charter.md` §6 has six roles, row-level access control, and a per-entry edit window. None of that exists in Phase 1.

Reasons it's deferred to Phase 3:

- **Single-user is enough to exercise the system end-to-end.** The App Lead can file every entry type and verify the data layer works. No multi-user scenario needs to land in Phase 1 for the operational definition to be met.
- **RLS policies are non-trivial to design correctly.** Getting them wrong is a security issue. Phase 3 is the right time to spend the design effort, once Phase 2's full Tier 2 entry capture has shipped and the read/write patterns are clearer.
- **The Phase 1 schema is already RLS-ready.** Every entry table has a `created_by` column referencing `auth.users(id)`, populated on insert. Phase 3 adds policies on top; no schema migration required for the access model.

Reasons it's email + password and not magic link:

- **Daily friction matters for a daily-use tool.** Magic link adds an inbox round trip on every sign-in, with email delivery delays sometimes in the 10–30 second range. Over a season of capture, that's significant cumulative friction. Password sign-in is instant.
- **Sign-up-disabled neutralizes the main argument for magic link.** Magic links are popular for passwordless signup flows. With signup disabled, that benefit doesn't apply.
- **The reset path still uses magic link.** Password reset is the one place where the inbox round trip is unavoidable. That's an infrequent action; the friction is acceptable there.

What this means in practice: when Phase 3 lands, the changes are (a) replace the single-email middleware check with a role-based one, (b) re-enable sign-up via an invite-token flow or admin-creation, (c) add `CREATE POLICY` statements per table, (d) add a roles table or a JWT claim. The forms, the renderer, the entry definitions, and the inserts are unchanged.

## 3. Supabase Auth setup (manual, in the dashboard)

These steps are done once, in the Supabase project dashboard, as part of **T09** in the plan. They are not code; document them in the PR description with screenshots.

1. **Authentication → Providers → Email.** Enable. Set "Confirm email" to off (you'll create the user account manually with a known-good email — no email-verification round trip needed).
2. **Authentication → Providers → Email → Password.** Enabled (default).
3. **Authentication → Sign In / Up → Disable signup.** Toggle off. This is the critical setting. With it off, the only way an account exists is manual dashboard creation.
4. **Authentication → URL Configuration.**
   - Site URL: `http://localhost:3000` during local development; update to the Vercel production URL when T20 lands.
   - Redirect URLs: add both the local and production URLs and their `/auth/reset-password` suffixes (used by the password-reset flow).
5. **Authentication → Email Templates → Reset Password.** Default template is fine for Phase 1; subject line should be clear (e.g., "Reset your MD-App password").
6. **Authentication → Users → Add user → Create new user.** Create the App Lead's account: enter the email and a password you'll remember. Tick "Auto Confirm User" so the account is immediately usable. This is the one and only Phase 1 user.

## 4. The middleware allowlist

`middleware.ts` at the project root enforces the single-email allowlist on every protected route. Middleware runs before page rendering; if it rejects, the user never sees the protected page.

This is defense in depth: signup is already disabled (so no other accounts should exist), but the middleware ensures that even if Supabase config drifts or someone creates an account through the dashboard, only the configured email can access the app.

**Logic:**

1. The request comes in for any route.
2. Middleware checks: is this route protected? (Anything under `(app)` is; the `/login`, `/forgot-password`, and `/auth/reset-password` routes are not.)
3. If protected: read the session cookie. If no session, redirect to `/login`.
4. If session present: read the user's email. Compare to `process.env.ALLOWED_EMAIL`. If mismatch, sign out (clear the session) and redirect to `/forbidden`.
5. If match, allow the request through.

**Pattern:**

```typescript
// middleware.ts
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Only enforce on protected paths
  const protectedPrefixes = ['/sessions', '/outreach', '/meetings', '/list'];
  const isProtected = protectedPrefixes.some((p) => request.nextUrl.pathname.startsWith(p));
  if (!isProtected) return response;

  // Wire up Supabase with cookie reading
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookies) =>
          cookies.forEach(({ name, value, options }) => response.cookies.set(name, value, options)),
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (user.email !== process.env.ALLOWED_EMAIL) {
    await supabase.auth.signOut();
    return NextResponse.redirect(new URL('/forbidden', request.url));
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|login|forgot-password|auth/reset-password|forbidden).*)',
  ],
};
```

The exact code may need adjustment as `@supabase/ssr` evolves; the above is the current canonical pattern as of the Phase 1 build window. If the Supabase docs show a different pattern, use the Supabase docs — they own the source of truth here.

**Why check `user.email` rather than `user.id`.** Email is the natural key for the allowlist — the App Lead types their email when signing in, not a UUID. The check is simple and the failure mode is obvious ("the user that just signed in is not the allowed user").

## 5. Login page

`src/app/(auth)/login/page.tsx` is a single-purpose page with email and password inputs and a "Sign in" button. Below the form, a "Forgot password?" link goes to `/forgot-password`.

**Flow:**

1. User visits `/login`.
2. Types email and password, clicks "Sign in."
3. The form posts to a server action that calls `supabase.auth.signInWithPassword({email, password})`.
4. **On success:** redirect to `/list`. The session cookie is set by the time the redirect lands; middleware sees it and lets the request through.
5. **On failure:** display "Invalid email or password." Do not reveal whether the email exists. Supabase returns the same error for "wrong password" and "no such user" — preserve that ambiguity in the UI.

**Server action pattern:**

```typescript
// src/app/(auth)/login/actions.ts
'use server';

import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { z } from 'zod';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function signIn(formData: FormData) {
  const parsed = schema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });
  if (!parsed.success) {
    return { ok: false, error: 'Invalid email or password.' };
  }

  const supabase = await createServerClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    return { ok: false, error: 'Invalid email or password.' };
  }

  redirect('/list');
}
```

The middleware will catch and reject any non-allowlisted email on the next protected request, so the login server action does not need to repeat the allowlist check. It's fine to add it as belt-and-suspenders, but not required.

**Wrong-email UX.** Because signup is disabled, the wrong-email case is now "user enters an email that doesn't have an account at all." Supabase returns "Invalid login credentials." The login page displays the generic error and stays on the login page. No magic link sent, no inbox pollution, no `/forbidden` redirect on the first try. Cleaner than the magic-link version of this design.

## 6. Forgot password flow

The one remaining magic-link path in the system, used only when the App Lead forgets their password.

**Pages and routes:**

- `src/app/(auth)/forgot-password/page.tsx` — form with one email input and a "Send reset link" button. Submits to a server action that calls `supabase.auth.resetPasswordForEmail(email, { redirectTo: <SITE_URL>/auth/reset-password })`. Shows "If an account exists for that email, a reset link has been sent" regardless of whether the email is registered (avoids leaking which emails exist).
- `src/app/auth/reset-password/route.ts` — the redirect target from the email. Exchanges the recovery code for a temporary session and forwards to the change-password form.
- `src/app/(auth)/change-password/page.tsx` — form with one password input (and a confirm field) and a "Set new password" button. Submits to a server action that calls `supabase.auth.updateUser({ password })`. On success, redirects to `/login` with a success banner.

**Reset-password callback pattern:**

```typescript
// src/app/auth/reset-password/route.ts
import { createServerClient } from '@/lib/supabase/server';
import { NextResponse, type NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');
  if (!code) {
    return NextResponse.redirect(new URL('/login?error=no_code', request.url));
  }

  const supabase = await createServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(new URL('/login?error=reset_failed', request.url));
  }

  // The user now has a temporary session. Forward them to set a new password.
  return NextResponse.redirect(new URL('/change-password', request.url));
}
```

The temporary session created by the reset flow is bound to the same user, so the middleware allowlist check passes when they navigate to `/change-password` (which sits under `(auth)`, so the middleware ignores it anyway). After the password is updated, they're sent to `/login` to sign in fresh.

## 7. The protected route layout

`src/app/(app)/layout.tsx` is the layout shared by all protected routes. It:

1. Confirms the user is authenticated (a defensive check beyond middleware — if middleware misconfigures, the layout still catches it).
2. Renders the top bar showing the user's email and a sign-out button.
3. Renders the child page.

**Defense in depth.** The middleware is the primary auth gate. The layout's server-side check is a backup. The expected case is that both pass; if either fails, no protected content renders.

## 8. Sign out

A simple server action:

```typescript
'use server';
import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export async function signOut() {
  const supabase = await createServerClient();
  await supabase.auth.signOut();
  redirect('/login');
}
```

Rendered as a button in the protected layout's top bar.

## 9. The Phase 3 migration path

What changes when multi-user auth lands in Phase 3:

1. The `ALLOWED_EMAIL` env var is removed. The middleware no longer compares to a single email.
2. Sign-up is re-enabled, gated by an invite-token mechanism OR a captain-only "add team member" action in the app. Captains and Documentation Captain create accounts for new members rather than the open public signing up.
3. A `team_members` table (or equivalent) is added, joining `auth.users` to roles.
4. Middleware reads the user's role from the JWT or from the `team_members` table and decides admission.
5. RLS policies are added to every entry table, gating read/write on `created_by`, role, and table-specific rules (e.g., the 24-hour edit window).

What does _not_ change: the `created_by` column on every entry table (it's already populated correctly in Phase 1), the forms, the renderer, the entry definitions, the insert helper, the password-auth provider, the sign-in form. The Phase 1 architecture is designed so this migration is additive.

## 10. Things that are not Phase 1 auth

For clarity, the following are _not_ implemented in Phase 1 even though related:

- Magic link sign-in (for normal sign-in). The reset-password flow uses a magic-link-style email, but that's the only path.
- OAuth providers (Google, GitHub). Email + password only.
- Multi-factor authentication. Phase 3 or later.
- Custom email branding. Default Supabase template is fine.
- Custom domain for auth emails. Phase 3 or later.
- Account deletion or email change. Phase 3 or later.
- "Remember me" toggle. Sessions persist by default; no toggle needed.
- Open sign-up. Phase 3 will introduce invited sign-up; never open sign-up.
- Password complexity rules beyond Supabase's defaults (which require at least 6 characters). Phase 3 may revisit; Phase 1 keeps the App Lead's password discipline as the App Lead's own responsibility.

If any of these come up during a task, ask in the PR before implementing.
