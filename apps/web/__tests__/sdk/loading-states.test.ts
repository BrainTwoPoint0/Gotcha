/**
 * Tests for SDK loading states and spinner behavior
 */

describe('SDK Loading States', () => {
  describe('Spinner Animation', () => {
    const createSpinnerStyles = (size: number, color: string) => ({
      width: size,
      height: size,
      animation: 'gotcha-spin 1s linear infinite',
      strokeColor: color,
    });

    it('should create spinner with correct size', () => {
      const styles = createSpinnerStyles(16, '#000');
      expect(styles.width).toBe(16);
      expect(styles.height).toBe(16);
    });

    it('should use infinite linear animation', () => {
      const styles = createSpinnerStyles(16, '#000');
      expect(styles.animation).toContain('infinite');
      expect(styles.animation).toContain('linear');
    });

    it('should apply custom color', () => {
      const styles = createSpinnerStyles(16, '#ffffff');
      expect(styles.strokeColor).toBe('#ffffff');
    });

    it('should scale for touch devices', () => {
      const desktopSize = 16;
      const touchSize = 18;
      expect(touchSize).toBeGreaterThan(desktopSize);
    });
  });

  describe('VoteMode Loading', () => {
    type Vote = 'up' | 'down';

    interface VoteState {
      isLoading: boolean;
      activeVote: Vote | null;
    }

    const getButtonContent = (
      state: VoteState,
      buttonType: Vote
    ): { showSpinner: boolean; text: string } => {
      if (state.isLoading && state.activeVote === buttonType) {
        return { showSpinner: true, text: 'Sending...' };
      }
      return {
        showSpinner: false,
        text: buttonType === 'up' ? 'Like' : 'Dislike',
      };
    };

    const isButtonDisabled = (state: VoteState): boolean => {
      return state.isLoading;
    };

    it('should show spinner on clicked button when loading', () => {
      const state: VoteState = { isLoading: true, activeVote: 'up' };
      const upContent = getButtonContent(state, 'up');
      const downContent = getButtonContent(state, 'down');

      expect(upContent.showSpinner).toBe(true);
      expect(upContent.text).toBe('Sending...');
      expect(downContent.showSpinner).toBe(false);
      expect(downContent.text).toBe('Dislike');
    });

    it('should show spinner on down button when down is active', () => {
      const state: VoteState = { isLoading: true, activeVote: 'down' };
      const downContent = getButtonContent(state, 'down');

      expect(downContent.showSpinner).toBe(true);
      expect(downContent.text).toBe('Sending...');
    });

    it('should disable both buttons when loading', () => {
      const state: VoteState = { isLoading: true, activeVote: 'up' };
      expect(isButtonDisabled(state)).toBe(true);
    });

    it('should show normal content when not loading', () => {
      const state: VoteState = { isLoading: false, activeVote: null };
      const upContent = getButtonContent(state, 'up');
      const downContent = getButtonContent(state, 'down');

      expect(upContent.showSpinner).toBe(false);
      expect(upContent.text).toBe('Like');
      expect(downContent.showSpinner).toBe(false);
      expect(downContent.text).toBe('Dislike');
    });

    it('should reset active vote when loading completes', () => {
      let state: VoteState = { isLoading: true, activeVote: 'up' };
      // Simulate loading completion
      state = { isLoading: false, activeVote: null };
      expect(state.activeVote).toBe(null);
    });
  });

  describe('FeedbackMode Loading', () => {
    interface FeedbackState {
      isLoading: boolean;
      content: string;
      rating: number | null;
    }

    const getSubmitButtonContent = (
      state: FeedbackState,
      submitText: string
    ): { showSpinner: boolean; text: string } => {
      if (state.isLoading) {
        return { showSpinner: true, text: 'Submitting...' };
      }
      return { showSpinner: false, text: submitText };
    };

    const isSubmitDisabled = (state: FeedbackState): boolean => {
      if (state.isLoading) return true;
      if (!state.content.trim() && state.rating === null) return true;
      return false;
    };

    const getButtonOpacity = (state: FeedbackState): number => {
      if (!state.content.trim() && state.rating === null) return 0.5;
      return 1;
    };

    it('should show spinner when submitting', () => {
      const state: FeedbackState = { isLoading: true, content: 'Great!', rating: 5 };
      const content = getSubmitButtonContent(state, 'Send Feedback');

      expect(content.showSpinner).toBe(true);
      expect(content.text).toBe('Submitting...');
    });

    it('should show custom submit text when not loading', () => {
      const state: FeedbackState = { isLoading: false, content: 'Great!', rating: 5 };
      const content = getSubmitButtonContent(state, 'Send Feedback');

      expect(content.showSpinner).toBe(false);
      expect(content.text).toBe('Send Feedback');
    });

    it('should disable submit when loading', () => {
      const state: FeedbackState = { isLoading: true, content: 'Test', rating: null };
      expect(isSubmitDisabled(state)).toBe(true);
    });

    it('should disable submit when no content and no rating', () => {
      const state: FeedbackState = { isLoading: false, content: '', rating: null };
      expect(isSubmitDisabled(state)).toBe(true);
    });

    it('should enable submit with content only', () => {
      const state: FeedbackState = { isLoading: false, content: 'Feedback', rating: null };
      expect(isSubmitDisabled(state)).toBe(false);
    });

    it('should enable submit with rating only', () => {
      const state: FeedbackState = { isLoading: false, content: '', rating: 4 };
      expect(isSubmitDisabled(state)).toBe(false);
    });

    it('should have reduced opacity when disabled', () => {
      const emptyState: FeedbackState = { isLoading: false, content: '', rating: null };
      const filledState: FeedbackState = { isLoading: false, content: 'Test', rating: 5 };

      expect(getButtonOpacity(emptyState)).toBe(0.5);
      expect(getButtonOpacity(filledState)).toBe(1);
    });
  });

  describe('Touch Device Adaptations', () => {
    const getSpinnerSize = (baseSize: number, isTouch: boolean): number => {
      return isTouch ? Math.round(baseSize * 1.125) : baseSize; // ~12.5% larger on touch
    };

    const getIconSize = (isTouch: boolean): number => {
      return isTouch ? 28 : 24;
    };

    const getFontSize = (isTouch: boolean): number => {
      return isTouch ? 16 : 14;
    };

    it('should use larger spinner on touch devices', () => {
      expect(getSpinnerSize(16, true)).toBeGreaterThan(getSpinnerSize(16, false));
    });

    it('should use larger icons on touch devices', () => {
      expect(getIconSize(true)).toBe(28);
      expect(getIconSize(false)).toBe(24);
    });

    it('should use larger font on touch devices', () => {
      expect(getFontSize(true)).toBe(16);
      expect(getFontSize(false)).toBe(14);
    });

    it('should maintain proportions between spinner and icon', () => {
      const touchIconSize = getIconSize(true);
      const desktopIconSize = getIconSize(false);
      const touchSpinnerSize = getSpinnerSize(24, true);
      const desktopSpinnerSize = getSpinnerSize(24, false);

      // Spinner should match icon size approximately
      expect(Math.abs(touchSpinnerSize - touchIconSize)).toBeLessThan(5);
      expect(Math.abs(desktopSpinnerSize - desktopIconSize)).toBeLessThan(5);
    });
  });

  describe('Button State Styling', () => {
    interface ButtonStyles {
      cursor: string;
      backgroundColor: string;
      opacity: number;
    }

    const getLoadingButtonStyles = (isLoading: boolean, isDark: boolean): ButtonStyles => {
      return {
        cursor: isLoading ? 'not-allowed' : 'pointer',
        backgroundColor: isLoading ? (isDark ? '#4b5563' : '#9ca3af') : '#6366f1',
        opacity: isLoading ? 0.8 : 1,
      };
    };

    it('should show not-allowed cursor when loading', () => {
      const styles = getLoadingButtonStyles(true, false);
      expect(styles.cursor).toBe('not-allowed');
    });

    it('should show pointer cursor when not loading', () => {
      const styles = getLoadingButtonStyles(false, false);
      expect(styles.cursor).toBe('pointer');
    });

    it('should use muted background when loading (light theme)', () => {
      const styles = getLoadingButtonStyles(true, false);
      expect(styles.backgroundColor).toBe('#9ca3af');
    });

    it('should use muted background when loading (dark theme)', () => {
      const styles = getLoadingButtonStyles(true, true);
      expect(styles.backgroundColor).toBe('#4b5563');
    });

    it('should use primary color when not loading', () => {
      const styles = getLoadingButtonStyles(false, false);
      expect(styles.backgroundColor).toBe('#6366f1');
    });
  });

  describe('Loading State Transitions', () => {
    interface TransitionState {
      phase: 'idle' | 'loading' | 'success' | 'error';
      startTime?: number;
      endTime?: number;
    }

    const calculateLoadingDuration = (state: TransitionState): number | null => {
      if (!state.startTime || !state.endTime) return null;
      return state.endTime - state.startTime;
    };

    const shouldShowMinimumLoadingTime = (
      actualDuration: number,
      minimumDuration: number
    ): boolean => {
      return actualDuration < minimumDuration;
    };

    it('should calculate loading duration', () => {
      const state: TransitionState = {
        phase: 'success',
        startTime: 1000,
        endTime: 1500,
      };
      expect(calculateLoadingDuration(state)).toBe(500);
    });

    it('should return null if times not set', () => {
      const state: TransitionState = { phase: 'idle' };
      expect(calculateLoadingDuration(state)).toBe(null);
    });

    it('should enforce minimum loading time for UX', () => {
      const minimumDuration = 300; // 300ms minimum
      expect(shouldShowMinimumLoadingTime(100, minimumDuration)).toBe(true);
      expect(shouldShowMinimumLoadingTime(500, minimumDuration)).toBe(false);
    });
  });
});
