/**
 * Tests for URL and query parameter handling
 */

describe('URL Parameter Handling', () => {
  describe('Pagination Parameters', () => {
    const parsePaginationParams = (
      searchParams: URLSearchParams
    ): { page: number; limit: number } => {
      const rawPage = parseInt(searchParams.get('page') || '1', 10);
      const rawLimit = parseInt(searchParams.get('limit') || '20', 10);
      const page = Math.max(1, isNaN(rawPage) ? 1 : rawPage);
      const limit = Math.min(100, Math.max(1, isNaN(rawLimit) ? 20 : rawLimit));
      return { page, limit };
    };

    it('should return defaults when no params', () => {
      const params = new URLSearchParams();
      const result = parsePaginationParams(params);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
    });

    it('should parse valid page and limit', () => {
      const params = new URLSearchParams('page=3&limit=50');
      const result = parsePaginationParams(params);
      expect(result.page).toBe(3);
      expect(result.limit).toBe(50);
    });

    it('should enforce minimum page of 1', () => {
      const params = new URLSearchParams('page=0');
      expect(parsePaginationParams(params).page).toBe(1);

      const negativeParams = new URLSearchParams('page=-5');
      expect(parsePaginationParams(negativeParams).page).toBe(1);
    });

    it('should enforce maximum limit of 100', () => {
      const params = new URLSearchParams('limit=500');
      expect(parsePaginationParams(params).limit).toBe(100);
    });

    it('should enforce minimum limit of 1', () => {
      const params = new URLSearchParams('limit=0');
      expect(parsePaginationParams(params).limit).toBe(1);
    });

    it('should handle non-numeric values gracefully', () => {
      const params = new URLSearchParams('page=abc&limit=xyz');
      const result = parsePaginationParams(params);
      expect(result.page).toBe(1); // Falls back to default
      expect(result.limit).toBe(20); // Falls back to default
    });
  });

  describe('Date Range Parameters', () => {
    const parseDateParams = (
      searchParams: URLSearchParams
    ): { startDate: Date | null; endDate: Date | null } => {
      const startStr = searchParams.get('startDate');
      const endStr = searchParams.get('endDate');

      const startDate = startStr ? new Date(startStr) : null;
      const endDate = endStr ? new Date(`${endStr}T23:59:59.999Z`) : null;

      // Validate dates
      if (startDate && isNaN(startDate.getTime())) return { startDate: null, endDate: null };
      if (endDate && isNaN(endDate.getTime())) return { startDate: null, endDate: null };

      return { startDate, endDate };
    };

    it('should return nulls when no date params', () => {
      const params = new URLSearchParams();
      const result = parseDateParams(params);
      expect(result.startDate).toBe(null);
      expect(result.endDate).toBe(null);
    });

    it('should parse valid date strings', () => {
      const params = new URLSearchParams('startDate=2024-01-01&endDate=2024-01-31');
      const result = parseDateParams(params);
      expect(result.startDate?.toISOString().split('T')[0]).toBe('2024-01-01');
      expect(result.endDate).not.toBe(null);
    });

    it('should set end date to end of day', () => {
      const params = new URLSearchParams('endDate=2024-01-15');
      const result = parseDateParams(params);
      expect(result.endDate?.getUTCHours()).toBe(23);
      expect(result.endDate?.getUTCMinutes()).toBe(59);
    });

    it('should return nulls for invalid date strings', () => {
      const params = new URLSearchParams('startDate=invalid');
      const result = parseDateParams(params);
      expect(result.startDate).toBe(null);
    });

    it('should handle partial date params', () => {
      const params = new URLSearchParams('startDate=2024-01-01');
      const result = parseDateParams(params);
      expect(result.startDate).not.toBe(null);
      expect(result.endDate).toBe(null);
    });
  });

  describe('Filter Parameter Serialization', () => {
    interface Filters {
      startDate?: string;
      endDate?: string;
      projectId?: string;
      page?: number;
    }

    const serializeFilters = (filters: Filters): string => {
      const params = new URLSearchParams();
      if (filters.startDate) params.set('startDate', filters.startDate);
      if (filters.endDate) params.set('endDate', filters.endDate);
      if (filters.projectId) params.set('projectId', filters.projectId);
      if (filters.page && filters.page > 1) params.set('page', filters.page.toString());
      return params.toString();
    };

    it('should serialize all filters', () => {
      const result = serializeFilters({
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        projectId: 'proj_123',
        page: 2,
      });
      expect(result).toContain('startDate=2024-01-01');
      expect(result).toContain('endDate=2024-01-31');
      expect(result).toContain('projectId=proj_123');
      expect(result).toContain('page=2');
    });

    it('should omit empty filters', () => {
      const result = serializeFilters({ startDate: '2024-01-01' });
      expect(result).toBe('startDate=2024-01-01');
      expect(result).not.toContain('endDate');
      expect(result).not.toContain('projectId');
    });

    it('should omit page=1', () => {
      const result = serializeFilters({ page: 1 });
      expect(result).toBe('');
    });

    it('should return empty string for no filters', () => {
      expect(serializeFilters({})).toBe('');
    });
  });

  describe('Slug Parsing', () => {
    const parseSlug = (slug: string): { isValid: boolean; normalized: string } => {
      // Slugs must be lowercase alphanumeric with hyphens
      const normalized = slug
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');

      const isValid = normalized.length > 0 && normalized.length <= 50;

      return { isValid, normalized };
    };

    it('should normalize uppercase to lowercase', () => {
      expect(parseSlug('MyProject').normalized).toBe('myproject');
    });

    it('should replace spaces with hyphens', () => {
      expect(parseSlug('my project').normalized).toBe('my-project');
    });

    it('should remove special characters', () => {
      expect(parseSlug('my@project!').normalized).toBe('my-project');
    });

    it('should collapse multiple hyphens', () => {
      expect(parseSlug('my---project').normalized).toBe('my-project');
    });

    it('should trim leading/trailing hyphens', () => {
      expect(parseSlug('-my-project-').normalized).toBe('my-project');
    });

    it('should validate length', () => {
      expect(parseSlug('a'.repeat(51)).isValid).toBe(false);
      expect(parseSlug('valid-slug').isValid).toBe(true);
    });

    it('should reject empty slugs', () => {
      expect(parseSlug('').isValid).toBe(false);
      expect(parseSlug('---').isValid).toBe(false);
    });
  });

  describe('API Key Parameter Extraction', () => {
    const extractApiKey = (request: { headers: Map<string, string> }): string | null => {
      const authHeader = request.headers.get('authorization');
      const apiKeyHeader = request.headers.get('x-api-key');

      // Try Authorization header first
      if (authHeader?.startsWith('Bearer ')) {
        return authHeader.slice(7);
      }

      // Fall back to X-API-Key header
      if (apiKeyHeader) {
        return apiKeyHeader;
      }

      return null;
    };

    it('should extract Bearer token from Authorization header', () => {
      const headers = new Map([['authorization', 'Bearer gtch_live_abc123']]);
      expect(extractApiKey({ headers })).toBe('gtch_live_abc123');
    });

    it('should extract from X-API-Key header', () => {
      const headers = new Map([['x-api-key', 'gtch_live_xyz789']]);
      expect(extractApiKey({ headers })).toBe('gtch_live_xyz789');
    });

    it('should prefer Authorization over X-API-Key', () => {
      const headers = new Map([
        ['authorization', 'Bearer gtch_live_auth'],
        ['x-api-key', 'gtch_live_apikey'],
      ]);
      expect(extractApiKey({ headers })).toBe('gtch_live_auth');
    });

    it('should return null when no API key present', () => {
      const headers = new Map<string, string>();
      expect(extractApiKey({ headers })).toBe(null);
    });

    it('should return null for invalid Authorization format', () => {
      const headers = new Map([['authorization', 'Basic abc123']]);
      expect(extractApiKey({ headers })).toBe(null);
    });
  });

  describe('Export Format Parameter', () => {
    type ExportFormat = 'csv' | 'json';

    const parseExportFormat = (format: string | null): ExportFormat => {
      if (format === 'json') return 'json';
      return 'csv'; // Default to CSV
    };

    it('should return csv by default', () => {
      expect(parseExportFormat(null)).toBe('csv');
      expect(parseExportFormat('')).toBe('csv');
    });

    it('should return json when specified', () => {
      expect(parseExportFormat('json')).toBe('json');
    });

    it('should return csv for invalid formats', () => {
      expect(parseExportFormat('xml')).toBe('csv');
      expect(parseExportFormat('pdf')).toBe('csv');
    });
  });

  describe('Callback URL Validation', () => {
    const isValidCallbackUrl = (url: string, allowedOrigins: string[]): boolean => {
      try {
        const parsed = new URL(url);
        return allowedOrigins.some((origin) => {
          if (origin.startsWith('*.')) {
            const domain = origin.slice(2);
            return parsed.hostname.endsWith(domain);
          }
          return parsed.origin === origin;
        });
      } catch {
        return false;
      }
    };

    it('should accept valid callback URLs', () => {
      expect(isValidCallbackUrl('https://gotcha.cx/callback', ['https://gotcha.cx'])).toBe(true);
    });

    it('should reject invalid origins', () => {
      expect(isValidCallbackUrl('https://evil.com/callback', ['https://gotcha.cx'])).toBe(false);
    });

    it('should support wildcard subdomains', () => {
      expect(isValidCallbackUrl('https://app.gotcha.cx/cb', ['*.gotcha.cx'])).toBe(true);
      expect(isValidCallbackUrl('https://api.gotcha.cx/cb', ['*.gotcha.cx'])).toBe(true);
    });

    it('should reject invalid URLs', () => {
      expect(isValidCallbackUrl('not-a-url', ['https://gotcha.cx'])).toBe(false);
    });
  });
});
