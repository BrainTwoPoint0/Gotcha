import { useState, useCallback, useEffect, useMemo } from 'react';
import { STORAGE_KEYS } from '../constants';
import { getAnonymousId } from '../utils/anonymous';
import { safeGetItem, safeSetItem } from '../utils/localStorage';

interface UseHideAfterSubmitOptions {
  elementId: string;
  userId?: string;
  hideAfterSubmitDays?: number;
}

function getStorageKey(elementId: string, userId: string): string {
  return `${STORAGE_KEYS.HIDDEN_UNTIL}_${elementId}_${userId}`;
}

function checkIsHidden(elementId: string, resolvedUserId: string, hideAfterSubmitDays?: number): boolean {
  if (!hideAfterSubmitDays || hideAfterSubmitDays <= 0) return false;
  const key = getStorageKey(elementId, resolvedUserId);
  const hiddenUntilStr = safeGetItem(key);
  if (!hiddenUntilStr) return false;
  return new Date(hiddenUntilStr).getTime() > Date.now();
}

export function useHideAfterSubmit(options: UseHideAfterSubmitOptions) {
  const { elementId, userId, hideAfterSubmitDays } = options;
  const resolvedUserId = useMemo(() => userId || getAnonymousId(), [userId]);

  const [isHidden, setIsHidden] = useState(() =>
    checkIsHidden(elementId, resolvedUserId, hideAfterSubmitDays)
  );

  // Re-evaluate when props change dynamically
  useEffect(() => {
    setIsHidden(checkIsHidden(elementId, resolvedUserId, hideAfterSubmitDays));
  }, [elementId, resolvedUserId, hideAfterSubmitDays]);

  const markHidden = useCallback(() => {
    if (!hideAfterSubmitDays || hideAfterSubmitDays <= 0) return;

    const key = getStorageKey(elementId, resolvedUserId);
    const hiddenUntil = new Date(
      Date.now() + hideAfterSubmitDays * 24 * 60 * 60 * 1000
    );
    safeSetItem(key, hiddenUntil.toISOString());
    setIsHidden(true);
  }, [elementId, resolvedUserId, hideAfterSubmitDays]);

  return { isHidden, markHidden };
}
