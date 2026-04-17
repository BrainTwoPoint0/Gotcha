import { ImageResponse } from 'next/og';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

// Dynamic favicon — Fraunces "G" matching the navbar wordmark and the
// SDK widget's G button. Overrides any stale public/favicon.ico so the
// browser-tab icon ships with the rebrand.
export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

export default async function Icon() {
  // Read from disk rather than fetch(import.meta.url). Next.js rewrites
  // the URL to /_next/static/media/... at build time, which fetch() can
  // neither resolve nor parse during static generation. readFileSync
  // against process.cwd() is deterministic and works in both build and
  // request contexts (node runtime).
  const fraunces = readFileSync(join(process.cwd(), 'app', 'Fraunces9pt-Regular.ttf'));

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#FAF8F4',
          color: '#1A1714',
          fontFamily: 'Fraunces',
          fontSize: 26,
          lineHeight: 1,
          // Optical nudge — Fraunces's descender on G sits below the metric
          // baseline, so a 1px upward shift lands the glyph visually centered
          // at 32px. Without this the "G" reads slightly high.
          paddingBottom: 2,
        }}
      >
        G
      </div>
    ),
    {
      ...size,
      fonts: [{ name: 'Fraunces', data: fraunces, weight: 400, style: 'normal' }],
    }
  );
}
