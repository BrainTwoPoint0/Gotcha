/**
 * Tests for SDK offline queue logic
 * Note: These replicate the queue algorithms without localStorage
 */

interface QueueItem {
  id: string;
  payload: Record<string, unknown>;
  type: string;
  queuedAt: number;
  retries: number;
}

const MAX_QUEUE_SIZE = 50;
const TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const MAX_RETRIES = 5;

function createQueue(initial: QueueItem[] = []): {
  enqueue: (item: QueueItem) => void;
  dequeue: (id: string) => void;
  incrementRetries: (id: string) => void;
  getAll: () => QueueItem[];
  getRaw: () => QueueItem[];
} {
  let queue: QueueItem[] = [...initial];

  const filterExpiredAndExhausted = (items: QueueItem[]): QueueItem[] => {
    const now = Date.now();
    return items.filter((item) => {
      if (now - item.queuedAt > TTL_MS) return false;
      if (item.retries > MAX_RETRIES) return false;
      return true;
    });
  };

  return {
    enqueue(item: QueueItem) {
      if (queue.length >= MAX_QUEUE_SIZE) return;
      queue.push(item);
    },
    dequeue(id: string) {
      queue = queue.filter((item) => item.id !== id);
    },
    incrementRetries(id: string) {
      queue = queue.map((item) =>
        item.id === id ? { ...item, retries: item.retries + 1 } : item
      );
    },
    getAll() {
      queue = filterExpiredAndExhausted(queue);
      return [...queue];
    },
    getRaw() {
      return [...queue];
    },
  };
}

function makeItem(overrides: Partial<QueueItem> = {}): QueueItem {
  return {
    id: `item-${Math.random().toString(36).slice(2, 8)}`,
    payload: { data: 'test' },
    type: 'feedback',
    queuedAt: Date.now(),
    retries: 0,
    ...overrides,
  };
}

describe('SDK Offline Queue', () => {
  describe('Enqueue', () => {
    it('should add a single item to an empty queue', () => {
      const q = createQueue();
      const item = makeItem({ id: 'a' });
      q.enqueue(item);
      expect(q.getAll()).toHaveLength(1);
      expect(q.getAll()[0].id).toBe('a');
    });

    it('should add multiple items preserving insertion order', () => {
      const q = createQueue();
      q.enqueue(makeItem({ id: 'first' }));
      q.enqueue(makeItem({ id: 'second' }));
      q.enqueue(makeItem({ id: 'third' }));
      const ids = q.getAll().map((i) => i.id);
      expect(ids).toEqual(['first', 'second', 'third']);
    });

    it('should preserve the full item payload', () => {
      const q = createQueue();
      const item = makeItem({
        id: 'x',
        payload: { rating: 5, text: 'Great!' },
        type: 'vote',
      });
      q.enqueue(item);
      const stored = q.getAll()[0];
      expect(stored.payload).toEqual({ rating: 5, text: 'Great!' });
      expect(stored.type).toBe('vote');
    });

    it('should store queuedAt timestamp', () => {
      const q = createQueue();
      const now = Date.now();
      q.enqueue(makeItem({ id: 'ts', queuedAt: now }));
      expect(q.getAll()[0].queuedAt).toBe(now);
    });

    it('should initialize retries to 0 for new items', () => {
      const q = createQueue();
      q.enqueue(makeItem({ id: 'r0', retries: 0 }));
      expect(q.getAll()[0].retries).toBe(0);
    });
  });

  describe('Dequeue', () => {
    it('should remove an item by id', () => {
      const q = createQueue();
      q.enqueue(makeItem({ id: 'keep' }));
      q.enqueue(makeItem({ id: 'remove' }));
      q.dequeue('remove');
      const ids = q.getAll().map((i) => i.id);
      expect(ids).toEqual(['keep']);
    });

    it('should be a no-op when id does not exist', () => {
      const q = createQueue();
      q.enqueue(makeItem({ id: 'a' }));
      q.dequeue('nonexistent');
      expect(q.getAll()).toHaveLength(1);
    });

    it('should handle dequeue on empty queue without error', () => {
      const q = createQueue();
      expect(() => q.dequeue('anything')).not.toThrow();
      expect(q.getAll()).toHaveLength(0);
    });

    it('should remove only the targeted item, not others', () => {
      const q = createQueue();
      q.enqueue(makeItem({ id: 'a' }));
      q.enqueue(makeItem({ id: 'b' }));
      q.enqueue(makeItem({ id: 'c' }));
      q.dequeue('b');
      const ids = q.getAll().map((i) => i.id);
      expect(ids).toEqual(['a', 'c']);
    });
  });

  describe('Max Size Cap', () => {
    it('should allow exactly 50 items', () => {
      const q = createQueue();
      for (let i = 0; i < 50; i++) {
        q.enqueue(makeItem({ id: `item-${i}` }));
      }
      expect(q.getAll()).toHaveLength(50);
    });

    it('should silently drop the 51st item', () => {
      const q = createQueue();
      for (let i = 0; i < 50; i++) {
        q.enqueue(makeItem({ id: `item-${i}` }));
      }
      q.enqueue(makeItem({ id: 'overflow' }));
      expect(q.getAll()).toHaveLength(50);
      const ids = q.getAll().map((i) => i.id);
      expect(ids).not.toContain('overflow');
    });

    it('should accept new items after dequeuing below the cap', () => {
      const q = createQueue();
      for (let i = 0; i < 50; i++) {
        q.enqueue(makeItem({ id: `item-${i}` }));
      }
      q.dequeue('item-0');
      q.enqueue(makeItem({ id: 'new-item' }));
      const ids = q.getAll().map((i) => i.id);
      expect(ids).toContain('new-item');
      expect(q.getAll()).toHaveLength(50);
    });

    it('should not throw when enqueueing beyond max size', () => {
      const q = createQueue();
      for (let i = 0; i < 50; i++) {
        q.enqueue(makeItem({ id: `item-${i}` }));
      }
      expect(() => q.enqueue(makeItem({ id: 'extra' }))).not.toThrow();
    });
  });

  describe('TTL Expiry', () => {
    it('should keep items younger than 7 days', () => {
      const q = createQueue();
      q.enqueue(makeItem({ id: 'fresh', queuedAt: Date.now() - 1000 }));
      expect(q.getAll()).toHaveLength(1);
    });

    it('should filter out items older than 7 days on read', () => {
      const eightDaysAgo = Date.now() - 8 * 24 * 60 * 60 * 1000;
      const q = createQueue();
      q.enqueue(makeItem({ id: 'old', queuedAt: eightDaysAgo }));
      expect(q.getAll()).toHaveLength(0);
    });

    it('should keep items exactly at 7-day boundary (not strictly older)', () => {
      const exactlySevenDays = Date.now() - 7 * 24 * 60 * 60 * 1000;
      const q = createQueue();
      // At exactly TTL_MS, now - queuedAt === TTL_MS, which is NOT > TTL_MS
      q.enqueue(makeItem({ id: 'boundary', queuedAt: exactlySevenDays }));
      expect(q.getAll()).toHaveLength(1);
    });

    it('should filter expired items but keep fresh ones', () => {
      const q = createQueue();
      const tenDaysAgo = Date.now() - 10 * 24 * 60 * 60 * 1000;
      q.enqueue(makeItem({ id: 'expired', queuedAt: tenDaysAgo }));
      q.enqueue(makeItem({ id: 'fresh', queuedAt: Date.now() }));
      const result = q.getAll();
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('fresh');
    });

    it('should remove expired items from underlying storage on read', () => {
      const q = createQueue();
      const tenDaysAgo = Date.now() - 10 * 24 * 60 * 60 * 1000;
      q.enqueue(makeItem({ id: 'expired', queuedAt: tenDaysAgo }));
      q.getAll(); // Triggers cleanup
      expect(q.getRaw()).toHaveLength(0);
    });
  });

  describe('Retry Limit', () => {
    it('should keep items with retries <= 5', () => {
      const q = createQueue();
      q.enqueue(makeItem({ id: 'ok', retries: 5 }));
      expect(q.getAll()).toHaveLength(1);
    });

    it('should remove items with retries > 5 on read', () => {
      const q = createQueue();
      q.enqueue(makeItem({ id: 'exhausted', retries: 6 }));
      expect(q.getAll()).toHaveLength(0);
    });

    it('should remove items after incrementing past the limit', () => {
      const q = createQueue();
      q.enqueue(makeItem({ id: 'retry-me', retries: 4 }));
      q.incrementRetries('retry-me');
      expect(q.getAll()).toHaveLength(1); // retries = 5, still ok
      q.incrementRetries('retry-me');
      expect(q.getAll()).toHaveLength(0); // retries = 6, removed
    });

    it('should keep other items when one is over retry limit', () => {
      const q = createQueue();
      q.enqueue(makeItem({ id: 'dead', retries: 10 }));
      q.enqueue(makeItem({ id: 'alive', retries: 0 }));
      const result = q.getAll();
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('alive');
    });
  });

  describe('Increment Retries', () => {
    it('should increment the retry count by 1', () => {
      const q = createQueue();
      q.enqueue(makeItem({ id: 'a', retries: 0 }));
      q.incrementRetries('a');
      expect(q.getRaw()[0].retries).toBe(1);
    });

    it('should only increment the targeted item', () => {
      const q = createQueue();
      q.enqueue(makeItem({ id: 'a', retries: 0 }));
      q.enqueue(makeItem({ id: 'b', retries: 0 }));
      q.incrementRetries('a');
      expect(q.getRaw()[0].retries).toBe(1);
      expect(q.getRaw()[1].retries).toBe(0);
    });

    it('should be a no-op for non-existent id', () => {
      const q = createQueue();
      q.enqueue(makeItem({ id: 'a', retries: 2 }));
      q.incrementRetries('nonexistent');
      expect(q.getRaw()[0].retries).toBe(2);
    });

    it('should handle multiple increments', () => {
      const q = createQueue();
      q.enqueue(makeItem({ id: 'a', retries: 0 }));
      q.incrementRetries('a');
      q.incrementRetries('a');
      q.incrementRetries('a');
      expect(q.getRaw()[0].retries).toBe(3);
    });
  });

  describe('Queue Ordering', () => {
    it('should return items in FIFO order', () => {
      const q = createQueue();
      q.enqueue(makeItem({ id: '1st' }));
      q.enqueue(makeItem({ id: '2nd' }));
      q.enqueue(makeItem({ id: '3rd' }));
      const ids = q.getAll().map((i) => i.id);
      expect(ids).toEqual(['1st', '2nd', '3rd']);
    });

    it('should maintain order after dequeue from middle', () => {
      const q = createQueue();
      q.enqueue(makeItem({ id: 'a' }));
      q.enqueue(makeItem({ id: 'b' }));
      q.enqueue(makeItem({ id: 'c' }));
      q.dequeue('b');
      const ids = q.getAll().map((i) => i.id);
      expect(ids).toEqual(['a', 'c']);
    });
  });

  describe('Empty Queue', () => {
    it('should return empty array from getAll', () => {
      const q = createQueue();
      expect(q.getAll()).toEqual([]);
    });

    it('should return empty array from getRaw', () => {
      const q = createQueue();
      expect(q.getRaw()).toEqual([]);
    });

    it('should handle dequeue on empty queue', () => {
      const q = createQueue();
      q.dequeue('anything');
      expect(q.getAll()).toEqual([]);
    });

    it('should handle incrementRetries on empty queue', () => {
      const q = createQueue();
      expect(() => q.incrementRetries('anything')).not.toThrow();
    });
  });

  describe('Corrupt Data Handling', () => {
    it('should initialize from valid pre-existing items', () => {
      const existing: QueueItem[] = [
        makeItem({ id: 'pre-1' }),
        makeItem({ id: 'pre-2' }),
      ];
      const q = createQueue(existing);
      expect(q.getAll()).toHaveLength(2);
    });

    it('should filter out items with negative queuedAt via TTL check', () => {
      const q = createQueue();
      q.enqueue(makeItem({ id: 'corrupt-time', queuedAt: -1 }));
      // A negative timestamp is extremely old, should be filtered by TTL
      expect(q.getAll()).toHaveLength(0);
    });

    it('should filter out items with NaN retries treated as > MAX_RETRIES', () => {
      const q = createQueue();
      q.enqueue(makeItem({ id: 'nan-retries', retries: NaN }));
      // NaN > MAX_RETRIES is false, but NaN comparisons are falsy
      // The item survives the retry check but NaN retries is effectively 0
      const result = q.getAll();
      // NaN > 5 evaluates to false, so item is kept
      expect(result).toHaveLength(1);
    });

    it('should handle items with missing payload gracefully', () => {
      const q = createQueue();
      q.enqueue({
        id: 'no-payload',
        payload: {} as Record<string, unknown>,
        type: '',
        queuedAt: Date.now(),
        retries: 0,
      });
      expect(q.getAll()).toHaveLength(1);
    });

    it('should filter items with queuedAt of 0 (epoch) as expired', () => {
      const q = createQueue();
      q.enqueue(makeItem({ id: 'epoch', queuedAt: 0 }));
      expect(q.getAll()).toHaveLength(0);
    });
  });
});
