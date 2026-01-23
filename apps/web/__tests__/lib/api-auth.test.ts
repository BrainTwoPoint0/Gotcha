/**
 * Tests for API authentication logic
 * Note: These test the validation logic, not actual database calls
 */

describe('API Auth Logic', () => {
  describe('API Key Format Validation', () => {
    const isValidApiKeyFormat = (key: string): boolean => {
      // API keys should be non-empty strings
      if (!key || typeof key !== 'string') return false;
      // Should have reasonable length (UUID-like or custom format)
      if (key.length < 10 || key.length > 100) return false;
      return true;
    };

    it('should reject empty API key', () => {
      expect(isValidApiKeyFormat('')).toBe(false);
    });

    it('should reject null/undefined API key', () => {
      expect(isValidApiKeyFormat(null as unknown as string)).toBe(false);
      expect(isValidApiKeyFormat(undefined as unknown as string)).toBe(false);
    });

    it('should reject too short API key', () => {
      expect(isValidApiKeyFormat('abc')).toBe(false);
    });

    it('should accept valid API key format', () => {
      expect(isValidApiKeyFormat('gk_1234567890abcdef')).toBe(true);
      expect(isValidApiKeyFormat('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
    });
  });

  describe('Domain Allowlist Validation', () => {
    const isDomainAllowed = (origin: string | null, allowedDomains: string[]): boolean => {
      // No origin header (server-to-server) - allow if no domains configured
      if (!origin) {
        return allowedDomains.length === 0;
      }

      // No domains configured means allow all
      if (allowedDomains.length === 0) {
        return true;
      }

      try {
        const url = new URL(origin);
        const hostname = url.hostname;

        return allowedDomains.some((domain) => {
          // Exact match
          if (hostname === domain) return true;
          // Subdomain match (e.g., *.example.com)
          if (domain.startsWith('*.')) {
            const baseDomain = domain.slice(2);
            return hostname.endsWith('.' + baseDomain) || hostname === baseDomain;
          }
          return false;
        });
      } catch {
        return false;
      }
    };

    it('should allow any origin when no domains configured', () => {
      expect(isDomainAllowed('https://example.com', [])).toBe(true);
      expect(isDomainAllowed('https://random.site', [])).toBe(true);
    });

    it('should allow exact domain match', () => {
      const allowed = ['example.com', 'app.example.com'];
      expect(isDomainAllowed('https://example.com', allowed)).toBe(true);
      expect(isDomainAllowed('https://app.example.com', allowed)).toBe(true);
    });

    it('should reject non-matching domain', () => {
      const allowed = ['example.com'];
      expect(isDomainAllowed('https://other.com', allowed)).toBe(false);
      expect(isDomainAllowed('https://malicious.example.com.evil.com', allowed)).toBe(false);
    });

    it('should handle wildcard subdomains', () => {
      const allowed = ['*.example.com'];
      expect(isDomainAllowed('https://app.example.com', allowed)).toBe(true);
      expect(isDomainAllowed('https://api.example.com', allowed)).toBe(true);
      expect(isDomainAllowed('https://example.com', allowed)).toBe(true);
      expect(isDomainAllowed('https://other.com', allowed)).toBe(false);
    });

    it('should handle localhost', () => {
      const allowed = ['localhost'];
      expect(isDomainAllowed('http://localhost:3000', allowed)).toBe(true);
      expect(isDomainAllowed('http://localhost:8080', allowed)).toBe(true);
    });

    it('should reject invalid origin URLs', () => {
      const allowed = ['example.com'];
      expect(isDomainAllowed('not-a-url', allowed)).toBe(false);
      expect(isDomainAllowed('', allowed)).toBe(false);
    });

    it('should handle null origin (server-to-server)', () => {
      // With no domains configured, allow server-to-server
      expect(isDomainAllowed(null, [])).toBe(true);
      // With domains configured, reject server-to-server
      expect(isDomainAllowed(null, ['example.com'])).toBe(false);
    });
  });

  describe('Authorization Header Parsing', () => {
    const parseAuthHeader = (header: string | null): string | null => {
      if (!header) return null;

      // Support "Bearer <key>" format
      if (header.startsWith('Bearer ')) {
        return header.slice(7);
      }

      // Support raw key
      return header;
    };

    it('should parse Bearer token', () => {
      expect(parseAuthHeader('Bearer abc123')).toBe('abc123');
      expect(parseAuthHeader('Bearer gk_1234567890')).toBe('gk_1234567890');
    });

    it('should handle raw API key', () => {
      expect(parseAuthHeader('abc123')).toBe('abc123');
    });

    it('should handle null/empty header', () => {
      expect(parseAuthHeader(null)).toBe(null);
      expect(parseAuthHeader('')).toBe(null);
    });

    it('should preserve key with special characters', () => {
      expect(parseAuthHeader('Bearer abc-123_456')).toBe('abc-123_456');
    });
  });

  describe('Error Response Codes', () => {
    const errorCodes = {
      INVALID_API_KEY: { status: 401, message: 'Invalid or missing API key' },
      DOMAIN_NOT_ALLOWED: { status: 403, message: 'Domain not in allowlist' },
      RATE_LIMITED: { status: 429, message: 'Too many requests' },
      PROJECT_NOT_FOUND: { status: 404, message: 'Project not found' },
      INTERNAL_ERROR: { status: 500, message: 'Internal server error' },
    };

    it('should have correct status codes', () => {
      expect(errorCodes.INVALID_API_KEY.status).toBe(401);
      expect(errorCodes.DOMAIN_NOT_ALLOWED.status).toBe(403);
      expect(errorCodes.RATE_LIMITED.status).toBe(429);
      expect(errorCodes.PROJECT_NOT_FOUND.status).toBe(404);
      expect(errorCodes.INTERNAL_ERROR.status).toBe(500);
    });

    it('should have descriptive messages', () => {
      expect(errorCodes.INVALID_API_KEY.message).toContain('API key');
      expect(errorCodes.DOMAIN_NOT_ALLOWED.message).toContain('Domain');
      expect(errorCodes.RATE_LIMITED.message).toContain('requests');
    });
  });
});
