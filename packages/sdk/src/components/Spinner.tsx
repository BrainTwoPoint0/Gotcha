import React from 'react';

interface SpinnerProps {
  size?: number;
  color?: string;
}

export function Spinner({ size = 16, color = 'currentColor' }: SpinnerProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      style={{
        animation: 'gotcha-spin 0.8s linear infinite',
      }}
    >
      <style>
        {`
          @keyframes gotcha-spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          @keyframes gotcha-dash {
            0% { stroke-dasharray: 1, 62; stroke-dashoffset: 0; }
            50% { stroke-dasharray: 40, 62; stroke-dashoffset: -12; }
            100% { stroke-dasharray: 1, 62; stroke-dashoffset: -62; }
          }
        `}
      </style>
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke={color}
        strokeWidth="2"
        strokeOpacity="0.12"
      />
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        style={{
          animation: 'gotcha-dash 1.2s ease-in-out infinite',
        }}
      />
    </svg>
  );
}
