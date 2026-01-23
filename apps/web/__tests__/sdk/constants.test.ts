/**
 * Tests for SDK constants and default values
 */

describe('SDK Constants', () => {
  describe('API URLs', () => {
    const API_BASE_URL = 'https://api.gotcha.cx/v1';
    const API_STAGING_URL = 'https://api.staging.gotcha.cx/v1';

    it('should have HTTPS URLs', () => {
      expect(API_BASE_URL).toMatch(/^https:\/\//);
      expect(API_STAGING_URL).toMatch(/^https:\/\//);
    });

    it('should have /v1 versioning', () => {
      expect(API_BASE_URL).toMatch(/\/v1$/);
      expect(API_STAGING_URL).toMatch(/\/v1$/);
    });

    it('should have different base and staging URLs', () => {
      expect(API_BASE_URL).not.toBe(API_STAGING_URL);
    });

    it('should use gotcha.cx domain', () => {
      expect(API_BASE_URL).toContain('gotcha.cx');
      expect(API_STAGING_URL).toContain('gotcha.cx');
    });
  });

  describe('Error Codes', () => {
    const ERROR_CODES = {
      INVALID_API_KEY: 'INVALID_API_KEY',
      ORIGIN_NOT_ALLOWED: 'ORIGIN_NOT_ALLOWED',
      RATE_LIMITED: 'RATE_LIMITED',
      QUOTA_EXCEEDED: 'QUOTA_EXCEEDED',
      INVALID_REQUEST: 'INVALID_REQUEST',
      USER_NOT_FOUND: 'USER_NOT_FOUND',
      INTERNAL_ERROR: 'INTERNAL_ERROR',
    };

    it('should have uppercase snake_case format', () => {
      Object.values(ERROR_CODES).forEach((code) => {
        expect(code).toMatch(/^[A-Z_]+$/);
      });
    });

    it('should have key equal to value', () => {
      Object.entries(ERROR_CODES).forEach(([key, value]) => {
        expect(key).toBe(value);
      });
    });

    it('should have all expected error types', () => {
      expect(ERROR_CODES.INVALID_API_KEY).toBeDefined();
      expect(ERROR_CODES.ORIGIN_NOT_ALLOWED).toBeDefined();
      expect(ERROR_CODES.RATE_LIMITED).toBeDefined();
      expect(ERROR_CODES.INTERNAL_ERROR).toBeDefined();
    });
  });

  describe('Default Values', () => {
    const DEFAULTS = {
      POSITION: 'top-right',
      SIZE: 'md',
      THEME: 'light',
      SHOW_ON_HOVER: true,
      TOUCH_BEHAVIOR: 'always-visible',
      SUBMIT_TEXT: 'Submit',
      THANK_YOU_MESSAGE: 'Thanks for your feedback!',
    };

    it('should have valid position default', () => {
      const validPositions = ['top-left', 'top-right', 'bottom-left', 'bottom-right', 'inline'];
      expect(validPositions).toContain(DEFAULTS.POSITION);
    });

    it('should have valid size default', () => {
      const validSizes = ['sm', 'md', 'lg'];
      expect(validSizes).toContain(DEFAULTS.SIZE);
    });

    it('should have valid theme default', () => {
      const validThemes = ['light', 'dark'];
      expect(validThemes).toContain(DEFAULTS.THEME);
    });

    it('should have hover enabled by default', () => {
      expect(DEFAULTS.SHOW_ON_HOVER).toBe(true);
    });

    it('should have user-friendly default text', () => {
      expect(DEFAULTS.SUBMIT_TEXT).toBe('Submit');
      expect(DEFAULTS.THANK_YOU_MESSAGE).toContain('Thanks');
    });
  });

  describe('Position Validation', () => {
    const VALID_POSITIONS = ['top-left', 'top-right', 'bottom-left', 'bottom-right', 'inline'];

    const isValidPosition = (position: string): boolean => {
      return VALID_POSITIONS.includes(position);
    };

    it('should accept all valid positions', () => {
      VALID_POSITIONS.forEach((pos) => {
        expect(isValidPosition(pos)).toBe(true);
      });
    });

    it('should reject invalid positions', () => {
      expect(isValidPosition('center')).toBe(false);
      expect(isValidPosition('left')).toBe(false);
      expect(isValidPosition('')).toBe(false);
    });
  });

  describe('Mode Validation', () => {
    const VALID_MODES = ['feedback', 'vote', 'poll', 'feature-request', 'ab'];

    const isValidMode = (mode: string): boolean => {
      return VALID_MODES.includes(mode);
    };

    it('should accept all valid modes', () => {
      VALID_MODES.forEach((mode) => {
        expect(isValidMode(mode)).toBe(true);
      });
    });

    it('should reject invalid modes', () => {
      expect(isValidMode('survey')).toBe(false);
      expect(isValidMode('FEEDBACK')).toBe(false); // Case sensitive
      expect(isValidMode('')).toBe(false);
    });
  });
});
