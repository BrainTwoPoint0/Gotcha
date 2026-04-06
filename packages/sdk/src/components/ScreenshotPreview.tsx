import React from 'react';
import { ResolvedTheme } from '../theme/tokens';

interface ScreenshotPreviewProps {
  src: string;
  onRemove: () => void;
  resolvedTheme: ResolvedTheme;
}

export function ScreenshotPreview({ src, onRemove, resolvedTheme: t }: ScreenshotPreviewProps) {
  return (
    <div style={{
      position: 'relative',
      marginTop: 10,
      borderRadius: t.borders.radius.md,
      overflow: 'hidden',
      border: `1px solid ${t.colors.border}`,
    }}>
      <img
        src={src}
        alt="Screenshot"
        style={{
          display: 'block',
          width: '100%',
          maxHeight: 120,
          objectFit: 'cover',
        }}
      />
      <button
        type="button"
        onClick={onRemove}
        aria-label="Remove screenshot"
        style={{
          position: 'absolute',
          top: 4,
          right: 4,
          width: 22,
          height: 22,
          borderRadius: '50%',
          border: 'none',
          backgroundColor: 'rgba(0,0,0,0.6)',
          color: '#fff',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 12,
          lineHeight: 1,
        }}
      >
        <svg width={10} height={10} viewBox="0 0 14 14" fill="none">
          <path d="M1 1L13 13M1 13L13 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  );
}
