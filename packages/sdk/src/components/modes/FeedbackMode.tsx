import React, { useState, useEffect } from 'react';
import { GotchaStyles } from '../../types';
import { isTouchDevice } from '../../utils/device';
import { Spinner } from '../Spinner';

interface FeedbackModeProps {
  theme: 'light' | 'dark' | 'custom';
  placeholder?: string;
  submitText: string;
  isLoading: boolean;
  onSubmit: (data: { content?: string; rating?: number }) => void;
  customStyles?: GotchaStyles;
  initialValues?: {
    content?: string | null;
    rating?: number | null;
  };
  isEditing?: boolean;
}

export function FeedbackMode({
  theme,
  placeholder,
  submitText,
  isLoading,
  onSubmit,
  customStyles,
  initialValues,
  isEditing = false,
}: FeedbackModeProps) {
  const [content, setContent] = useState(initialValues?.content || '');
  const [rating, setRating] = useState<number | null>(initialValues?.rating ?? null);
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    setIsTouch(isTouchDevice());
  }, []);

  // Update local state when initialValues change (e.g., after loading existing response)
  useEffect(() => {
    if (initialValues?.content !== undefined) {
      setContent(initialValues.content || '');
    }
    if (initialValues?.rating !== undefined) {
      setRating(initialValues.rating ?? null);
    }
  }, [initialValues?.content, initialValues?.rating]);

  const isDark = theme === 'dark';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && rating === null) return;
    onSubmit({ content: content.trim() || undefined, rating: rating ?? undefined });
  };

  const inputStyles: React.CSSProperties = {
    width: '100%',
    padding: isTouch ? '12px 14px' : '10px 12px',
    border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0'}`,
    borderRadius: 8,
    backgroundColor: isDark ? 'rgba(55,65,81,0.5)' : '#fafbfc',
    color: isDark ? '#f9fafb' : '#111827',
    fontSize: isTouch ? 16 : 14, // 16px prevents iOS zoom on focus
    resize: 'vertical',
    minHeight: isTouch ? 100 : 80,
    fontFamily: 'inherit',
    outline: 'none',
    transition: 'border-color 0.2s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    lineHeight: 1.5,
    ...customStyles?.input,
  };

  const buttonStyles: React.CSSProperties = {
    width: '100%',
    padding: isTouch ? '14px 16px' : '10px 16px',
    border: 'none',
    borderRadius: 8,
    backgroundColor: isDark ? '#e2e8f0' : '#1e293b',
    color: isDark ? '#1e293b' : '#ffffff',
    fontSize: isTouch ? 16 : 14,
    fontWeight: 500,
    cursor: isLoading ? 'not-allowed' : 'pointer',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    letterSpacing: '0.01em',
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
        onFocus={(e) => {
          e.currentTarget.style.borderColor = '#1e293b';
          e.currentTarget.style.boxShadow = '0 0 0 2px rgba(30,41,59,0.15)';
          e.currentTarget.style.backgroundColor = isDark ? 'rgba(55,65,81,0.7)' : '#ffffff';
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0';
          e.currentTarget.style.boxShadow = 'none';
          e.currentTarget.style.backgroundColor = isDark ? 'rgba(55,65,81,0.5)' : '#fafbfc';
        }}
      />

      {/* Submit button */}
      <button
        type="submit"
        disabled={isLoading || (!content.trim() && rating === null)}
        style={{
          ...buttonStyles,
          marginTop: 12,
          opacity: isLoading ? 0.8 : 1,
          backgroundColor: (!content.trim() && rating === null)
            ? (isDark ? '#374151' : '#e2e8f0')
            : (isDark ? '#e2e8f0' : '#1e293b'),
          color: (!content.trim() && rating === null)
            ? (isDark ? '#6b7280' : '#94a3b8')
            : (isDark ? '#1e293b' : '#ffffff'),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
        }}
        onMouseEnter={(e) => {
          if (!e.currentTarget.disabled) {
            e.currentTarget.style.backgroundColor = isDark ? '#cbd5e1' : '#334155';
          }
        }}
        onMouseLeave={(e) => {
          if (!e.currentTarget.disabled) {
            e.currentTarget.style.backgroundColor = isDark ? '#e2e8f0' : '#1e293b';
          }
        }}
      >
        {isLoading && <Spinner size={isTouch ? 18 : 16} color={isDark ? '#1e293b' : '#ffffff'} />}
        {isLoading ? (isEditing ? 'Updating...' : 'Submitting...') : (isEditing ? 'Update' : submitText)}
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
  const starSize = isTouch ? 28 : 18;
  const buttonPadding = isTouch ? 6 : 3;

  return (
    <div
      style={{
        display: 'flex',
        gap: isTouch ? 6 : 2,
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
              color: isFilled ? '#f59e0b' : (isDark ? 'rgba(255,255,255,0.12)' : '#e2e8f0'),
              transition: 'color 0.15s cubic-bezier(0.4, 0, 0.2, 1), transform 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
              transform: (hovered !== null && hovered >= star) ? 'scale(1.1)' : 'scale(1)',
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
