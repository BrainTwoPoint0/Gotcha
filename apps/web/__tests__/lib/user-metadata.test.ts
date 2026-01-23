/**
 * Unit tests for user metadata handling
 * Tests metadata parsing, type inference, and segmentation logic
 */

describe('User Metadata Logic', () => {
  describe('Metadata Type Inference', () => {
    // Simulates type inference from the API
    const inferType = (values: unknown[]): 'string' | 'number' | 'boolean' => {
      const types = new Set<string>();

      values.forEach((value) => {
        if (value === null) {
          types.add('null');
        } else if (typeof value === 'boolean') {
          types.add('boolean');
        } else if (typeof value === 'number') {
          types.add('number');
        } else if (typeof value === 'string') {
          types.add('string');
        }
      });

      // Determine dominant type
      if (types.has('number') && !types.has('string')) {
        return 'number';
      } else if (types.has('boolean') && types.size <= 2) {
        return 'boolean';
      }
      return 'string';
    };

    it('should infer string type for string values', () => {
      expect(inferType(['US', 'UK', 'CA'])).toBe('string');
    });

    it('should infer number type for numeric values', () => {
      expect(inferType([25, 30, 35, 40])).toBe('number');
    });

    it('should infer boolean type for boolean values', () => {
      expect(inferType([true, false, true])).toBe('boolean');
    });

    it('should infer boolean with null values', () => {
      expect(inferType([true, null, false])).toBe('boolean');
    });

    it('should infer string for mixed string/number', () => {
      expect(inferType([25, '30', 35])).toBe('string');
    });

    it('should infer number with null values', () => {
      expect(inferType([25, null, 35])).toBe('number');
    });
  });

  describe('Metadata Field Discovery', () => {
    // Simulates field discovery from the API
    const discoverFields = (
      responses: { endUserMeta: Record<string, unknown> }[]
    ): Record<string, { count: number; samples: unknown[] }> => {
      const fieldStats: Record<string, { count: number; samples: unknown[] }> = {};

      responses.forEach((r) => {
        const meta = r.endUserMeta;
        if (!meta || typeof meta !== 'object') return;

        Object.entries(meta).forEach(([key, value]) => {
          if (key === 'id') return; // Skip standard id field

          if (!fieldStats[key]) {
            fieldStats[key] = { count: 0, samples: [] };
          }

          fieldStats[key].count++;

          if (fieldStats[key].samples.length < 5 && value !== null) {
            if (!fieldStats[key].samples.includes(value)) {
              fieldStats[key].samples.push(value);
            }
          }
        });
      });

      return fieldStats;
    };

    it('should discover fields from responses', () => {
      const responses = [
        { endUserMeta: { id: 'u1', plan: 'free', age: 25 } },
        { endUserMeta: { id: 'u2', plan: 'pro', age: 30 } },
        { endUserMeta: { id: 'u3', plan: 'free', location: 'US' } },
      ];

      const fields = discoverFields(responses);

      expect(Object.keys(fields)).toContain('plan');
      expect(Object.keys(fields)).toContain('age');
      expect(Object.keys(fields)).toContain('location');
      expect(Object.keys(fields)).not.toContain('id');
    });

    it('should count field occurrences', () => {
      const responses = [
        { endUserMeta: { plan: 'free' } },
        { endUserMeta: { plan: 'pro' } },
        { endUserMeta: { plan: 'free' } },
        { endUserMeta: { location: 'US' } },
      ];

      const fields = discoverFields(responses);

      expect(fields['plan'].count).toBe(3);
      expect(fields['location'].count).toBe(1);
    });

    it('should collect unique sample values', () => {
      const responses = [
        { endUserMeta: { plan: 'free' } },
        { endUserMeta: { plan: 'pro' } },
        { endUserMeta: { plan: 'free' } },
        { endUserMeta: { plan: 'enterprise' } },
      ];

      const fields = discoverFields(responses);

      expect(fields['plan'].samples).toContain('free');
      expect(fields['plan'].samples).toContain('pro');
      expect(fields['plan'].samples).toContain('enterprise');
      // Should not have duplicates
      expect(fields['plan'].samples.filter((s) => s === 'free').length).toBe(1);
    });

    it('should limit samples to 5', () => {
      const responses = Array.from({ length: 10 }, (_, i) => ({
        endUserMeta: { location: `Country${i}` },
      }));

      const fields = discoverFields(responses);

      expect(fields['location'].samples.length).toBe(5);
    });

    it('should handle empty metadata', () => {
      const responses = [{ endUserMeta: {} }, { endUserMeta: {} }];

      const fields = discoverFields(responses);

      expect(Object.keys(fields).length).toBe(0);
    });
  });

  describe('Segmentation Aggregation', () => {
    // Simulates segment aggregation from the API
    interface Response {
      rating: number | null;
      vote: 'UP' | 'DOWN' | null;
      endUserMeta: Record<string, unknown>;
    }

    interface SegmentStats {
      count: number;
      ratings: number[];
      votes: { up: number; down: number };
    }

    const aggregateBySegment = (
      responses: Response[],
      groupBy: string
    ): Record<string, SegmentStats> => {
      const segments: Record<string, SegmentStats> = {};

      responses.forEach((r) => {
        const segmentValue = r.endUserMeta?.[groupBy];
        const segment =
          segmentValue !== undefined && segmentValue !== null ? String(segmentValue) : '(not set)';

        if (!segments[segment]) {
          segments[segment] = { count: 0, ratings: [], votes: { up: 0, down: 0 } };
        }

        segments[segment].count++;

        if (r.rating) {
          segments[segment].ratings.push(r.rating);
        }

        if (r.vote === 'UP') {
          segments[segment].votes.up++;
        } else if (r.vote === 'DOWN') {
          segments[segment].votes.down++;
        }
      });

      return segments;
    };

    it('should group responses by metadata field', () => {
      const responses: Response[] = [
        { rating: 5, vote: null, endUserMeta: { plan: 'free' } },
        { rating: 4, vote: null, endUserMeta: { plan: 'pro' } },
        { rating: 3, vote: null, endUserMeta: { plan: 'free' } },
      ];

      const segments = aggregateBySegment(responses, 'plan');

      expect(Object.keys(segments)).toContain('free');
      expect(Object.keys(segments)).toContain('pro');
      expect(segments['free'].count).toBe(2);
      expect(segments['pro'].count).toBe(1);
    });

    it('should aggregate ratings by segment', () => {
      const responses: Response[] = [
        { rating: 5, vote: null, endUserMeta: { plan: 'pro' } },
        { rating: 4, vote: null, endUserMeta: { plan: 'pro' } },
        { rating: 2, vote: null, endUserMeta: { plan: 'free' } },
      ];

      const segments = aggregateBySegment(responses, 'plan');

      expect(segments['pro'].ratings).toEqual([5, 4]);
      expect(segments['free'].ratings).toEqual([2]);
    });

    it('should aggregate votes by segment', () => {
      const responses: Response[] = [
        { rating: null, vote: 'UP', endUserMeta: { plan: 'pro' } },
        { rating: null, vote: 'UP', endUserMeta: { plan: 'pro' } },
        { rating: null, vote: 'DOWN', endUserMeta: { plan: 'free' } },
      ];

      const segments = aggregateBySegment(responses, 'plan');

      expect(segments['pro'].votes.up).toBe(2);
      expect(segments['pro'].votes.down).toBe(0);
      expect(segments['free'].votes.up).toBe(0);
      expect(segments['free'].votes.down).toBe(1);
    });

    it('should handle missing metadata field', () => {
      const responses: Response[] = [
        { rating: 5, vote: null, endUserMeta: { plan: 'pro' } },
        { rating: 4, vote: null, endUserMeta: {} },
        { rating: 3, vote: null, endUserMeta: { other: 'value' } },
      ];

      const segments = aggregateBySegment(responses, 'plan');

      expect(Object.keys(segments)).toContain('pro');
      expect(Object.keys(segments)).toContain('(not set)');
      expect(segments['(not set)'].count).toBe(2);
    });

    it('should handle numeric segment values', () => {
      const responses: Response[] = [
        { rating: 5, vote: null, endUserMeta: { age: 25 } },
        { rating: 4, vote: null, endUserMeta: { age: 25 } },
        { rating: 3, vote: null, endUserMeta: { age: 30 } },
      ];

      const segments = aggregateBySegment(responses, 'age');

      expect(Object.keys(segments)).toContain('25');
      expect(Object.keys(segments)).toContain('30');
      expect(segments['25'].count).toBe(2);
    });
  });

  describe('Segment Statistics', () => {
    // Simulates stat calculation from the API
    const calculateSegmentStats = (segment: {
      ratings: number[];
      votes: { up: number; down: number };
    }): { avgRating: number | null; positiveRate: number | null } => {
      const avgRating =
        segment.ratings.length > 0
          ? Number((segment.ratings.reduce((a, b) => a + b, 0) / segment.ratings.length).toFixed(2))
          : null;

      const totalVotes = segment.votes.up + segment.votes.down;
      const positiveRate =
        totalVotes > 0 ? Math.round((segment.votes.up / totalVotes) * 100) : null;

      return { avgRating, positiveRate };
    };

    it('should calculate average rating', () => {
      const stats = calculateSegmentStats({
        ratings: [5, 4, 3, 4, 4],
        votes: { up: 0, down: 0 },
      });

      expect(stats.avgRating).toBe(4);
    });

    it('should calculate positive rate', () => {
      const stats = calculateSegmentStats({
        ratings: [],
        votes: { up: 8, down: 2 },
      });

      expect(stats.positiveRate).toBe(80);
    });

    it('should return null for no ratings', () => {
      const stats = calculateSegmentStats({
        ratings: [],
        votes: { up: 5, down: 5 },
      });

      expect(stats.avgRating).toBeNull();
    });

    it('should return null for no votes', () => {
      const stats = calculateSegmentStats({
        ratings: [4, 5],
        votes: { up: 0, down: 0 },
      });

      expect(stats.positiveRate).toBeNull();
    });

    it('should handle single rating', () => {
      const stats = calculateSegmentStats({
        ratings: [5],
        votes: { up: 0, down: 0 },
      });

      expect(stats.avgRating).toBe(5);
    });

    it('should round average rating to 2 decimals', () => {
      const stats = calculateSegmentStats({
        ratings: [1, 2, 3],
        votes: { up: 0, down: 0 },
      });

      expect(stats.avgRating).toBe(2);
    });
  });
});
