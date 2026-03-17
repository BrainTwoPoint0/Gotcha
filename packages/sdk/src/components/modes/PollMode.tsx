import React, { useState, useEffect } from 'react';
import { ResolvedTheme } from '../../theme/tokens';
import { isTouchDevice } from '../../utils/device';
import { Spinner } from '../Spinner';

interface PollModeProps {
  resolvedTheme: ResolvedTheme;
  options: string[];
  allowMultiple: boolean;
  isLoading: boolean;
  onSubmit: (data: { pollSelected: string[] }) => void;
  initialSelected?: string[] | null;
  isEditing?: boolean;
}

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

  useEffect(() => {
    setIsTouch(isTouchDevice());
  }, []);

  useEffect(() => {
    if (initialSelected) {
      setSelected(initialSelected);
    }
  }, [initialSelected]);

  const handleToggle = (option: string) => {
    if (allowMultiple) {
      setSelected((prev) =>
        prev.includes(option) ? prev.filter((o) => o !== option) : [...prev, option]
      );
    } else {
      setSelected((prev) => (prev.includes(option) ? [] : [option]));
    }
  };

  const handleSubmit = () => {
    if (selected.length === 0) return;
    onSubmit({ pollSelected: selected });
  };

  const getOptionStyles = (option: string, index: number): React.CSSProperties => {
    const isSelected = selected.includes(option);
    return {
      width: '100%',
      padding: isTouch ? '12px 14px' : '9px 12px',
      border: `1px solid ${isSelected ? t.colors.pollSelectedBorder : t.colors.pollBorder}`,
      borderRadius: t.borders.radius.lg - 2,
      backgroundColor: isSelected ? t.colors.pollSelectedBackground : t.colors.pollBackground,
      color: isSelected ? t.colors.pollSelectedColor : t.colors.pollColor,
      fontSize: isTouch ? 15 : t.typography.fontSize.sm,
      fontWeight: isSelected ? t.typography.fontWeight.semibold : t.typography.fontWeight.medium,
      fontFamily: t.typography.fontFamily,
      cursor: isLoading ? 'not-allowed' : 'pointer',
      transition: `all 0.2s ${t.animation.easing.default}`,
      textAlign: 'left' as const,
      letterSpacing: '0.01em',
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      animation: `gotcha-fade-up ${t.animation.duration.normal} ${t.animation.easing.default} both`,
      animationDelay: `${index * 0.05}s`,
    };
  };

  return (
    <div>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: isTouch ? 8 : 6,
        }}
        role="group"
        aria-label={allowMultiple ? 'Select one or more options' : 'Select an option'}
      >
        {options.map((option, index) => {
          const isSelected = selected.includes(option);
          return (
            <button
              key={option}
              type="button"
              onClick={() => handleToggle(option)}
              disabled={isLoading}
              style={getOptionStyles(option, index)}
              aria-pressed={isSelected}
              onMouseEnter={(e) => {
                if (!isLoading) {
                  e.currentTarget.style.transform = 'translateX(2px)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateX(0)';
              }}
            >
              <span
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: allowMultiple ? 4 : '50%',
                  border: `2px solid ${isSelected ? t.colors.pollCheckSelectedBorder : t.colors.pollCheckBorder}`,
                  backgroundColor: isSelected ? t.colors.pollCheckSelectedBg : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  transition: `all ${t.animation.duration.fast}`,
                }}
              >
                {isSelected && (
                  <svg width={10} height={10} viewBox="0 0 12 12" fill="none">
                    <path
                      d="M2 6l3 3 5-5"
                      stroke="#fff"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </span>
              {option}
            </button>
          );
        })}
      </div>

      <button
        type="button"
        onClick={handleSubmit}
        disabled={isLoading || selected.length === 0}
        style={{
          width: '100%',
          marginTop: 12,
          padding: isTouch ? '14px 16px' : '10px 16px',
          border: t.colors.buttonBorder,
          borderRadius: t.borders.radius.md,
          backgroundColor: selected.length === 0 ? t.colors.buttonBackgroundDisabled : t.colors.buttonBackground,
          color: selected.length === 0 ? t.colors.buttonColorDisabled : t.colors.buttonColor,
          fontSize: isTouch ? t.typography.fontSize.lg : t.typography.fontSize.md,
          fontWeight: t.typography.fontWeight.medium,
          fontFamily: t.typography.fontFamily,
          cursor: isLoading || selected.length === 0 ? 'not-allowed' : 'pointer',
          transition: `all ${t.animation.duration.fast} ${t.animation.easing.default}`,
          letterSpacing: '0.01em',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          opacity: isLoading ? 0.8 : 1,
          ...(isLoading ? {
            backgroundImage: `linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.1) 50%, transparent 100%)`,
            backgroundSize: '200% 100%',
            animation: 'gotcha-shimmer 1.5s ease infinite',
          } : {}),
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
            e.currentTarget.style.backgroundColor = selected.length === 0
              ? t.colors.buttonBackgroundDisabled
              : t.colors.buttonBackground;
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }
        }}
      >
        {isLoading && <Spinner size={isTouch ? 18 : 16} color={t.colors.buttonColor} />}
        {isLoading ? (isEditing ? 'Updating...' : 'Submitting...') : (isEditing ? 'Update' : 'Submit')}
      </button>
    </div>
  );
}
