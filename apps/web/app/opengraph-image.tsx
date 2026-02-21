import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Gotcha - Lightweight Feedback SDK for React';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function Image() {
  return new ImageResponse(
    <div
      style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'sans-serif',
      }}
    >
      <div
        style={{
          fontSize: 96,
          fontWeight: 800,
          color: '#f8fafc',
          letterSpacing: '-0.02em',
        }}
      >
        Gotcha
      </div>
      <div
        style={{
          fontSize: 32,
          color: '#94a3b8',
          marginTop: 16,
        }}
      >
        Lightweight Feedback SDK for React
      </div>
    </div>,
    { ...size }
  );
}
