/**
 * Sanitizes the redirect path from the `next` query parameter in auth callbacks.
 * Prevents open redirect attacks by ensuring the path is a relative path on the same origin.
 */
export function sanitizeRedirectPath(path: string | null | undefined): string {
  const fallback = '/dashboard';

  if (!path) return fallback;

  // Must start with exactly one forward slash, not two (protocol-relative)
  if (!path.startsWith('/') || path.startsWith('//')) return fallback;

  // Block backslash tricks
  if (path.includes('\\')) return fallback;

  // Block any protocol prefix (javascript:, data:, etc.)
  if (/^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(path)) return fallback;

  return path;
}
