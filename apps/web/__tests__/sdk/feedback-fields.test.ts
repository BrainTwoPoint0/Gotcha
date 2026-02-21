/**
 * Tests for configurable feedback fields (showText / showRating)
 */

describe('Feedback Fields Configuration', () => {
  // Simulates the field visibility logic in FeedbackMode
  const getVisibleFields = (showText: boolean = true, showRating: boolean = true) => ({
    showText,
    showRating,
    hasTextarea: showText,
    hasStarRating: showRating,
  });

  describe('Default behavior (both shown)', () => {
    it('should show both text and rating by default', () => {
      const fields = getVisibleFields();
      expect(fields.hasTextarea).toBe(true);
      expect(fields.hasStarRating).toBe(true);
    });

    it('should show both when explicitly set to true', () => {
      const fields = getVisibleFields(true, true);
      expect(fields.hasTextarea).toBe(true);
      expect(fields.hasStarRating).toBe(true);
    });
  });

  describe('Text only (showRating=false)', () => {
    it('should show textarea but not star rating', () => {
      const fields = getVisibleFields(true, false);
      expect(fields.hasTextarea).toBe(true);
      expect(fields.hasStarRating).toBe(false);
    });
  });

  describe('Rating only (showText=false)', () => {
    it('should show star rating but not textarea', () => {
      const fields = getVisibleFields(false, true);
      expect(fields.hasTextarea).toBe(false);
      expect(fields.hasStarRating).toBe(true);
    });
  });

  describe('Submit validation', () => {
    // Simulates the submit validation logic
    const canSubmit = (
      showText: boolean,
      showRating: boolean,
      content: string,
      rating: number | null
    ): boolean => {
      if (showText && showRating) {
        // Either field is enough
        return content.trim().length > 0 || rating !== null;
      }
      if (showText && !showRating) {
        // Text is required
        return content.trim().length > 0;
      }
      if (!showText && showRating) {
        // Rating is required
        return rating !== null;
      }
      return false;
    };

    describe('Both fields shown', () => {
      it('should allow submit with only text', () => {
        expect(canSubmit(true, true, 'Great!', null)).toBe(true);
      });

      it('should allow submit with only rating', () => {
        expect(canSubmit(true, true, '', 5)).toBe(true);
      });

      it('should allow submit with both', () => {
        expect(canSubmit(true, true, 'Great!', 5)).toBe(true);
      });

      it('should reject submit with neither', () => {
        expect(canSubmit(true, true, '', null)).toBe(false);
      });

      it('should reject whitespace-only text without rating', () => {
        expect(canSubmit(true, true, '   ', null)).toBe(false);
      });
    });

    describe('Text only mode', () => {
      it('should allow submit with text', () => {
        expect(canSubmit(true, false, 'Feedback here', null)).toBe(true);
      });

      it('should reject empty text', () => {
        expect(canSubmit(true, false, '', null)).toBe(false);
      });

      it('should reject whitespace-only text', () => {
        expect(canSubmit(true, false, '   ', null)).toBe(false);
      });
    });

    describe('Rating only mode', () => {
      it('should allow submit with rating', () => {
        expect(canSubmit(false, true, '', 4)).toBe(true);
      });

      it('should reject without rating', () => {
        expect(canSubmit(false, true, '', null)).toBe(false);
      });
    });
  });

  describe('Submit payload', () => {
    // Simulates the payload construction
    const buildPayload = (
      showText: boolean,
      showRating: boolean,
      content: string,
      rating: number | null
    ) => ({
      content: showText && content.trim() ? content.trim() : undefined,
      rating: showRating && rating !== null ? rating : undefined,
    });

    it('should include both fields when both shown', () => {
      const payload = buildPayload(true, true, 'Great!', 5);
      expect(payload.content).toBe('Great!');
      expect(payload.rating).toBe(5);
    });

    it('should exclude rating when showRating=false', () => {
      const payload = buildPayload(true, false, 'Text only', null);
      expect(payload.content).toBe('Text only');
      expect(payload.rating).toBeUndefined();
    });

    it('should exclude text when showText=false', () => {
      const payload = buildPayload(false, true, '', 3);
      expect(payload.content).toBeUndefined();
      expect(payload.rating).toBe(3);
    });

    it('should trim whitespace from content', () => {
      const payload = buildPayload(true, true, '  hello  ', 4);
      expect(payload.content).toBe('hello');
    });
  });

  describe('Prop defaults', () => {
    // Simulates how Gotcha component applies defaults
    const resolveProps = (props: { showText?: boolean; showRating?: boolean }) => ({
      showText: props.showText ?? true,
      showRating: props.showRating ?? true,
    });

    it('should default both to true when not provided', () => {
      const resolved = resolveProps({});
      expect(resolved.showText).toBe(true);
      expect(resolved.showRating).toBe(true);
    });

    it('should respect explicit false for showText', () => {
      const resolved = resolveProps({ showText: false });
      expect(resolved.showText).toBe(false);
      expect(resolved.showRating).toBe(true);
    });

    it('should respect explicit false for showRating', () => {
      const resolved = resolveProps({ showRating: false });
      expect(resolved.showText).toBe(true);
      expect(resolved.showRating).toBe(false);
    });

    it('should respect both set explicitly', () => {
      const resolved = resolveProps({ showText: true, showRating: false });
      expect(resolved.showText).toBe(true);
      expect(resolved.showRating).toBe(false);
    });
  });
});
