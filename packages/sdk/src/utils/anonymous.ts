import { STORAGE_KEYS } from '../constants';

/**
 * Get or create an anonymous user ID
 * Stored in localStorage for consistency across sessions
 */
export function getAnonymousId(): string {
  if (typeof window === 'undefined') {
    // SSR fallback - generate but don't persist
    return `anon_${crypto.randomUUID()}`;
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEYS.ANONYMOUS_ID);
    if (stored) return stored;

    const id = `anon_${crypto.randomUUID()}`;
    localStorage.setItem(STORAGE_KEYS.ANONYMOUS_ID, id);
    return id;
  } catch {
    // localStorage unavailable (incognito Safari, sandboxed iframes)
    return `anon_${crypto.randomUUID()}`;
  }
}

/**
 * Clear the anonymous ID (useful for testing)
 */
export function clearAnonymousId(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEYS.ANONYMOUS_ID);
  }
}
