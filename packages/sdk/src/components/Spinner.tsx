import React from 'react';

interface SpinnerProps {
  size?: number;
  color?: string;
}

/**
 * Editorial spinner — a hairline arc rotating over a faint full circle.
 * Only used in the "checking for existing response" path on the modal;
 * submit buttons switched to italic "Sending…" text instead. Minimal,
 * quiet, matches the one-px-hairline discipline of the rest of the
 * widget.
 */
export function Spinner({ size = 16, color = 'currentColor' }: SpinnerProps) {
  const radius = 9;
  const circumference = 2 * Math.PI * radius;
  // Show a ~25% arc (90 degrees).
  const arc = circumference * 0.25;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      role="img"
      aria-label="Loading"
      style={{
        animation: 'gotcha-spin 1.1s linear infinite',
        transformOrigin: 'center',
      }}
    >
      <circle
        cx="12"
        cy="12"
        r={radius}
        stroke={color}
        strokeOpacity="0.18"
        strokeWidth="1.25"
        fill="none"
      />
      <circle
        cx="12"
        cy="12"
        r={radius}
        stroke={color}
        strokeWidth="1.25"
        strokeLinecap="round"
        fill="none"
        strokeDasharray={`${arc} ${circumference}`}
        strokeDashoffset="0"
      />
    </svg>
  );
}
