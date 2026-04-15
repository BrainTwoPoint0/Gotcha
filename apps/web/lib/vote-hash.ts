import crypto from 'crypto';

/**
 * Voter hash for anonymous public-roadmap upvotes.
 *
 * Shape: sha256(projectSalt | ip | uaNormalised) → base64url.
 *
 * NOT a MAC. You cannot "forge" a useful vote — the only thing a hash lets
 * you do is try to vote again from the same browser, which the Postgres
 * unique constraint on (responseId, voterHash) rejects. Plain SHA-256
 * keeps this utility dependency-free and trivial to unit-test.
 *
 * UA normalisation is deliberately coarse: we collapse the user-agent
 * string down to a browser-family + platform bucket (Chrome/Mac,
 * Firefox/Linux, Safari/iOS, Edge/Win, "other"). Coarser normalisation
 * means:
 *   - weekly browser auto-updates don't look like a new voter
 *   - same person on the same machine stays one vote
 *   - shared-IP offices can still cast distinct votes across different
 *     browser families (Chrome vs Safari vs Firefox)
 * Trade-off: two colleagues on the same office IP using the same browser
 * family count as one voter. Acceptable for a public vote primitive; the
 * false-positive dedup is the smaller of the two risks vs vote-stuffers.
 */

export interface VoterHashInput {
  ip: string;
  userAgent: string | null | undefined;
  projectSalt: string;
}

const SEP = '|';

export function normaliseUserAgent(ua: string | null | undefined): string {
  if (!ua) return 'other';
  const s = ua.toLowerCase();

  // Order matters: Edge identifies as "edg/" AND "chrome/"; check Edge first.
  // Same for Opera (OPR) vs Chrome.
  const family = /edg\//.test(s)
    ? 'edge'
    : /opr\//.test(s)
      ? 'opera'
      : /firefox\//.test(s)
        ? 'firefox'
        : /chrome\//.test(s)
          ? 'chrome'
          : /safari\//.test(s)
            ? 'safari'
            : 'other';

  // iOS/Android must be checked before Mac/Windows because mobile UA
  // strings often contain "Mac OS X" too (iOS Safari).
  const platform = /iphone|ipad|ipod/.test(s)
    ? 'ios'
    : /android/.test(s)
      ? 'android'
      : /windows/.test(s)
        ? 'win'
        : /mac os x|macintosh/.test(s)
          ? 'mac'
          : /linux/.test(s)
            ? 'linux'
            : 'other';

  return `${family}/${platform}`;
}

function b64url(buf: Buffer): string {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function computeVoterHash({ ip, userAgent, projectSalt }: VoterHashInput): string {
  if (!projectSalt) {
    throw new Error('computeVoterHash: projectSalt is required');
  }
  const ua = normaliseUserAgent(userAgent);
  const digest = crypto
    .createHash('sha256')
    .update(projectSalt + SEP + ip + SEP + ua)
    .digest();
  return b64url(digest);
}
