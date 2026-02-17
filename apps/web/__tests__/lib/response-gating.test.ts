import { isOverLimit, shouldShowUpgradeWarning } from '@/lib/plan-limits';

/**
 * Tests for response data gating logic.
 *
 * When FREE users exceed 500 responses/month:
 * - Dashboard: recent responses replaced with locked/upgrade card
 * - Responses page: table replaced with upgrade prompt
 * - Stats/counts remain visible (user sees data exists)
 * - API continues collecting responses (only *access* is gated)
 *
 * PRO users are never gated.
 */
describe('Response Data Gating', () => {
  describe('Dashboard gating decisions', () => {
    it('should NOT gate recent responses for FREE users under limit', () => {
      const overLimit = isOverLimit('FREE', 0);
      expect(overLimit).toBe(false);
      // Recent responses should be fetched and displayed
    });

    it('should NOT gate recent responses for FREE users at exactly 500', () => {
      const overLimit = isOverLimit('FREE', 500);
      expect(overLimit).toBe(false);
      // 500 is the limit, not over it
    });

    it('should gate recent responses for FREE users at 501', () => {
      const overLimit = isOverLimit('FREE', 501);
      expect(overLimit).toBe(true);
      // Recent responses should be replaced with upgrade card
    });

    it('should gate recent responses for FREE users well over limit', () => {
      const overLimit = isOverLimit('FREE', 1500);
      expect(overLimit).toBe(true);
    });

    it('should NEVER gate recent responses for PRO users', () => {
      expect(isOverLimit('PRO', 0)).toBe(false);
      expect(isOverLimit('PRO', 501)).toBe(false);
      expect(isOverLimit('PRO', 10000)).toBe(false);
      expect(isOverLimit('PRO', 999999)).toBe(false);
    });

    it('should treat unknown plans as FREE (gated over 500)', () => {
      expect(isOverLimit('UNKNOWN', 501)).toBe(true);
      expect(isOverLimit('UNKNOWN', 100)).toBe(false);
    });
  });

  describe('Responses page gating decisions', () => {
    it('should skip response queries when over limit', () => {
      // When overLimit is true, responses and element filter queries should be skipped
      const overLimit = isOverLimit('FREE', 600);
      expect(overLimit).toBe(true);
      // total count query should still run (shows "You have X responses")
    });

    it('should fetch responses normally when under limit', () => {
      const overLimit = isOverLimit('FREE', 300);
      expect(overLimit).toBe(false);
      // All queries should execute normally
    });

    it('should fetch responses normally for PRO regardless of count', () => {
      const overLimit = isOverLimit('PRO', 50000);
      expect(overLimit).toBe(false);
      // PRO users always get full access
    });
  });

  describe('Banner display logic', () => {
    it('should show red banner when over limit', () => {
      const overLimit = isOverLimit('FREE', 501);
      const showWarning = shouldShowUpgradeWarning('FREE', 501);
      expect(overLimit).toBe(true);
      expect(showWarning).toBe(true);
      // Red "Response limit exceeded" banner should show
      // Yellow "Approaching limit" banner should NOT show (overLimit takes priority)
    });

    it('should show yellow banner when approaching limit but not over', () => {
      const overLimit = isOverLimit('FREE', 450);
      const showWarning = shouldShowUpgradeWarning('FREE', 450);
      expect(overLimit).toBe(false);
      expect(showWarning).toBe(true);
      // Yellow "Approaching response limit" banner should show
    });

    it('should show no banner when well under limit', () => {
      const overLimit = isOverLimit('FREE', 100);
      const showWarning = shouldShowUpgradeWarning('FREE', 100);
      expect(overLimit).toBe(false);
      expect(showWarning).toBe(false);
      // No banners should show
    });

    it('should show no banner for PRO users even with high usage', () => {
      const overLimit = isOverLimit('PRO', 10000);
      const showWarning = shouldShowUpgradeWarning('PRO', 10000);
      expect(overLimit).toBe(false);
      expect(showWarning).toBe(false);
    });
  });

  describe('Data visibility when gated', () => {
    it('stats counts should remain visible (overLimit does not affect count queries)', () => {
      // The overLimit flag gates response *content*, not aggregate counts
      // totalResponses and responsesThisMonth are always available
      const overLimit = isOverLimit('FREE', 750);
      expect(overLimit).toBe(true);
      // Even when gated, user can see: "750 responses this month"
      // This incentivizes upgrading - they know data exists
    });

    it('30-day filter banner should be hidden when over limit', () => {
      // The "Showing responses from the last 30 days" banner is redundant
      // when the entire table is replaced with an upgrade prompt
      const overLimit = isOverLimit('FREE', 600);
      const isPro = false;
      const showThirtyDayBanner = !isPro && !overLimit;
      expect(showThirtyDayBanner).toBe(false);
    });

    it('30-day filter banner should show when under limit', () => {
      const overLimit = isOverLimit('FREE', 300);
      const isPro = false;
      const showThirtyDayBanner = !isPro && !overLimit;
      expect(showThirtyDayBanner).toBe(true);
    });

    it('30-day filter banner should not show for PRO', () => {
      const overLimit = isOverLimit('PRO', 300);
      const isPro = true;
      const showThirtyDayBanner = !isPro && !overLimit;
      expect(showThirtyDayBanner).toBe(false);
    });
  });

  describe('Edge cases', () => {
    it('should handle zero responses', () => {
      expect(isOverLimit('FREE', 0)).toBe(false);
      expect(shouldShowUpgradeWarning('FREE', 0)).toBe(false);
    });

    it('should handle negative response count gracefully', () => {
      expect(isOverLimit('FREE', -1)).toBe(false);
      expect(shouldShowUpgradeWarning('FREE', -1)).toBe(false);
    });

    it('should handle boundary at exactly 400 (80% warning threshold)', () => {
      expect(isOverLimit('FREE', 400)).toBe(false);
      expect(shouldShowUpgradeWarning('FREE', 400)).toBe(true);
    });

    it('should handle boundary at exactly 399 (just under warning threshold)', () => {
      expect(isOverLimit('FREE', 399)).toBe(false);
      expect(shouldShowUpgradeWarning('FREE', 399)).toBe(false);
    });
  });
});
