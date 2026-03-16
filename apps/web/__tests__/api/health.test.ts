/**
 * @jest-environment node
 */
import { GET } from '@/app/api/health/route';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    $queryRaw: jest.fn().mockResolvedValue([{ '?column?': 1 }]),
  },
}));

import { prisma } from '@/lib/prisma';

describe('GET /api/health', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calls prisma.$queryRaw', async () => {
    await GET();
    expect(prisma.$queryRaw).toHaveBeenCalled();
  });

  it('returns { status: ok, timestamp } with 200', async () => {
    const res = await GET();
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.status).toBe('ok');
    expect(typeof body.timestamp).toBe('string');
    // timestamp should be a valid ISO string
    expect(new Date(body.timestamp).toISOString()).toBe(body.timestamp);
  });

  it('returns 503 if Prisma connection fails', async () => {
    (prisma.$queryRaw as jest.Mock).mockRejectedValueOnce(new Error('Connection refused'));

    const res = await GET();
    expect(res.status).toBe(503);

    const body = await res.json();
    expect(body.status).toBe('error');
  });
});
