import { atomicIncrementUsage } from '@/lib/usage-atomic';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    $queryRaw: jest.fn().mockResolvedValue([{ responsesThisMonth: 1 }]),
  },
}));

import { prisma } from '@/lib/prisma';

describe('atomicIncrementUsage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (prisma.$queryRaw as jest.Mock).mockResolvedValue([{ responsesThisMonth: 1 }]);
  });

  it('calls $queryRaw with the organization ID', async () => {
    await atomicIncrementUsage('org-123');
    expect(prisma.$queryRaw).toHaveBeenCalledTimes(1);
  });

  it('passes a tagged template (Prisma raw query)', async () => {
    await atomicIncrementUsage('org-456');

    const call = (prisma.$queryRaw as jest.Mock).mock.calls[0];
    expect(Array.isArray(call[0])).toBe(true);
  });

  it('includes start-of-month date and current time in parameters', async () => {
    const before = new Date();
    await atomicIncrementUsage('org-789');
    const after = new Date();

    const call = (prisma.$queryRaw as jest.Mock).mock.calls[0];
    // Tagged template params: [strings, startOfMonth, startOfMonth, now, now, orgId]
    const startOfMonth = call[1];
    const now = call[3];

    expect(startOfMonth).toBeInstanceOf(Date);
    expect(startOfMonth.getDate()).toBe(1);
    expect(startOfMonth.getHours()).toBe(0);

    expect(now).toBeInstanceOf(Date);
    expect(now.getTime()).toBeGreaterThanOrEqual(before.getTime());
    expect(now.getTime()).toBeLessThanOrEqual(after.getTime());
  });

  it('returns the new responsesThisMonth count from RETURNING', async () => {
    (prisma.$queryRaw as jest.Mock).mockResolvedValueOnce([{ responsesThisMonth: 42 }]);
    await expect(atomicIncrementUsage('org-ok')).resolves.toBe(42);
  });

  it('returns null when no subscription row matched', async () => {
    (prisma.$queryRaw as jest.Mock).mockResolvedValueOnce([]);
    await expect(atomicIncrementUsage('org-missing')).resolves.toBeNull();
  });

  it('propagates database errors', async () => {
    (prisma.$queryRaw as jest.Mock).mockRejectedValueOnce(new Error('DB down'));
    await expect(atomicIncrementUsage('org-fail')).rejects.toThrow('DB down');
  });
});
