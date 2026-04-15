import React, { useState, useEffect } from 'react';
import { ResolvedTheme } from '../theme/tokens';
import { isTouchDevice } from '../utils/device';

interface FollowUpPromptProps {
  resolvedTheme: ResolvedTheme;
  promptText: string;
  placeholder?: string;
  isLoading: boolean;
  onSubmit: (content: string) => void;
}

/**
 * Follow-up prompt — the deeper question after a low rating or negative
 * vote. Serif italic prompt sets the tone as conversational; the input
 * matches the editorial textarea pattern (transparent, hairline bottom).
 */
export function FollowUpPrompt({
  resolvedTheme: t,
  promptText,
  placeholder,
  isLoading,
  onSubmit,
}: FollowUpPromptProps) {
  const [content, setContent] = useState('');
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    setIsTouch(isTouchDevice());
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || isLoading) return;
    onSubmit(content.trim());
  };

  return (
    <form onSubmit={handleSubmit}>
      <p
        style={{
          margin: '0 0 14px 0',
          fontFamily: t.typography.fontFamilyDisplay,
          fontSize: isTouch ? 17 : 16,
          fontStyle: 'italic',
          color: t.colors.text,
          lineHeight: 1.45,
          letterSpacing: '-0.01em',
        }}
      >
        {promptText}
      </p>

      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={placeholder || 'Tell us more…'}
        maxLength={5000}
        disabled={isLoading}
        aria-label="Follow-up feedback"
        style={{
          width: '100%',
          padding: isTouch ? '12px 0' : '10px 0',
          border: 'none',
          borderBottom: `1px solid ${t.colors.inputBorder}`,
          borderRadius: 0,
          backgroundColor: 'transparent',
          color: t.colors.text,
          fontSize: isTouch ? t.typography.fontSize.lg : t.typography.fontSize.md,
          resize: 'none',
          minHeight: isTouch ? 96 : 72,
          fontFamily: t.typography.fontFamily,
          outline: 'none',
          transition: `border-color ${t.animation.duration.fast} ${t.animation.easing.default}`,
          lineHeight: 1.55,
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderBottomColor = t.colors.inputBorderFocus;
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderBottomColor = t.colors.inputBorder;
        }}
      />

      <button
        type="submit"
        disabled={isLoading || !content.trim()}
        style={{
          width: '100%',
          marginTop: 16,
          padding: isTouch ? '14px 16px' : '11px 16px',
          border: 'none',
          borderRadius: t.borders.radius.sm,
          backgroundColor: !content.trim()
            ? t.colors.buttonBackgroundDisabled
            : t.colors.buttonBackground,
          color: !content.trim() ? t.colors.buttonColorDisabled : t.colors.buttonColor,
          fontSize: t.typography.fontSize.sm,
          fontWeight: t.typography.fontWeight.medium,
          fontFamily: t.typography.fontFamily,
          cursor: isLoading || !content.trim() ? 'not-allowed' : 'pointer',
          transition: `background-color ${t.animation.duration.fast} ${t.animation.easing.default}`,
          fontStyle: isLoading ? 'italic' : 'normal',
        }}
        onMouseEnter={(e) => {
          if (!e.currentTarget.disabled) {
            e.currentTarget.style.backgroundColor = t.colors.buttonBackgroundHover;
          }
        }}
        onMouseLeave={(e) => {
          if (!e.currentTarget.disabled) {
            e.currentTarget.style.backgroundColor = t.colors.buttonBackground;
          }
        }}
      >
        {isLoading ? 'Sending…' : 'Submit'}
      </button>
    </form>
  );
}
