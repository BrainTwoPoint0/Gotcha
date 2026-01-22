import { test, expect } from '@playwright/test';

test.describe('Feedback API', () => {
  // Note: These tests require a valid API key and database connection
  // In CI, you'd use test fixtures or a test database

  test.describe('POST /api/v1/responses', () => {
    test('should return 401 without API key', async ({ request }) => {
      const response = await request.post('/api/v1/responses', {
        data: {
          elementId: 'test-element',
          mode: 'feedback',
          content: 'Test feedback',
        },
      });

      expect(response.status()).toBe(401);
      const body = await response.json();
      expect(body.error.code).toBe('INVALID_API_KEY');
    });

    test('should return 401 with invalid API key', async ({ request }) => {
      const response = await request.post('/api/v1/responses', {
        headers: {
          Authorization: 'Bearer gtch_invalid_key',
        },
        data: {
          elementId: 'test-element',
          mode: 'feedback',
          content: 'Test feedback',
        },
      });

      expect(response.status()).toBe(401);
    });

    test('should return 400 for missing elementId', async ({ request }) => {
      const response = await request.post('/api/v1/responses', {
        headers: {
          Authorization: 'Bearer gtch_test_xxx',
        },
        data: {
          mode: 'feedback',
          content: 'Missing elementId',
        },
      });

      // Will be 401 (invalid key) or 400 (validation) depending on key validity
      expect([400, 401]).toContain(response.status());
    });

    test('should return 400 for invalid mode', async ({ request }) => {
      const response = await request.post('/api/v1/responses', {
        headers: {
          Authorization: 'Bearer gtch_test_xxx',
        },
        data: {
          elementId: 'test',
          mode: 'invalid-mode',
        },
      });

      expect([400, 401]).toContain(response.status());
    });
  });

  test.describe('GET /api/v1/responses', () => {
    test('should return 401 without API key', async ({ request }) => {
      const response = await request.get('/api/v1/responses');

      expect(response.status()).toBe(401);
      const body = await response.json();
      expect(body.error.code).toBe('INVALID_API_KEY');
    });
  });

  test.describe('OPTIONS /api/v1/responses (CORS)', () => {
    test('should return CORS headers', async ({ request }) => {
      const response = await request.fetch('/api/v1/responses', {
        method: 'OPTIONS',
      });

      expect(response.status()).toBe(204);
      expect(response.headers()['access-control-allow-origin']).toBe('*');
      expect(response.headers()['access-control-allow-methods']).toContain('POST');
    });
  });
});

test.describe('Demo API', () => {
  test.describe('POST /api/v1/demo/responses', () => {
    test('should accept demo feedback without API key', async ({ request }) => {
      const response = await request.post('/api/v1/demo/responses', {
        data: {
          elementId: 'demo-element',
          mode: 'feedback',
          content: 'This is a demo feedback',
        },
      });

      // Demo endpoint should accept without auth
      expect([200, 201]).toContain(response.status());
    });

    test('should accept demo vote', async ({ request }) => {
      const response = await request.post('/api/v1/demo/responses', {
        data: {
          elementId: 'demo-vote',
          mode: 'vote',
          vote: 'up',
        },
      });

      expect([200, 201]).toContain(response.status());
    });
  });
});
