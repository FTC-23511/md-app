import { test, expect } from '@playwright/test';

/**
 * This test exercises the auth chain WITHOUT a real sign-in:
 *   1. visiting /dashboard while unauthed redirects to /auth/sign-in
 *   2. the sign-in page renders the email + password form
 *   3. the public /showcase route is reachable without auth
 *
 * Full sign-in coverage (password → session → allowlist) requires a real test
 * user provisioned in Supabase. We add that in a follow-up once we wire test
 * fixtures.
 */

test.describe('auth chain', () => {
  test('unauthenticated visit to /dashboard redirects to sign-in', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/auth\/sign-in/);
  });

  test('sign-in page renders the email + password form', async ({ page }) => {
    await page.goto('/auth/sign-in');
    await expect(page.getByRole('heading', { name: /Maximum Documentation/i })).toBeVisible();
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();
    await expect(page.getByRole('button', { name: /Sign in/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Forgot password/i })).toBeVisible();
  });

  test('public /showcase is reachable without authentication', async ({ page }) => {
    await page.goto('/showcase');
    await expect(page.getByRole('heading', { name: /FTC 23511/i })).toBeVisible();
  });
});
