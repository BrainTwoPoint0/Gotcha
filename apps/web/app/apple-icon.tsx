import { ImageResponse } from 'next/og';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

// Apple touch icon — same editorial G, scaled up to 180x180 for home-screen
// and iOS tab bookmarks. A slightly larger optical padding than the 32px
// favicon because the larger canvas exposes Fraunces's descender length
// more clearly.
export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default async function AppleIcon() {
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
          fontSize: 140,
          lineHeight: 1,
          paddingBottom: 10,
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
