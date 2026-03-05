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
  webhook: { id: string; url: string; secret: string; failureCount: number },
  event: string,
  payload: Record<string, unknown>,
  timestamp: string
) {
  const body = JSON.stringify(payload);
  const signature = generateSignature(webhook.secret, body);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  const start = Date.now();
  let statusCode: number | null = null;
  let success = false;
  let error: string | null = null;

  try {
    const res = await fetch(webhook.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Gotcha-Signature': signature,
        'X-Gotcha-Event': event,
        'X-Gotcha-Timestamp': timestamp,
      },
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
