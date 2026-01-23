/**
 * Tests for data export formatting (CSV/JSON)
 */

describe('Export Formatting', () => {
  describe('CSV Escaping', () => {
    const escapeCSVField = (value: string | number | null | undefined): string => {
      if (value === null || value === undefined) return '';
      const str = String(value);

      // If contains comma, newline, or quote, wrap in quotes and escape quotes
      if (str.includes(',') || str.includes('\n') || str.includes('"') || str.includes('\r')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    it('should return empty string for null/undefined', () => {
      expect(escapeCSVField(null)).toBe('');
      expect(escapeCSVField(undefined)).toBe('');
    });

    it('should convert numbers to strings', () => {
      expect(escapeCSVField(123)).toBe('123');
      expect(escapeCSVField(45.67)).toBe('45.67');
    });

    it('should pass through simple strings', () => {
      expect(escapeCSVField('hello')).toBe('hello');
      expect(escapeCSVField('simple text')).toBe('simple text');
    });

    it('should wrap strings with commas in quotes', () => {
      expect(escapeCSVField('hello, world')).toBe('"hello, world"');
    });

    it('should wrap strings with newlines in quotes', () => {
      expect(escapeCSVField('line1\nline2')).toBe('"line1\nline2"');
      expect(escapeCSVField('line1\r\nline2')).toBe('"line1\r\nline2"');
    });

    it('should escape quotes by doubling them', () => {
      expect(escapeCSVField('say "hello"')).toBe('"say ""hello"""');
      expect(escapeCSVField('"quoted"')).toBe('"""quoted"""');
    });

    it('should handle complex strings', () => {
      const complex = 'Hello, "World"\nHow are you?';
      expect(escapeCSVField(complex)).toBe('"Hello, ""World""\nHow are you?"');
    });
  });

  describe('CSV Row Generation', () => {
    const escapeCSVField = (value: string | number | null | undefined): string => {
      if (value === null || value === undefined) return '';
      const str = String(value);
      if (str.includes(',') || str.includes('\n') || str.includes('"') || str.includes('\r')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const toCSVRow = (values: (string | number | null | undefined)[]): string => {
      return values.map(escapeCSVField).join(',');
    };

    it('should join values with commas', () => {
      expect(toCSVRow(['a', 'b', 'c'])).toBe('a,b,c');
    });

    it('should handle mixed types', () => {
      expect(toCSVRow(['text', 123, null, undefined])).toBe('text,123,,');
    });

    it('should escape fields as needed', () => {
      expect(toCSVRow(['hello', 'hi, there', 'bye'])).toBe('hello,"hi, there",bye');
    });
  });

  describe('CSV Document Generation', () => {
    interface ResponseData {
      id: string;
      type: string;
      content: string | null;
      rating: number | null;
      createdAt: string;
    }

    const generateCSV = (headers: string[], rows: ResponseData[]): string => {
      const escapeField = (value: string | number | null | undefined): string => {
        if (value === null || value === undefined) return '';
        const str = String(value);
        if (str.includes(',') || str.includes('\n') || str.includes('"')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      };

      const headerRow = headers.join(',');
      const dataRows = rows.map((row) =>
        [row.id, row.type, escapeField(row.content), row.rating ?? '', row.createdAt].join(',')
      );

      return [headerRow, ...dataRows].join('\n');
    };

    it('should generate CSV with headers', () => {
      const headers = ['id', 'type', 'content', 'rating', 'createdAt'];
      const rows: ResponseData[] = [];
      const csv = generateCSV(headers, rows);

      expect(csv).toBe('id,type,content,rating,createdAt');
    });

    it('should include data rows', () => {
      const headers = ['id', 'type', 'content', 'rating', 'createdAt'];
      const rows: ResponseData[] = [
        { id: '1', type: 'feedback', content: 'Great!', rating: 5, createdAt: '2024-01-01' },
      ];
      const csv = generateCSV(headers, rows);
      const lines = csv.split('\n');

      expect(lines).toHaveLength(2);
      expect(lines[1]).toBe('1,feedback,Great!,5,2024-01-01');
    });

    it('should handle null values', () => {
      const headers = ['id', 'type', 'content', 'rating', 'createdAt'];
      const rows: ResponseData[] = [
        { id: '1', type: 'vote', content: null, rating: null, createdAt: '2024-01-01' },
      ];
      const csv = generateCSV(headers, rows);
      const lines = csv.split('\n');

      expect(lines[1]).toBe('1,vote,,,2024-01-01');
    });

    it('should escape content with special characters', () => {
      const headers = ['id', 'type', 'content', 'rating', 'createdAt'];
      const rows: ResponseData[] = [
        {
          id: '1',
          type: 'feedback',
          content: 'Good, but "needs work"',
          rating: 3,
          createdAt: '2024-01-01',
        },
      ];
      const csv = generateCSV(headers, rows);

      expect(csv).toContain('"Good, but ""needs work"""');
    });
  });

  describe('JSON Export Formatting', () => {
    interface ExportData {
      responses: unknown[];
      metadata: {
        exportedAt: string;
        totalCount: number;
        filters?: Record<string, unknown>;
      };
    }

    const formatJSONExport = (data: ExportData, pretty: boolean = true): string => {
      return pretty ? JSON.stringify(data, null, 2) : JSON.stringify(data);
    };

    it('should format as pretty JSON by default', () => {
      const data: ExportData = {
        responses: [{ id: '1' }],
        metadata: { exportedAt: '2024-01-01', totalCount: 1 },
      };
      const json = formatJSONExport(data);

      expect(json).toContain('\n');
      expect(json).toContain('  ');
    });

    it('should format as compact JSON when requested', () => {
      const data: ExportData = {
        responses: [{ id: '1' }],
        metadata: { exportedAt: '2024-01-01', totalCount: 1 },
      };
      const json = formatJSONExport(data, false);

      expect(json).not.toContain('\n');
    });

    it('should include metadata', () => {
      const data: ExportData = {
        responses: [],
        metadata: {
          exportedAt: '2024-01-01T12:00:00Z',
          totalCount: 0,
          filters: { projectId: 'proj_123' },
        },
      };
      const json = formatJSONExport(data);
      const parsed = JSON.parse(json);

      expect(parsed.metadata.exportedAt).toBe('2024-01-01T12:00:00Z');
      expect(parsed.metadata.filters.projectId).toBe('proj_123');
    });
  });

  describe('Data Sanitization', () => {
    const sanitizeForExport = (value: unknown): unknown => {
      if (value === null || value === undefined) return null;

      if (typeof value === 'string') {
        // Remove potential formula injection (Excel)
        if (/^[=+\-@]/.test(value)) {
          return `'${value}`;
        }
        // Remove control characters
        return value.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '');
      }

      if (Array.isArray(value)) {
        return value.map(sanitizeForExport);
      }

      if (typeof value === 'object') {
        const sanitized: Record<string, unknown> = {};
        for (const [key, val] of Object.entries(value)) {
          sanitized[key] = sanitizeForExport(val);
        }
        return sanitized;
      }

      return value;
    };

    it('should prefix formula-like strings', () => {
      expect(sanitizeForExport('=SUM(A1:A10)')).toBe("'=SUM(A1:A10)");
      expect(sanitizeForExport('+cmd|calc')).toBe("'+cmd|calc");
      expect(sanitizeForExport('-1+1')).toBe("'-1+1");
      expect(sanitizeForExport('@import')).toBe("'@import");
    });

    it('should not modify normal strings', () => {
      expect(sanitizeForExport('hello world')).toBe('hello world');
      expect(sanitizeForExport('user@email.com')).toBe('user@email.com');
    });

    it('should remove control characters', () => {
      expect(sanitizeForExport('hello\x00world')).toBe('helloworld');
      expect(sanitizeForExport('test\x1Fdata')).toBe('testdata');
    });

    it('should handle null/undefined', () => {
      expect(sanitizeForExport(null)).toBe(null);
      expect(sanitizeForExport(undefined)).toBe(null);
    });

    it('should sanitize arrays recursively', () => {
      const input = ['normal', '=formula', null];
      const output = sanitizeForExport(input);
      expect(output).toEqual(['normal', "'=formula", null]);
    });

    it('should sanitize objects recursively', () => {
      const input = { name: 'test', formula: '=SUM()', nested: { value: '+cmd' } };
      const output = sanitizeForExport(input);
      expect(output).toEqual({
        name: 'test',
        formula: "'=SUM()",
        nested: { value: "'+cmd" },
      });
    });

    it('should pass through numbers', () => {
      expect(sanitizeForExport(123)).toBe(123);
      expect(sanitizeForExport(45.67)).toBe(45.67);
    });
  });

  describe('File Size Estimation', () => {
    const estimateCSVSize = (rowCount: number, avgRowLength: number): number => {
      return rowCount * avgRowLength;
    };

    const estimateJSONSize = (data: unknown): number => {
      return JSON.stringify(data).length;
    };

    const formatFileSize = (bytes: number): string => {
      if (bytes < 1024) return `${bytes} B`;
      if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    it('should estimate CSV size', () => {
      const size = estimateCSVSize(1000, 100); // 1000 rows, 100 bytes each
      expect(size).toBe(100000);
    });

    it('should estimate JSON size', () => {
      const data = { items: [1, 2, 3], name: 'test' };
      const size = estimateJSONSize(data);
      expect(size).toBeGreaterThan(0);
    });

    it('should format bytes', () => {
      expect(formatFileSize(500)).toBe('500 B');
    });

    it('should format kilobytes', () => {
      expect(formatFileSize(2048)).toBe('2.0 KB');
      expect(formatFileSize(1536)).toBe('1.5 KB');
    });

    it('should format megabytes', () => {
      expect(formatFileSize(1048576)).toBe('1.0 MB');
      expect(formatFileSize(2621440)).toBe('2.5 MB');
    });
  });

  describe('Content Type Headers', () => {
    const getContentType = (format: 'csv' | 'json'): string => {
      return format === 'csv' ? 'text/csv; charset=utf-8' : 'application/json; charset=utf-8';
    };

    const getContentDisposition = (filename: string): string => {
      const sanitizedName = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
      return `attachment; filename="${sanitizedName}"`;
    };

    it('should return CSV content type', () => {
      expect(getContentType('csv')).toBe('text/csv; charset=utf-8');
    });

    it('should return JSON content type', () => {
      expect(getContentType('json')).toBe('application/json; charset=utf-8');
    });

    it('should generate content disposition header', () => {
      expect(getContentDisposition('export.csv')).toBe('attachment; filename="export.csv"');
    });

    it('should sanitize filename', () => {
      expect(getContentDisposition('my file (1).csv')).toBe(
        'attachment; filename="my_file__1_.csv"'
      );
    });
  });

  describe('Export Limits', () => {
    const MAX_EXPORT_ROWS = 10000;
    const MAX_EXPORT_SIZE_MB = 50;

    const canExport = (
      rowCount: number,
      estimatedSizeMB: number
    ): { allowed: boolean; reason?: string } => {
      if (rowCount > MAX_EXPORT_ROWS) {
        return { allowed: false, reason: `Maximum ${MAX_EXPORT_ROWS} rows allowed` };
      }
      if (estimatedSizeMB > MAX_EXPORT_SIZE_MB) {
        return { allowed: false, reason: `Maximum ${MAX_EXPORT_SIZE_MB}MB file size allowed` };
      }
      return { allowed: true };
    };

    it('should allow small exports', () => {
      expect(canExport(100, 0.1).allowed).toBe(true);
    });

    it('should reject too many rows', () => {
      const result = canExport(15000, 1);
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('10000 rows');
    });

    it('should reject files too large', () => {
      const result = canExport(1000, 100);
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('50MB');
    });

    it('should allow edge cases', () => {
      expect(canExport(MAX_EXPORT_ROWS, MAX_EXPORT_SIZE_MB).allowed).toBe(true);
    });
  });

  describe('Column Selection', () => {
    interface Row {
      id: string;
      type: string;
      content: string;
      rating: number;
      userId: string;
      createdAt: string;
    }

    const selectColumns = <T extends Record<string, unknown>>(
      data: T[],
      columns: (keyof T)[]
    ): Partial<T>[] => {
      return data.map((row) => {
        const selected: Partial<T> = {};
        for (const col of columns) {
          selected[col] = row[col];
        }
        return selected;
      });
    };

    it('should select specified columns', () => {
      const data: Row[] = [
        {
          id: '1',
          type: 'feedback',
          content: 'test',
          rating: 5,
          userId: 'u1',
          createdAt: '2024-01-01',
        },
      ];
      const result = selectColumns(data, ['id', 'type', 'content']);

      expect(result[0]).toEqual({ id: '1', type: 'feedback', content: 'test' });
      expect(result[0]).not.toHaveProperty('rating');
    });

    it('should handle empty selection', () => {
      const data: Row[] = [
        {
          id: '1',
          type: 'feedback',
          content: 'test',
          rating: 5,
          userId: 'u1',
          createdAt: '2024-01-01',
        },
      ];
      const result = selectColumns(data, []);

      expect(result[0]).toEqual({});
    });

    it('should handle multiple rows', () => {
      const data: Row[] = [
        {
          id: '1',
          type: 'feedback',
          content: 'a',
          rating: 5,
          userId: 'u1',
          createdAt: '2024-01-01',
        },
        { id: '2', type: 'vote', content: 'b', rating: 4, userId: 'u2', createdAt: '2024-01-02' },
      ];
      const result = selectColumns(data, ['id', 'rating']);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({ id: '1', rating: 5 });
      expect(result[1]).toEqual({ id: '2', rating: 4 });
    });
  });
});
