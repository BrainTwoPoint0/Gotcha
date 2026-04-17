/**
 * Tests for SDK follow-up question triggering logic
 * Note: These test the decision function without React rendering
 */

describe('SDK Follow-Up Logic', () => {
  describe('shouldFollowUp Decision', () => {
    interface FollowUpConfig {
      ratingThreshold?: number;
      onNegativeVote?: boolean;
      question?: string;
    }

    interface SubmitData {
      rating?: number | null;
      vote?: 'up' | 'down' | null;
      content?: string;
    }

    const shouldFollowUp = (
      followUp: FollowUpConfig | undefined,
      lastSubmitData: SubmitData | null
    ): boolean => {
      if (!followUp || !lastSubmitData) return false;
      return (
        (followUp.ratingThreshold != null &&
          lastSubmitData.rating != null &&
          lastSubmitData.rating <= followUp.ratingThreshold) ||
        (!!followUp.onNegativeVote && lastSubmitData.vote === 'down')
      );
    };

    // --- Rating threshold tests ---

    it('should trigger when rating equals threshold', () => {
      const config: FollowUpConfig = { ratingThreshold: 2, question: 'What went wrong?' };
      const data: SubmitData = { rating: 2 };
      expect(shouldFollowUp(config, data)).toBe(true);
    });

    it('should trigger when rating is below threshold', () => {
      const config: FollowUpConfig = { ratingThreshold: 3, question: 'What went wrong?' };
      const data: SubmitData = { rating: 1 };
      expect(shouldFollowUp(config, data)).toBe(true);
    });

    it('should not trigger when rating is above threshold', () => {
      const config: FollowUpConfig = { ratingThreshold: 2, question: 'What went wrong?' };
      const data: SubmitData = { rating: 3 };
      expect(shouldFollowUp(config, data)).toBe(false);
    });

    it('should not trigger when rating is 5 and threshold is 3', () => {
      const config: FollowUpConfig = { ratingThreshold: 3, question: 'What went wrong?' };
      const data: SubmitData = { rating: 5 };
      expect(shouldFollowUp(config, data)).toBe(false);
    });

    it('should trigger when rating is 1 (minimum) and threshold is 1', () => {
      const config: FollowUpConfig = { ratingThreshold: 1, question: 'What went wrong?' };
      const data: SubmitData = { rating: 1 };
      expect(shouldFollowUp(config, data)).toBe(true);
    });

    it('should not trigger for rating threshold when rating is null', () => {
      const config: FollowUpConfig = { ratingThreshold: 3, question: 'What went wrong?' };
      const data: SubmitData = { rating: null };
      expect(shouldFollowUp(config, data)).toBe(false);
    });

    it('should not trigger for rating threshold when rating is undefined', () => {
      const config: FollowUpConfig = { ratingThreshold: 3, question: 'What went wrong?' };
      const data: SubmitData = {};
      expect(shouldFollowUp(config, data)).toBe(false);
    });

    it('should handle threshold of 0', () => {
      const config: FollowUpConfig = { ratingThreshold: 0, question: 'What went wrong?' };
      const data: SubmitData = { rating: 0 };
      // ratingThreshold is 0 which is != null, rating is 0 which is != null, 0 <= 0 = true
      expect(shouldFollowUp(config, data)).toBe(true);
    });

    // --- NPS score tests ---

    it('should trigger for NPS score at threshold', () => {
      // NPS uses 0-10 scale, detractors are 0-6
      const config: FollowUpConfig = { ratingThreshold: 6, question: 'How can we improve?' };
      const data: SubmitData = { rating: 6 };
      expect(shouldFollowUp(config, data)).toBe(true);
    });

    it('should trigger for NPS detractor score', () => {
      const config: FollowUpConfig = { ratingThreshold: 6, question: 'How can we improve?' };
      const data: SubmitData = { rating: 3 };
      expect(shouldFollowUp(config, data)).toBe(true);
    });

    it('should not trigger for NPS promoter score', () => {
      const config: FollowUpConfig = { ratingThreshold: 6, question: 'How can we improve?' };
      const data: SubmitData = { rating: 9 };
      expect(shouldFollowUp(config, data)).toBe(false);
    });

    // --- Negative vote tests ---

    it('should trigger on negative vote with onNegativeVote=true', () => {
      const config: FollowUpConfig = { onNegativeVote: true, question: 'What went wrong?' };
      const data: SubmitData = { vote: 'down' };
      expect(shouldFollowUp(config, data)).toBe(true);
    });

    it('should not trigger on negative vote with onNegativeVote=false', () => {
      const config: FollowUpConfig = { onNegativeVote: false, question: 'What went wrong?' };
      const data: SubmitData = { vote: 'down' };
      expect(shouldFollowUp(config, data)).toBe(false);
    });

    it('should not trigger on negative vote when onNegativeVote is undefined', () => {
      const config: FollowUpConfig = { question: 'What went wrong?' };
      const data: SubmitData = { vote: 'down' };
      expect(shouldFollowUp(config, data)).toBe(false);
    });

    it('should not trigger on positive vote with onNegativeVote=true', () => {
      const config: FollowUpConfig = { onNegativeVote: true, question: 'What went wrong?' };
      const data: SubmitData = { vote: 'up' };
      expect(shouldFollowUp(config, data)).toBe(false);
    });

    it('should not trigger on null vote with onNegativeVote=true', () => {
      const config: FollowUpConfig = { onNegativeVote: true, question: 'What went wrong?' };
      const data: SubmitData = { vote: null };
      expect(shouldFollowUp(config, data)).toBe(false);
    });

    it('should not trigger when vote is undefined with onNegativeVote=true', () => {
      const config: FollowUpConfig = { onNegativeVote: true, question: 'What went wrong?' };
      const data: SubmitData = {};
      expect(shouldFollowUp(config, data)).toBe(false);
    });

    // --- No config / no data tests ---

    it('should not trigger when followUp is undefined', () => {
      const data: SubmitData = { rating: 1, vote: 'down' };
      expect(shouldFollowUp(undefined, data)).toBe(false);
    });

    it('should not trigger when lastSubmitData is null', () => {
      const config: FollowUpConfig = {
        ratingThreshold: 3,
        onNegativeVote: true,
        question: 'What went wrong?',
      };
      expect(shouldFollowUp(config, null)).toBe(false);
    });

    it('should not trigger with empty config', () => {
      const config: FollowUpConfig = {};
      const data: SubmitData = { rating: 1, vote: 'down' };
      expect(shouldFollowUp(config, data)).toBe(false);
    });

    it('should not trigger with empty submit data', () => {
      const config: FollowUpConfig = {
        ratingThreshold: 3,
        onNegativeVote: true,
        question: 'What went wrong?',
      };
      const data: SubmitData = {};
      expect(shouldFollowUp(config, data)).toBe(false);
    });

    // --- Combined trigger tests ---

    it('should trigger when rating meets threshold even if vote is up', () => {
      const config: FollowUpConfig = {
        ratingThreshold: 3,
        onNegativeVote: true,
        question: 'What went wrong?',
      };
      const data: SubmitData = { rating: 2, vote: 'up' };
      expect(shouldFollowUp(config, data)).toBe(true);
    });

    it('should trigger when vote is down even if rating is above threshold', () => {
      const config: FollowUpConfig = {
        ratingThreshold: 2,
        onNegativeVote: true,
        question: 'What went wrong?',
      };
      const data: SubmitData = { rating: 5, vote: 'down' };
      expect(shouldFollowUp(config, data)).toBe(true);
    });

    it('should trigger when both conditions are met (OR logic)', () => {
      const config: FollowUpConfig = {
        ratingThreshold: 3,
        onNegativeVote: true,
        question: 'What went wrong?',
      };
      const data: SubmitData = { rating: 1, vote: 'down' };
      expect(shouldFollowUp(config, data)).toBe(true);
    });

    it('should not trigger when neither condition is met', () => {
      const config: FollowUpConfig = {
        ratingThreshold: 2,
        onNegativeVote: true,
        question: 'What went wrong?',
      };
      const data: SubmitData = { rating: 5, vote: 'up' };
      expect(shouldFollowUp(config, data)).toBe(false);
    });
  });

  describe('Poll Mode Exclusion', () => {
    type Mode = 'feedback' | 'vote' | 'poll' | 'nps';

    const isFollowUpAllowed = (mode: Mode): boolean => {
      return mode !== 'poll';
    };

    it('should allow follow-up for feedback mode', () => {
      expect(isFollowUpAllowed('feedback')).toBe(true);
    });

    it('should allow follow-up for vote mode', () => {
      expect(isFollowUpAllowed('vote')).toBe(true);
    });

    it('should allow follow-up for nps mode', () => {
      expect(isFollowUpAllowed('nps')).toBe(true);
    });

    it('should not allow follow-up for poll mode', () => {
      expect(isFollowUpAllowed('poll')).toBe(false);
    });
  });

  describe('Follow-Up with Mode Gating', () => {
    interface FollowUpConfig {
      ratingThreshold?: number;
      onNegativeVote?: boolean;
      question?: string;
    }

    interface SubmitData {
      rating?: number | null;
      vote?: 'up' | 'down' | null;
    }

    type Mode = 'feedback' | 'vote' | 'poll' | 'nps';

    const shouldShowFollowUp = (
      mode: Mode,
      followUp: FollowUpConfig | undefined,
      lastSubmitData: SubmitData | null
    ): boolean => {
      if (mode === 'poll') return false;
      if (!followUp || !lastSubmitData) return false;
      return (
        (followUp.ratingThreshold != null &&
          lastSubmitData.rating != null &&
          lastSubmitData.rating <= followUp.ratingThreshold) ||
        (!!followUp.onNegativeVote && lastSubmitData.vote === 'down')
      );
    };

    it('should trigger follow-up for feedback mode with low rating', () => {
      expect(
        shouldShowFollowUp('feedback', { ratingThreshold: 3, question: 'Why?' }, { rating: 2 })
      ).toBe(true);
    });

    it('should trigger follow-up for vote mode with negative vote', () => {
      expect(
        shouldShowFollowUp('vote', { onNegativeVote: true, question: 'Why?' }, { vote: 'down' })
      ).toBe(true);
    });

    it('should trigger follow-up for nps mode with detractor score', () => {
      expect(
        shouldShowFollowUp(
          'nps',
          { ratingThreshold: 6, question: 'How can we improve?' },
          { rating: 4 }
        )
      ).toBe(true);
    });

    it('should NOT trigger follow-up for poll mode even with matching conditions', () => {
      expect(
        shouldShowFollowUp(
          'poll',
          { ratingThreshold: 5, onNegativeVote: true, question: 'Why?' },
          { rating: 1, vote: 'down' }
        )
      ).toBe(false);
    });

    it('should NOT trigger for poll mode with negative vote', () => {
      expect(
        shouldShowFollowUp('poll', { onNegativeVote: true, question: 'Why?' }, { vote: 'down' })
      ).toBe(false);
    });

    it('should NOT trigger for feedback mode with high rating', () => {
      expect(
        shouldShowFollowUp('feedback', { ratingThreshold: 2, question: 'Why?' }, { rating: 5 })
      ).toBe(false);
    });

    it('should NOT trigger for vote mode with positive vote', () => {
      expect(
        shouldShowFollowUp('vote', { onNegativeVote: true, question: 'Why?' }, { vote: 'up' })
      ).toBe(false);
    });
  });

  describe('Rating Threshold Boundary Cases', () => {
    const meetsThreshold = (rating: number, threshold: number): boolean => {
      return rating <= threshold;
    };

    it('should trigger at exact boundary (rating === threshold)', () => {
      expect(meetsThreshold(3, 3)).toBe(true);
    });

    it('should trigger one below boundary', () => {
      expect(meetsThreshold(2, 3)).toBe(true);
    });

    it('should not trigger one above boundary', () => {
      expect(meetsThreshold(4, 3)).toBe(false);
    });

    it('should handle 5-star scale boundaries', () => {
      // Threshold of 2 on 5-star: 1 and 2 trigger, 3-5 do not
      expect(meetsThreshold(1, 2)).toBe(true);
      expect(meetsThreshold(2, 2)).toBe(true);
      expect(meetsThreshold(3, 2)).toBe(false);
      expect(meetsThreshold(4, 2)).toBe(false);
      expect(meetsThreshold(5, 2)).toBe(false);
    });

    it('should handle 10-point NPS scale boundaries', () => {
      // Threshold of 6: detractors (0-6) trigger, passives/promoters (7-10) do not
      for (let i = 0; i <= 6; i++) {
        expect(meetsThreshold(i, 6)).toBe(true);
      }
      for (let i = 7; i <= 10; i++) {
        expect(meetsThreshold(i, 6)).toBe(false);
      }
    });

    it('should handle threshold of 5 on 5-star (always triggers)', () => {
      for (let i = 1; i <= 5; i++) {
        expect(meetsThreshold(i, 5)).toBe(true);
      }
    });

    it('should handle threshold of 0 on 5-star (only 0 triggers, unusual)', () => {
      expect(meetsThreshold(0, 0)).toBe(true);
      expect(meetsThreshold(1, 0)).toBe(false);
    });
  });

  describe('Null and Undefined Guards', () => {
    // Replicates the null-check behavior in the shouldFollowUp expression
    const ratingPassesThreshold = (
      ratingThreshold: number | undefined | null,
      rating: number | undefined | null
    ): boolean => {
      return ratingThreshold != null && rating != null && rating <= ratingThreshold;
    };

    const votePassesCheck = (
      onNegativeVote: boolean | undefined,
      vote: 'up' | 'down' | null | undefined
    ): boolean => {
      return !!onNegativeVote && vote === 'down';
    };

    it('ratingThreshold undefined skips rating check', () => {
      expect(ratingPassesThreshold(undefined, 1)).toBe(false);
    });

    it('ratingThreshold null skips rating check', () => {
      expect(ratingPassesThreshold(null, 1)).toBe(false);
    });

    it('rating undefined skips rating check', () => {
      expect(ratingPassesThreshold(3, undefined)).toBe(false);
    });

    it('rating null skips rating check', () => {
      expect(ratingPassesThreshold(3, null)).toBe(false);
    });

    it('both defined and passing returns true', () => {
      expect(ratingPassesThreshold(3, 2)).toBe(true);
    });

    it('both defined but not passing returns false', () => {
      expect(ratingPassesThreshold(2, 4)).toBe(false);
    });

    it('onNegativeVote undefined with down vote returns false', () => {
      expect(votePassesCheck(undefined, 'down')).toBe(false);
    });

    it('onNegativeVote false with down vote returns false', () => {
      expect(votePassesCheck(false, 'down')).toBe(false);
    });

    it('onNegativeVote true with up vote returns false', () => {
      expect(votePassesCheck(true, 'up')).toBe(false);
    });

    it('onNegativeVote true with null vote returns false', () => {
      expect(votePassesCheck(true, null)).toBe(false);
    });

    it('onNegativeVote true with undefined vote returns false', () => {
      expect(votePassesCheck(true, undefined)).toBe(false);
    });

    it('onNegativeVote true with down vote returns true', () => {
      expect(votePassesCheck(true, 'down')).toBe(true);
    });
  });
});
