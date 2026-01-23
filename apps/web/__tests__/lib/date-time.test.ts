/**
 * Tests for date/time utilities
 */

describe('Date/Time Utilities', () => {
  describe('Relative Time Formatting', () => {
    const getRelativeTime = (date: Date, now: Date = new Date()): string => {
      const diffMs = now.getTime() - date.getTime();
      const diffSeconds = Math.floor(diffMs / 1000);
      const diffMinutes = Math.floor(diffSeconds / 60);
      const diffHours = Math.floor(diffMinutes / 60);
      const diffDays = Math.floor(diffHours / 24);
      const diffWeeks = Math.floor(diffDays / 7);
      const diffMonths = Math.floor(diffDays / 30);

      if (diffSeconds < 60) return 'just now';
      if (diffMinutes === 1) return '1 minute ago';
      if (diffMinutes < 60) return `${diffMinutes} minutes ago`;
      if (diffHours === 1) return '1 hour ago';
      if (diffHours < 24) return `${diffHours} hours ago`;
      if (diffDays === 1) return 'yesterday';
      if (diffDays < 7) return `${diffDays} days ago`;
      if (diffWeeks === 1) return '1 week ago';
      if (diffWeeks < 4) return `${diffWeeks} weeks ago`;
      if (diffMonths === 1) return '1 month ago';
      if (diffMonths < 12) return `${diffMonths} months ago`;
      return 'over a year ago';
    };

    const now = new Date('2024-06-15T12:00:00Z');

    it('should return "just now" for recent times', () => {
      const date = new Date('2024-06-15T11:59:30Z');
      expect(getRelativeTime(date, now)).toBe('just now');
    });

    it('should return "1 minute ago" for 1 minute', () => {
      const date = new Date('2024-06-15T11:59:00Z');
      expect(getRelativeTime(date, now)).toBe('1 minute ago');
    });

    it('should return plural minutes', () => {
      const date = new Date('2024-06-15T11:45:00Z');
      expect(getRelativeTime(date, now)).toBe('15 minutes ago');
    });

    it('should return "1 hour ago" for 1 hour', () => {
      const date = new Date('2024-06-15T11:00:00Z');
      expect(getRelativeTime(date, now)).toBe('1 hour ago');
    });

    it('should return plural hours', () => {
      const date = new Date('2024-06-15T06:00:00Z');
      expect(getRelativeTime(date, now)).toBe('6 hours ago');
    });

    it('should return "yesterday" for 1 day ago', () => {
      const date = new Date('2024-06-14T12:00:00Z');
      expect(getRelativeTime(date, now)).toBe('yesterday');
    });

    it('should return plural days', () => {
      const date = new Date('2024-06-12T12:00:00Z');
      expect(getRelativeTime(date, now)).toBe('3 days ago');
    });

    it('should return weeks', () => {
      const date = new Date('2024-06-01T12:00:00Z');
      expect(getRelativeTime(date, now)).toBe('2 weeks ago');
    });

    it('should return months', () => {
      const date = new Date('2024-04-15T12:00:00Z');
      expect(getRelativeTime(date, now)).toBe('2 months ago');
    });

    it('should return "over a year ago" for old dates', () => {
      const date = new Date('2023-01-15T12:00:00Z');
      expect(getRelativeTime(date, now)).toBe('over a year ago');
    });
  });

  describe('Date Formatting', () => {
    const formatDate = (date: Date, format: 'short' | 'long' | 'iso'): string => {
      if (format === 'iso') {
        return date.toISOString().split('T')[0];
      }
      if (format === 'short') {
        return date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        });
      }
      return date.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
    };

    const testDate = new Date('2024-06-15T12:00:00Z');

    it('should format as ISO date', () => {
      expect(formatDate(testDate, 'iso')).toBe('2024-06-15');
    });

    it('should format as short date', () => {
      expect(formatDate(testDate, 'short')).toBe('Jun 15');
    });

    it('should format as long date', () => {
      expect(formatDate(testDate, 'long')).toBe('June 15, 2024');
    });
  });

  describe('Time Formatting', () => {
    const formatTime = (date: Date, use24Hour: boolean = false): string => {
      if (use24Hour) {
        return date.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        });
      }
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    };

    it('should format as 12-hour time', () => {
      const date = new Date('2024-06-15T14:30:00Z');
      const result = formatTime(date, false);
      expect(result).toMatch(/PM/);
    });

    it('should format as 24-hour time', () => {
      const date = new Date('2024-06-15T14:30:00Z');
      const result = formatTime(date, true);
      expect(result).toMatch(/\d{2}:\d{2}/);
    });
  });

  describe('Date Range Calculations', () => {
    const getDateRange = (
      period: 'today' | 'week' | 'month' | 'year'
    ): { start: Date; end: Date } => {
      const now = new Date();
      const end = new Date(now);
      end.setHours(23, 59, 59, 999);

      const start = new Date(now);
      start.setHours(0, 0, 0, 0);

      switch (period) {
        case 'today':
          break;
        case 'week':
          start.setDate(start.getDate() - 7);
          break;
        case 'month':
          start.setMonth(start.getMonth() - 1);
          break;
        case 'year':
          start.setFullYear(start.getFullYear() - 1);
          break;
      }

      return { start, end };
    };

    it('should return today range', () => {
      const { start, end } = getDateRange('today');
      expect(start.getDate()).toBe(end.getDate());
      expect(start.getHours()).toBe(0);
      expect(end.getHours()).toBe(23);
    });

    it('should return week range', () => {
      const { start, end } = getDateRange('week');
      const diffDays = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      expect(diffDays).toBeGreaterThanOrEqual(7);
    });

    it('should return month range', () => {
      const { start, end } = getDateRange('month');
      const diffDays = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      expect(diffDays).toBeGreaterThanOrEqual(28);
    });

    it('should return year range', () => {
      const { start, end } = getDateRange('year');
      const diffDays = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      expect(diffDays).toBeGreaterThanOrEqual(365);
    });
  });

  describe('Timezone Handling', () => {
    const toUTC = (date: Date): Date => {
      return new Date(date.toISOString());
    };

    const getTimezoneOffset = (date: Date): number => {
      return date.getTimezoneOffset();
    };

    const formatWithTimezone = (date: Date, timezone: string): string => {
      try {
        return date.toLocaleString('en-US', { timeZone: timezone });
      } catch {
        return date.toLocaleString('en-US');
      }
    };

    it('should convert to UTC', () => {
      const local = new Date('2024-06-15T12:00:00');
      const utc = toUTC(local);
      expect(utc.toISOString()).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    it('should get timezone offset in minutes', () => {
      const date = new Date();
      const offset = getTimezoneOffset(date);
      expect(typeof offset).toBe('number');
    });

    it('should format with specific timezone', () => {
      const date = new Date('2024-06-15T12:00:00Z');
      const result = formatWithTimezone(date, 'America/New_York');
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('should handle invalid timezone gracefully', () => {
      const date = new Date('2024-06-15T12:00:00Z');
      const result = formatWithTimezone(date, 'Invalid/Timezone');
      expect(typeof result).toBe('string');
    });
  });

  describe('Date Validation', () => {
    const isValidDate = (date: unknown): boolean => {
      if (!(date instanceof Date)) return false;
      return !isNaN(date.getTime());
    };

    const isDateInPast = (date: Date): boolean => {
      return date.getTime() < Date.now();
    };

    const isDateInFuture = (date: Date): boolean => {
      return date.getTime() > Date.now();
    };

    const isDateInRange = (date: Date, start: Date, end: Date): boolean => {
      const time = date.getTime();
      return time >= start.getTime() && time <= end.getTime();
    };

    it('should validate Date objects', () => {
      expect(isValidDate(new Date())).toBe(true);
      expect(isValidDate(new Date('invalid'))).toBe(false);
      expect(isValidDate('2024-01-01')).toBe(false);
      expect(isValidDate(null)).toBe(false);
    });

    it('should check if date is in past', () => {
      const past = new Date('2020-01-01');
      const future = new Date('2030-01-01');
      expect(isDateInPast(past)).toBe(true);
      expect(isDateInPast(future)).toBe(false);
    });

    it('should check if date is in future', () => {
      const past = new Date('2020-01-01');
      const future = new Date('2030-01-01');
      expect(isDateInFuture(future)).toBe(true);
      expect(isDateInFuture(past)).toBe(false);
    });

    it('should check if date is in range', () => {
      const start = new Date('2024-01-01');
      const end = new Date('2024-12-31');
      const inside = new Date('2024-06-15');
      const outside = new Date('2025-01-01');

      expect(isDateInRange(inside, start, end)).toBe(true);
      expect(isDateInRange(outside, start, end)).toBe(false);
      expect(isDateInRange(start, start, end)).toBe(true); // Inclusive
      expect(isDateInRange(end, start, end)).toBe(true); // Inclusive
    });
  });

  describe('Duration Calculations', () => {
    const formatDuration = (ms: number): string => {
      const seconds = Math.floor(ms / 1000);
      const minutes = Math.floor(seconds / 60);
      const hours = Math.floor(minutes / 60);
      const days = Math.floor(hours / 24);

      if (days > 0) return `${days}d ${hours % 24}h`;
      if (hours > 0) return `${hours}h ${minutes % 60}m`;
      if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
      return `${seconds}s`;
    };

    const getDaysBetween = (start: Date, end: Date): number => {
      const diffMs = Math.abs(end.getTime() - start.getTime());
      return Math.floor(diffMs / (1000 * 60 * 60 * 24));
    };

    it('should format seconds', () => {
      expect(formatDuration(5000)).toBe('5s');
      expect(formatDuration(45000)).toBe('45s');
    });

    it('should format minutes and seconds', () => {
      expect(formatDuration(90000)).toBe('1m 30s');
      expect(formatDuration(300000)).toBe('5m 0s');
    });

    it('should format hours and minutes', () => {
      expect(formatDuration(3661000)).toBe('1h 1m');
      expect(formatDuration(7200000)).toBe('2h 0m');
    });

    it('should format days and hours', () => {
      expect(formatDuration(90000000)).toBe('1d 1h');
      expect(formatDuration(172800000)).toBe('2d 0h');
    });

    it('should calculate days between dates', () => {
      const start = new Date('2024-01-01');
      const end = new Date('2024-01-15');
      expect(getDaysBetween(start, end)).toBe(14);
    });

    it('should handle reverse date order', () => {
      const start = new Date('2024-01-15');
      const end = new Date('2024-01-01');
      expect(getDaysBetween(start, end)).toBe(14);
    });
  });

  describe('Business Days', () => {
    const isWeekend = (date: Date): boolean => {
      const day = date.getDay();
      return day === 0 || day === 6;
    };

    const getBusinessDays = (start: Date, end: Date): number => {
      let count = 0;
      const current = new Date(start);

      while (current <= end) {
        if (!isWeekend(current)) {
          count++;
        }
        current.setDate(current.getDate() + 1);
      }

      return count;
    };

    it('should identify weekends', () => {
      const saturday = new Date('2024-06-15'); // Saturday
      const sunday = new Date('2024-06-16'); // Sunday
      const monday = new Date('2024-06-17'); // Monday

      expect(isWeekend(saturday)).toBe(true);
      expect(isWeekend(sunday)).toBe(true);
      expect(isWeekend(monday)).toBe(false);
    });

    it('should count business days in a week', () => {
      const monday = new Date('2024-06-10');
      const friday = new Date('2024-06-14');
      expect(getBusinessDays(monday, friday)).toBe(5);
    });

    it('should exclude weekends from count', () => {
      const monday = new Date('2024-06-10');
      const nextMonday = new Date('2024-06-17');
      expect(getBusinessDays(monday, nextMonday)).toBe(6); // Mon-Fri + Mon
    });
  });
});
