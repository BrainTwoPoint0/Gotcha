/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';

// Shared call-order tracker populated by mock implementations
const callOrder: string[] = [];

// ── Mocks ────────────────────────────────────────────────────────────────

jest.mock('@/lib/prisma', () => ({
  prisma: {
    element: {
      upsert: jest.fn().mockImplementation(async () => {
        callOrder.push('element.upsert');
        return { id: 'el-db-1' };
      }),
    },
    response: {
      create: jest.fn().mockImplementation(async () => {
        callOrder.push('response.create');
        return {};
      }),
    },
    subscription: {
      findUnique: jest.fn().mockImplementation(async () => {
        callOrder.push('subscription.findUnique');
        return { responsesThisMonth: 10 };
      }),
    },
    bugTicket: {
      create: jest.fn().mockImplementation(async () => {
        callOrder.push('bugTicket.create');
        return { id: 'bug-1' };
      }),
    },
  },
}));

jest.mock('@/lib/api-auth', () => {
  const actual = jest.requireActual('@/lib/api-auth');
  return {
    ...actual,
    validateApiKey: jest.fn(),
  };
});

jest.mock('@/lib/rate-limit', () => ({
  checkRateLimit: jest.fn().mockImplementation(async () => {
    callOrder.push('checkRateLimit');
    return { success: true, remaining: 99, headers: {} };
  }),
  checkIdempotency: jest.fn().mockImplementation(async () => {
    callOrder.push('checkIdempotency');
    return { isDuplicate: false };
  }),
  cacheIdempotencyResponse: jest.fn().mockImplementation(async () => {
    callOrder.push('cacheIdempotencyResponse');
  }),
}));

jest.mock('@/lib/usage-atomic', () => ({
  atomicIncrementUsage: jest.fn().mockImplementation(async () => {
    callOrder.push('atomicIncrementUsage');
  }),
}));

jest.mock('@/lib/webhooks', () => ({
  fireWebhooks: jest.fn().mockImplementation(async () => {
    callOrder.push('fireWebhooks');
  }),
}));

jest.mock('@/lib/emails/send', () => ({
  sendUsageWarningEmail: jest.fn().mockResolvedValue(undefined),
  sendBugReportEmail: jest.fn().mockResolvedValue(undefined),
}));

// ── Imports (after mocks) ────────────────────────────────────────────────

import { POST } from '@/app/api/v1/responses/route';
import { prisma } from '@/lib/prisma';
import { validateApiKey } from '@/lib/api-auth';
import { checkIdempotency, cacheIdempotencyResponse } from '@/lib/rate-limit';
import { atomicIncrementUsage } from '@/lib/usage-atomic';
import { fireWebhooks } from '@/lib/webhooks';

// ── Helpers ──────────────────────────────────────────────────────────────

const FREE_KEY = {
  id: 'ak-1',
  projectId: 'proj-1',
  organizationId: 'org-1',
  plan: 'FREE' as const,
  allowedDomains: [],
};

const PRO_KEY = { ...FREE_KEY, plan: 'PRO' as const };

function makeRequest(body: Record<string, unknown>, headers: Record<string, string> = {}) {
  return new NextRequest('http://localhost/api/v1/responses', {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });
}

const validBody = {
  elementId: 'btn-1',
  mode: 'feedback',
  content: 'Great app!',
  rating: 5,
};

// ── Tests ────────────────────────────────────────────────────────────────

describe('POST /api/v1/responses integration', () => {
  beforeEach(() => {
    callOrder.length = 0;
    jest.clearAllMocks();

    // Default: auth succeeds with FREE plan
    (validateApiKey as jest.Mock).mockResolvedValue({
      success: true,
      apiKey: FREE_KEY,
    });

    // Reset response.create to default success
    (prisma.response.create as jest.Mock).mockImplementation(async () => {
      callOrder.push('response.create');
      return {};
    });

    // Reset subscription to low usage
    (prisma.subscription.findUnique as jest.Mock).mockImplementation(async () => {
      callOrder.push('subscription.findUnique');
      return { responsesThisMonth: 10 };
    });
  });

  it('DB writes complete before response', async () => {
    const res = await POST(makeRequest(validBody));
    expect(res.status).toBe(201);
    expect(callOrder).toContain('response.create');
  });

  it('idempotency cache set AFTER DB write', async () => {
    const req = makeRequest(validBody, { 'idempotency-key': 'idem-1' });
    await POST(req);

    const dbIdx = callOrder.indexOf('response.create');
    const cacheIdx = callOrder.indexOf('cacheIdempotencyResponse');
    expect(dbIdx).toBeGreaterThanOrEqual(0);
    expect(cacheIdx).toBeGreaterThanOrEqual(0);
    expect(dbIdx).toBeLessThan(cacheIdx);
  });

  it('idempotency cache NOT set on DB failure', async () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});

    (prisma.response.create as jest.Mock).mockImplementation(async () => {
      callOrder.push('response.create');
      throw new Error('DB write failed');
    });

    const req = makeRequest(validBody, { 'idempotency-key': 'idem-2' });
    const res = await POST(req);
    // Error now propagates to outer catch which returns 500
    expect(res.status).toBe(500);
    expect(cacheIdempotencyResponse).not.toHaveBeenCalled();

    spy.mockRestore();
  });

  it('no idempotency calls without header', async () => {
    await POST(makeRequest(validBody));
    expect(checkIdempotency).not.toHaveBeenCalled();
    expect(cacheIdempotencyResponse).not.toHaveBeenCalled();
  });

  it('usage counter incremented', async () => {
    await POST(makeRequest(validBody));
    expect(atomicIncrementUsage).toHaveBeenCalledWith('org-1');
    expect(callOrder).toContain('atomicIncrementUsage');
  });

  it('bug ticket created when isBug=true', async () => {
    const body = { ...validBody, isBug: true };
    await POST(makeRequest(body));

    expect(prisma.bugTicket.create).toHaveBeenCalled();
    const createCall = (prisma.bugTicket.create as jest.Mock).mock.calls[0][0];
    expect(createCall.data).toHaveProperty('responseId');
    expect(createCall.data).toHaveProperty('projectId', 'proj-1');
  });

  it('webhooks fired for PRO after DB write', async () => {
    (validateApiKey as jest.Mock).mockResolvedValue({
      success: true,
      apiKey: PRO_KEY,
    });

    await POST(makeRequest(validBody));

    const dbIdx = callOrder.indexOf('response.create');
    const whIdx = callOrder.indexOf('fireWebhooks');
    expect(dbIdx).toBeGreaterThanOrEqual(0);
    expect(whIdx).toBeGreaterThanOrEqual(0);
    expect(dbIdx).toBeLessThan(whIdx);
  });

  it('webhooks NOT fired for FREE', async () => {
    await POST(makeRequest(validBody));
    expect(fireWebhooks).not.toHaveBeenCalled();
  });

  it('gated flag set when FREE plan over limit', async () => {
    // Sprint 2: the gating count now comes back from atomicIncrementUsage via
    // the RETURNING clause — no more follow-up subscription.findUnique.
    (atomicIncrementUsage as jest.Mock).mockImplementationOnce(async () => {
      callOrder.push('atomicIncrementUsage');
      return 501; // 501 exceeds the 500 free limit
    });

    await POST(makeRequest(validBody));

    const createCall = (prisma.response.create as jest.Mock).mock.calls[0][0];
    expect(createCall.data.gated).toBe(true);
  });
});
