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

// Helper: build a valid request with a gtch_ API key
function makeRequest(key = 'gtch_live_abcdefghijklmnopqrstuvwxyz1234') {
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
          subscription: { plan: 'PRO' },
        },
      },
    });

    const result = await validateApiKey(makeRequest());
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

    const result = await validateApiKey(makeRequest());
    expect(result).toEqual(
      expect.objectContaining({
        success: true,
        apiKey: expect.objectContaining({ plan: 'FREE' }),
      })
    );
  });

  it('uses select (not include) with correct nested fields', async () => {
    (prisma.apiKey.findUnique as jest.Mock).mockResolvedValue(null);

    await validateApiKey(makeRequest());

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
                subscription: { select: { plan: true } },
              },
            },
          }),
        },
      })
    );
  });
});
