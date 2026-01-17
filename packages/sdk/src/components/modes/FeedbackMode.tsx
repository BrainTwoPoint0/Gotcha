import React, { useState, useEffect } from 'react';
import { GotchaStyles } from '../../types';
import { isTouchDevice } from '../../utils/device';

interface FeedbackModeProps {
  theme: 'light' | 'dark' | 'custom';
  placeholder?: string;
  submitText: string;
  isLoading: boolean;
  onSubmit: (data: { content?: string; rating?: number }) => void;
  customStyles?: GotchaStyles;
}

export function FeedbackMode({
  theme,
  placeholder,
  submitText,
  isLoading,
  onSubmit,
  customStyles,
}: FeedbackModeProps) {
  const [content, setContent] = useState('');
  const [rating, setRating] = useState<number | null>(null);
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    setIsTouch(isTouchDevice());
  }, []);

  const isDark = theme === 'dark';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && rating === null) return;
    onSubmit({ content: content.trim() || undefined, rating: rating ?? undefined });
  };

  const inputStyles: React.CSSProperties = {
    width: '100%',
    padding: isTouch ? '12px 14px' : '10px 12px',
    border: `1px solid ${isDark ? '#374151' : '#d1d5db'}`,
    borderRadius: isTouch ? 8 : 6,
    backgroundColor: isDark ? '#374151' : '#ffffff',
    color: isDark ? '#f9fafb' : '#111827',
    fontSize: isTouch ? 16 : 14, // 16px prevents iOS zoom on focus
    resize: 'vertical',
    minHeight: isTouch ? 100 : 80,
    fontFamily: 'inherit',
    ...customStyles?.input,
  };

  const buttonStyles: React.CSSProperties = {
    width: '100%',
    padding: isTouch ? '14px 16px' : '10px 16px',
    border: 'none',
    borderRadius: isTouch ? 8 : 6,
    backgroundColor: isLoading ? (isDark ? '#4b5563' : '#9ca3af') : '#6366f1',
    color: '#ffffff',
    fontSize: isTouch ? 16 : 14,
    fontWeight: 500,
    cursor: isLoading ? 'not-allowed' : 'pointer',
    transition: 'background-color 150ms ease',
    ...customStyles?.submitButton,
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Rating (optional) */}
      <div style={{ marginBottom: isTouch ? 16 : 12 }}>
        <StarRating value={rating} onChange={setRating} isDark={isDark} isTouch={isTouch} />
      </div>

      {/* Text input */}
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={placeholder || 'Share your thoughts...'}
        style={inputStyles}
        disabled={isLoading}
        aria-label="Your feedback"
      />

      {/* Submit button */}
      <button
        type="submit"
        disabled={isLoading || (!content.trim() && rating === null)}
        style={{
          ...buttonStyles,
          marginTop: 12,
          opacity: (!content.trim() && rating === null) ? 0.5 : 1,
        }}
      >
        {isLoading ? 'Submitting...' : submitText}
      </button>
    </form>
  );
}

interface StarRatingProps {
  value: number | null;
  onChange: (rating: number) => void;
  isDark: boolean;
  isTouch: boolean;
}

function StarRating({ value, onChange, isDark, isTouch }: StarRatingProps) {
  const [hovered, setHovered] = useState<number | null>(null);
  const starSize = isTouch ? 32 : 20;
  const buttonPadding = isTouch ? 6 : 2;

  return (
    <div
      style={{
        display: 'flex',
        gap: isTouch ? 8 : 4,
      }}
      role="group"
      aria-label="Rating"
    >
      {[1, 2, 3, 4, 5].map((star) => {
        const isFilled = (hovered ?? value ?? 0) >= star;
        return (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(null)}
            aria-label={`Rate ${star} out of 5`}
            aria-pressed={value === star}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: buttonPadding,
              color: isFilled ? '#f59e0b' : (isDark ? '#4b5563' : '#d1d5db'),
              transition: 'color 150ms ease',
            }}
          >
            <svg width={starSize} height={starSize} viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          </button>
        );
      })}
    </div>
  );
}
