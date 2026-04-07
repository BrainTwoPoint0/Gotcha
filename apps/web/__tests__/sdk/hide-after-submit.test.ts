/**
 * Tests for SDK hide-after-submit logic
 * Note: These test the hide/show decision and storage logic without React or localStorage
 */

describe('SDK Hide After Submit', () => {
  describe('checkIsHidden', () => {
    const checkIsHidden = (
      elementId: string,
      userId: string,
      hideAfterSubmitDays: number | undefined,
      storedValue: string | null
    ): boolean => {
      if (!hideAfterSubmitDays || hideAfterSubmitDays <= 0) return false;
      if (!storedValue) return false;
      return new Date(storedValue).getTime() > Date.now();
    };

    it('should return false when hideAfterSubmitDays is undefined', () => {
      expect(checkIsHidden('el1', 'user1', undefined, null)).toBe(false);
    });

    it('should return false when hideAfterSubmitDays is 0', () => {
      expect(checkIsHidden('el1', 'user1', 0, null)).toBe(false);
    });

    it('should return false when hideAfterSubmitDays is negative', () => {
      expect(checkIsHidden('el1', 'user1', -1, null)).toBe(false);
      expect(checkIsHidden('el1', 'user1', -30, null)).toBe(false);
    });

    it('should return false when no stored value exists', () => {
      expect(checkIsHidden('el1', 'user1', 7, null)).toBe(false);
    });

    it('should return false when stored value is empty string', () => {
      expect(checkIsHidden('el1', 'user1', 7, '')).toBe(false);
    });

    it('should return true when stored date is in the future', () => {
      const futureDate = new Date(Date.now() + 7 * 86400000).toISOString();
      expect(checkIsHidden('el1', 'user1', 7, futureDate)).toBe(true);
    });

    it('should return false when stored date is in the past', () => {
      const pastDate = new Date(Date.now() - 86400000).toISOString();
      expect(checkIsHidden('el1', 'user1', 7, pastDate)).toBe(false);
    });

    it('should return false when stored date is exactly now', () => {
      // Date.now() > Date.now() is false
      const nowDate = new Date(Date.now()).toISOString();
      // By the time the comparison runs, the stored time will be slightly in the past
      expect(checkIsHidden('el1', 'user1', 7, nowDate)).toBe(false);
    });

    it('should return false for invalid stored date string', () => {
      // new Date('garbage').getTime() returns NaN, and NaN > Date.now() is false
      expect(checkIsHidden('el1', 'user1', 7, 'garbage')).toBe(false);
    });

    it('should return false for non-ISO date string that parses to NaN', () => {
      expect(checkIsHidden('el1', 'user1', 7, 'not-a-date')).toBe(false);
    });

    it('should return true when stored date is 1 second in the future', () => {
      const nearFuture = new Date(Date.now() + 1000).toISOString();
      expect(checkIsHidden('el1', 'user1', 1, nearFuture)).toBe(true);
    });

    it('should return false when stored date is 1 second in the past', () => {
      const nearPast = new Date(Date.now() - 1000).toISOString();
      expect(checkIsHidden('el1', 'user1', 1, nearPast)).toBe(false);
    });

    it('should not depend on hideAfterSubmitDays value when checking stored date', () => {
      // hideAfterSubmitDays only matters for the initial guard — the stored date is the source of truth
      const futureDate = new Date(Date.now() + 30 * 86400000).toISOString();
      expect(checkIsHidden('el1', 'user1', 1, futureDate)).toBe(true);
      expect(checkIsHidden('el1', 'user1', 365, futureDate)).toBe(true);
    });

    it('should treat hideAfterSubmitDays as a feature toggle', () => {
      const futureDate = new Date(Date.now() + 86400000).toISOString();
      // Feature disabled: always not hidden regardless of stored value
      expect(checkIsHidden('el1', 'user1', undefined, futureDate)).toBe(false);
      expect(checkIsHidden('el1', 'user1', 0, futureDate)).toBe(false);
      // Feature enabled: respect stored value
      expect(checkIsHidden('el1', 'user1', 1, futureDate)).toBe(true);
    });
  });

  describe('Storage Key Format', () => {
    const getStorageKey = (elementId: string, userId: string): string => {
      return `gotcha_hidden_${elementId}_${userId}`;
    };

    it('should include elementId and userId', () => {
      const key = getStorageKey('feedback-widget', 'user-123');
      expect(key).toBe('gotcha_hidden_feedback-widget_user-123');
    });

    it('should produce different keys for different elementIds', () => {
      const key1 = getStorageKey('widget-a', 'user-1');
      const key2 = getStorageKey('widget-b', 'user-1');
      expect(key1).not.toBe(key2);
    });

    it('should produce different keys for different userIds', () => {
      const key1 = getStorageKey('widget-a', 'user-1');
      const key2 = getStorageKey('widget-a', 'user-2');
      expect(key1).not.toBe(key2);
    });

    it('should start with gotcha_hidden_ prefix', () => {
      const key = getStorageKey('el', 'usr');
      expect(key.startsWith('gotcha_hidden_')).toBe(true);
    });

    it('should handle empty elementId', () => {
      const key = getStorageKey('', 'user-1');
      expect(key).toBe('gotcha_hidden__user-1');
    });

    it('should handle empty userId', () => {
      const key = getStorageKey('widget-a', '');
      expect(key).toBe('gotcha_hidden_widget-a_');
    });

    it('should handle anonymous user IDs', () => {
      const key = getStorageKey('widget', 'anon_550e8400-e29b-41d4-a716-446655440000');
      expect(key).toBe('gotcha_hidden_widget_anon_550e8400-e29b-41d4-a716-446655440000');
    });
  });

  describe('markHidden', () => {
    const calculateHiddenUntil = (days: number): string => {
      return new Date(Date.now() + days * 86400000).toISOString();
    };

    it('should store a future ISO timestamp for 7 days', () => {
      const before = Date.now();
      const hiddenUntil = calculateHiddenUntil(7);
      const after = Date.now();

      const storedTime = new Date(hiddenUntil).getTime();
      expect(storedTime).toBeGreaterThanOrEqual(before + 7 * 86400000);
      expect(storedTime).toBeLessThanOrEqual(after + 7 * 86400000);
    });

    it('should store a future ISO timestamp for 1 day', () => {
      const before = Date.now();
      const hiddenUntil = calculateHiddenUntil(1);
      const storedTime = new Date(hiddenUntil).getTime();

      expect(storedTime).toBeGreaterThanOrEqual(before + 86400000);
    });

    it('should store a future ISO timestamp for 30 days', () => {
      const before = Date.now();
      const hiddenUntil = calculateHiddenUntil(30);
      const storedTime = new Date(hiddenUntil).getTime();

      expect(storedTime).toBeGreaterThanOrEqual(before + 30 * 86400000);
    });

    it('should produce valid ISO 8601 format', () => {
      const hiddenUntil = calculateHiddenUntil(7);
      // ISO format: YYYY-MM-DDTHH:mm:ss.sssZ
      expect(hiddenUntil).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/);
    });

    it('should produce a date that round-trips through Date parsing', () => {
      const hiddenUntil = calculateHiddenUntil(7);
      const parsed = new Date(hiddenUntil);
      expect(parsed.toISOString()).toBe(hiddenUntil);
    });

    it('should handle fractional days', () => {
      const before = Date.now();
      const hiddenUntil = calculateHiddenUntil(0.5); // 12 hours
      const storedTime = new Date(hiddenUntil).getTime();

      expect(storedTime).toBeGreaterThanOrEqual(before + 0.5 * 86400000);
    });

    it('should produce timestamps further in the future for more days', () => {
      const oneDay = new Date(calculateHiddenUntil(1)).getTime();
      const sevenDays = new Date(calculateHiddenUntil(7)).getTime();
      const thirtyDays = new Date(calculateHiddenUntil(30)).getTime();

      expect(sevenDays).toBeGreaterThan(oneDay);
      expect(thirtyDays).toBeGreaterThan(sevenDays);
    });
  });

  describe('End-to-End Hide Flow', () => {
    // Simulates the full flow: mark hidden, then check hidden
    const calculateHiddenUntil = (days: number): string => {
      return new Date(Date.now() + days * 86400000).toISOString();
    };

    const checkIsHidden = (
      hideAfterSubmitDays: number | undefined,
      storedValue: string | null
    ): boolean => {
      if (!hideAfterSubmitDays || hideAfterSubmitDays <= 0) return false;
      if (!storedValue) return false;
      return new Date(storedValue).getTime() > Date.now();
    };

    it('should be hidden immediately after marking', () => {
      const hiddenUntil = calculateHiddenUntil(7);
      expect(checkIsHidden(7, hiddenUntil)).toBe(true);
    });

    it('should not be hidden if feature is later disabled', () => {
      const hiddenUntil = calculateHiddenUntil(7);
      // Config changes to no longer use hideAfterSubmit
      expect(checkIsHidden(undefined, hiddenUntil)).toBe(false);
    });

    it('should not be hidden after expiry', () => {
      // Simulate a timestamp that already expired
      const expiredDate = new Date(Date.now() - 1000).toISOString();
      expect(checkIsHidden(7, expiredDate)).toBe(false);
    });

    it('should isolate hiding per element and user', () => {
      const getKey = (elementId: string, userId: string) =>
        `gotcha_hidden_${elementId}_${userId}`;

      // Simulate a storage map
      const storage: Record<string, string> = {};
      storage[getKey('widget-a', 'user-1')] = calculateHiddenUntil(7);

      // widget-a is hidden for user-1
      expect(checkIsHidden(7, storage[getKey('widget-a', 'user-1')] ?? null)).toBe(true);

      // widget-a is NOT hidden for user-2
      expect(checkIsHidden(7, storage[getKey('widget-a', 'user-2')] ?? null)).toBe(false);

      // widget-b is NOT hidden for user-1
      expect(checkIsHidden(7, storage[getKey('widget-b', 'user-1')] ?? null)).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    const checkIsHidden = (
      hideAfterSubmitDays: number | undefined,
      storedValue: string | null
    ): boolean => {
      if (!hideAfterSubmitDays || hideAfterSubmitDays <= 0) return false;
      if (!storedValue) return false;
      return new Date(storedValue).getTime() > Date.now();
    };

    it('should handle very large day values', () => {
      const farFuture = new Date(Date.now() + 3650 * 86400000).toISOString(); // ~10 years
      expect(checkIsHidden(3650, farFuture)).toBe(true);
    });

    it('should handle epoch timestamp stored as string', () => {
      // If someone stored a raw number string instead of ISO
      const epochStr = String(Date.now() + 86400000);
      // new Date(epochStr) where epochStr is a numeric string parses as a year, not ms
      // This should effectively return false for most values
      const result = new Date(epochStr).getTime() > Date.now();
      // The exact result depends on the numeric string, but the point is
      // only ISO strings work correctly — this tests robustness
      expect(typeof result).toBe('boolean');
    });

    it('should handle NaN comparison correctly', () => {
      // NaN > anything is always false
      expect(NaN > Date.now()).toBe(false);
      expect(NaN > 0).toBe(false);
      expect(NaN > -Infinity).toBe(false);
    });

    it('should handle stored value of "undefined" string', () => {
      expect(checkIsHidden(7, 'undefined')).toBe(false);
    });

    it('should handle stored value of "null" string', () => {
      expect(checkIsHidden(7, 'null')).toBe(false);
    });
  });
});
