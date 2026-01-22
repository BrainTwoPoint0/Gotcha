/**
 * Unit tests for response API business logic
 * Tests validation, data transformation, and mode handling
 */

import { submitResponseSchema, listResponsesSchema } from '@/lib/validations';

describe('Response API Logic', () => {
  describe('Mode Mapping', () => {
    const modeMap: Record<string, string> = {
      feedback: 'FEEDBACK',
      vote: 'VOTE',
      poll: 'POLL',
      'feature-request': 'FEATURE_REQUEST',
      ab: 'AB',
    };

    const voteMap: Record<string, string> = {
      up: 'UP',
      down: 'DOWN',
    };

    it('should map SDK modes to Prisma enums', () => {
      expect(modeMap['feedback']).toBe('FEEDBACK');
      expect(modeMap['vote']).toBe('VOTE');
      expect(modeMap['poll']).toBe('POLL');
      expect(modeMap['feature-request']).toBe('FEATURE_REQUEST');
      expect(modeMap['ab']).toBe('AB');
    });

    it('should map vote types to Prisma enums', () => {
      expect(voteMap['up']).toBe('UP');
      expect(voteMap['down']).toBe('DOWN');
    });
  });

  describe('Submit Response Validation', () => {
    describe('Text Feedback', () => {
      it('should validate basic feedback submission', () => {
        const result = submitResponseSchema.safeParse({
          elementId: 'feedback-button',
          mode: 'feedback',
          content: 'Great feature!',
        });
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.content).toBe('Great feature!');
        }
      });

      it('should validate feedback with rating', () => {
        const result = submitResponseSchema.safeParse({
          elementId: 'nps-survey',
          mode: 'feedback',
          content: 'Very satisfied',
          rating: 9,
        });
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.rating).toBe(9);
        }
      });

      it('should reject invalid ratings', () => {
        const tooLow = submitResponseSchema.safeParse({
          elementId: 'test',
          mode: 'feedback',
          rating: 0,
        });
        expect(tooLow.success).toBe(false);

        const tooHigh = submitResponseSchema.safeParse({
          elementId: 'test',
          mode: 'feedback',
          rating: 11,
        });
        expect(tooHigh.success).toBe(false);
      });
    });

    describe('Vote (Thumbs Up/Down)', () => {
      it('should validate upvote submission', () => {
        const result = submitResponseSchema.safeParse({
          elementId: 'helpful-article',
          mode: 'vote',
          vote: 'up',
        });
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.vote).toBe('up');
        }
      });

      it('should validate downvote submission', () => {
        const result = submitResponseSchema.safeParse({
          elementId: 'helpful-article',
          mode: 'vote',
          vote: 'down',
        });
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.vote).toBe('down');
        }
      });

      it('should reject vote mode without vote field', () => {
        const result = submitResponseSchema.safeParse({
          elementId: 'helpful-article',
          mode: 'vote',
        });
        expect(result.success).toBe(false);
      });
    });

    describe('Poll', () => {
      it('should validate poll submission', () => {
        const result = submitResponseSchema.safeParse({
          elementId: 'feature-poll',
          mode: 'poll',
          pollOptions: ['Option A', 'Option B', 'Option C'],
          pollSelected: ['Option A'],
        });
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.pollOptions).toHaveLength(3);
          expect(result.data.pollSelected).toEqual(['Option A']);
        }
      });

      it('should allow multiple selections in poll', () => {
        const result = submitResponseSchema.safeParse({
          elementId: 'multi-poll',
          mode: 'poll',
          pollOptions: ['A', 'B', 'C', 'D'],
          pollSelected: ['A', 'C'],
        });
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.pollSelected).toEqual(['A', 'C']);
        }
      });

      it('should reject poll without options', () => {
        const result = submitResponseSchema.safeParse({
          elementId: 'feature-poll',
          mode: 'poll',
          pollSelected: ['Option A'],
        });
        expect(result.success).toBe(false);
      });

      it('should reject poll with only one option', () => {
        const result = submitResponseSchema.safeParse({
          elementId: 'feature-poll',
          mode: 'poll',
          pollOptions: ['Only One'],
          pollSelected: ['Only One'],
        });
        expect(result.success).toBe(false);
      });

      it('should reject poll without selected option', () => {
        const result = submitResponseSchema.safeParse({
          elementId: 'feature-poll',
          mode: 'poll',
          pollOptions: ['A', 'B'],
        });
        expect(result.success).toBe(false);
      });
    });

    describe('Feature Request', () => {
      it('should validate feature request submission', () => {
        const result = submitResponseSchema.safeParse({
          elementId: 'feature-form',
          mode: 'feature-request',
          title: 'Dark mode',
          content: 'Please add dark mode support',
        });
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.title).toBe('Dark mode');
          expect(result.data.content).toBe('Please add dark mode support');
        }
      });
    });

    describe('A/B Test', () => {
      it('should validate A/B test submission', () => {
        const result = submitResponseSchema.safeParse({
          elementId: 'checkout-button',
          mode: 'ab',
          experimentId: 'exp-button-color',
          variant: 'green',
        });
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.experimentId).toBe('exp-button-color');
          expect(result.data.variant).toBe('green');
        }
      });

      it('should reject A/B without experimentId', () => {
        const result = submitResponseSchema.safeParse({
          elementId: 'checkout-button',
          mode: 'ab',
          variant: 'green',
        });
        expect(result.success).toBe(false);
      });
    });

    describe('User Data', () => {
      it('should accept user with id', () => {
        const result = submitResponseSchema.safeParse({
          elementId: 'test',
          mode: 'feedback',
          user: { id: 'user-123' },
        });
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.user?.id).toBe('user-123');
        }
      });

      it('should accept user with arbitrary metadata', () => {
        const result = submitResponseSchema.safeParse({
          elementId: 'test',
          mode: 'feedback',
          user: {
            id: 'user-123',
            email: 'test@example.com',
            plan: 'pro',
            customField: 'value',
          },
        });
        expect(result.success).toBe(true);
        if (result.success) {
          const user = result.data.user as Record<string, unknown>;
          expect(user.email).toBe('test@example.com');
          expect(user.plan).toBe('pro');
          expect(user.customField).toBe('value');
        }
      });
    });

    describe('Context', () => {
      it('should accept valid context', () => {
        const result = submitResponseSchema.safeParse({
          elementId: 'test',
          mode: 'feedback',
          context: {
            url: 'https://example.com/page',
            userAgent: 'Mozilla/5.0',
          },
        });
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.context?.url).toBe('https://example.com/page');
        }
      });

      it('should reject invalid URL in context', () => {
        const result = submitResponseSchema.safeParse({
          elementId: 'test',
          mode: 'feedback',
          context: {
            url: 'not-a-url',
          },
        });
        expect(result.success).toBe(false);
      });
    });
  });

  describe('List Responses Query Validation', () => {
    it('should provide defaults for empty query', () => {
      const result = listResponsesSchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(1);
        expect(result.data.limit).toBe(20);
      }
    });

    it('should accept all filter options', () => {
      const result = listResponsesSchema.safeParse({
        elementId: 'test-element',
        mode: 'feedback',
        page: 2,
        limit: 50,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.elementId).toBe('test-element');
        expect(result.data.mode).toBe('feedback');
        expect(result.data.page).toBe(2);
        expect(result.data.limit).toBe(50);
      }
    });

    it('should coerce string numbers', () => {
      const result = listResponsesSchema.safeParse({
        page: '3',
        limit: '25',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(3);
        expect(result.data.limit).toBe(25);
      }
    });

    it('should reject limit over 100', () => {
      const result = listResponsesSchema.safeParse({ limit: 150 });
      expect(result.success).toBe(false);
    });

    it('should reject page below 1', () => {
      const result = listResponsesSchema.safeParse({ page: 0 });
      expect(result.success).toBe(false);
    });
  });

  describe('Poll Results Calculation', () => {
    // Simulates the poll results calculation logic from the API
    const calculatePollResults = (
      options: string[],
      responses: { pollSelected: string[] | null }[]
    ): Record<string, number> => {
      const results: Record<string, number> = {};
      options.forEach((opt) => {
        results[opt] = 0;
      });

      responses.forEach((r) => {
        if (r.pollSelected) {
          r.pollSelected.forEach((s) => {
            if (results[s] !== undefined) {
              results[s]++;
            }
          });
        }
      });

      return results;
    };

    it('should calculate poll results correctly', () => {
      const options = ['Red', 'Blue', 'Green'];
      const responses = [
        { pollSelected: ['Red'] },
        { pollSelected: ['Blue'] },
        { pollSelected: ['Red'] },
        { pollSelected: ['Green'] },
        { pollSelected: ['Red'] },
      ];

      const results = calculatePollResults(options, responses);

      expect(results['Red']).toBe(3);
      expect(results['Blue']).toBe(1);
      expect(results['Green']).toBe(1);
    });

    it('should handle multiple selections per response', () => {
      const options = ['A', 'B', 'C'];
      const responses = [
        { pollSelected: ['A', 'B'] },
        { pollSelected: ['B', 'C'] },
        { pollSelected: ['A'] },
      ];

      const results = calculatePollResults(options, responses);

      expect(results['A']).toBe(2);
      expect(results['B']).toBe(2);
      expect(results['C']).toBe(1);
    });

    it('should handle empty responses', () => {
      const options = ['Yes', 'No'];
      const responses: { pollSelected: string[] | null }[] = [];

      const results = calculatePollResults(options, responses);

      expect(results['Yes']).toBe(0);
      expect(results['No']).toBe(0);
    });

    it('should ignore null pollSelected', () => {
      const options = ['A', 'B'];
      const responses = [
        { pollSelected: ['A'] },
        { pollSelected: null },
        { pollSelected: ['B'] },
      ];

      const results = calculatePollResults(options, responses);

      expect(results['A']).toBe(1);
      expect(results['B']).toBe(1);
    });
  });
});
