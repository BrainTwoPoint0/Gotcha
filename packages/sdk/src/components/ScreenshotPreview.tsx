import React, { useEffect, useState } from 'react';
import { ResolvedTheme } from '../theme/tokens';
import { isTouchDevice } from '../utils/device';

interface ScreenshotPreviewProps {
  src: string;
  onRemove: () => void;
  resolvedTheme: ResolvedTheme;
}

/**
 * Screenshot preview — paper-framed image with a mono caption beneath
 * and a remove affordance that sits in the top-right. At rest the remove
 * button is a hairline X on paper; hover fills clay (the destructive
 * brand moment).
 *
 * On touch devices (no hover), the button is always fully visible —
 * tap-to-reveal-then-tap-to-confirm was two taps for a destructive
 * action and felt wrong.
 */
export function ScreenshotPreview({ src, onRemove, resolvedTheme: t }: ScreenshotPreviewProps) {
  const [isTouch, setIsTouch] = useState(false);
  const [removeHover, setRemoveHover] = useState(false);

  useEffect(() => {
    setIsTouch(isTouchDevice());
  }, []);

  // Approximate the image byte size from the data URL length (base64 ≈ 4/3
  // of the raw bytes). Good enough for a "~142 KB" caption hint.
  const approxKb = (() => {
    if (!src.startsWith('data:')) return null;
    const commaIdx = src.indexOf(',');
    if (commaIdx < 0) return null;
    const b64 = src.slice(commaIdx + 1);
    return Math.round((b64.length * 3) / 4 / 1024);
  })();

  return (
    <div style={{ marginTop: 12 }}>
      <div
        style={{
          position: 'relative',
          borderRadius: t.borders.radius.sm,
          overflow: 'hidden',
          border: `1px solid ${t.colors.border}`,
          padding: 4,
          background: t.colors.background,
        }}
      >
        <img
          src={src}
          alt="Screenshot attached to the feedback"
          style={{
            display: 'block',
            width: '100%',
            maxHeight: 140,
            objectFit: 'cover',
            borderRadius: Math.max(0, t.borders.radius.sm - 2),
          }}
        />
        <button
          type="button"
          onClick={onRemove}
          onMouseEnter={() => setRemoveHover(true)}
          onMouseLeave={() => setRemoveHover(false)}
          aria-label="Remove screenshot"
          style={{
            position: 'absolute',
            top: 8,
            right: 8,
            // Touch: 32×32 so the hit area clears WCAG AAA. Desktop: a
            // tighter 24×24 since cursor precision is higher.
            width: isTouch ? 32 : 24,
            height: isTouch ? 32 : 24,
            borderRadius: '50%',
            border: `1px solid ${removeHover ? t.colors.error : t.colors.border}`,
            backgroundColor: removeHover ? t.colors.error : t.colors.background,
            color: removeHover ? t.colors.primaryText : t.colors.textSecondary,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: `all ${t.animation.duration.fast} ${t.animation.easing.default}`,
          }}
        >
          <svg width={10} height={10} viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path
              d="M1 1L13 13M1 13L13 1"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>
      <p
        style={{
          margin: '6px 0 0',
          fontFamily:
            "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace",
          fontSize: 10,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: t.colors.textSecondary,
        }}
      >
        screenshot.png{approxKb != null ? ` · ${approxKb} KB` : ''}
      </p>
    </div>
  );
}
