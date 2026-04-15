import React, { useState, useEffect } from 'react';
import { ResolvedTheme } from '../../theme/tokens';
import { isTouchDevice } from '../../utils/device';

interface PollModeProps {
  resolvedTheme: ResolvedTheme;
  options: string[];
  allowMultiple: boolean;
  isLoading: boolean;
  onSubmit: (data: { pollSelected: string[] }) => void;
  initialSelected?: string[] | null;
  isEditing?: boolean;
}

/**
 * Poll mode — newspaper-column list.
 *
 * Layout: flat list of option rows separated by hairline rules (no outer
 * border, no individual card chrome). Selected rows get a 2px sienna
 * left-edge — the single brand moment in this mode, replacing the old
 * full-tint selected background. Check indicator on the right: hairline
 * square for multi-select, hairline circle for single-select.
 *
 * Hover: background darkens to paper-hover tone. No translateX nudge —
 * the rows are columns of text, not buttons that animate laterally.
 */
export function PollMode({
  resolvedTheme: t,
  options,
  allowMultiple,
  isLoading,
  onSubmit,
  initialSelected,
  isEditing = false,
}: PollModeProps) {
  const [selected, setSelected] = useState<string[]>(initialSelected || []);
  const [isTouch, setIsTouch] = useState(false);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  useEffect(() => {
    setIsTouch(isTouchDevice());
  }, []);

  useEffect(() => {
    if (initialSelected) setSelected(initialSelected);
  }, [initialSelected]);

  const handleToggle = (option: string) => {
    if (isLoading) return;
    if (allowMultiple) {
      setSelected((prev) =>
        prev.includes(option) ? prev.filter((o) => o !== option) : [...prev, option]
      );
    } else {
      setSelected((prev) => (prev.includes(option) ? [] : [option]));
    }
  };

  const handleSubmit = () => {
    if (selected.length === 0 || isLoading) return;
    onSubmit({ pollSelected: selected });
  };

  const rowPadding = isTouch ? '14px 14px' : '12px 14px';

  return (
    <div>
      <ul
        role="group"
        aria-label={allowMultiple ? 'Select one or more options' : 'Select an option'}
        style={{
          listStyle: 'none',
          margin: 0,
          padding: 0,
          borderTop: `1px solid ${t.colors.border}`,
        }}
      >
        {options.map((option, index) => {
          const isSelected = selected.includes(option);
          const isHovered = hoverIdx === index;
          return (
            <li
              key={option}
              style={{
                borderBottom: `1px solid ${t.colors.border}`,
                position: 'relative',
                animation: `gotcha-fade-up ${t.animation.duration.normal} ${t.animation.easing.default} both`,
                animationDelay: `${index * 0.04}s`,
              }}
            >
              {/* 2px sienna left-edge on selected — the brand moment.
                  Inset 8px top/bottom so the mark reads as a true pulled
                  margin rule (newspaper-column convention), not a
                  bar-button edge butting against the hairline rows. */}
              {isSelected && (
                <span
                  aria-hidden="true"
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: 8,
                    bottom: 8,
                    width: 2,
                    backgroundColor: t.colors.pollSelectedBorder,
                  }}
                />
              )}
              <button
                type="button"
                onClick={() => handleToggle(option)}
                onMouseEnter={() => setHoverIdx(index)}
                onMouseLeave={() => setHoverIdx(null)}
                disabled={isLoading}
                aria-pressed={isSelected}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  width: '100%',
                  padding: rowPadding,
                  paddingLeft: isSelected
                    ? (isTouch ? 16 : 16)
                    : (isTouch ? 14 : 14),
                  border: 'none',
                  background: isHovered && !isSelected ? t.colors.surfaceHover : 'transparent',
                  color: t.colors.text,
                  fontSize: isTouch ? 15 : t.typography.fontSize.md,
                  fontWeight: isSelected
                    ? t.typography.fontWeight.medium
                    : t.typography.fontWeight.normal,
                  fontFamily: t.typography.fontFamily,
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  transition: `background-color ${t.animation.duration.fast} ${t.animation.easing.default}`,
                  textAlign: 'left',
                  letterSpacing: '0',
                  outline: 'none',
                }}
              >
                <span style={{ flex: 1 }}>{option}</span>

                {/* Indicator on the right — square for multi, circle for single */}
                <span
                  aria-hidden="true"
                  style={{
                    width: 14,
                    height: 14,
                    borderRadius: allowMultiple ? 3 : '50%',
                    border: `1px solid ${isSelected ? t.colors.pollCheckSelectedBorder : t.colors.pollCheckBorder}`,
                    backgroundColor: isSelected ? t.colors.pollCheckSelectedBg : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    transition: `all ${t.animation.duration.fast} ${t.animation.easing.default}`,
                  }}
                >
                  {isSelected && (
                    <svg width={8} height={8} viewBox="0 0 10 10" fill="none">
                      <path
                        d="M2 5L4 7L8 3"
                        stroke={t.colors.primaryText}
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      {/* Submit */}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={isLoading || selected.length === 0}
        style={{
          width: '100%',
          marginTop: 18,
          padding: isTouch ? '14px 16px' : '11px 16px',
          border: 'none',
          borderRadius: t.borders.radius.sm,
          backgroundColor:
            selected.length === 0
              ? t.colors.buttonBackgroundDisabled
              : t.colors.buttonBackground,
          color:
            selected.length === 0
              ? t.colors.buttonColorDisabled
              : t.colors.buttonColor,
          fontSize: t.typography.fontSize.sm,
          fontWeight: t.typography.fontWeight.medium,
          fontFamily: t.typography.fontFamily,
          cursor: isLoading || selected.length === 0 ? 'not-allowed' : 'pointer',
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
        {isLoading
          ? (isEditing ? 'Updating…' : 'Sending…')
          : (isEditing ? 'Update' : 'Submit')}
      </button>
    </div>
  );
}
