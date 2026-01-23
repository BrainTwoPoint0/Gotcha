/**
 * Tests for analytics data processing logic
 * Note: These test the data transformation logic, not actual database calls
 */

describe('Analytics Data Processing', () => {
  describe('Daily Count Aggregation', () => {
    interface Response {
      createdAt: Date;
    }

    const aggregateDailyCounts = (
      responses: Response[],
      startDate: Date,
      endDate: Date
    ): Record<string, number> => {
      const counts: Record<string, number> = {};

      // Initialize all days in range
      const current = new Date(startDate);
      while (current <= endDate) {
        const key = current.toISOString().split('T')[0];
        counts[key] = 0;
        current.setDate(current.getDate() + 1);
      }

      // Count responses per day
      responses.forEach((r) => {
        const key = r.createdAt.toISOString().split('T')[0];
        if (counts[key] !== undefined) {
          counts[key]++;
        }
      });

      return counts;
    };

    it('should initialize all days with zero', () => {
      const start = new Date('2024-01-01');
      const end = new Date('2024-01-03');
      const counts = aggregateDailyCounts([], start, end);

      expect(counts['2024-01-01']).toBe(0);
      expect(counts['2024-01-02']).toBe(0);
      expect(counts['2024-01-03']).toBe(0);
    });

    it('should count responses per day', () => {
      const responses = [
        { createdAt: new Date('2024-01-01T10:00:00Z') },
        { createdAt: new Date('2024-01-01T14:00:00Z') },
        { createdAt: new Date('2024-01-02T09:00:00Z') },
      ];
      const start = new Date('2024-01-01');
      const end = new Date('2024-01-03');
      const counts = aggregateDailyCounts(responses, start, end);

      expect(counts['2024-01-01']).toBe(2);
      expect(counts['2024-01-02']).toBe(1);
      expect(counts['2024-01-03']).toBe(0);
    });

    it('should ignore responses outside date range', () => {
      const responses = [
        { createdAt: new Date('2023-12-31T10:00:00Z') },
        { createdAt: new Date('2024-01-01T10:00:00Z') },
        { createdAt: new Date('2024-01-04T10:00:00Z') },
      ];
      const start = new Date('2024-01-01');
      const end = new Date('2024-01-02');
      const counts = aggregateDailyCounts(responses, start, end);

      expect(counts['2024-01-01']).toBe(1);
      expect(counts['2023-12-31']).toBeUndefined();
      expect(counts['2024-01-04']).toBeUndefined();
    });
  });

  describe('Mode Count Aggregation', () => {
    const aggregateModeCounts = (responses: { mode: string }[]): Record<string, number> => {
      const counts: Record<string, number> = {};
      responses.forEach((r) => {
        counts[r.mode] = (counts[r.mode] || 0) + 1;
      });
      return counts;
    };

    it('should count responses by mode', () => {
      const responses = [
        { mode: 'FEEDBACK' },
        { mode: 'FEEDBACK' },
        { mode: 'VOTE' },
        { mode: 'POLL' },
      ];

      const counts = aggregateModeCounts(responses);

      expect(counts['FEEDBACK']).toBe(2);
      expect(counts['VOTE']).toBe(1);
      expect(counts['POLL']).toBe(1);
    });

    it('should return empty object for no responses', () => {
      expect(aggregateModeCounts([])).toEqual({});
    });
  });

  describe('Vote Sentiment Aggregation', () => {
    const aggregateVotes = (responses: { vote: string | null }[]): { UP: number; DOWN: number } => {
      const counts = { UP: 0, DOWN: 0 };
      responses.forEach((r) => {
        if (r.vote === 'UP') counts.UP++;
        if (r.vote === 'DOWN') counts.DOWN++;
      });
      return counts;
    };

    it('should count up and down votes', () => {
      const responses = [{ vote: 'UP' }, { vote: 'UP' }, { vote: 'DOWN' }, { vote: null }];

      const counts = aggregateVotes(responses);

      expect(counts.UP).toBe(2);
      expect(counts.DOWN).toBe(1);
    });

    it('should return zeros for no votes', () => {
      const counts = aggregateVotes([{ vote: null }, { vote: null }]);

      expect(counts.UP).toBe(0);
      expect(counts.DOWN).toBe(0);
    });
  });

  describe('Average Rating Calculation', () => {
    const calculateAverageRating = (ratings: number[]): number | null => {
      if (ratings.length === 0) return null;
      const sum = ratings.reduce((a, b) => a + b, 0);
      return Number((sum / ratings.length).toFixed(1));
    };

    it('should calculate average rating', () => {
      expect(calculateAverageRating([5, 4, 3, 4, 4])).toBe(4);
      expect(calculateAverageRating([5, 5, 5])).toBe(5);
    });

    it('should round to one decimal place', () => {
      expect(calculateAverageRating([5, 4, 4])).toBe(4.3);
      expect(calculateAverageRating([3, 3, 3, 4])).toBe(3.3);
    });

    it('should return null for empty ratings', () => {
      expect(calculateAverageRating([])).toBe(null);
    });
  });

  describe('Positive Rate Calculation', () => {
    const calculatePositiveRate = (upVotes: number, downVotes: number): number | null => {
      const total = upVotes + downVotes;
      if (total === 0) return null;
      return Math.round((upVotes / total) * 100);
    };

    it('should calculate positive rate percentage', () => {
      expect(calculatePositiveRate(8, 2)).toBe(80);
      expect(calculatePositiveRate(1, 1)).toBe(50);
      expect(calculatePositiveRate(10, 0)).toBe(100);
    });

    it('should return null when no votes', () => {
      expect(calculatePositiveRate(0, 0)).toBe(null);
    });

    it('should round to nearest integer', () => {
      expect(calculatePositiveRate(1, 2)).toBe(33);
      expect(calculatePositiveRate(2, 1)).toBe(67);
    });
  });

  describe('Mode Name Formatting', () => {
    const formatModeName = (mode: string): string => {
      return mode.toLowerCase().replace('_', ' ');
    };

    it('should convert to lowercase', () => {
      expect(formatModeName('FEEDBACK')).toBe('feedback');
      expect(formatModeName('VOTE')).toBe('vote');
    });

    it('should replace underscores with spaces', () => {
      expect(formatModeName('FEATURE_REQUEST')).toBe('feature request');
    });
  });

  describe('Date Label Formatting', () => {
    const formatDateLabel = (dateString: string): string => {
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
    };

    it('should format date as "Mon DD"', () => {
      expect(formatDateLabel('2024-01-15')).toBe('Jan 15');
      expect(formatDateLabel('2024-12-25')).toBe('Dec 25');
    });
  });

  describe('Sentiment Data Formatting', () => {
    const formatSentimentData = (upVotes: number, downVotes: number) => {
      return [
        { name: 'Positive', value: upVotes, color: '#22c55e' },
        { name: 'Negative', value: downVotes, color: '#ef4444' },
      ].filter((d) => d.value > 0);
    };

    it('should include both when both have votes', () => {
      const result = formatSentimentData(10, 5);

      expect(result.length).toBe(2);
      expect(result[0].name).toBe('Positive');
      expect(result[0].value).toBe(10);
      expect(result[1].name).toBe('Negative');
      expect(result[1].value).toBe(5);
    });

    it('should filter out zero values', () => {
      const positiveOnly = formatSentimentData(10, 0);
      expect(positiveOnly.length).toBe(1);
      expect(positiveOnly[0].name).toBe('Positive');

      const negativeOnly = formatSentimentData(0, 5);
      expect(negativeOnly.length).toBe(1);
      expect(negativeOnly[0].name).toBe('Negative');
    });

    it('should return empty array when no votes', () => {
      expect(formatSentimentData(0, 0)).toEqual([]);
    });

    it('should use correct colors', () => {
      const result = formatSentimentData(1, 1);

      expect(result[0].color).toBe('#22c55e'); // Green for positive
      expect(result[1].color).toBe('#ef4444'); // Red for negative
    });
  });

  describe('Ratings by Date Aggregation', () => {
    const aggregateRatingsByDate = (
      responses: { date: string; rating: number }[]
    ): Record<string, number[]> => {
      const ratingsByDate: Record<string, number[]> = {};
      responses.forEach(({ date, rating }) => {
        if (!ratingsByDate[date]) ratingsByDate[date] = [];
        ratingsByDate[date].push(rating);
      });
      return ratingsByDate;
    };

    it('should group ratings by date', () => {
      const responses = [
        { date: '2024-01-01', rating: 5 },
        { date: '2024-01-01', rating: 4 },
        { date: '2024-01-02', rating: 3 },
      ];

      const result = aggregateRatingsByDate(responses);

      expect(result['2024-01-01']).toEqual([5, 4]);
      expect(result['2024-01-02']).toEqual([3]);
    });

    it('should return empty object for no responses', () => {
      expect(aggregateRatingsByDate([])).toEqual({});
    });
  });

  describe('Days in Range Calculation', () => {
    const calculateDaysDiff = (startDate: Date, endDate: Date): number => {
      return Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    };

    it('should calculate days between dates', () => {
      const start = new Date('2024-01-01');
      const end = new Date('2024-01-31');

      expect(calculateDaysDiff(start, end)).toBe(30);
    });

    it('should return 0 for same date', () => {
      const date = new Date('2024-01-15');
      expect(calculateDaysDiff(date, date)).toBe(0);
    });
  });

  describe('Chart Data Limit', () => {
    // Charts cap at 90 days for readability
    const MAX_CHART_DAYS = 90;

    const capDaysForChart = (days: number): number => {
      return Math.min(days, MAX_CHART_DAYS);
    };

    it('should not cap days under limit', () => {
      expect(capDaysForChart(30)).toBe(30);
      expect(capDaysForChart(90)).toBe(90);
    });

    it('should cap days over limit', () => {
      expect(capDaysForChart(100)).toBe(90);
      expect(capDaysForChart(365)).toBe(90);
    });
  });

  describe('Trend Data Formatting', () => {
    const formatTrendData = (dailyCounts: Record<string, number>) => {
      return Object.entries(dailyCounts).map(([date, count]) => ({
        date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        responses: count,
      }));
    };

    it('should format daily counts to trend data', () => {
      const counts = {
        '2024-01-01': 5,
        '2024-01-02': 10,
      };

      const result = formatTrendData(counts);

      expect(result.length).toBe(2);
      expect(result[0].date).toBe('Jan 1');
      expect(result[0].responses).toBe(5);
      expect(result[1].date).toBe('Jan 2');
      expect(result[1].responses).toBe(10);
    });
  });
});
