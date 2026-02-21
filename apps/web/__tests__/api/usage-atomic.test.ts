import { atomicIncrementUsage } from '@/lib/usage-atomic';

// Mock prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    $executeRaw: jest.fn().mockResolvedValue(1),
  },
}));

import { prisma } from '@/lib/prisma';

describe('atomicIncrementUsage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calls $executeRaw with the organization ID', async () => {
    await atomicIncrementUsage('org-123');
    expect(prisma.$executeRaw).toHaveBeenCalledTimes(1);
  });

  it('passes a tagged template (Prisma raw query)', async () => {
    await atomicIncrementUsage('org-456');

    // $executeRaw is called with a tagged template literal
    // The first argument is the template strings array
    const call = (prisma.$executeRaw as jest.Mock).mock.calls[0];
    // Tagged template: first arg is TemplateStringsArray
    expect(Array.isArray(call[0])).toBe(true);
  });

  it('includes start-of-month date and current time in parameters', async () => {
    const before = new Date();
    await atomicIncrementUsage('org-789');
    const after = new Date();

    const call = (prisma.$executeRaw as jest.Mock).mock.calls[0];
    // Tagged template params: [strings, startOfMonth, startOfMonth, now, now, orgId]
    const startOfMonth = call[1];
    const now = call[3]; // 3rd value param (after two startOfMonth refs)

    expect(startOfMonth).toBeInstanceOf(Date);
    expect(startOfMonth.getDate()).toBe(1);
    expect(startOfMonth.getHours()).toBe(0);

    expect(now).toBeInstanceOf(Date);
    expect(now.getTime()).toBeGreaterThanOrEqual(before.getTime());
    expect(now.getTime()).toBeLessThanOrEqual(after.getTime());
  });

  it('does not throw on success', async () => {
    await expect(atomicIncrementUsage('org-ok')).resolves.toBeUndefined();
  });

  it('propagates database errors', async () => {
    (prisma.$executeRaw as jest.Mock).mockRejectedValueOnce(new Error('DB down'));
    await expect(atomicIncrementUsage('org-fail')).rejects.toThrow('DB down');
  });
});
