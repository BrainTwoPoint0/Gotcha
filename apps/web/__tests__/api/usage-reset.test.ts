import { shouldResetCounter } from '@/lib/usage-reset';

describe('shouldResetCounter', () => {
  it('returns true when resetAt is null (never set)', () => {
    expect(shouldResetCounter(null)).toBe(true);
  });

  it('returns true when resetAt is in previous month', () => {
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    expect(shouldResetCounter(lastMonth)).toBe(true);
  });

  it('returns false when resetAt is in current month', () => {
    const today = new Date();
    expect(shouldResetCounter(today)).toBe(false);
  });

  it('returns true when resetAt is in a previous year', () => {
    const lastYear = new Date();
    lastYear.setFullYear(lastYear.getFullYear() - 1);
    expect(shouldResetCounter(lastYear)).toBe(true);
  });

  it('returns false when resetAt is start of current month', () => {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    expect(shouldResetCounter(startOfMonth)).toBe(false);
  });
});
