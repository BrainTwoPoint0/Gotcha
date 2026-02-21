/**
 * Determines whether the monthly usage counter should be reset.
 * Returns true if resetAt is null or falls before the start of the current month.
 */
export function shouldResetCounter(resetAt: Date | null | undefined): boolean {
  if (!resetAt) return true;

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  return resetAt < startOfMonth;
}
