/**
 * Strict origin check — compares hostname from the Origin header
 * against the Host header. Prevents subdomain spoofing attacks
 * like `gotcha.cx.evil.com` bypassing `origin.includes(host)`.
 */
export function isOriginAllowed(origin: string | null, host: string | null): boolean {
  // If either header is missing, allow (same-origin or non-browser)
  if (!origin || !host) return true;

  try {
    const originHostname = new URL(origin).hostname;
    const hostHostname = host.split(':')[0];
    return originHostname === hostHostname;
  } catch {
    return false;
  }
}
