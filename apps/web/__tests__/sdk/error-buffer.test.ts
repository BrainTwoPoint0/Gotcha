/**
 * Tests for SDK error buffer (circular buffer for recent JS errors)
 * Note: These test the buffer logic without importing from the SDK
 */

describe('SDK Error Buffer', () => {
  const MAX_ENTRIES = 10;
  const MAX_MESSAGE_LENGTH = 200;

  interface ErrorEntry {
    message: string;
    source?: string;
    timestamp: number;
  }

  // Replicate the circular buffer logic
  const createErrorBuffer = () => {
    let buffer: ErrorEntry[] = [];

    const pushError = (message: string, source?: string): void => {
      const truncatedMessage =
        message.length > MAX_MESSAGE_LENGTH ? message.slice(0, MAX_MESSAGE_LENGTH) : message;
      const truncatedSource =
        source && source.length > MAX_MESSAGE_LENGTH ? source.slice(0, MAX_MESSAGE_LENGTH) : source;

      const entry: ErrorEntry = {
        message: truncatedMessage,
        source: truncatedSource,
        timestamp: Date.now(),
      };

      buffer.push(entry);
      if (buffer.length > MAX_ENTRIES) {
        buffer.shift();
      }
    };

    const getRecentErrors = (): ErrorEntry[] => {
      return [...buffer].reverse();
    };

    const clear = () => {
      buffer = [];
    };

    return { pushError, getRecentErrors, clear };
  };

  describe('pushError', () => {
    it('should add an error entry to the buffer', () => {
      const buf = createErrorBuffer();
      buf.pushError('Something went wrong');
      const errors = buf.getRecentErrors();
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toBe('Something went wrong');
    });

    it('should set timestamp on each entry', () => {
      const buf = createErrorBuffer();
      const before = Date.now();
      buf.pushError('Test error');
      const after = Date.now();
      const errors = buf.getRecentErrors();
      expect(errors[0].timestamp).toBeGreaterThanOrEqual(before);
      expect(errors[0].timestamp).toBeLessThanOrEqual(after);
    });

    it('should store source when provided', () => {
      const buf = createErrorBuffer();
      buf.pushError('Error occurred', 'GotchaModal.tsx');
      const errors = buf.getRecentErrors();
      expect(errors[0].source).toBe('GotchaModal.tsx');
    });

    it('should leave source undefined when not provided', () => {
      const buf = createErrorBuffer();
      buf.pushError('Error occurred');
      const errors = buf.getRecentErrors();
      expect(errors[0].source).toBeUndefined();
    });

    it('should accept multiple errors', () => {
      const buf = createErrorBuffer();
      buf.pushError('Error 1');
      buf.pushError('Error 2');
      buf.pushError('Error 3');
      expect(buf.getRecentErrors()).toHaveLength(3);
    });
  });

  describe('Circular buffer overflow', () => {
    it('should cap at MAX_ENTRIES (10)', () => {
      const buf = createErrorBuffer();
      for (let i = 0; i < 15; i++) {
        buf.pushError(`Error ${i}`);
      }
      expect(buf.getRecentErrors()).toHaveLength(MAX_ENTRIES);
    });

    it('should keep the newest entries when overflow occurs', () => {
      const buf = createErrorBuffer();
      for (let i = 0; i < 15; i++) {
        buf.pushError(`Error ${i}`);
      }
      const errors = buf.getRecentErrors();
      // Newest first, so errors[0] should be the last pushed
      expect(errors[0].message).toBe('Error 14');
      // Oldest remaining should be Error 5 (0-4 were shifted out)
      expect(errors[9].message).toBe('Error 5');
    });

    it('should evict oldest entry first', () => {
      const buf = createErrorBuffer();
      for (let i = 0; i < 11; i++) {
        buf.pushError(`Error ${i}`);
      }
      const errors = buf.getRecentErrors();
      // Error 0 should have been shifted out
      const messages = errors.map((e) => e.message);
      expect(messages).not.toContain('Error 0');
      expect(messages).toContain('Error 1');
      expect(messages).toContain('Error 10');
    });

    it('should maintain exactly MAX_ENTRIES after many pushes', () => {
      const buf = createErrorBuffer();
      for (let i = 0; i < 100; i++) {
        buf.pushError(`Error ${i}`);
      }
      expect(buf.getRecentErrors()).toHaveLength(MAX_ENTRIES);
    });

    it('should have errors 90-99 after pushing 100', () => {
      const buf = createErrorBuffer();
      for (let i = 0; i < 100; i++) {
        buf.pushError(`Error ${i}`);
      }
      const errors = buf.getRecentErrors();
      expect(errors[0].message).toBe('Error 99');
      expect(errors[9].message).toBe('Error 90');
    });
  });

  describe('Message truncation', () => {
    it('should not truncate messages under 200 chars', () => {
      const buf = createErrorBuffer();
      const shortMessage = 'Short error message';
      buf.pushError(shortMessage);
      expect(buf.getRecentErrors()[0].message).toBe(shortMessage);
    });

    it('should not truncate messages exactly 200 chars', () => {
      const buf = createErrorBuffer();
      const exactMessage = 'x'.repeat(200);
      buf.pushError(exactMessage);
      expect(buf.getRecentErrors()[0].message).toHaveLength(200);
      expect(buf.getRecentErrors()[0].message).toBe(exactMessage);
    });

    it('should truncate messages over 200 chars', () => {
      const buf = createErrorBuffer();
      const longMessage = 'a'.repeat(500);
      buf.pushError(longMessage);
      expect(buf.getRecentErrors()[0].message).toHaveLength(200);
    });

    it('should truncate to exactly 200 chars', () => {
      const buf = createErrorBuffer();
      const longMessage = 'b'.repeat(201);
      buf.pushError(longMessage);
      expect(buf.getRecentErrors()[0].message).toHaveLength(MAX_MESSAGE_LENGTH);
    });

    it('should truncate source strings over 200 chars', () => {
      const buf = createErrorBuffer();
      const longSource = 'https://example.com/' + 'path/'.repeat(100);
      buf.pushError('Error', longSource);
      expect(buf.getRecentErrors()[0].source!.length).toBeLessThanOrEqual(MAX_MESSAGE_LENGTH);
    });

    it('should not truncate short source strings', () => {
      const buf = createErrorBuffer();
      buf.pushError('Error', 'app.js:42');
      expect(buf.getRecentErrors()[0].source).toBe('app.js:42');
    });
  });

  describe('getRecentErrors ordering', () => {
    it('should return newest error first', () => {
      const buf = createErrorBuffer();
      buf.pushError('First');
      buf.pushError('Second');
      buf.pushError('Third');
      const errors = buf.getRecentErrors();
      expect(errors[0].message).toBe('Third');
      expect(errors[1].message).toBe('Second');
      expect(errors[2].message).toBe('First');
    });

    it('should return empty array when buffer is empty', () => {
      const buf = createErrorBuffer();
      expect(buf.getRecentErrors()).toEqual([]);
    });

    it('should return a single error correctly', () => {
      const buf = createErrorBuffer();
      buf.pushError('Only error');
      const errors = buf.getRecentErrors();
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toBe('Only error');
    });

    it('should not mutate internal buffer when returning', () => {
      const buf = createErrorBuffer();
      buf.pushError('Error A');
      buf.pushError('Error B');
      const first = buf.getRecentErrors();
      const second = buf.getRecentErrors();
      // Both calls should return same data
      expect(first).toEqual(second);
      // Modifying returned array should not affect buffer
      first.pop();
      expect(buf.getRecentErrors()).toHaveLength(2);
    });
  });

  describe('Timestamp correctness', () => {
    it('should have increasing timestamps for sequential pushes', () => {
      const buf = createErrorBuffer();
      buf.pushError('Error 1');
      buf.pushError('Error 2');
      buf.pushError('Error 3');
      const errors = buf.getRecentErrors();
      // Reversed order: newest first, so timestamps should be decreasing
      expect(errors[0].timestamp).toBeGreaterThanOrEqual(errors[1].timestamp);
      expect(errors[1].timestamp).toBeGreaterThanOrEqual(errors[2].timestamp);
    });

    it('should use numeric timestamp (epoch ms)', () => {
      const buf = createErrorBuffer();
      buf.pushError('Test');
      const ts = buf.getRecentErrors()[0].timestamp;
      expect(typeof ts).toBe('number');
      // Should be a reasonable epoch ms value (after year 2020)
      expect(ts).toBeGreaterThan(1577836800000);
    });
  });
});
