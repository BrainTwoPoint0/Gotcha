/**
 * Unit tests for segmented analytics API endpoint
 * Tests grouping responses by metadata fields
 */

describe('Segmented Analytics API Logic', () => {
  interface Response {
    id: string;
    rating: number | null;
    vote: 'UP' | 'DOWN' | null;
    content: string | null;
    endUserMeta: Record<string, unknown>;
    createdAt: Date;
  }

  describe('Group By Metadata Field', () => {
    const groupByField = (responses: Response[], fieldKey: string): Record<string, Response[]> => {
      const groups: Record<string, Response[]> = {};

      responses.forEach((r) => {
        const value = r.endUserMeta?.[fieldKey];
        const key = value !== undefined && value !== null ? String(value) : '(not set)';

        if (!groups[key]) {
          groups[key] = [];
        }
        groups[key].push(r);
      });

      return groups;
    };

    it('should group responses by string field', () => {
      const responses: Response[] = [
        {
          id: '1',
          rating: 5,
          vote: null,
          content: null,
          endUserMeta: { plan: 'free' },
          createdAt: new Date(),
        },
        {
          id: '2',
          rating: 4,
          vote: null,
          content: null,
          endUserMeta: { plan: 'pro' },
          createdAt: new Date(),
        },
        {
          id: '3',
          rating: 3,
          vote: null,
          content: null,
          endUserMeta: { plan: 'free' },
          createdAt: new Date(),
        },
      ];

      const groups = groupByField(responses, 'plan');

      expect(Object.keys(groups)).toContain('free');
      expect(Object.keys(groups)).toContain('pro');
      expect(groups['free'].length).toBe(2);
      expect(groups['pro'].length).toBe(1);
    });

    it('should group responses by numeric field', () => {
      const responses: Response[] = [
        {
          id: '1',
          rating: 5,
          vote: null,
          content: null,
          endUserMeta: { age: 25 },
          createdAt: new Date(),
        },
        {
          id: '2',
          rating: 4,
          vote: null,
          content: null,
          endUserMeta: { age: 30 },
          createdAt: new Date(),
        },
        {
          id: '3',
          rating: 3,
          vote: null,
          content: null,
          endUserMeta: { age: 25 },
          createdAt: new Date(),
        },
      ];

      const groups = groupByField(responses, 'age');

      expect(Object.keys(groups)).toContain('25');
      expect(Object.keys(groups)).toContain('30');
      expect(groups['25'].length).toBe(2);
    });

    it('should group responses by boolean field', () => {
      const responses: Response[] = [
        {
          id: '1',
          rating: 5,
          vote: null,
          content: null,
          endUserMeta: { isPremium: true },
          createdAt: new Date(),
        },
        {
          id: '2',
          rating: 4,
          vote: null,
          content: null,
          endUserMeta: { isPremium: false },
          createdAt: new Date(),
        },
        {
          id: '3',
          rating: 3,
          vote: null,
          content: null,
          endUserMeta: { isPremium: true },
          createdAt: new Date(),
        },
      ];

      const groups = groupByField(responses, 'isPremium');

      expect(Object.keys(groups)).toContain('true');
      expect(Object.keys(groups)).toContain('false');
      expect(groups['true'].length).toBe(2);
      expect(groups['false'].length).toBe(1);
    });

    it('should handle missing field with (not set)', () => {
      const responses: Response[] = [
        {
          id: '1',
          rating: 5,
          vote: null,
          content: null,
          endUserMeta: { plan: 'pro' },
          createdAt: new Date(),
        },
        { id: '2', rating: 4, vote: null, content: null, endUserMeta: {}, createdAt: new Date() },
        {
          id: '3',
          rating: 3,
          vote: null,
          content: null,
          endUserMeta: { other: 'value' },
          createdAt: new Date(),
        },
      ];

      const groups = groupByField(responses, 'plan');

      expect(Object.keys(groups)).toContain('pro');
      expect(Object.keys(groups)).toContain('(not set)');
      expect(groups['(not set)'].length).toBe(2);
    });

    it('should handle null values as (not set)', () => {
      const responses: Response[] = [
        {
          id: '1',
          rating: 5,
          vote: null,
          content: null,
          endUserMeta: { plan: 'pro' },
          createdAt: new Date(),
        },
        {
          id: '2',
          rating: 4,
          vote: null,
          content: null,
          endUserMeta: { plan: null },
          createdAt: new Date(),
        },
      ];

      const groups = groupByField(responses, 'plan');

      expect(groups['(not set)'].length).toBe(1);
    });
  });

  describe('Calculate Segment Statistics', () => {
    interface SegmentStats {
      count: number;
      avgRating: number | null;
      totalVotes: number;
      upVotes: number;
      downVotes: number;
      positiveRate: number | null;
      feedbackCount: number;
    }

    const calculateStats = (responses: Response[]): SegmentStats => {
      const ratings = responses.filter((r) => r.rating !== null).map((r) => r.rating as number);
      const upVotes = responses.filter((r) => r.vote === 'UP').length;
      const downVotes = responses.filter((r) => r.vote === 'DOWN').length;
      const totalVotes = upVotes + downVotes;
      const feedbackCount = responses.filter((r) => r.content !== null && r.content !== '').length;

      return {
        count: responses.length,
        avgRating:
          ratings.length > 0
            ? Number((ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(2))
            : null,
        totalVotes,
        upVotes,
        downVotes,
        positiveRate: totalVotes > 0 ? Math.round((upVotes / totalVotes) * 100) : null,
        feedbackCount,
      };
    };

    it('should calculate count', () => {
      const responses: Response[] = [
        { id: '1', rating: 5, vote: null, content: null, endUserMeta: {}, createdAt: new Date() },
        { id: '2', rating: 4, vote: null, content: null, endUserMeta: {}, createdAt: new Date() },
        { id: '3', rating: 3, vote: null, content: null, endUserMeta: {}, createdAt: new Date() },
      ];

      const stats = calculateStats(responses);

      expect(stats.count).toBe(3);
    });

    it('should calculate average rating', () => {
      const responses: Response[] = [
        { id: '1', rating: 5, vote: null, content: null, endUserMeta: {}, createdAt: new Date() },
        { id: '2', rating: 4, vote: null, content: null, endUserMeta: {}, createdAt: new Date() },
        { id: '3', rating: 3, vote: null, content: null, endUserMeta: {}, createdAt: new Date() },
      ];

      const stats = calculateStats(responses);

      expect(stats.avgRating).toBe(4);
    });

    it('should return null avgRating when no ratings', () => {
      const responses: Response[] = [
        {
          id: '1',
          rating: null,
          vote: 'UP',
          content: null,
          endUserMeta: {},
          createdAt: new Date(),
        },
        {
          id: '2',
          rating: null,
          vote: 'DOWN',
          content: null,
          endUserMeta: {},
          createdAt: new Date(),
        },
      ];

      const stats = calculateStats(responses);

      expect(stats.avgRating).toBeNull();
    });

    it('should calculate vote statistics', () => {
      const responses: Response[] = [
        {
          id: '1',
          rating: null,
          vote: 'UP',
          content: null,
          endUserMeta: {},
          createdAt: new Date(),
        },
        {
          id: '2',
          rating: null,
          vote: 'UP',
          content: null,
          endUserMeta: {},
          createdAt: new Date(),
        },
        {
          id: '3',
          rating: null,
          vote: 'DOWN',
          content: null,
          endUserMeta: {},
          createdAt: new Date(),
        },
      ];

      const stats = calculateStats(responses);

      expect(stats.totalVotes).toBe(3);
      expect(stats.upVotes).toBe(2);
      expect(stats.downVotes).toBe(1);
    });

    it('should calculate positive rate', () => {
      const responses: Response[] = [
        {
          id: '1',
          rating: null,
          vote: 'UP',
          content: null,
          endUserMeta: {},
          createdAt: new Date(),
        },
        {
          id: '2',
          rating: null,
          vote: 'UP',
          content: null,
          endUserMeta: {},
          createdAt: new Date(),
        },
        {
          id: '3',
          rating: null,
          vote: 'UP',
          content: null,
          endUserMeta: {},
          createdAt: new Date(),
        },
        {
          id: '4',
          rating: null,
          vote: 'DOWN',
          content: null,
          endUserMeta: {},
          createdAt: new Date(),
        },
      ];

      const stats = calculateStats(responses);

      expect(stats.positiveRate).toBe(75);
    });

    it('should return null positiveRate when no votes', () => {
      const responses: Response[] = [
        { id: '1', rating: 5, vote: null, content: null, endUserMeta: {}, createdAt: new Date() },
      ];

      const stats = calculateStats(responses);

      expect(stats.positiveRate).toBeNull();
    });

    it('should count feedback with content', () => {
      const responses: Response[] = [
        {
          id: '1',
          rating: 5,
          vote: null,
          content: 'Great!',
          endUserMeta: {},
          createdAt: new Date(),
        },
        { id: '2', rating: 4, vote: null, content: null, endUserMeta: {}, createdAt: new Date() },
        {
          id: '3',
          rating: 3,
          vote: null,
          content: 'Could be better',
          endUserMeta: {},
          createdAt: new Date(),
        },
        { id: '4', rating: 2, vote: null, content: '', endUserMeta: {}, createdAt: new Date() },
      ];

      const stats = calculateStats(responses);

      expect(stats.feedbackCount).toBe(2);
    });

    it('should handle empty responses array', () => {
      const stats = calculateStats([]);

      expect(stats.count).toBe(0);
      expect(stats.avgRating).toBeNull();
      expect(stats.positiveRate).toBeNull();
    });
  });

  describe('Segment Comparison', () => {
    interface SegmentSummary {
      segment: string;
      count: number;
      avgRating: number | null;
      positiveRate: number | null;
    }

    const compareSegments = (
      segments: SegmentSummary[]
    ): {
      highestRated: string | null;
      lowestRated: string | null;
      mostPositive: string | null;
      largest: string | null;
    } => {
      if (segments.length === 0) {
        return { highestRated: null, lowestRated: null, mostPositive: null, largest: null };
      }

      const withRatings = segments.filter((s) => s.avgRating !== null);
      const withVotes = segments.filter((s) => s.positiveRate !== null);

      return {
        highestRated:
          withRatings.length > 0
            ? withRatings.reduce((a, b) => (a.avgRating! > b.avgRating! ? a : b)).segment
            : null,
        lowestRated:
          withRatings.length > 0
            ? withRatings.reduce((a, b) => (a.avgRating! < b.avgRating! ? a : b)).segment
            : null,
        mostPositive:
          withVotes.length > 0
            ? withVotes.reduce((a, b) => (a.positiveRate! > b.positiveRate! ? a : b)).segment
            : null,
        largest: segments.reduce((a, b) => (a.count > b.count ? a : b)).segment,
      };
    };

    it('should identify highest rated segment', () => {
      const segments: SegmentSummary[] = [
        { segment: 'free', count: 100, avgRating: 3.5, positiveRate: null },
        { segment: 'pro', count: 50, avgRating: 4.5, positiveRate: null },
        { segment: 'enterprise', count: 10, avgRating: 4.0, positiveRate: null },
      ];

      const comparison = compareSegments(segments);

      expect(comparison.highestRated).toBe('pro');
    });

    it('should identify lowest rated segment', () => {
      const segments: SegmentSummary[] = [
        { segment: 'free', count: 100, avgRating: 3.5, positiveRate: null },
        { segment: 'pro', count: 50, avgRating: 4.5, positiveRate: null },
      ];

      const comparison = compareSegments(segments);

      expect(comparison.lowestRated).toBe('free');
    });

    it('should identify most positive segment', () => {
      const segments: SegmentSummary[] = [
        { segment: 'US', count: 100, avgRating: null, positiveRate: 60 },
        { segment: 'UK', count: 50, avgRating: null, positiveRate: 80 },
        { segment: 'CA', count: 30, avgRating: null, positiveRate: 70 },
      ];

      const comparison = compareSegments(segments);

      expect(comparison.mostPositive).toBe('UK');
    });

    it('should identify largest segment', () => {
      const segments: SegmentSummary[] = [
        { segment: 'free', count: 100, avgRating: 3.5, positiveRate: null },
        { segment: 'pro', count: 50, avgRating: 4.5, positiveRate: null },
      ];

      const comparison = compareSegments(segments);

      expect(comparison.largest).toBe('free');
    });

    it('should handle segments without ratings', () => {
      const segments: SegmentSummary[] = [
        { segment: 'A', count: 10, avgRating: null, positiveRate: 50 },
        { segment: 'B', count: 20, avgRating: null, positiveRate: 60 },
      ];

      const comparison = compareSegments(segments);

      expect(comparison.highestRated).toBeNull();
      expect(comparison.lowestRated).toBeNull();
      expect(comparison.mostPositive).toBe('B');
    });

    it('should handle empty segments', () => {
      const comparison = compareSegments([]);

      expect(comparison.highestRated).toBeNull();
      expect(comparison.lowestRated).toBeNull();
      expect(comparison.mostPositive).toBeNull();
      expect(comparison.largest).toBeNull();
    });
  });
});
