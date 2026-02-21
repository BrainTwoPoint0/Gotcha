import { isOriginAllowed } from '@/lib/origin-check';

describe('isOriginAllowed', () => {
  it('allows same host', () => {
    expect(isOriginAllowed('https://gotcha.cx', 'gotcha.cx')).toBe(true);
  });

  it('allows localhost with port', () => {
    expect(isOriginAllowed('http://localhost:3000', 'localhost:3000')).toBe(true);
  });

  it('blocks subdomain spoofing (gotcha.cx.evil.com)', () => {
    expect(isOriginAllowed('https://gotcha.cx.evil.com', 'gotcha.cx')).toBe(false);
  });

  it('blocks prefix spoofing (evil-gotcha.cx)', () => {
    expect(isOriginAllowed('https://evil-gotcha.cx', 'gotcha.cx')).toBe(false);
  });

  it('returns true when origin is null (same-origin request)', () => {
    expect(isOriginAllowed(null, 'gotcha.cx')).toBe(true);
  });

  it('returns true when host is null', () => {
    expect(isOriginAllowed('https://gotcha.cx', null)).toBe(true);
  });

  it('blocks completely different host', () => {
    expect(isOriginAllowed('https://evil.com', 'gotcha.cx')).toBe(false);
  });
});
