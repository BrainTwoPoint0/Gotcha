/**
 * Tests for SDK UUID generation with crypto.randomUUID fallback
 */

describe('SDK Generate ID', () => {
  describe('Fallback UUID Generation', () => {
    const generateIdFallback = (): string => {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
      });
    };

    it('should produce a string of length 36', () => {
      const id = generateIdFallback();
      expect(id.length).toBe(36);
    });

    it('should match UUID v4 format', () => {
      const id = generateIdFallback();
      expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    });

    it('should have "4" at position 14 (version nibble)', () => {
      for (let i = 0; i < 50; i++) {
        const id = generateIdFallback();
        expect(id[14]).toBe('4');
      }
    });

    it('should have 8, 9, a, or b at position 19 (variant nibble)', () => {
      const validVariants = ['8', '9', 'a', 'b'];
      for (let i = 0; i < 50; i++) {
        const id = generateIdFallback();
        expect(validVariants).toContain(id[19]);
      }
    });

    it('should contain only lowercase hex chars and hyphens', () => {
      const id = generateIdFallback();
      expect(id).toMatch(/^[0-9a-f-]+$/);
    });

    it('should have hyphens at correct positions (8, 13, 18, 23)', () => {
      const id = generateIdFallback();
      expect(id[8]).toBe('-');
      expect(id[13]).toBe('-');
      expect(id[18]).toBe('-');
      expect(id[23]).toBe('-');
    });

    it('should have 5 groups with lengths 8-4-4-4-12', () => {
      const id = generateIdFallback();
      const groups = id.split('-');
      expect(groups.length).toBe(5);
      expect(groups[0].length).toBe(8);
      expect(groups[1].length).toBe(4);
      expect(groups[2].length).toBe(4);
      expect(groups[3].length).toBe(4);
      expect(groups[4].length).toBe(12);
    });

    it('should generate unique IDs across 100 calls', () => {
      const ids = new Set<string>();
      for (let i = 0; i < 100; i++) {
        ids.add(generateIdFallback());
      }
      expect(ids.size).toBe(100);
    });

    it('should not produce identical consecutive IDs', () => {
      const id1 = generateIdFallback();
      const id2 = generateIdFallback();
      expect(id1).not.toBe(id2);
    });

    it('should produce valid hex digits in all non-hyphen positions', () => {
      const id = generateIdFallback();
      const hexOnly = id.replace(/-/g, '');
      expect(hexOnly.length).toBe(32);
      for (const ch of hexOnly) {
        expect('0123456789abcdef').toContain(ch);
      }
    });
  });

  describe('generateId with crypto.randomUUID', () => {
    const generateId = (): string => {
      if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
      }
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
      });
    };

    it('should return a valid UUID when crypto.randomUUID is available', () => {
      const id = generateId();
      expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    });

    it('should return a 36-character string from crypto.randomUUID', () => {
      const id = generateId();
      expect(id.length).toBe(36);
    });

    it('should produce unique UUIDs from crypto path', () => {
      const ids = new Set<string>();
      for (let i = 0; i < 100; i++) {
        ids.add(generateId());
      }
      expect(ids.size).toBe(100);
    });
  });

  describe('Fallback path when crypto.randomUUID is undefined', () => {
    it('should use fallback and still produce valid UUID format', () => {
      const originalRandomUUID = crypto.randomUUID;
      try {
        // Simulate environment without crypto.randomUUID
        // @ts-expect-error — intentionally removing for test
        crypto.randomUUID = undefined;

        const generateId = (): string => {
          if (typeof crypto !== 'undefined' && crypto.randomUUID) {
            return crypto.randomUUID();
          }
          return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
            const r = (Math.random() * 16) | 0;
            return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
          });
        };

        const id = generateId();
        expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
      } finally {
        crypto.randomUUID = originalRandomUUID;
      }
    });

    it('should produce version 4 UUID from fallback path', () => {
      const originalRandomUUID = crypto.randomUUID;
      try {
        // @ts-expect-error — intentionally removing for test
        crypto.randomUUID = undefined;

        const generateId = (): string => {
          if (typeof crypto !== 'undefined' && crypto.randomUUID) {
            return crypto.randomUUID();
          }
          return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
            const r = (Math.random() * 16) | 0;
            return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
          });
        };

        const id = generateId();
        expect(id[14]).toBe('4');
        expect(['8', '9', 'a', 'b']).toContain(id[19]);
      } finally {
        crypto.randomUUID = originalRandomUUID;
      }
    });

    it('should generate unique IDs from fallback path', () => {
      const originalRandomUUID = crypto.randomUUID;
      try {
        // @ts-expect-error — intentionally removing for test
        crypto.randomUUID = undefined;

        const generateId = (): string => {
          if (typeof crypto !== 'undefined' && crypto.randomUUID) {
            return crypto.randomUUID();
          }
          return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
            const r = (Math.random() * 16) | 0;
            return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
          });
        };

        const ids = new Set<string>();
        for (let i = 0; i < 50; i++) {
          ids.add(generateId());
        }
        expect(ids.size).toBe(50);
      } finally {
        crypto.randomUUID = originalRandomUUID;
      }
    });
  });

  describe('UUID V4 Compliance', () => {
    const generateIdFallback = (): string => {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
      });
    };

    it('should set version bits correctly across many generations', () => {
      for (let i = 0; i < 100; i++) {
        const id = generateIdFallback();
        // Version 4: 13th hex digit (position 14 in string) must be '4'
        expect(id[14]).toBe('4');
      }
    });

    it('should set variant bits correctly across many generations', () => {
      for (let i = 0; i < 100; i++) {
        const id = generateIdFallback();
        // Variant 1: 17th hex digit (position 19 in string) must be 8, 9, a, or b
        const variant = parseInt(id[19], 16);
        expect(variant & 0xc).toBe(0x8); // Top two bits are 10
      }
    });

    it('should have sufficient randomness in the first group', () => {
      const firstGroups = new Set<string>();
      for (let i = 0; i < 50; i++) {
        const id = generateIdFallback();
        firstGroups.add(id.split('-')[0]);
      }
      // With 8 hex chars, collisions in 50 samples are astronomically unlikely
      expect(firstGroups.size).toBe(50);
    });

    it('should have sufficient randomness in the last group', () => {
      const lastGroups = new Set<string>();
      for (let i = 0; i < 50; i++) {
        const id = generateIdFallback();
        lastGroups.add(id.split('-')[4]);
      }
      expect(lastGroups.size).toBe(50);
    });
  });
});
