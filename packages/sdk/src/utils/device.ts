/**
 * Detect if the device supports touch
 */
export const isTouchDevice = (): boolean => {
  if (typeof window === 'undefined') return false;
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
};

/**
 * Get the appropriate size based on device type
 */
export const getResponsiveSize = (
  size: 'sm' | 'md' | 'lg',
  isTouch: boolean
): number => {
  const sizes = {
    sm: { desktop: 24, mobile: 32 },
    md: { desktop: 32, mobile: 36 },
    lg: { desktop: 40, mobile: 40 },
  };

  return isTouch ? sizes[size].mobile : sizes[size].desktop;
};
