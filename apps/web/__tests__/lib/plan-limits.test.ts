describe('Plan Limits', () => {
  const getPlanLimit = (plan: string): string => {
    const limits: Record<string, string> = {
      FREE: '500',
      PRO: '∞',
    };
    return limits[plan] || '500';
  };

  const getPlanLimitNum = (plan: string): number => {
    const limits: Record<string, number> = {
      FREE: 500,
      PRO: 999999,
    };
    return limits[plan] || 500;
  };

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
});
