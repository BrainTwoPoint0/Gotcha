import React, { useState, useEffect } from 'react';
import { isTouchDevice } from '../../utils/device';
import { Spinner } from '../Spinner';

interface PollModeProps {
  theme: 'light' | 'dark' | 'custom';
  options: string[];
  allowMultiple: boolean;
  isLoading: boolean;
  onSubmit: (data: { pollSelected: string[] }) => void;
  initialSelected?: string[] | null;
  isEditing?: boolean;
}

export function PollMode({
  theme,
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

  const isDark = theme === 'dark';

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

  const getOptionStyles = (option: string): React.CSSProperties => {
    const isSelected = selected.includes(option);
    return {
      width: '100%',
      padding: isTouch ? '12px 14px' : '9px 12px',
      border: `1px solid ${isSelected
        ? (isDark ? 'rgba(226,232,240,0.25)' : 'rgba(30,41,59,0.25)')
        : (isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0')}`,
      borderRadius: isTouch ? 10 : 8,
      backgroundColor: isSelected
        ? (isDark ? 'rgba(226,232,240,0.08)' : 'rgba(30,41,59,0.05)')
        : (isDark ? 'rgba(55,65,81,0.5)' : '#fafbfc'),
      color: isSelected
        ? (isDark ? '#e2e8f0' : '#1e293b')
        : (isDark ? '#d1d5db' : '#374151'),
      fontSize: isTouch ? 15 : 13,
      fontWeight: 500,
      cursor: isLoading ? 'not-allowed' : 'pointer',
      transition: 'background-color 0.2s, border-color 0.2s, color 0.2s',
      textAlign: 'left' as const,
      letterSpacing: '0.01em',
      display: 'flex',
      alignItems: 'center',
      gap: 8,
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
        {options.map((option) => {
          const isSelected = selected.includes(option);
          return (
            <button
              key={option}
              type="button"
              onClick={() => handleToggle(option)}
              disabled={isLoading}
              style={getOptionStyles(option)}
              aria-pressed={isSelected}
            >
              <span
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: allowMultiple ? 4 : '50%',
                  border: `2px solid ${isSelected
                    ? (isDark ? '#e2e8f0' : '#1e293b')
                    : (isDark ? 'rgba(255,255,255,0.2)' : '#cbd5e1')}`,
                  backgroundColor: isSelected
                    ? (isDark ? '#e2e8f0' : '#1e293b')
                    : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  transition: 'all 0.15s',
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
          border: 'none',
          borderRadius: 8,
          backgroundColor: selected.length === 0
            ? (isDark ? '#374151' : '#e2e8f0')
            : (isDark ? '#e2e8f0' : '#1e293b'),
          color: selected.length === 0
            ? (isDark ? '#6b7280' : '#94a3b8')
            : (isDark ? '#1e293b' : '#ffffff'),
          fontSize: isTouch ? 16 : 14,
          fontWeight: 500,
          cursor: isLoading || selected.length === 0 ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          letterSpacing: '0.01em',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          opacity: isLoading ? 0.8 : 1,
        }}
        onMouseEnter={(e) => {
          if (!e.currentTarget.disabled) {
            e.currentTarget.style.backgroundColor = isDark ? '#cbd5e1' : '#334155';
          }
        }}
        onMouseLeave={(e) => {
          if (!e.currentTarget.disabled) {
            e.currentTarget.style.backgroundColor = selected.length === 0
              ? (isDark ? '#374151' : '#e2e8f0')
              : (isDark ? '#e2e8f0' : '#1e293b');
          }
        }}
      >
        {isLoading && <Spinner size={isTouch ? 18 : 16} color={isDark ? '#1e293b' : '#ffffff'} />}
        {isLoading ? (isEditing ? 'Updating...' : 'Submitting...') : (isEditing ? 'Update' : 'Submit')}
      </button>
    </div>
  );
}
