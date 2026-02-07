import { test, expect } from '@playwright/test';

/**
 * Response submission performance tests
 *
 * Performance budgets:
 *   - Demo endpoint (no DB):  < 500ms
 *   - Public API (with auth + DB): < 1000ms
 *   - Internal API (with DB):      < 1000ms
 *
 * These budgets cover server processing time only (measured via
 * HTTP round-trip). They do NOT include the SDK's client-side
 * auto-close delay, which is a separate UX concern.
 */

const PERF_BUDGET_DEMO_MS = 500;
const PERF_BUDGET_API_MS = 1000;

test.describe('Response Submission Performance', () => {
  test.describe('Demo endpoint', () => {
    test('POST /api/v1/demo/responses completes within budget', async ({ request }) => {
      const start = performance.now();

      const response = await request.post('/api/v1/demo/responses', {
        data: {
          elementId: 'perf-test-demo',
          mode: 'feedback',
          content: 'Performance test feedback',
        },
      });

      const elapsed = performance.now() - start;

      expect(response.status()).toBe(200);
      expect(elapsed).toBeLessThan(PERF_BUDGET_DEMO_MS);

      // Log for visibility in CI
      console.log(`Demo POST: ${Math.round(elapsed)}ms (budget: ${PERF_BUDGET_DEMO_MS}ms)`);
    });

    test('Demo vote submission completes within budget', async ({ request }) => {
      const start = performance.now();

      const response = await request.post('/api/v1/demo/responses', {
        data: {
          elementId: 'perf-test-demo-vote',
          mode: 'vote',
          vote: 'up',
        },
      });

      const elapsed = performance.now() - start;

      expect(response.status()).toBe(200);
      expect(elapsed).toBeLessThan(PERF_BUDGET_DEMO_MS);

      console.log(`Demo vote POST: ${Math.round(elapsed)}ms (budget: ${PERF_BUDGET_DEMO_MS}ms)`);
    });
  });

  test.describe('Public API endpoint', () => {
    test('POST /api/v1/responses auth rejection is fast', async ({ request }) => {
      // Even a 401 should be fast — measures auth overhead
      const start = performance.now();

      const response = await request.post('/api/v1/responses', {
        headers: {
          Authorization: 'Bearer gtch_invalid_key',
        },
        data: {
          elementId: 'perf-test',
          mode: 'feedback',
          content: 'Should be rejected',
        },
      });

      const elapsed = performance.now() - start;

      expect(response.status()).toBe(401);
      expect(elapsed).toBeLessThan(PERF_BUDGET_API_MS);

      console.log(`Public API 401: ${Math.round(elapsed)}ms (budget: ${PERF_BUDGET_API_MS}ms)`);
    });
  });

  test.describe('Internal API endpoint', () => {
    test('POST /api/v1/internal/responses returns within budget (or expected error)', async ({
      request,
    }) => {
      // This hits the real internal route with DB.
      // Without GOTCHA_SDK_API configured it returns 500, but we still
      // measure the response time to catch regressions in the code path.
      const start = performance.now();

      const response = await request.post('/api/v1/internal/responses', {
        data: {
          elementId: 'perf-test-internal',
          mode: 'feedback',
          content: 'Performance test',
        },
      });

      const elapsed = performance.now() - start;
      const status = response.status();

      // 201 = success (SDK API configured), 500 = SDK API not configured
      expect([201, 500]).toContain(status);
      expect(elapsed).toBeLessThan(PERF_BUDGET_API_MS);

      console.log(
        `Internal API (status ${status}): ${Math.round(elapsed)}ms (budget: ${PERF_BUDGET_API_MS}ms)`
      );
    });
  });

  test.describe('CORS preflight', () => {
    test('OPTIONS /api/v1/responses is near-instant', async ({ request }) => {
      const start = performance.now();

      const response = await request.fetch('/api/v1/responses', {
        method: 'OPTIONS',
      });

      const elapsed = performance.now() - start;

      expect(response.status()).toBe(204);
      expect(elapsed).toBeLessThan(200);

      console.log(`CORS preflight: ${Math.round(elapsed)}ms (budget: 200ms)`);
    });
  });
});
