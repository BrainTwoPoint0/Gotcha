const UNSAFE_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function deepMerge(base: any, override: any): any {
  const result = { ...base };
  for (const key of Object.keys(override)) {
    if (UNSAFE_KEYS.has(key)) continue;
    const val = override[key];
    if (val !== undefined && val !== null && typeof val === 'object' && !Array.isArray(val)) {
      result[key] = deepMerge(base[key] ?? {}, val);
    } else if (val !== undefined) {
      result[key] = val;
    }
  }
  return result;
}
