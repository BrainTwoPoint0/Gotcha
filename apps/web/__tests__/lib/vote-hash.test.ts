import { computeVoterHash, normaliseUserAgent } from '@/lib/vote-hash';

const CHROME_MAC =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const CHROME_MAC_NEW_VERSION =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';
const FIREFOX_MAC =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:125.0) Gecko/20100101 Firefox/125.0';
const SAFARI_IOS =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1';
const EDGE_WIN =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0';

describe('normaliseUserAgent', () => {
  it('collapses Chrome on Mac to chrome/mac', () => {
    expect(normaliseUserAgent(CHROME_MAC)).toBe('chrome/mac');
  });

  it('collapses auto-update browser-version drift to the same bucket', () => {
    expect(normaliseUserAgent(CHROME_MAC)).toBe(normaliseUserAgent(CHROME_MAC_NEW_VERSION));
  });

  it('distinguishes Chrome and Firefox on the same platform', () => {
    expect(normaliseUserAgent(CHROME_MAC)).not.toBe(normaliseUserAgent(FIREFOX_MAC));
  });

  it('detects iOS Safari correctly despite the Mac OS X fragment in the UA', () => {
    expect(normaliseUserAgent(SAFARI_IOS)).toBe('safari/ios');
  });

  it('identifies Edge ahead of its embedded Chrome token', () => {
    expect(normaliseUserAgent(EDGE_WIN)).toBe('edge/win');
  });

  it('falls back to other/other for empty or unknown UA', () => {
    expect(normaliseUserAgent('')).toBe('other');
    expect(normaliseUserAgent(null)).toBe('other');
    expect(normaliseUserAgent(undefined)).toBe('other');
    expect(normaliseUserAgent('curl/8.0.0')).toBe('other/other');
  });
});

describe('computeVoterHash', () => {
  const baseInput = {
    ip: '203.0.113.5',
    userAgent: CHROME_MAC,
    projectSalt: 'salt-project-a',
  };

  it('is stable across calls with the same inputs', () => {
    expect(computeVoterHash(baseInput)).toBe(computeVoterHash(baseInput));
  });

  it('survives a browser auto-update (same-family, new version)', () => {
    expect(computeVoterHash(baseInput)).toBe(
      computeVoterHash({ ...baseInput, userAgent: CHROME_MAC_NEW_VERSION })
    );
  });

  it('differs when the project salt changes (cross-project isolation)', () => {
    const a = computeVoterHash(baseInput);
    const b = computeVoterHash({ ...baseInput, projectSalt: 'salt-project-b' });
    expect(a).not.toBe(b);
  });

  it('differs when the IP changes', () => {
    const a = computeVoterHash(baseInput);
    const b = computeVoterHash({ ...baseInput, ip: '198.51.100.10' });
    expect(a).not.toBe(b);
  });

  it('differs when the browser family changes', () => {
    const a = computeVoterHash(baseInput);
    const b = computeVoterHash({ ...baseInput, userAgent: FIREFOX_MAC });
    expect(a).not.toBe(b);
  });

  it('produces a base64url string (no +, /, or =)', () => {
    const h = computeVoterHash(baseInput);
    expect(h).not.toMatch(/[+/=]/);
    expect(h.length).toBeGreaterThan(40);
  });

  it('throws when projectSalt is empty', () => {
    expect(() => computeVoterHash({ ...baseInput, projectSalt: '' })).toThrow();
  });
});
