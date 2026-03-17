import { LIGHT_TOKENS, DARK_TOKENS, GotchaThemeConfig, ResolvedTheme } from './tokens';
import { deepMerge } from '../utils/deepMerge';

/**
 * Resolve a complete theme from the base preset + optional provider & instance overrides.
 * Returns a fully-resolved object with no undefined values.
 */
export function resolveTheme(
  theme: 'light' | 'dark' | 'auto' | 'custom',
  systemTheme: 'light' | 'dark',
  providerConfig?: GotchaThemeConfig,
): ResolvedTheme {
  const effectiveTheme = theme === 'auto' || theme === 'custom' ? systemTheme : theme;
  let resolved: ResolvedTheme = effectiveTheme === 'dark'
    ? deepMerge({}, DARK_TOKENS) as ResolvedTheme
    : deepMerge({}, LIGHT_TOKENS) as ResolvedTheme;

  if (providerConfig) {
    resolved = deepMerge(resolved, providerConfig) as ResolvedTheme;
  }

  return resolved;
}
