import crypto from 'crypto';
import { prisma } from '@/lib/prisma';

const TIMEOUT_MS = 10_000;
const MAX_FAILURES = 10;

// SSRF protection: block requests to private/internal IP ranges
export function isPrivateUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString);
    const hostname = url.hostname.toLowerCase();

    // Block localhost variants
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1' || hostname === '0.0.0.0') {
      return true;
    }

    // Block private IP ranges
    const parts = hostname.split('.').map(Number);
    if (parts.length === 4 && parts.every((p) => !isNaN(p))) {
      if (parts[0] === 10) return true; // 10.0.0.0/8
      if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true; // 172.16.0.0/12
      if (parts[0] === 192 && parts[1] === 168) return true; // 192.168.0.0/16
      if (parts[0] === 169 && parts[1] === 254) return true; // 169.254.0.0/16 (AWS metadata)
    }

    // Block non-http(s) schemes
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return true;

    return false;
  } catch {
    return true; // Invalid URL = block
  }
}

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

// --- Bug-specific formatters ---

export function formatSlackBugPayload(
  event: string,
  payload: Record<string, unknown>
): Record<string, unknown> {
  const isResolved = event === 'bug.resolved';
  const title = String(payload.title || 'Untitled bug');
  const elementId = payload.elementId || 'unknown';

  const fields: string[] = [];
  fields.push(`*Element:* \`${elementId}\``);
  if (payload.priority) fields.push(`*Priority:* ${String(payload.priority)}`);
  if (payload.status) fields.push(`*Status:* ${String(payload.status)}`);
  if (payload.pageUrl) fields.push(`*Page:* ${String(payload.pageUrl)}`);

  if (isResolved && payload.resolutionNote) {
    fields.push(`*Resolution:* ${String(payload.resolutionNote)}`);
  }

  const emoji = isResolved ? ':white_check_mark:' : ':warning:';
  const heading = isResolved ? 'Bug resolved' : 'New bug reported';

  return {
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `${emoji} *${heading}*\n*${title}*`,
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

export function formatDiscordBugPayload(
  event: string,
  payload: Record<string, unknown>
): Record<string, unknown> {
  const isResolved = event === 'bug.resolved';
  const title = String(payload.title || 'Untitled bug');
  const elementId = payload.elementId || 'unknown';

  const embedFields: { name: string; value: string; inline: boolean }[] = [
    { name: 'Element', value: `\`${elementId}\``, inline: true },
  ];

  if (payload.priority) {
    embedFields.push({ name: 'Priority', value: String(payload.priority), inline: true });
  }
  if (payload.status) {
    embedFields.push({ name: 'Status', value: String(payload.status), inline: true });
  }
  if (payload.pageUrl) {
    embedFields.push({ name: 'Page', value: String(payload.pageUrl), inline: false });
  }
  if (isResolved && payload.resolutionNote) {
    embedFields.push({ name: 'Resolution', value: String(payload.resolutionNote), inline: false });
  }

  return {
    embeds: [
      {
        title: isResolved ? `Bug resolved: ${title}` : `New bug: ${title}`,
        color: isResolved ? 0x16a34a : 0xf59e0b, // green or amber
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
  // SSRF check
  if (isPrivateUrl(webhook.url)) {
    console.warn(`Blocked webhook delivery to private URL: ${webhook.url}`);
    return;
  }

  let body: string;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };

  const isBugEvent = event.startsWith('bug.');

  if (webhook.type === 'slack') {
    body = JSON.stringify(
      isBugEvent
        ? formatSlackBugPayload(event, payload)
        : formatSlackPayload(event, payload)
    );
  } else if (webhook.type === 'discord') {
    body = JSON.stringify(
      isBugEvent
        ? formatDiscordBugPayload(event, payload)
        : formatDiscordPayload(event, payload)
    );
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
