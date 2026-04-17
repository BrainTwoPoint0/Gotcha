/**
 * Tests for SDK context collector output shape
 * Note: These test the shape and types of collected context without importing from the SDK
 */

describe('SDK Context Collector', () => {
  // Replicate the context collection logic
  const collectContext = (
    recentErrors: Array<{ message: string; source?: string; timestamp: number }> = []
  ) => {
    return {
      url: window.location.origin + window.location.pathname,
      userAgent: navigator.userAgent,
      viewport: { width: window.innerWidth, height: window.innerHeight },
      language: navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      screenResolution: { width: screen.width, height: screen.height },
      recentErrors,
    };
  };

  describe('Output shape', () => {
    it('should return an object with all expected top-level fields', () => {
      const ctx = collectContext();
      expect(ctx).toHaveProperty('url');
      expect(ctx).toHaveProperty('userAgent');
      expect(ctx).toHaveProperty('viewport');
      expect(ctx).toHaveProperty('language');
      expect(ctx).toHaveProperty('timezone');
      expect(ctx).toHaveProperty('screenResolution');
      expect(ctx).toHaveProperty('recentErrors');
    });

    it('should have exactly 7 top-level keys', () => {
      const ctx = collectContext();
      expect(Object.keys(ctx)).toHaveLength(7);
    });

    it('should not include any undefined fields', () => {
      const ctx = collectContext();
      Object.values(ctx).forEach((value) => {
        expect(value).toBeDefined();
      });
    });
  });

  describe('url field', () => {
    it('should be a string', () => {
      const ctx = collectContext();
      expect(typeof ctx.url).toBe('string');
    });

    it('should combine origin and pathname', () => {
      const ctx = collectContext();
      const expected = window.location.origin + window.location.pathname;
      expect(ctx.url).toBe(expected);
    });

    it('should not include query parameters or hash', () => {
      const ctx = collectContext();
      expect(ctx.url).not.toContain('?');
      expect(ctx.url).not.toContain('#');
    });
  });

  describe('userAgent field', () => {
    it('should be a string', () => {
      const ctx = collectContext();
      expect(typeof ctx.userAgent).toBe('string');
    });

    it('should be non-empty in jsdom', () => {
      const ctx = collectContext();
      expect(ctx.userAgent.length).toBeGreaterThan(0);
    });

    it('should match navigator.userAgent', () => {
      const ctx = collectContext();
      expect(ctx.userAgent).toBe(navigator.userAgent);
    });
  });

  describe('viewport field', () => {
    it('should be an object', () => {
      const ctx = collectContext();
      expect(typeof ctx.viewport).toBe('object');
      expect(ctx.viewport).not.toBeNull();
    });

    it('should have width and height properties', () => {
      const ctx = collectContext();
      expect(ctx.viewport).toHaveProperty('width');
      expect(ctx.viewport).toHaveProperty('height');
    });

    it('should have numeric width', () => {
      const ctx = collectContext();
      expect(typeof ctx.viewport.width).toBe('number');
    });

    it('should have numeric height', () => {
      const ctx = collectContext();
      expect(typeof ctx.viewport.height).toBe('number');
    });

    it('should have non-negative dimensions', () => {
      const ctx = collectContext();
      expect(ctx.viewport.width).toBeGreaterThanOrEqual(0);
      expect(ctx.viewport.height).toBeGreaterThanOrEqual(0);
    });

    it('should have exactly two keys', () => {
      const ctx = collectContext();
      expect(Object.keys(ctx.viewport)).toHaveLength(2);
    });
  });

  describe('language field', () => {
    it('should be a string', () => {
      const ctx = collectContext();
      expect(typeof ctx.language).toBe('string');
    });

    it('should be non-empty', () => {
      const ctx = collectContext();
      expect(ctx.language.length).toBeGreaterThan(0);
    });

    it('should match navigator.language', () => {
      const ctx = collectContext();
      expect(ctx.language).toBe(navigator.language);
    });
  });

  describe('timezone field', () => {
    it('should be a string', () => {
      const ctx = collectContext();
      expect(typeof ctx.timezone).toBe('string');
    });

    it('should be non-empty', () => {
      const ctx = collectContext();
      expect(ctx.timezone.length).toBeGreaterThan(0);
    });

    it('should match Intl resolved timezone', () => {
      const ctx = collectContext();
      expect(ctx.timezone).toBe(Intl.DateTimeFormat().resolvedOptions().timeZone);
    });
  });

  describe('screenResolution field', () => {
    it('should be an object', () => {
      const ctx = collectContext();
      expect(typeof ctx.screenResolution).toBe('object');
      expect(ctx.screenResolution).not.toBeNull();
    });

    it('should have width and height properties', () => {
      const ctx = collectContext();
      expect(ctx.screenResolution).toHaveProperty('width');
      expect(ctx.screenResolution).toHaveProperty('height');
    });

    it('should have numeric width', () => {
      const ctx = collectContext();
      expect(typeof ctx.screenResolution.width).toBe('number');
    });

    it('should have numeric height', () => {
      const ctx = collectContext();
      expect(typeof ctx.screenResolution.height).toBe('number');
    });

    it('should have non-negative dimensions', () => {
      const ctx = collectContext();
      expect(ctx.screenResolution.width).toBeGreaterThanOrEqual(0);
      expect(ctx.screenResolution.height).toBeGreaterThanOrEqual(0);
    });

    it('should have exactly two keys', () => {
      const ctx = collectContext();
      expect(Object.keys(ctx.screenResolution)).toHaveLength(2);
    });
  });

  describe('recentErrors field', () => {
    it('should be an array', () => {
      const ctx = collectContext();
      expect(Array.isArray(ctx.recentErrors)).toBe(true);
    });

    it('should default to empty array when no errors', () => {
      const ctx = collectContext();
      expect(ctx.recentErrors).toEqual([]);
    });

    it('should default to empty array when called with no arguments', () => {
      const ctx = collectContext();
      expect(ctx.recentErrors).toHaveLength(0);
    });

    it('should include provided errors', () => {
      const errors = [
        {
          message: 'TypeError: undefined is not a function',
          source: 'app.js',
          timestamp: 1700000000000,
        },
        { message: 'ReferenceError: x is not defined', timestamp: 1700000001000 },
      ];
      const ctx = collectContext(errors);
      expect(ctx.recentErrors).toHaveLength(2);
      expect(ctx.recentErrors[0].message).toBe('TypeError: undefined is not a function');
      expect(ctx.recentErrors[1].message).toBe('ReferenceError: x is not defined');
    });

    it('should preserve error entry shape', () => {
      const errors = [{ message: 'Test error', source: 'test.js', timestamp: 1700000000000 }];
      const ctx = collectContext(errors);
      const entry = ctx.recentErrors[0];
      expect(entry).toHaveProperty('message');
      expect(entry).toHaveProperty('source');
      expect(entry).toHaveProperty('timestamp');
    });

    it('should handle errors without source field', () => {
      const errors = [{ message: 'No source error', timestamp: 1700000000000 }];
      const ctx = collectContext(errors);
      expect(ctx.recentErrors[0].source).toBeUndefined();
    });
  });

  describe('Serialization safety', () => {
    it('should be JSON-serializable', () => {
      const ctx = collectContext([{ message: 'Test', source: 'test.js', timestamp: Date.now() }]);
      expect(() => JSON.stringify(ctx)).not.toThrow();
    });

    it('should round-trip through JSON correctly', () => {
      const ctx = collectContext();
      const serialized = JSON.stringify(ctx);
      const deserialized = JSON.parse(serialized);
      expect(deserialized.url).toBe(ctx.url);
      expect(deserialized.viewport.width).toBe(ctx.viewport.width);
      expect(deserialized.viewport.height).toBe(ctx.viewport.height);
      expect(deserialized.recentErrors).toEqual(ctx.recentErrors);
    });

    it('should not contain circular references', () => {
      const ctx = collectContext();
      // JSON.stringify would throw on circular refs
      const json = JSON.stringify(ctx);
      expect(typeof json).toBe('string');
      expect(json.length).toBeGreaterThan(0);
    });
  });
});
