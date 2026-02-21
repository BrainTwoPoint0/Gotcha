import { sanitizeRedirectPath } from '@/lib/auth-redirect';

describe('sanitizeRedirectPath', () => {
  it('allows a simple path', () => {
    expect(sanitizeRedirectPath('/dashboard')).toBe('/dashboard');
  });

  it('allows nested paths', () => {
    expect(sanitizeRedirectPath('/dashboard/settings')).toBe('/dashboard/settings');
  });

  it('allows paths with query strings', () => {
    expect(sanitizeRedirectPath('/dashboard?tab=billing')).toBe('/dashboard?tab=billing');
  });

  it('defaults to /dashboard for empty string', () => {
    expect(sanitizeRedirectPath('')).toBe('/dashboard');
  });

  it('defaults to /dashboard for null', () => {
    expect(sanitizeRedirectPath(null)).toBe('/dashboard');
  });

  it('blocks protocol-relative URLs (//evil.com)', () => {
    expect(sanitizeRedirectPath('//evil.com')).toBe('/dashboard');
  });

  it('blocks absolute URLs with protocol', () => {
    expect(sanitizeRedirectPath('https://evil.com')).toBe('/dashboard');
  });

  it('blocks javascript: protocol', () => {
    expect(sanitizeRedirectPath('javascript:alert(1)')).toBe('/dashboard');
  });

  it('blocks paths not starting with /', () => {
    expect(sanitizeRedirectPath('evil.com/dashboard')).toBe('/dashboard');
  });

  it('blocks backslash trick (\\\\evil.com)', () => {
    expect(sanitizeRedirectPath('\\evil.com')).toBe('/dashboard');
  });
});
