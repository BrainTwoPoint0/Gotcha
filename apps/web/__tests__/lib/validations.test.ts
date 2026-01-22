import {
  submitResponseSchema,
  listResponsesSchema,
  responseModeSchema,
  voteTypeSchema,
} from '@/lib/validations';

describe('Validation Schemas', () => {
  describe('responseModeSchema', () => {
    it('should accept valid modes', () => {
      expect(responseModeSchema.parse('feedback')).toBe('feedback');
      expect(responseModeSchema.parse('vote')).toBe('vote');
      expect(responseModeSchema.parse('poll')).toBe('poll');
      expect(responseModeSchema.parse('feature-request')).toBe('feature-request');
      expect(responseModeSchema.parse('ab')).toBe('ab');
    });

    it('should reject invalid modes', () => {
      expect(() => responseModeSchema.parse('invalid')).toThrow();
    });
  });

  describe('voteTypeSchema', () => {
    it('should accept up and down', () => {
      expect(voteTypeSchema.parse('up')).toBe('up');
      expect(voteTypeSchema.parse('down')).toBe('down');
    });

    it('should reject invalid vote types', () => {
      expect(() => voteTypeSchema.parse('left')).toThrow();
    });
  });

  describe('submitResponseSchema', () => {
    describe('feedback mode', () => {
      it('should accept valid feedback', () => {
        const result = submitResponseSchema.parse({
          elementId: 'test-element',
          mode: 'feedback',
          content: 'This is great!',
        });
        expect(result.elementId).toBe('test-element');
        expect(result.mode).toBe('feedback');
        expect(result.content).toBe('This is great!');
      });

      it('should require elementId', () => {
        expect(() =>
          submitResponseSchema.parse({
            mode: 'feedback',
            content: 'This is great!',
          })
        ).toThrow();
      });

      it('should reject empty elementId', () => {
        expect(() =>
          submitResponseSchema.parse({
            elementId: '',
            mode: 'feedback',
          })
        ).toThrow();
      });
    });

    describe('vote mode', () => {
      it('should accept valid upvote', () => {
        const result = submitResponseSchema.parse({
          elementId: 'feature-1',
          mode: 'vote',
          vote: 'up',
        });
        expect(result.vote).toBe('up');
      });

      it('should accept valid downvote', () => {
        const result = submitResponseSchema.parse({
          elementId: 'feature-1',
          mode: 'vote',
          vote: 'down',
        });
        expect(result.vote).toBe('down');
      });

      it('should require vote field for vote mode', () => {
        expect(() =>
          submitResponseSchema.parse({
            elementId: 'feature-1',
            mode: 'vote',
          })
        ).toThrow('Vote mode requires a vote');
      });
    });

    describe('poll mode', () => {
      it('should accept valid poll response', () => {
        const result = submitResponseSchema.parse({
          elementId: 'poll-1',
          mode: 'poll',
          pollOptions: ['Option A', 'Option B', 'Option C'],
          pollSelected: ['Option A'],
        });
        expect(result.pollOptions).toHaveLength(3);
        expect(result.pollSelected).toEqual(['Option A']);
      });

      it('should require pollOptions for poll mode', () => {
        expect(() =>
          submitResponseSchema.parse({
            elementId: 'poll-1',
            mode: 'poll',
            pollSelected: ['Option A'],
          })
        ).toThrow('Poll mode requires pollOptions');
      });

      it('should require at least 2 poll options', () => {
        expect(() =>
          submitResponseSchema.parse({
            elementId: 'poll-1',
            mode: 'poll',
            pollOptions: ['Only one'],
            pollSelected: ['Only one'],
          })
        ).toThrow();
      });

      it('should require pollSelected for poll mode', () => {
        expect(() =>
          submitResponseSchema.parse({
            elementId: 'poll-1',
            mode: 'poll',
            pollOptions: ['Option A', 'Option B'],
          })
        ).toThrow('Poll mode requires pollOptions');
      });
    });

    describe('ab mode', () => {
      it('should accept valid A/B response', () => {
        const result = submitResponseSchema.parse({
          elementId: 'ab-test-1',
          mode: 'ab',
          experimentId: 'exp-123',
          variant: 'A',
        });
        expect(result.experimentId).toBe('exp-123');
        expect(result.variant).toBe('A');
      });

      it('should require experimentId for ab mode', () => {
        expect(() =>
          submitResponseSchema.parse({
            elementId: 'ab-test-1',
            mode: 'ab',
            variant: 'A',
          })
        ).toThrow('A/B mode requires experimentId');
      });
    });

    describe('rating', () => {
      it('should accept valid rating (1-10)', () => {
        const result = submitResponseSchema.parse({
          elementId: 'rating-1',
          mode: 'feedback',
          rating: 5,
        });
        expect(result.rating).toBe(5);
      });

      it('should reject rating below 1', () => {
        expect(() =>
          submitResponseSchema.parse({
            elementId: 'rating-1',
            mode: 'feedback',
            rating: 0,
          })
        ).toThrow();
      });

      it('should reject rating above 10', () => {
        expect(() =>
          submitResponseSchema.parse({
            elementId: 'rating-1',
            mode: 'feedback',
            rating: 11,
          })
        ).toThrow();
      });
    });

    describe('user data', () => {
      it('should accept user with id', () => {
        const result = submitResponseSchema.parse({
          elementId: 'test',
          mode: 'feedback',
          user: { id: 'user-123' },
        });
        expect(result.user?.id).toBe('user-123');
      });

      it('should accept user with additional properties', () => {
        const result = submitResponseSchema.parse({
          elementId: 'test',
          mode: 'feedback',
          user: { id: 'user-123', email: 'test@example.com', plan: 'pro' },
        });
        expect(result.user).toEqual({ id: 'user-123', email: 'test@example.com', plan: 'pro' });
      });
    });

    describe('context', () => {
      it('should accept valid context', () => {
        const result = submitResponseSchema.parse({
          elementId: 'test',
          mode: 'feedback',
          context: {
            url: 'https://example.com/page',
            userAgent: 'Mozilla/5.0',
          },
        });
        expect(result.context?.url).toBe('https://example.com/page');
      });

      it('should reject invalid URL in context', () => {
        expect(() =>
          submitResponseSchema.parse({
            elementId: 'test',
            mode: 'feedback',
            context: {
              url: 'not-a-url',
            },
          })
        ).toThrow();
      });
    });
  });

  describe('listResponsesSchema', () => {
    it('should accept empty query (defaults)', () => {
      const result = listResponsesSchema.parse({});
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
    });

    it('should accept valid filters', () => {
      const result = listResponsesSchema.parse({
        elementId: 'test',
        mode: 'feedback',
        page: 2,
        limit: 50,
      });
      expect(result.elementId).toBe('test');
      expect(result.mode).toBe('feedback');
      expect(result.page).toBe(2);
      expect(result.limit).toBe(50);
    });

    it('should coerce string numbers', () => {
      const result = listResponsesSchema.parse({
        page: '3',
        limit: '25',
      });
      expect(result.page).toBe(3);
      expect(result.limit).toBe(25);
    });

    it('should reject limit above 100', () => {
      expect(() =>
        listResponsesSchema.parse({
          limit: 101,
        })
      ).toThrow();
    });

    it('should reject page below 1', () => {
      expect(() =>
        listResponsesSchema.parse({
          page: 0,
        })
      ).toThrow();
    });
  });
});
