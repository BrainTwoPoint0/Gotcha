export function getPlanLimit(plan: string): string {
  const limits: Record<string, string> = {
    FREE: '500',
    PRO: '∞',
  };
  return limits[plan] || '500';
}

export function getPlanLimitNum(plan: string): number {
  const limits: Record<string, number> = {
    FREE: 500,
    PRO: 999999,
  };
  return limits[plan] || 500;
}

export function isOverLimit(plan: string, responsesThisMonth: number): boolean {
  if (plan === 'PRO') return false;
  return responsesThisMonth > getPlanLimitNum(plan);
}

export function getAccessibleResponseCount(plan: string, totalResponses: number): number {
  if (plan === 'PRO') return totalResponses;
  const limit = getPlanLimitNum(plan);
  return Math.min(totalResponses, limit);
}

export function shouldShowUpgradeWarning(plan: string, responsesThisMonth: number): boolean {
  if (plan === 'PRO') return false;
  const limit = getPlanLimitNum(plan);
  return responsesThisMonth >= limit * 0.8;
}

// Project limits
export function getProjectLimit(plan: string): number {
  const limits: Record<string, number> = {
    FREE: 1,
    PRO: 999999,
  };
  return limits[plan] || 1;
}

export function getProjectLimitDisplay(plan: string): string {
  const limits: Record<string, string> = {
    FREE: '1',
    PRO: '∞',
  };
  return limits[plan] || '1';
}

export function isOverProjectLimit(plan: string, projectCount: number): boolean {
  if (plan === 'PRO') return false;
  return projectCount >= getProjectLimit(plan);
}
