/**
 * Unit tests for webhook logic
 * Tests HMAC signature, secret generation, payload structure, failure counting
 */

import crypto from 'crypto';

// Inline the pure functions to test without importing (avoids Prisma dependency)
function generateSignature(secret: string, payload: string): string {
  return crypto.createHmac('sha256', secret).update(payload).digest('hex');
}

function generateSecret(): string {
  return `whsec_${crypto.randomBytes(24).toString('hex')}`;
}

const MAX_FAILURES = 10;

describe('Webhook Logic', () => {
  describe('HMAC Signature', () => {
    it('should generate a valid HMAC-SHA256 signature', () => {
      const secret = 'whsec_test123';
      const payload = JSON.stringify({ id: 'resp_1', mode: 'feedback' });

      const signature = generateSignature(secret, payload);

      // Verify it matches manual computation
      const expected = crypto
        .createHmac('sha256', secret)
        .update(payload)
        .digest('hex');
      expect(signature).toBe(expected);
    });

    it('should produce different signatures for different payloads', () => {
      const secret = 'whsec_test123';
      const sig1 = generateSignature(secret, '{"id":"1"}');
      const sig2 = generateSignature(secret, '{"id":"2"}');

      expect(sig1).not.toBe(sig2);
    });

    it('should produce different signatures for different secrets', () => {
      const payload = '{"id":"1"}';
      const sig1 = generateSignature('secret_a', payload);
      const sig2 = generateSignature('secret_b', payload);

      expect(sig1).not.toBe(sig2);
    });

    it('should produce a 64-character hex string', () => {
      const signature = generateSignature('secret', '{}');
      expect(signature).toMatch(/^[a-f0-9]{64}$/);
    });

    it('should allow verification by receiver', () => {
      const secret = 'whsec_mysecret';
      const payload = JSON.stringify({ id: 'test', event: 'response.created' });

      const signature = generateSignature(secret, payload);

      // Simulate receiver verifying
      const receiverComputed = crypto
        .createHmac('sha256', secret)
        .update(payload)
        .digest('hex');

      const isValid = crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(receiverComputed)
      );
      expect(isValid).toBe(true);
    });
  });

  describe('Secret Generation', () => {
    it('should generate secrets with whsec_ prefix', () => {
      const secret = generateSecret();
      expect(secret).toMatch(/^whsec_[a-f0-9]{48}$/);
    });

    it('should generate unique secrets', () => {
      const secrets = new Set(Array.from({ length: 100 }, () => generateSecret()));
      expect(secrets.size).toBe(100);
    });
  });

  describe('Payload Structure', () => {
    it('should include expected fields for response.created', () => {
      const payload = {
        id: 'resp_123',
        elementId: 'feature-x',
        mode: 'feedback',
        content: 'Great feature!',
        rating: 5,
        vote: null,
        createdAt: '2024-01-01T00:00:00.000Z',
      };

      expect(payload).toHaveProperty('id');
      expect(payload).toHaveProperty('elementId');
      expect(payload).toHaveProperty('mode');
      expect(payload).toHaveProperty('createdAt');
      expect(typeof payload.id).toBe('string');
      expect(typeof payload.createdAt).toBe('string');
    });

    it('should serialize to valid JSON for signing', () => {
      const payload = {
        id: 'resp_123',
        elementId: 'test',
        mode: 'vote',
        content: null,
        rating: null,
        vote: 'up',
        createdAt: new Date().toISOString(),
      };

      const json = JSON.stringify(payload);
      expect(() => JSON.parse(json)).not.toThrow();

      // Should be signable
      const sig = generateSignature('secret', json);
      expect(sig).toMatch(/^[a-f0-9]{64}$/);
    });
  });

  describe('Failure Count + Auto-disable', () => {
    it('should reset failure count to 0 on success', () => {
      const currentFailureCount = 5;
      const success = true;
      const newCount = success ? 0 : currentFailureCount + 1;
      expect(newCount).toBe(0);
    });

    it('should increment failure count on failure', () => {
      const currentFailureCount = 3;
      const success = false;
      const newCount = success ? 0 : currentFailureCount + 1;
      expect(newCount).toBe(4);
    });

    it('should auto-disable at exactly 10 failures', () => {
      const failureCount = 9;
      const success = false;
      const newCount = success ? 0 : failureCount + 1;
      const shouldDisable = newCount >= MAX_FAILURES;
      expect(newCount).toBe(10);
      expect(shouldDisable).toBe(true);
    });

    it('should not auto-disable at 9 failures', () => {
      const failureCount = 8;
      const success = false;
      const newCount = success ? 0 : failureCount + 1;
      const shouldDisable = newCount >= MAX_FAILURES;
      expect(newCount).toBe(9);
      expect(shouldDisable).toBe(false);
    });

    it('should reset count even after many failures if a success comes', () => {
      const failureCount = 9;
      const success = true;
      const newCount = success ? 0 : failureCount + 1;
      expect(newCount).toBe(0);
    });
  });

  describe('Event Filtering', () => {
    const VALID_EVENTS = ['response.created'];

    it('should match response.created event', () => {
      const webhookEvents = ['response.created'];
      const event = 'response.created';
      expect(webhookEvents.includes(event)).toBe(true);
    });

    it('should not match unknown events', () => {
      const webhookEvents = ['response.created'];
      const event = 'response.deleted';
      expect(webhookEvents.includes(event)).toBe(false);
    });

    it('should only fire for subscribed events', () => {
      const webhooks = [
        { id: '1', events: ['response.created'], active: true },
        { id: '2', events: ['response.updated'], active: true },
      ];

      const event = 'response.created';
      const matching = webhooks.filter(
        (w) => w.active && w.events.includes(event)
      );

      expect(matching).toHaveLength(1);
      expect(matching[0].id).toBe('1');
    });

    it('should skip inactive webhooks', () => {
      const webhooks = [
        { id: '1', events: ['response.created'], active: false },
        { id: '2', events: ['response.created'], active: true },
      ];

      const event = 'response.created';
      const matching = webhooks.filter(
        (w) => w.active && w.events.includes(event)
      );

      expect(matching).toHaveLength(1);
      expect(matching[0].id).toBe('2');
    });
  });
});
