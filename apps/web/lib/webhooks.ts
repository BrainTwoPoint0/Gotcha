import crypto from 'crypto';
import { prisma } from '@/lib/prisma';

const TIMEOUT_MS = 10_000;
const MAX_FAILURES = 10;

export function generateSignature(secret: string, payload: string): string {
  return crypto.createHmac('sha256', secret).update(payload).digest('hex');
}

export function generateSecret(): string {
  return `whsec_${crypto.randomBytes(24).toString('hex')}`;
}

// --- Slack / Discord formatters ---

export function formatSlackPayload(
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

export function formatDiscordPayload(
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
        color: 0x6366f1, // indigo
        fields: embedFields,
        timestamp: new Date().toISOString(),
        footer: { text: 'Gotcha' },
      },
    ],
  };
}

// --- Delivery ---

export async function fireWebhooks(
  projectId: string,
  event: string,
  payload: Record<string, unknown>
) {
  const webhooks = await prisma.webhook.findMany({
    where: {
      projectId,
      active: true,
      events: { has: event },
    },
  });

  if (webhooks.length === 0) return;

  const timestamp = Date.now().toString();

  await Promise.allSettled(
    webhooks.map((webhook) => deliverWebhook(webhook, event, payload, timestamp))
  );
}

async function deliverWebhook(
  webhook: { id: string; type: string; url: string; secret: string | null; failureCount: number },
  event: string,
  payload: Record<string, unknown>,
  timestamp: string
) {
  let body: string;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };

  if (webhook.type === 'slack') {
    body = JSON.stringify(formatSlackPayload(event, payload));
  } else if (webhook.type === 'discord') {
    body = JSON.stringify(formatDiscordPayload(event, payload));
  } else {
    // custom — raw payload + HMAC signature
    body = JSON.stringify(payload);
    if (webhook.secret) {
      const signature = generateSignature(webhook.secret, body);
      headers['X-Gotcha-Signature'] = signature;
    }
    headers['X-Gotcha-Event'] = event;
    headers['X-Gotcha-Timestamp'] = timestamp;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  const start = Date.now();
  let statusCode: number | null = null;
  let success = false;
  let error: string | null = null;

  try {
    const res = await fetch(webhook.url, {
      method: 'POST',
      headers,
      body,
      signal: controller.signal,
    });

    statusCode = res.status;
    success = res.ok;

    if (!res.ok) {
      error = `HTTP ${res.status}`;
    }
  } catch (err) {
    error = err instanceof Error ? err.message : 'Unknown error';
  } finally {
    clearTimeout(timeout);
  }

  const responseMs = Date.now() - start;

  // Log + update webhook state in parallel
  const newFailureCount = success ? 0 : webhook.failureCount + 1;

  await Promise.allSettled([
    prisma.webhookLog.create({
      data: {
        webhookId: webhook.id,
        event,
        payload: JSON.parse(JSON.stringify(payload)),
        statusCode,
        responseMs,
        error,
        success,
      },
    }),
    prisma.webhook.update({
      where: { id: webhook.id },
      data: {
        lastTriggeredAt: new Date(),
        lastStatusCode: statusCode,
        failureCount: newFailureCount,
        ...(newFailureCount >= MAX_FAILURES ? { active: false } : {}),
      },
    }),
  ]);
}
