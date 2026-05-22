import { test, expect } from '@playwright/test';

test.describe('health', () => {
  test('GET /api/health returns ok:true', async ({ request }) => {
    const response = await request.get('/api/health');
    expect(response.status()).toBe(200);
    const body = (await response.json()) as { ok: boolean; service: string };
    expect(body.ok).toBe(true);
    expect(body.service).toBe('md-app');
  });
});
