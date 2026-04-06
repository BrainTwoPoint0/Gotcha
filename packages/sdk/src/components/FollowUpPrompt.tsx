import React, { useState, useEffect } from 'react';
import { ResolvedTheme } from '../theme/tokens';
import { isTouchDevice } from '../utils/device';
import { Spinner } from './Spinner';

interface FollowUpPromptProps {
  resolvedTheme: ResolvedTheme;
  promptText: string;
  placeholder?: string;
  isLoading: boolean;
  onSubmit: (content: string) => void;
}

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
    if (!content.trim()) return;
    onSubmit(content.trim());
  };

  return (
    <form onSubmit={handleSubmit}>
      <p style={{
        margin: '0 0 12px 0',
        fontSize: t.typography.fontSize.sm,
        color: t.colors.textSecondary,
        lineHeight: 1.4,
        fontFamily: t.typography.fontFamily,
      }}>
        {promptText}
      </p>

      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={placeholder || 'Tell us more...'}
        maxLength={5000}
        disabled={isLoading}
        aria-label="Follow-up feedback"
        style={{
          width: '100%',
          padding: isTouch ? '12px 14px' : '10px 12px',
          border: `1px solid ${t.colors.inputBorder}`,
          borderRadius: t.borders.radius.md,
          backgroundColor: t.colors.inputBackground,
          color: t.colors.text,
          fontSize: isTouch ? t.typography.fontSize.lg : t.typography.fontSize.md,
          resize: 'none',
          minHeight: isTouch ? 100 : 80,
          fontFamily: t.typography.fontFamily,
          outline: 'none',
          transition: `border-color ${t.animation.duration.fast} ${t.animation.easing.default}, box-shadow ${t.animation.duration.fast} ${t.animation.easing.default}`,
          lineHeight: 1.5,
          boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.04)',
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = t.colors.inputBorderFocus;
          e.currentTarget.style.boxShadow = `0 0 0 3px ${t.colors.inputFocusRing}`;
          e.currentTarget.style.backgroundColor = t.colors.inputBackgroundFocus;
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = t.colors.inputBorder;
          e.currentTarget.style.boxShadow = 'inset 0 1px 2px rgba(0,0,0,0.04)';
          e.currentTarget.style.backgroundColor = t.colors.inputBackground;
        }}
      />

      <button
        type="submit"
        disabled={isLoading || !content.trim()}
        style={{
          width: '100%',
          marginTop: 12,
          padding: isTouch ? '14px 16px' : '10px 16px',
          border: t.colors.buttonBorder,
          borderRadius: t.borders.radius.md,
          backgroundColor: !content.trim() ? t.colors.buttonBackgroundDisabled : t.colors.buttonBackground,
          color: !content.trim() ? t.colors.buttonColorDisabled : t.colors.buttonColor,
          fontSize: isTouch ? t.typography.fontSize.lg : t.typography.fontSize.md,
          fontWeight: t.typography.fontWeight.medium,
          fontFamily: t.typography.fontFamily,
          cursor: isLoading ? 'not-allowed' : 'pointer',
          transition: `all ${t.animation.duration.fast} ${t.animation.easing.default}`,
          letterSpacing: '0.01em',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          opacity: isLoading ? 0.8 : 1,
        }}
        onMouseEnter={(e) => {
          if (!e.currentTarget.disabled) {
            e.currentTarget.style.backgroundColor = t.colors.buttonBackgroundHover;
            e.currentTarget.style.transform = 'translateY(-1px)';
            e.currentTarget.style.boxShadow = t.shadows.button;
          }
        }}
        onMouseLeave={(e) => {
          if (!e.currentTarget.disabled) {
            e.currentTarget.style.backgroundColor = t.colors.buttonBackground;
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }
        }}
      >
        {isLoading && <Spinner size={isTouch ? 18 : 16} color={t.colors.buttonColor} />}
        {isLoading ? 'Sending...' : 'Submit'}
      </button>
    </form>
  );
}
