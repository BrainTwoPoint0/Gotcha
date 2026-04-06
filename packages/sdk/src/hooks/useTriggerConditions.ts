import { useState, useEffect } from 'react';
import { STORAGE_KEYS } from '../constants';
import { safeGetItem, safeSetItem } from '../utils/localStorage';

interface UseTriggerConditionsOptions {
  elementId: string;
  showAfterSeconds?: number;
  showAfterScrollPercent?: number;
  showAfterVisits?: number;
}

function getVisitKey(elementId: string): string {
  return `${STORAGE_KEYS.VISIT_COUNT}_${elementId}`;
}

export function useTriggerConditions(options: UseTriggerConditionsOptions) {
  const { elementId, showAfterSeconds, showAfterScrollPercent, showAfterVisits } = options;

  const hasConditions = showAfterSeconds != null || showAfterScrollPercent != null || showAfterVisits != null;

  const [timeMet, setTimeMet] = useState(!showAfterSeconds);
  const [scrollMet, setScrollMet] = useState(!showAfterScrollPercent);
  const [visitsMet] = useState(() => {
    if (!showAfterVisits) return true;
    const key = getVisitKey(elementId);
    const current = parseInt(safeGetItem(key) || '0', 10);
    const next = current + 1;
    safeSetItem(key, String(next));
    return next >= showAfterVisits;
  });

  // Time delay
  useEffect(() => {
    if (!showAfterSeconds || showAfterSeconds <= 0) return;

    const start = Date.now();
    const targetMs = showAfterSeconds * 1000;

    const check = () => {
      if (Date.now() - start >= targetMs) {
        setTimeMet(true);
      } else {
        timer = setTimeout(check, Math.min(1000, targetMs - (Date.now() - start)));
      }
    };

    let timer = setTimeout(check, Math.min(1000, targetMs));
    return () => clearTimeout(timer);
  }, [showAfterSeconds]);

  // Scroll depth
  useEffect(() => {
    if (!showAfterScrollPercent || showAfterScrollPercent <= 0) return;

    const checkScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight;
      const viewportHeight = window.innerHeight;

      // If page can't scroll, condition is auto-met
      if (scrollHeight <= viewportHeight) {
        setScrollMet(true);
        return;
      }

      const scrolled = (window.scrollY + viewportHeight) / scrollHeight * 100;
      if (scrolled >= showAfterScrollPercent) {
        setScrollMet(true);
      }
    };

    checkScroll();
    if (!scrollMet) {
      window.addEventListener('scroll', checkScroll, { passive: true });
      return () => window.removeEventListener('scroll', checkScroll);
    }
  }, [showAfterScrollPercent, scrollMet]);

  return {
    conditionsMet: !hasConditions || (timeMet && scrollMet && visitsMet),
  };
}
