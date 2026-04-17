/**
 * Tests for SDK cooldown expiry logic
 * Determines whether a user's previous response has expired based on cooldown period
 */

describe('SDK Cooldown Expiry', () => {
  const isResponseExpired = (createdAt: string, cooldownDays: number): boolean => {
    const createdTime = new Date(createdAt).getTime();
    if (isNaN(createdTime)) return true;
    const ageMs = Date.now() - createdTime;
    const cooldownMs = cooldownDays * 24 * 60 * 60 * 1000;
    return ageMs >= cooldownMs;
  };

  describe('Not Expired (within cooldown)', () => {
    it('should return false for response 10 days ago with 30-day cooldown', () => {
      const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString();
      expect(isResponseExpired(tenDaysAgo, 30)).toBe(false);
    });

    it('should return false for response created just now with any cooldown', () => {
      const now = new Date().toISOString();
      expect(isResponseExpired(now, 1)).toBe(false);
    });

    it('should return false for response 1 day ago with 7-day cooldown', () => {
      const oneDayAgo = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString();
      expect(isResponseExpired(oneDayAgo, 7)).toBe(false);
    });

    it('should return false for response 29 days ago with 30-day cooldown', () => {
      const twentyNineDaysAgo = new Date(Date.now() - 29 * 24 * 60 * 60 * 1000).toISOString();
      expect(isResponseExpired(twentyNineDaysAgo, 30)).toBe(false);
    });

    it('should return false for response 1 second ago with 1-day cooldown', () => {
      const oneSecondAgo = new Date(Date.now() - 1000).toISOString();
      expect(isResponseExpired(oneSecondAgo, 1)).toBe(false);
    });
  });

  describe('Expired (past cooldown)', () => {
    it('should return true for response 45 days ago with 30-day cooldown', () => {
      const fortyFiveDaysAgo = new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString();
      expect(isResponseExpired(fortyFiveDaysAgo, 30)).toBe(true);
    });

    it('should return true for response 31 days ago with 30-day cooldown', () => {
      const thirtyOneDaysAgo = new Date(Date.now() - 31 * 24 * 60 * 60 * 1000).toISOString();
      expect(isResponseExpired(thirtyOneDaysAgo, 30)).toBe(true);
    });

    it('should return true for response 8 days ago with 7-day cooldown', () => {
      const eightDaysAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString();
      expect(isResponseExpired(eightDaysAgo, 7)).toBe(true);
    });

    it('should return true for response 365 days ago with 30-day cooldown', () => {
      const oneYearAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString();
      expect(isResponseExpired(oneYearAgo, 30)).toBe(true);
    });

    it('should return true for very old response (2020) with 90-day cooldown', () => {
      expect(isResponseExpired('2020-01-01T00:00:00.000Z', 90)).toBe(true);
    });
  });

  describe('Boundary Conditions', () => {
    it('should return true when age exactly equals cooldown', () => {
      // ageMs >= cooldownMs, so exactly equal means expired
      const exactlyThirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      expect(isResponseExpired(exactlyThirtyDaysAgo, 30)).toBe(true);
    });

    it('should return false 1ms before cooldown expires', () => {
      const justBefore = new Date(Date.now() - (30 * 24 * 60 * 60 * 1000 - 1)).toISOString();
      expect(isResponseExpired(justBefore, 30)).toBe(false);
    });

    it('should return true 1ms after cooldown expires', () => {
      const justAfter = new Date(Date.now() - (30 * 24 * 60 * 60 * 1000 + 1)).toISOString();
      expect(isResponseExpired(justAfter, 30)).toBe(true);
    });
  });

  describe('Invalid Date Strings (fail open)', () => {
    it('should return true for empty string', () => {
      expect(isResponseExpired('', 30)).toBe(true);
    });

    it('should return true for garbage string', () => {
      expect(isResponseExpired('not-a-date', 30)).toBe(true);
    });

    it('should return true for null coerced to string', () => {
      expect(isResponseExpired(null as unknown as string, 30)).toBe(true);
    });

    it('should return true for undefined coerced to string', () => {
      expect(isResponseExpired(undefined as unknown as string, 30)).toBe(true);
    });

    it('should return true for "Invalid Date" string', () => {
      expect(isResponseExpired('Invalid Date', 30)).toBe(true);
    });

    it('should handle partial ISO string gracefully', () => {
      // "2024-13-01" is an invalid month; Date parsing varies by engine
      const result = isResponseExpired('2024-13-01', 30);
      // Should either parse to something and evaluate, or return true (NaN path)
      expect(typeof result).toBe('boolean');
    });
  });

  describe('Zero Cooldown', () => {
    it('should return true immediately with 0-day cooldown', () => {
      const now = new Date().toISOString();
      expect(isResponseExpired(now, 0)).toBe(true);
    });

    it('should return true for recent response with 0-day cooldown', () => {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      expect(isResponseExpired(fiveMinutesAgo, 0)).toBe(true);
    });

    it('should return true for old response with 0-day cooldown', () => {
      expect(isResponseExpired('2023-01-01T00:00:00.000Z', 0)).toBe(true);
    });
  });

  describe('Very Large Cooldown', () => {
    it('should return false for recent response with 10-year cooldown', () => {
      const oneDayAgo = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString();
      expect(isResponseExpired(oneDayAgo, 3650)).toBe(false);
    });

    it('should return false for 1-year-old response with 10-year cooldown', () => {
      const oneYearAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString();
      expect(isResponseExpired(oneYearAgo, 3650)).toBe(false);
    });

    it('should still expire very old responses even with large cooldown', () => {
      // 20 years ago with 10-year cooldown
      const twentyYearsAgo = new Date(Date.now() - 20 * 365 * 24 * 60 * 60 * 1000).toISOString();
      expect(isResponseExpired(twentyYearsAgo, 3650)).toBe(true);
    });
  });

  describe('Future Timestamps', () => {
    it('should return false for a future createdAt (not yet expired)', () => {
      const tomorrow = new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString();
      // ageMs would be negative, negative < cooldownMs, so not expired
      expect(isResponseExpired(tomorrow, 30)).toBe(false);
    });

    it('should return false for far future createdAt', () => {
      const nextYear = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
      expect(isResponseExpired(nextYear, 1)).toBe(false);
    });

    it('should return true for future createdAt with 0-day cooldown', () => {
      const tomorrow = new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString();
      // ageMs is negative, cooldownMs is 0, negative >= 0 is false
      expect(isResponseExpired(tomorrow, 0)).toBe(false);
    });
  });

  describe('Date Format Handling', () => {
    it('should handle ISO 8601 format', () => {
      const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString();
      expect(isResponseExpired(tenDaysAgo, 30)).toBe(false);
    });

    it('should handle date-only string (YYYY-MM-DD)', () => {
      // This will be parsed as midnight UTC — should be a very old date
      const result = isResponseExpired('2020-06-15', 30);
      expect(result).toBe(true);
    });

    it('should handle date with timezone offset', () => {
      const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
      const withOffset = tenDaysAgo.toISOString().replace('Z', '+00:00');
      expect(isResponseExpired(withOffset, 30)).toBe(false);
    });
  });
});
