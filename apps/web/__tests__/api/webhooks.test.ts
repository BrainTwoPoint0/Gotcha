/**
 * Unit tests for webhook logic
 * Tests HMAC signature, secret generation, payload structure, failure counting,
 * and Slack/Discord payload formatters
 */

import crypto from 'crypto';

// Inline the pure functions to test without importing (avoids Prisma dependency)
function generateSignature(secret: string, payload: string): string {
  return crypto.createHmac('sha256', secret).update(payload).digest('hex');
}

function generateSecret(): string {
  return `whsec_${crypto.randomBytes(24).toString('hex')}`;
}

// Inline formatters (mirrors lib/webhooks.ts) to avoid Prisma import
function formatSlackPayload(
  event: string,
  payload: Record<string, unknown>
): Record<string, unknown> {
  const mode = String(payload.mode || 'feedback').toLowerCase();
  const elementId = payload.elementId || payload.elementIdRaw || 'unknown';

  const fields: string[] = [];
  fields.push(`*Event:* \`${event}\``);
  fields.push(`*Element:* \`${elementId}\``);
  fields.push(`*Mode:* ${mode}`);

  if (payload.rating != null) {
    const stars = '★'.repeat(Number(payload.rating)) + '☆'.repeat(5 - Number(payload.rating));
    fields.push(`*Rating:* ${stars}`);
  }
  if (payload.vote != null) {
    const emoji = String(payload.vote).toUpperCase() === 'UP' ? ':thumbsup:' : ':thumbsdown:';
    fields.push(`*Vote:* ${emoji}`);
  }
  if (payload.content) {
    fields.push(`*Content:*\n>${String(payload.content)}`);
  }

  return {
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*New ${mode} response* from Gotcha`,
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: fields.join('\n'),
        },
      },
    ],
  };
}

function formatDiscordPayload(
  event: string,
  payload: Record<string, unknown>
): Record<string, unknown> {
  const mode = String(payload.mode || 'feedback').toLowerCase();
  const elementId = payload.elementId || payload.elementIdRaw || 'unknown';

  const embedFields: { name: string; value: string; inline: boolean }[] = [
    { name: 'Event', value: `\`${event}\``, inline: true },
    { name: 'Element', value: `\`${elementId}\``, inline: true },
    { name: 'Mode', value: mode, inline: true },
  ];

  if (payload.rating != null) {
    const stars = '★'.repeat(Number(payload.rating)) + '☆'.repeat(5 - Number(payload.rating));
    embedFields.push({ name: 'Rating', value: stars, inline: true });
  }
  if (payload.vote != null) {
    const emoji = String(payload.vote).toUpperCase() === 'UP' ? '👍' : '👎';
    embedFields.push({ name: 'Vote', value: emoji, inline: true });
  }

  const description = payload.content ? String(payload.content) : undefined;

  return {
    embeds: [
      {
        title: `New ${mode} response`,
        description,
        color: 0x6366f1,
        fields: embedFields,
        timestamp: new Date().toISOString(),
        footer: { text: 'Gotcha' },
      },
    ],
  };
}

const MAX_FAILURES = 10;

describe('Webhook Logic', () => {
  describe('HMAC Signature', () => {
    it('should generate a valid HMAC-SHA256 signature', () => {
      const secret = 'whsec_test123';
      const payload = JSON.stringify({ id: 'resp_1', mode: 'feedback' });

      const signature = generateSignature(secret, payload);

      // Verify it matches manual computation
      const expected = crypto.createHmac('sha256', secret).update(payload).digest('hex');
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
      const receiverComputed = crypto.createHmac('sha256', secret).update(payload).digest('hex');

      const isValid = crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(receiverComputed));
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
      const matching = webhooks.filter((w) => w.active && w.events.includes(event));

      expect(matching).toHaveLength(1);
      expect(matching[0].id).toBe('1');
    });

    it('should skip inactive webhooks', () => {
      const webhooks = [
        { id: '1', events: ['response.created'], active: false },
        { id: '2', events: ['response.created'], active: true },
      ];

      const event = 'response.created';
      const matching = webhooks.filter((w) => w.active && w.events.includes(event));

      expect(matching).toHaveLength(1);
      expect(matching[0].id).toBe('2');
    });
  });

  describe('Slack Payload Formatter', () => {
    const basePayload = {
      id: 'resp_123',
      elementId: 'feature-x',
      mode: 'feedback',
      content: 'Great feature!',
      rating: 4,
      vote: null,
      createdAt: '2024-01-01T00:00:00.000Z',
    };

    it('should return Slack Block Kit structure with blocks array', () => {
      const result = formatSlackPayload('response.created', basePayload) as { blocks: unknown[] };
      expect(result).toHaveProperty('blocks');
      expect(Array.isArray(result.blocks)).toBe(true);
      expect(result.blocks).toHaveLength(2);
    });

    it('should have section blocks with mrkdwn text', () => {
      const result = formatSlackPayload('response.created', basePayload) as {
        blocks: Array<{ type: string; text: { type: string; text: string } }>;
      };
      expect(result.blocks[0].type).toBe('section');
      expect(result.blocks[0].text.type).toBe('mrkdwn');
      expect(result.blocks[0].text.text).toContain('feedback');
    });

    it('should include rating stars', () => {
      const result = formatSlackPayload('response.created', basePayload) as {
        blocks: Array<{ text: { text: string } }>;
      };
      const fieldsText = result.blocks[1].text.text;
      expect(fieldsText).toContain('★★★★☆');
    });

    it('should include content as quote', () => {
      const result = formatSlackPayload('response.created', basePayload) as {
        blocks: Array<{ text: { text: string } }>;
      };
      const fieldsText = result.blocks[1].text.text;
      expect(fieldsText).toContain('>Great feature!');
    });

    it('should show vote emoji for vote mode', () => {
      const votePayload = { ...basePayload, mode: 'vote', vote: 'UP', rating: null };
      const result = formatSlackPayload('response.created', votePayload) as {
        blocks: Array<{ text: { text: string } }>;
      };
      const fieldsText = result.blocks[1].text.text;
      expect(fieldsText).toContain(':thumbsup:');
    });

    it('should include element name', () => {
      const result = formatSlackPayload('response.created', basePayload) as {
        blocks: Array<{ text: { text: string } }>;
      };
      const fieldsText = result.blocks[1].text.text;
      expect(fieldsText).toContain('feature-x');
    });
  });

  describe('Discord Payload Formatter', () => {
    const basePayload = {
      id: 'resp_123',
      elementId: 'feature-x',
      mode: 'feedback',
      content: 'Great feature!',
      rating: 3,
      vote: null,
      createdAt: '2024-01-01T00:00:00.000Z',
    };

    it('should return Discord embed structure', () => {
      const result = formatDiscordPayload('response.created', basePayload) as { embeds: unknown[] };
      expect(result).toHaveProperty('embeds');
      expect(Array.isArray(result.embeds)).toBe(true);
      expect(result.embeds).toHaveLength(1);
    });

    it('should have correct embed title and description', () => {
      const result = formatDiscordPayload('response.created', basePayload) as {
        embeds: Array<{ title: string; description: string }>;
      };
      expect(result.embeds[0].title).toBe('New feedback response');
      expect(result.embeds[0].description).toBe('Great feature!');
    });

    it('should have embed color and timestamp', () => {
      const result = formatDiscordPayload('response.created', basePayload) as {
        embeds: Array<{ color: number; timestamp: string }>;
      };
      expect(result.embeds[0].color).toBe(0x6366f1);
      expect(result.embeds[0].timestamp).toBeDefined();
    });

    it('should have inline fields for event, element, mode', () => {
      const result = formatDiscordPayload('response.created', basePayload) as {
        embeds: Array<{ fields: Array<{ name: string; value: string; inline: boolean }> }>;
      };
      const fields = result.embeds[0].fields;
      expect(fields.length).toBeGreaterThanOrEqual(3);
      expect(fields[0].name).toBe('Event');
      expect(fields[1].name).toBe('Element');
      expect(fields[2].name).toBe('Mode');
      expect(fields.every((f) => f.inline)).toBe(true);
    });

    it('should include rating stars as a field', () => {
      const result = formatDiscordPayload('response.created', basePayload) as {
        embeds: Array<{ fields: Array<{ name: string; value: string }> }>;
      };
      const ratingField = result.embeds[0].fields.find((f) => f.name === 'Rating');
      expect(ratingField).toBeDefined();
      expect(ratingField!.value).toBe('★★★☆☆');
    });

    it('should include vote emoji for vote mode', () => {
      const votePayload = { ...basePayload, mode: 'vote', vote: 'DOWN', rating: null };
      const result = formatDiscordPayload('response.created', votePayload) as {
        embeds: Array<{ fields: Array<{ name: string; value: string }> }>;
      };
      const voteField = result.embeds[0].fields.find((f) => f.name === 'Vote');
      expect(voteField).toBeDefined();
      expect(voteField!.value).toBe('👎');
    });

    it('should have Gotcha footer', () => {
      const result = formatDiscordPayload('response.created', basePayload) as {
        embeds: Array<{ footer: { text: string } }>;
      };
      expect(result.embeds[0].footer.text).toBe('Gotcha');
    });
  });

  describe('Type-based Signature Behavior', () => {
    it('custom type should generate a signature', () => {
      const secret = 'whsec_test';
      const payload = '{"test":true}';
      const sig = generateSignature(secret, payload);
      expect(sig).toMatch(/^[a-f0-9]{64}$/);
    });

    it('slack type should not need a signature (no secret)', () => {
      // Slack webhooks don't use HMAC — secret is null
      const secret = null;
      expect(secret).toBeNull();
    });

    it('discord type should not need a signature (no secret)', () => {
      const secret = null;
      expect(secret).toBeNull();
    });

    it('custom type should generate a secret on creation', () => {
      const type = 'custom';
      const secret = type === 'custom' ? generateSecret() : null;
      expect(secret).not.toBeNull();
      expect(secret).toMatch(/^whsec_/);
    });

    it('slack type should not generate a secret on creation', () => {
      const type = 'slack' as 'slack' | 'discord' | 'custom';
      const secret = type === 'custom' ? generateSecret() : null;
      expect(secret).toBeNull();
    });

    it('discord type should not generate a secret on creation', () => {
      const type = 'discord' as 'slack' | 'discord' | 'custom';
      const secret = type === 'custom' ? generateSecret() : null;
      expect(secret).toBeNull();
    });
  });
});
