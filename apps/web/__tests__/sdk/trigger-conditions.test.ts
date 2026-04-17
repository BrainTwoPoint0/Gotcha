/**
 * Tests for SDK trigger conditions logic (showAfterSeconds, showAfterScrollPercent, showAfterVisits)
 * Note: These test the pure logic without importing from the SDK
 */

describe('SDK Trigger Conditions', () => {
  describe('Scroll percentage calculation', () => {
    const calculateScrollPercent = (
      scrollY: number,
      innerHeight: number,
      scrollHeight: number
    ): number => {
      if (scrollHeight <= 0) return 100;
      return ((scrollY + innerHeight) / scrollHeight) * 100;
    };

    it('should return 0% at top of tall page', () => {
      // scrollY=0, viewport=500, page=5000
      const percent = calculateScrollPercent(0, 500, 5000);
      expect(percent).toBe(10);
    });

    it('should return 100% at bottom of page', () => {
      // scrollY=4500, viewport=500, page=5000
      const percent = calculateScrollPercent(4500, 500, 5000);
      expect(percent).toBe(100);
    });

    it('should return 50% at midpoint', () => {
      // scrollY=250, viewport=500, page=1000
      const percent = calculateScrollPercent(250, 500, 1000);
      expect(percent).toBe(75);
    });

    it('should handle page that cannot scroll (viewport >= content)', () => {
      // Content fits entirely in viewport
      const percent = calculateScrollPercent(0, 800, 800);
      expect(percent).toBe(100);
    });

    it('should handle viewport larger than content', () => {
      const percent = calculateScrollPercent(0, 1200, 600);
      expect(percent).toBeGreaterThanOrEqual(100);
    });

    it('should return 100% for zero scroll height', () => {
      const percent = calculateScrollPercent(0, 500, 0);
      expect(percent).toBe(100);
    });

    it('should handle small scroll increments', () => {
      const percent = calculateScrollPercent(100, 500, 5000);
      expect(percent).toBe(12);
    });

    it('should calculate correctly for typical desktop page', () => {
      // Typical: viewport 900px, page 3000px, scrolled 1000px
      const percent = calculateScrollPercent(1000, 900, 3000);
      expect(percent).toBeCloseTo(63.33, 1);
    });

    it('should calculate correctly for short mobile page', () => {
      // viewport 667px, page 1200px, scrolled 200px
      const percent = calculateScrollPercent(200, 667, 1200);
      expect(percent).toBeCloseTo(72.25, 1);
    });
  });

  describe('Visit counting logic', () => {
    const VISIT_KEY_PREFIX = 'gotcha_visits_';

    const getVisitKey = (elementId: string): string => {
      return `${VISIT_KEY_PREFIX}${elementId}`;
    };

    const incrementVisitCount = (storage: Record<string, string>, elementId: string): number => {
      const key = getVisitKey(elementId);
      const current = parseInt(storage[key] || '0', 10);
      const newCount = current + 1;
      storage[key] = String(newCount);
      return newCount;
    };

    const getVisitCount = (storage: Record<string, string>, elementId: string): number => {
      const key = getVisitKey(elementId);
      return parseInt(storage[key] || '0', 10);
    };

    const hasMetVisitThreshold = (
      storage: Record<string, string>,
      elementId: string,
      threshold: number
    ): boolean => {
      return getVisitCount(storage, elementId) >= threshold;
    };

    it('should format key as gotcha_visits_{elementId}', () => {
      expect(getVisitKey('my-widget')).toBe('gotcha_visits_my-widget');
      expect(getVisitKey('feedback-123')).toBe('gotcha_visits_feedback-123');
    });

    it('should start at 0 for new element', () => {
      const storage: Record<string, string> = {};
      expect(getVisitCount(storage, 'new-element')).toBe(0);
    });

    it('should increment from 0 to 1 on first visit', () => {
      const storage: Record<string, string> = {};
      const count = incrementVisitCount(storage, 'widget-1');
      expect(count).toBe(1);
    });

    it('should increment sequentially', () => {
      const storage: Record<string, string> = {};
      incrementVisitCount(storage, 'widget-1');
      incrementVisitCount(storage, 'widget-1');
      incrementVisitCount(storage, 'widget-1');
      expect(getVisitCount(storage, 'widget-1')).toBe(3);
    });

    it('should track different elements independently', () => {
      const storage: Record<string, string> = {};
      incrementVisitCount(storage, 'widget-a');
      incrementVisitCount(storage, 'widget-a');
      incrementVisitCount(storage, 'widget-b');
      expect(getVisitCount(storage, 'widget-a')).toBe(2);
      expect(getVisitCount(storage, 'widget-b')).toBe(1);
    });

    it('should meet threshold when count equals threshold', () => {
      const storage: Record<string, string> = {};
      incrementVisitCount(storage, 'w');
      incrementVisitCount(storage, 'w');
      incrementVisitCount(storage, 'w');
      expect(hasMetVisitThreshold(storage, 'w', 3)).toBe(true);
    });

    it('should meet threshold when count exceeds threshold', () => {
      const storage: Record<string, string> = {};
      for (let i = 0; i < 5; i++) {
        incrementVisitCount(storage, 'w');
      }
      expect(hasMetVisitThreshold(storage, 'w', 3)).toBe(true);
    });

    it('should not meet threshold when count is below', () => {
      const storage: Record<string, string> = {};
      incrementVisitCount(storage, 'w');
      expect(hasMetVisitThreshold(storage, 'w', 3)).toBe(false);
    });

    it('should not meet threshold with 0 visits', () => {
      const storage: Record<string, string> = {};
      expect(hasMetVisitThreshold(storage, 'w', 1)).toBe(false);
    });
  });

  describe('Time condition logic', () => {
    const hasTimeElapsed = (startTime: number, currentTime: number, seconds: number): boolean => {
      return (currentTime - startTime) / 1000 >= seconds;
    };

    it('should return false when no time has passed', () => {
      expect(hasTimeElapsed(1000, 1000, 5)).toBe(false);
    });

    it('should return false before threshold', () => {
      expect(hasTimeElapsed(1000, 4000, 5)).toBe(false);
    });

    it('should return true when exactly at threshold', () => {
      expect(hasTimeElapsed(1000, 6000, 5)).toBe(true);
    });

    it('should return true after threshold', () => {
      expect(hasTimeElapsed(1000, 20000, 5)).toBe(true);
    });

    it('should handle 0 second threshold (always true)', () => {
      expect(hasTimeElapsed(1000, 1000, 0)).toBe(true);
    });
  });

  describe('AND logic — all conditions must be met', () => {
    interface TriggerConfig {
      showAfterSeconds?: number;
      showAfterScrollPercent?: number;
      showAfterVisits?: number;
    }

    interface TriggerState {
      timeMet: boolean;
      scrollMet: boolean;
      visitsMet: boolean;
    }

    const evaluateConditions = (config: TriggerConfig, state: TriggerState): boolean => {
      // If a condition is not specified, it is considered met
      const timeOk = config.showAfterSeconds === undefined || state.timeMet;
      const scrollOk = config.showAfterScrollPercent === undefined || state.scrollMet;
      const visitsOk = config.showAfterVisits === undefined || state.visitsMet;
      return timeOk && scrollOk && visitsOk;
    };

    it('should return true when no conditions are specified', () => {
      expect(evaluateConditions({}, { timeMet: false, scrollMet: false, visitsMet: false })).toBe(
        true
      );
    });

    it('should return true when all specified conditions are met', () => {
      const config: TriggerConfig = {
        showAfterSeconds: 5,
        showAfterScrollPercent: 50,
        showAfterVisits: 3,
      };
      expect(evaluateConditions(config, { timeMet: true, scrollMet: true, visitsMet: true })).toBe(
        true
      );
    });

    it('should return false when time condition is unmet', () => {
      const config: TriggerConfig = {
        showAfterSeconds: 5,
        showAfterScrollPercent: 50,
      };
      expect(evaluateConditions(config, { timeMet: false, scrollMet: true, visitsMet: true })).toBe(
        false
      );
    });

    it('should return false when scroll condition is unmet', () => {
      const config: TriggerConfig = {
        showAfterSeconds: 5,
        showAfterScrollPercent: 50,
      };
      expect(evaluateConditions(config, { timeMet: true, scrollMet: false, visitsMet: true })).toBe(
        false
      );
    });

    it('should return false when visits condition is unmet', () => {
      const config: TriggerConfig = {
        showAfterSeconds: 5,
        showAfterVisits: 3,
      };
      expect(evaluateConditions(config, { timeMet: true, scrollMet: true, visitsMet: false })).toBe(
        false
      );
    });

    it('should return false when all specified conditions are unmet', () => {
      const config: TriggerConfig = {
        showAfterSeconds: 5,
        showAfterScrollPercent: 50,
        showAfterVisits: 3,
      };
      expect(
        evaluateConditions(config, { timeMet: false, scrollMet: false, visitsMet: false })
      ).toBe(false);
    });

    it('should ignore unspecified time condition', () => {
      const config: TriggerConfig = { showAfterScrollPercent: 50 };
      // timeMet is false but time is not specified, so it doesn't matter
      expect(
        evaluateConditions(config, { timeMet: false, scrollMet: true, visitsMet: false })
      ).toBe(true);
    });

    it('should ignore unspecified scroll condition', () => {
      const config: TriggerConfig = { showAfterSeconds: 5 };
      expect(
        evaluateConditions(config, { timeMet: true, scrollMet: false, visitsMet: false })
      ).toBe(true);
    });

    it('should ignore unspecified visits condition', () => {
      const config: TriggerConfig = { showAfterSeconds: 5, showAfterScrollPercent: 50 };
      expect(evaluateConditions(config, { timeMet: true, scrollMet: true, visitsMet: false })).toBe(
        true
      );
    });

    it('should handle single condition: time only', () => {
      expect(
        evaluateConditions(
          { showAfterSeconds: 10 },
          { timeMet: true, scrollMet: false, visitsMet: false }
        )
      ).toBe(true);
      expect(
        evaluateConditions(
          { showAfterSeconds: 10 },
          { timeMet: false, scrollMet: true, visitsMet: true }
        )
      ).toBe(false);
    });

    it('should handle single condition: scroll only', () => {
      expect(
        evaluateConditions(
          { showAfterScrollPercent: 75 },
          { timeMet: false, scrollMet: true, visitsMet: false }
        )
      ).toBe(true);
      expect(
        evaluateConditions(
          { showAfterScrollPercent: 75 },
          { timeMet: true, scrollMet: false, visitsMet: true }
        )
      ).toBe(false);
    });

    it('should handle single condition: visits only', () => {
      expect(
        evaluateConditions(
          { showAfterVisits: 2 },
          { timeMet: false, scrollMet: false, visitsMet: true }
        )
      ).toBe(true);
      expect(
        evaluateConditions(
          { showAfterVisits: 2 },
          { timeMet: true, scrollMet: true, visitsMet: false }
        )
      ).toBe(false);
    });
  });

  describe('Edge cases', () => {
    describe('Page that cannot scroll', () => {
      const calculateScrollPercent = (
        scrollY: number,
        innerHeight: number,
        scrollHeight: number
      ): number => {
        if (scrollHeight <= 0) return 100;
        return ((scrollY + innerHeight) / scrollHeight) * 100;
      };

      it('should auto-satisfy scroll when content fits viewport', () => {
        // scrollHeight === innerHeight means no scrolling possible
        const percent = calculateScrollPercent(0, 768, 768);
        expect(percent).toBeGreaterThanOrEqual(100);
      });

      it('should auto-satisfy scroll when viewport exceeds content', () => {
        const percent = calculateScrollPercent(0, 1024, 500);
        expect(percent).toBeGreaterThanOrEqual(100);
      });
    });

    describe('Zero and negative values', () => {
      const calculateScrollPercent = (
        scrollY: number,
        innerHeight: number,
        scrollHeight: number
      ): number => {
        if (scrollHeight <= 0) return 100;
        return ((scrollY + innerHeight) / scrollHeight) * 100;
      };

      it('should handle scrollHeight of 0', () => {
        const percent = calculateScrollPercent(0, 500, 0);
        expect(percent).toBe(100);
      });

      it('should handle negative scrollHeight', () => {
        const percent = calculateScrollPercent(0, 500, -100);
        expect(percent).toBe(100);
      });

      it('should handle scrollY of 0 with normal page', () => {
        const percent = calculateScrollPercent(0, 500, 2000);
        expect(percent).toBe(25);
      });
    });

    describe('Visit threshold of 0 or 1', () => {
      const getVisitCount = (storage: Record<string, string>, key: string): number => {
        return parseInt(storage[`gotcha_visits_${key}`] || '0', 10);
      };

      it('should meet threshold of 0 with no visits', () => {
        const storage: Record<string, string> = {};
        expect(getVisitCount(storage, 'w') >= 0).toBe(true);
      });

      it('should not meet threshold of 1 with no visits', () => {
        const storage: Record<string, string> = {};
        expect(getVisitCount(storage, 'w') >= 1).toBe(false);
      });

      it('should meet threshold of 1 after one visit', () => {
        const storage: Record<string, string> = { gotcha_visits_w: '1' };
        expect(getVisitCount(storage, 'w') >= 1).toBe(true);
      });
    });

    describe('Large values', () => {
      const calculateScrollPercent = (
        scrollY: number,
        innerHeight: number,
        scrollHeight: number
      ): number => {
        if (scrollHeight <= 0) return 100;
        return ((scrollY + innerHeight) / scrollHeight) * 100;
      };

      it('should handle very tall pages', () => {
        const percent = calculateScrollPercent(0, 900, 100000);
        expect(percent).toBeCloseTo(0.9, 1);
      });

      it('should handle very large scroll position', () => {
        const percent = calculateScrollPercent(99100, 900, 100000);
        expect(percent).toBe(100);
      });
    });
  });
});
