/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { validateApiKey } from '@/lib/api-auth';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    apiKey: {
      findUnique: jest.fn(),
      update: jest.fn().mockResolvedValue({}),
    },
  },
}));

import { prisma } from '@/lib/prisma';

// Helper: build a valid request with a gtch_ API key. Distinct keys per test
// keep them from colliding on the in-process ApiKey cache (validateApiKey
// memoises by sha256(key) for 60s per instance).
function makeRequest(key: string) {
  return new NextRequest('http://localhost/api/v1/responses', {
    headers: { authorization: `Bearer ${key}` },
  });
}

describe('validateApiKey shape', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns correct ApiKeyData shape when key is valid', async () => {
    (prisma.apiKey.findUnique as jest.Mock).mockResolvedValue({
      id: 'ak-1',
      projectId: 'proj-1',
      allowedDomains: ['example.com'],
      revokedAt: null,
      project: {
        organizationId: 'org-1',
        organization: {
          subscription: { plan: 'PRO', status: 'ACTIVE' },
        },
      },
    });

    const result = await validateApiKey(
      makeRequest('gtch_live_aaaaaaaaaaaaaaaaaaaaaaaaaaaaa1')
    );
    expect(result).toEqual({
      success: true,
      apiKey: {
        id: 'ak-1',
        projectId: 'proj-1',
        organizationId: 'org-1',
        plan: 'PRO',
        allowedDomains: ['example.com'],
      },
    });
  });

  it('defaults to FREE when subscription is null', async () => {
    (prisma.apiKey.findUnique as jest.Mock).mockResolvedValue({
      id: 'ak-2',
      projectId: 'proj-2',
      allowedDomains: [],
      revokedAt: null,
      project: {
        organizationId: 'org-2',
        organization: {
          subscription: null,
        },
      },
    });

    const result = await validateApiKey(
      makeRequest('gtch_live_bbbbbbbbbbbbbbbbbbbbbbbbbbbbb2')
    );
    expect(result).toEqual(
      expect.objectContaining({
        success: true,
        apiKey: expect.objectContaining({ plan: 'FREE' }),
      })
    );
  });

  it('downgrades plan to FREE when subscription is PAST_DUE', async () => {
    (prisma.apiKey.findUnique as jest.Mock).mockResolvedValue({
      id: 'ak-pastdue',
      projectId: 'proj-pastdue',
      allowedDomains: [],
      revokedAt: null,
      project: {
        organizationId: 'org-pastdue',
        organization: {
          subscription: { plan: 'PRO', status: 'PAST_DUE' },
        },
      },
    });

    const result = await validateApiKey(
      makeRequest('gtch_live_ddddddddddddddddddddddddddddd4')
    );
    expect(result).toEqual(
      expect.objectContaining({
        success: true,
        apiKey: expect.objectContaining({ plan: 'FREE' }),
      })
    );
  });

  it('downgrades plan to FREE when subscription is CANCELED', async () => {
    (prisma.apiKey.findUnique as jest.Mock).mockResolvedValue({
      id: 'ak-canceled',
      projectId: 'proj-canceled',
      allowedDomains: [],
      revokedAt: null,
      project: {
        organizationId: 'org-canceled',
        organization: {
          subscription: { plan: 'PRO', status: 'CANCELED' },
        },
      },
    });

    const result = await validateApiKey(
      makeRequest('gtch_live_eeeeeeeeeeeeeeeeeeeeeeeeeeeee5')
    );
    expect(result).toEqual(
      expect.objectContaining({
        success: true,
        apiKey: expect.objectContaining({ plan: 'FREE' }),
      })
    );
  });

  it('keeps PRO when subscription is TRIALING', async () => {
    (prisma.apiKey.findUnique as jest.Mock).mockResolvedValue({
      id: 'ak-trialing',
      projectId: 'proj-trialing',
      allowedDomains: [],
      revokedAt: null,
      project: {
        organizationId: 'org-trialing',
        organization: {
          subscription: { plan: 'PRO', status: 'TRIALING' },
        },
      },
    });

    const result = await validateApiKey(
      makeRequest('gtch_live_fffffffffffffffffffffffffffff6')
    );
    expect(result).toEqual(
      expect.objectContaining({
        success: true,
        apiKey: expect.objectContaining({ plan: 'PRO' }),
      })
    );
  });

  it('uses select (not include) with correct nested fields', async () => {
    (prisma.apiKey.findUnique as jest.Mock).mockResolvedValue(null);

    await validateApiKey(makeRequest('gtch_live_ccccccccccccccccccccccccccccc3'));

    const call = (prisma.apiKey.findUnique as jest.Mock).mock.calls[0][0];

    // Must use select, not include
    expect(call).toHaveProperty('select');
    expect(call).not.toHaveProperty('include');

    // Check nested select structure
    expect(call.select).toEqual(
      expect.objectContaining({
        id: true,
        projectId: true,
        allowedDomains: true,
        revokedAt: true,
        project: {
          select: expect.objectContaining({
            organizationId: true,
            organization: {
              select: {
                subscription: { select: { plan: true, status: true } },
              },
            },
          }),
        },
      })
    );
  });
});
