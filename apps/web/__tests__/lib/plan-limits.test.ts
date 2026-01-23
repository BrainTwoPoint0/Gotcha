import {
  getPlanLimit,
  getPlanLimitNum,
  isOverLimit,
  getAccessibleResponseCount,
  shouldShowUpgradeWarning,
} from '@/lib/plan-limits';

describe('Plan Limits', () => {
  describe('getPlanLimit', () => {
    it('should return 500 for FREE plan', () => {
      expect(getPlanLimit('FREE')).toBe('500');
    });

    it('should return ∞ for PRO plan', () => {
      expect(getPlanLimit('PRO')).toBe('∞');
    });

    it('should return 500 for unknown plan', () => {
      expect(getPlanLimit('UNKNOWN')).toBe('500');
    });
  });

  describe('getPlanLimitNum', () => {
    it('should return 500 for FREE plan', () => {
      expect(getPlanLimitNum('FREE')).toBe(500);
    });

    it('should return 999999 for PRO plan (unlimited)', () => {
      expect(getPlanLimitNum('PRO')).toBe(999999);
    });

    it('should return 500 for unknown plan', () => {
      expect(getPlanLimitNum('UNKNOWN')).toBe(500);
    });
  });

  describe('isOverLimit', () => {
    it('should return false when FREE user is under 500', () => {
      expect(isOverLimit('FREE', 100)).toBe(false);
      expect(isOverLimit('FREE', 499)).toBe(false);
      expect(isOverLimit('FREE', 500)).toBe(false);
    });

    it('should return true when FREE user exceeds 500', () => {
      expect(isOverLimit('FREE', 501)).toBe(true);
      expect(isOverLimit('FREE', 1000)).toBe(true);
    });

    it('should always return false for PRO users', () => {
      expect(isOverLimit('PRO', 500)).toBe(false);
      expect(isOverLimit('PRO', 10000)).toBe(false);
      expect(isOverLimit('PRO', 999999)).toBe(false);
    });
  });

  describe('getAccessibleResponseCount', () => {
    it('should cap FREE users at 500 responses', () => {
      expect(getAccessibleResponseCount('FREE', 100)).toBe(100);
      expect(getAccessibleResponseCount('FREE', 500)).toBe(500);
      expect(getAccessibleResponseCount('FREE', 750)).toBe(500);
      expect(getAccessibleResponseCount('FREE', 1000)).toBe(500);
    });

    it('should not cap PRO users', () => {
      expect(getAccessibleResponseCount('PRO', 100)).toBe(100);
      expect(getAccessibleResponseCount('PRO', 1000)).toBe(1000);
      expect(getAccessibleResponseCount('PRO', 100000)).toBe(100000);
    });
  });

  describe('shouldShowUpgradeWarning', () => {
    it('should return false when FREE user is under 80%', () => {
      expect(shouldShowUpgradeWarning('FREE', 0)).toBe(false);
      expect(shouldShowUpgradeWarning('FREE', 100)).toBe(false);
      expect(shouldShowUpgradeWarning('FREE', 399)).toBe(false);
    });

    it('should return true when FREE user reaches 80% (400)', () => {
      expect(shouldShowUpgradeWarning('FREE', 400)).toBe(true);
      expect(shouldShowUpgradeWarning('FREE', 450)).toBe(true);
      expect(shouldShowUpgradeWarning('FREE', 500)).toBe(true);
      expect(shouldShowUpgradeWarning('FREE', 600)).toBe(true);
    });

    it('should always return false for PRO users', () => {
      expect(shouldShowUpgradeWarning('PRO', 400)).toBe(false);
      expect(shouldShowUpgradeWarning('PRO', 1000)).toBe(false);
    });
  });
});
