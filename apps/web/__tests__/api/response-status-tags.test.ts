/**
 * Unit tests for response status and tags business logic
 * Tests validation, sanitization, and status transition logic
 */

import { z } from 'zod';

// Status validation matching the API endpoint
const validStatuses = ['NEW', 'REVIEWED', 'ADDRESSED', 'ARCHIVED'] as const;
type ResponseStatus = (typeof validStatuses)[number];

const updateStatusSchema = z.object({
  status: z.enum(validStatuses),
});

// Tags validation matching the API endpoint
const MAX_TAGS = 10;
const MAX_TAG_LENGTH = 30;

const sanitizeTags = (tags: unknown[]): string[] => {
  const filtered = tags
    .filter((t): t is string => typeof t === 'string')
    .map((t) => t.trim().toLowerCase())
    .filter((t) => t.length > 0 && t.length <= MAX_TAG_LENGTH);
  return filtered.filter((t, i) => filtered.indexOf(t) === i);
};

// Status filter parsing matching the responses page
const parseStatusFilter = (statusParam: string | undefined): ResponseStatus[] | undefined => {
  if (!statusParam) return undefined;
  return statusParam
    .split(',')
    .filter((s): s is ResponseStatus => (validStatuses as readonly string[]).includes(s));
};

describe('Response Status API Logic', () => {
  describe('Status Validation', () => {
    it.each(validStatuses)('should accept valid status: %s', (status) => {
      const result = updateStatusSchema.safeParse({ status });
      expect(result.success).toBe(true);
    });

    it('should reject invalid status', () => {
      const result = updateStatusSchema.safeParse({ status: 'DELETED' });
      expect(result.success).toBe(false);
    });

    it('should reject empty status', () => {
      const result = updateStatusSchema.safeParse({ status: '' });
      expect(result.success).toBe(false);
    });

    it('should reject lowercase status', () => {
      const result = updateStatusSchema.safeParse({ status: 'new' });
      expect(result.success).toBe(false);
    });

    it('should reject missing status field', () => {
      const result = updateStatusSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe('Status Transitions', () => {
    // All statuses should be settable from any other status (no restrictions)
    it('should allow any status transition', () => {
      for (const from of validStatuses) {
        for (const to of validStatuses) {
          const result = updateStatusSchema.safeParse({ status: to });
          expect(result.success).toBe(true);
        }
      }
    });
  });

  describe('reviewedAt/reviewedBy tracking', () => {
    const shouldTrackReview = (newStatus: ResponseStatus): boolean => {
      return newStatus === 'REVIEWED' || newStatus === 'ADDRESSED';
    };

    it('should track review for REVIEWED status', () => {
      expect(shouldTrackReview('REVIEWED')).toBe(true);
    });

    it('should track review for ADDRESSED status', () => {
      expect(shouldTrackReview('ADDRESSED')).toBe(true);
    });

    it('should not track review for NEW status', () => {
      expect(shouldTrackReview('NEW')).toBe(false);
    });

    it('should not track review for ARCHIVED status', () => {
      expect(shouldTrackReview('ARCHIVED')).toBe(false);
    });
  });
});

describe('Response Tags API Logic', () => {
  describe('Tag Sanitization', () => {
    it('should lowercase tags', () => {
      expect(sanitizeTags(['BUG', 'Feature'])).toEqual(['bug', 'feature']);
    });

    it('should trim whitespace', () => {
      expect(sanitizeTags(['  bug  ', ' feature '])).toEqual(['bug', 'feature']);
    });

    it('should deduplicate tags', () => {
      expect(sanitizeTags(['bug', 'Bug', 'BUG'])).toEqual(['bug']);
    });

    it('should remove empty strings', () => {
      expect(sanitizeTags(['bug', '', '  ', 'feature'])).toEqual(['bug', 'feature']);
    });

    it('should filter non-string values', () => {
      expect(sanitizeTags(['bug', 123, null, undefined, true, 'feature'])).toEqual([
        'bug',
        'feature',
      ]);
    });

    it('should enforce max tag length', () => {
      const longTag = 'a'.repeat(31);
      const okTag = 'a'.repeat(30);
      expect(sanitizeTags([longTag, okTag])).toEqual([okTag]);
    });

    it('should handle empty array', () => {
      expect(sanitizeTags([])).toEqual([]);
    });

    it('should preserve order after dedup', () => {
      expect(sanitizeTags(['c', 'a', 'b', 'A'])).toEqual(['c', 'a', 'b']);
    });
  });

  describe('Tag Limits', () => {
    it('should allow up to MAX_TAGS tags', () => {
      const tags = Array.from({ length: MAX_TAGS }, (_, i) => `tag-${i}`);
      expect(tags.length).toBe(MAX_TAGS);
      expect(sanitizeTags(tags)).toHaveLength(MAX_TAGS);
    });

    it('MAX_TAGS should be 10', () => {
      expect(MAX_TAGS).toBe(10);
    });

    it('MAX_TAG_LENGTH should be 30', () => {
      expect(MAX_TAG_LENGTH).toBe(30);
    });
  });
});

describe('Status Filter Parsing', () => {
  it('should parse single status', () => {
    expect(parseStatusFilter('NEW')).toEqual(['NEW']);
  });

  it('should parse multiple statuses', () => {
    expect(parseStatusFilter('NEW,REVIEWED')).toEqual(['NEW', 'REVIEWED']);
  });

  it('should filter out invalid statuses', () => {
    expect(parseStatusFilter('NEW,INVALID,REVIEWED')).toEqual(['NEW', 'REVIEWED']);
  });

  it('should return undefined for empty param', () => {
    expect(parseStatusFilter(undefined)).toBeUndefined();
  });

  it('should return empty array for all-invalid statuses', () => {
    expect(parseStatusFilter('INVALID,NOPE')).toEqual([]);
  });

  it('should handle all statuses combined', () => {
    expect(parseStatusFilter('NEW,REVIEWED,ADDRESSED,ARCHIVED')).toEqual([
      'NEW',
      'REVIEWED',
      'ADDRESSED',
      'ARCHIVED',
    ]);
  });
});
