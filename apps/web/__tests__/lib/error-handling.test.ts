/**
 * Tests for error handling and response formatting
 */

describe('Error Handling', () => {
  describe('API Error Response Formatting', () => {
    interface ApiError {
      error: string;
      code?: string;
      details?: Record<string, string>;
    }

    const formatApiError = (
      message: string,
      code?: string,
      details?: Record<string, string>
    ): ApiError => {
      const error: ApiError = { error: message };
      if (code) error.code = code;
      if (details && Object.keys(details).length > 0) error.details = details;
      return error;
    };

    it('should format basic error', () => {
      const result = formatApiError('Something went wrong');
      expect(result).toEqual({ error: 'Something went wrong' });
    });

    it('should include error code when provided', () => {
      const result = formatApiError('Invalid API key', 'INVALID_API_KEY');
      expect(result).toEqual({
        error: 'Invalid API key',
        code: 'INVALID_API_KEY',
      });
    });

    it('should include details when provided', () => {
      const result = formatApiError('Validation failed', 'VALIDATION_ERROR', {
        email: 'Invalid email format',
        name: 'Name is required',
      });
      expect(result.details).toEqual({
        email: 'Invalid email format',
        name: 'Name is required',
      });
    });

    it('should omit empty details', () => {
      const result = formatApiError('Error', 'CODE', {});
      expect(result.details).toBeUndefined();
    });
  });

  describe('HTTP Status Code Selection', () => {
    const getStatusCode = (errorCode: string): number => {
      const statusMap: Record<string, number> = {
        INVALID_API_KEY: 401,
        ORIGIN_NOT_ALLOWED: 403,
        RATE_LIMITED: 429,
        QUOTA_EXCEEDED: 403,
        INVALID_REQUEST: 400,
        USER_NOT_FOUND: 404,
        PROJECT_NOT_FOUND: 404,
        INTERNAL_ERROR: 500,
        UNAUTHORIZED: 401,
        FORBIDDEN: 403,
        NOT_FOUND: 404,
        CONFLICT: 409,
      };
      return statusMap[errorCode] || 500;
    };

    it('should return 401 for auth errors', () => {
      expect(getStatusCode('INVALID_API_KEY')).toBe(401);
      expect(getStatusCode('UNAUTHORIZED')).toBe(401);
    });

    it('should return 403 for forbidden errors', () => {
      expect(getStatusCode('ORIGIN_NOT_ALLOWED')).toBe(403);
      expect(getStatusCode('QUOTA_EXCEEDED')).toBe(403);
      expect(getStatusCode('FORBIDDEN')).toBe(403);
    });

    it('should return 404 for not found errors', () => {
      expect(getStatusCode('USER_NOT_FOUND')).toBe(404);
      expect(getStatusCode('PROJECT_NOT_FOUND')).toBe(404);
      expect(getStatusCode('NOT_FOUND')).toBe(404);
    });

    it('should return 429 for rate limit errors', () => {
      expect(getStatusCode('RATE_LIMITED')).toBe(429);
    });

    it('should return 400 for validation errors', () => {
      expect(getStatusCode('INVALID_REQUEST')).toBe(400);
    });

    it('should return 500 for unknown errors', () => {
      expect(getStatusCode('UNKNOWN_ERROR')).toBe(500);
      expect(getStatusCode('INTERNAL_ERROR')).toBe(500);
    });
  });

  describe('Error Message Sanitization', () => {
    const sanitizeErrorMessage = (message: string): string => {
      // Remove sensitive information patterns
      const patterns = [
        /password[=:]\s*\S+/gi,
        /api[_-]?key[=:]\s*\S+/gi,
        /token[=:]\s*\S+/gi,
        /secret[=:]\s*\S+/gi,
        /Bearer\s+\S+/gi,
      ];

      let sanitized = message;
      patterns.forEach((pattern) => {
        sanitized = sanitized.replace(pattern, '[REDACTED]');
      });

      return sanitized;
    };

    it('should redact password values', () => {
      expect(sanitizeErrorMessage('Error: password=secret123')).toBe('Error: [REDACTED]');
      expect(sanitizeErrorMessage('password: mypass')).toBe('[REDACTED]');
    });

    it('should redact API keys', () => {
      expect(sanitizeErrorMessage('Invalid api_key=gtch_live_abc')).toBe('Invalid [REDACTED]');
      expect(sanitizeErrorMessage('api-key: xyz')).toBe('[REDACTED]');
    });

    it('should redact tokens', () => {
      expect(sanitizeErrorMessage('token=abc123')).toBe('[REDACTED]');
      expect(sanitizeErrorMessage('Bearer gtch_live_secret')).toBe('[REDACTED]');
    });

    it('should redact secrets', () => {
      expect(sanitizeErrorMessage('secret=mysecret')).toBe('[REDACTED]');
    });

    it('should preserve non-sensitive messages', () => {
      expect(sanitizeErrorMessage('User not found')).toBe('User not found');
      expect(sanitizeErrorMessage('Invalid email format')).toBe('Invalid email format');
    });
  });

  describe('Validation Error Aggregation', () => {
    interface FieldError {
      field: string;
      message: string;
    }

    const aggregateValidationErrors = (errors: FieldError[]): Record<string, string> => {
      return errors.reduce(
        (acc, { field, message }) => {
          // Keep first error for each field
          if (!acc[field]) {
            acc[field] = message;
          }
          return acc;
        },
        {} as Record<string, string>
      );
    };

    it('should aggregate errors by field', () => {
      const errors = [
        { field: 'email', message: 'Required' },
        { field: 'password', message: 'Too short' },
      ];
      expect(aggregateValidationErrors(errors)).toEqual({
        email: 'Required',
        password: 'Too short',
      });
    });

    it('should keep only first error per field', () => {
      const errors = [
        { field: 'email', message: 'Required' },
        { field: 'email', message: 'Invalid format' },
      ];
      expect(aggregateValidationErrors(errors)).toEqual({
        email: 'Required',
      });
    });

    it('should handle empty errors array', () => {
      expect(aggregateValidationErrors([])).toEqual({});
    });
  });

  describe('Error Logging', () => {
    interface LogEntry {
      level: 'error' | 'warn' | 'info';
      message: string;
      context?: Record<string, unknown>;
      timestamp: string;
    }

    const createLogEntry = (
      level: 'error' | 'warn' | 'info',
      message: string,
      context?: Record<string, unknown>
    ): LogEntry => {
      return {
        level,
        message,
        context,
        timestamp: new Date().toISOString(),
      };
    };

    it('should create error log entry', () => {
      const entry = createLogEntry('error', 'Database connection failed', {
        host: 'localhost',
        port: 5432,
      });
      expect(entry.level).toBe('error');
      expect(entry.message).toBe('Database connection failed');
      expect(entry.context).toEqual({ host: 'localhost', port: 5432 });
      expect(entry.timestamp).toBeDefined();
    });

    it('should create log entry without context', () => {
      const entry = createLogEntry('info', 'Server started');
      expect(entry.context).toBeUndefined();
    });

    it('should include ISO timestamp', () => {
      const entry = createLogEntry('warn', 'High memory usage');
      expect(entry.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });
  });

  describe('Rate Limit Error Headers', () => {
    interface RateLimitInfo {
      limit: number;
      remaining: number;
      reset: number;
    }

    const formatRateLimitHeaders = (info: RateLimitInfo): Record<string, string> => {
      return {
        'X-RateLimit-Limit': info.limit.toString(),
        'X-RateLimit-Remaining': info.remaining.toString(),
        'X-RateLimit-Reset': info.reset.toString(),
        'Retry-After': Math.max(0, info.reset - Math.floor(Date.now() / 1000)).toString(),
      };
    };

    it('should format rate limit headers', () => {
      const futureReset = Math.floor(Date.now() / 1000) + 60;
      const headers = formatRateLimitHeaders({
        limit: 100,
        remaining: 0,
        reset: futureReset,
      });

      expect(headers['X-RateLimit-Limit']).toBe('100');
      expect(headers['X-RateLimit-Remaining']).toBe('0');
      expect(headers['X-RateLimit-Reset']).toBe(futureReset.toString());
      expect(parseInt(headers['Retry-After'])).toBeGreaterThan(0);
    });

    it('should handle past reset time', () => {
      const pastReset = Math.floor(Date.now() / 1000) - 60;
      const headers = formatRateLimitHeaders({
        limit: 100,
        remaining: 50,
        reset: pastReset,
      });

      expect(headers['Retry-After']).toBe('0');
    });
  });

  describe('Try-Catch Error Extraction', () => {
    const extractErrorMessage = (error: unknown): string => {
      if (error instanceof Error) {
        return error.message;
      }
      if (typeof error === 'string') {
        return error;
      }
      if (typeof error === 'object' && error !== null && 'message' in error) {
        return String((error as { message: unknown }).message);
      }
      return 'An unexpected error occurred';
    };

    it('should extract message from Error instance', () => {
      expect(extractErrorMessage(new Error('Test error'))).toBe('Test error');
    });

    it('should use string error directly', () => {
      expect(extractErrorMessage('String error')).toBe('String error');
    });

    it('should extract message from error-like object', () => {
      expect(extractErrorMessage({ message: 'Object error' })).toBe('Object error');
    });

    it('should return default for unknown error types', () => {
      expect(extractErrorMessage(null)).toBe('An unexpected error occurred');
      expect(extractErrorMessage(undefined)).toBe('An unexpected error occurred');
      expect(extractErrorMessage(123)).toBe('An unexpected error occurred');
    });
  });

  describe('User-Friendly Error Messages', () => {
    const getUserFriendlyMessage = (errorCode: string): string => {
      const messages: Record<string, string> = {
        INVALID_API_KEY: 'Your API key is invalid. Please check your credentials.',
        ORIGIN_NOT_ALLOWED: 'This domain is not authorized to use this API key.',
        RATE_LIMITED: 'Too many requests. Please try again later.',
        QUOTA_EXCEEDED: "You've reached your plan's response limit. Please upgrade.",
        INVALID_REQUEST: 'The request was invalid. Please check your input.',
        USER_NOT_FOUND: 'User not found.',
        INTERNAL_ERROR: 'Something went wrong. Please try again later.',
      };
      return messages[errorCode] || 'An error occurred. Please try again.';
    };

    it('should return friendly message for known codes', () => {
      expect(getUserFriendlyMessage('INVALID_API_KEY')).toContain('invalid');
      expect(getUserFriendlyMessage('RATE_LIMITED')).toContain('Too many requests');
      expect(getUserFriendlyMessage('QUOTA_EXCEEDED')).toContain('limit');
    });

    it('should return generic message for unknown codes', () => {
      expect(getUserFriendlyMessage('UNKNOWN')).toBe('An error occurred. Please try again.');
    });
  });
});
