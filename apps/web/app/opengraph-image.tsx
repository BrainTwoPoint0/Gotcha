import { ImageResponse } from 'next/og';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

// Editorial Open Graph image — mirrors the hero-section treatment so a
// shared link on Slack / Twitter / iMessage / LinkedIn lands with the
// same identity a visitor sees on the landing page itself.
//
// Layout: paper background, hairline top rule, sienna-dot eyebrow, large
// Fraunces wordmark with sienna terminal accent, muted deck, footer
// masthead. Left-aligned rather than centered — editorial, not splash.
//
// Font: we only ship Fraunces 9pt Regular (Italic is not subset) so the
// second-clause emphasis is carried by the muted neutral colour alone,
// not italic. Same visual hierarchy, one less font file on disk.
export const alt = 'Gotcha — a feedback layer for honest teams.';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function OpenGraphImage() {
  const fraunces = readFileSync(join(process.cwd(), 'app', 'Fraunces9pt-Regular.ttf'));

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: '#FAF8F4',
          padding: '72px 96px',
          fontFamily: 'Fraunces, Georgia, serif',
          color: '#1A1714',
          position: 'relative',
        }}
      >
        {/* Hairline top rule — the editorial signature shared with every
            marketing page. A single 1px line, not a border. */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 1,
            background: '#E8E3DA',
          }}
        />

        {/* Eyebrow: sienna dot + mono uppercase micro-label */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: 999,
              background: '#D4532A',
            }}
          />
          <div
            style={{
              fontFamily: 'ui-monospace, Menlo, monospace',
              fontSize: 18,
              textTransform: 'uppercase',
              letterSpacing: '0.2em',
              color: '#6B655D',
            }}
          >
            Gotcha · Feedback SDK
          </div>
        </div>

        {/* Headline — Fraunces display. Second clause muted (same visual
            job as italic in the hero, minus the italic font file). */}
        <div
          style={{
            marginTop: 44,
            fontSize: 88,
            lineHeight: 1.04,
            letterSpacing: '-0.02em',
            fontWeight: 400,
            display: 'flex',
            flexWrap: 'wrap',
            maxWidth: 1000,
          }}
        >
          <span>Where your users talk to you,&nbsp;</span>
          <span style={{ color: '#6B655D' }}>and you talk back</span>
          <span style={{ color: '#D4532A' }}>.</span>
        </div>

        {/* Deck — understated, editorial whitespace. Inter-ish system
            sans because `next/og` doesn't need to download it. */}
        <div
          style={{
            marginTop: 36,
            fontSize: 24,
            lineHeight: 1.5,
            color: '#6B655D',
            fontFamily:
              "-apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', Roboto, sans-serif",
            maxWidth: 900,
          }}
        >
          A React feedback widget and dashboard that closes the loop. No trackers, no cookies, no
          third-party scripts.
        </div>

        {/* Spacer pushes the masthead to the bottom without absolute
            positioning — keeps content and footer from ever colliding
            regardless of how the headline wraps. */}
        <div style={{ flexGrow: 1 }} />

        {/* Footer masthead — quiet, like a newspaper byline row */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontFamily: 'ui-monospace, Menlo, monospace',
            fontSize: 15,
            textTransform: 'uppercase',
            letterSpacing: '0.2em',
            color: '#6B655D',
          }}
        >
          <span>gotcha.cx</span>
          <span>Free tier · No credit card</span>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [{ name: 'Fraunces', data: fraunces, weight: 400, style: 'normal' }],
    }
  );
}
