import { STORAGE_KEYS } from '../constants';
import { safeGetItem, safeSetItem, safeRemoveItem } from './localStorage';
import { generateId } from './generateId';

/**
 * Get or create an anonymous user ID
 * Stored in localStorage for consistency across sessions
 */
export function getAnonymousId(): string {
  const stored = safeGetItem(STORAGE_KEYS.ANONYMOUS_ID);
  if (stored) return stored;

  const id = `anon_${generateId()}`;
  safeSetItem(STORAGE_KEYS.ANONYMOUS_ID, id);
  return id;
}

/**
 * Clear the anonymous ID (useful for testing)
 */
export function clearAnonymousId(): void {
  safeRemoveItem(STORAGE_KEYS.ANONYMOUS_ID);
}
