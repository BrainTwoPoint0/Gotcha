import { STORAGE_KEYS } from '../constants';
import { safeGetItem, safeSetItem } from './localStorage';

const MAX_QUEUE_SIZE = 50;
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export interface OfflineQueueItem {
  id: string;
  payload: Record<string, unknown>;
  type: 'create' | 'update';
  queuedAt: number;
  retries: number;
}

function readQueue(): OfflineQueueItem[] {
  const raw = safeGetItem(STORAGE_KEYS.OFFLINE_QUEUE);
  if (!raw) return [];
  try {
    const items = JSON.parse(raw) as OfflineQueueItem[];
    // Drop items older than 7 days
    const now = Date.now();
    return items.filter(item => now - item.queuedAt < MAX_AGE_MS);
  } catch {
    return [];
  }
}

function writeQueue(items: OfflineQueueItem[]): void {
  safeSetItem(STORAGE_KEYS.OFFLINE_QUEUE, JSON.stringify(items));
}

export function enqueue(payload: Record<string, unknown>, type: 'create' | 'update' = 'create'): void {
  const items = readQueue();
  if (items.length >= MAX_QUEUE_SIZE) return;
  items.push({
    id: crypto.randomUUID(),
    payload,
    type,
    queuedAt: Date.now(),
    retries: 0,
  });
  writeQueue(items);
}

export function dequeue(id: string): void {
  const items = readQueue().filter(item => item.id !== id);
  writeQueue(items);
}

export function getQueuedItems(): OfflineQueueItem[] {
  return readQueue();
}

export function getQueueLength(): number {
  return readQueue().length;
}

export function incrementRetries(id: string): void {
  const items = readQueue().map(item =>
    item.id === id ? { ...item, retries: item.retries + 1 } : item
  );
  // Drop items with too many retries
  writeQueue(items.filter(item => item.retries <= 5));
}
