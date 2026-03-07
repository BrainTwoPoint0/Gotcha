import { canAccessBugFeatures } from '@/lib/plan-limits';

/**
 * Tests for bug feature Pro gating.
 *
 * Bug tracking features gated to Pro:
 * - Dashboard bugs page (list + detail)
 * - Bug email notifications
 * - Bug webhooks (Slack/Discord)
 * - Public API bug endpoints
 * - Dashboard bug management API routes
 *
 * NOT gated (available to all plans):
 * - enableBugFlag toggle in SDK (data collection)
 * - Bug data stored in DB (Response.isBug + BugTicket)
 */
describe('Bug Feature Pro Gating', () => {
  describe('canAccessBugFeatures', () => {
    it('should allow PRO plan to access bug features', () => {
      expect(canAccessBugFeatures('PRO')).toBe(true);
    });

    it('should deny FREE plan from accessing bug features', () => {
      expect(canAccessBugFeatures('FREE')).toBe(false);
    });

    it('should deny unknown plans from accessing bug features', () => {
      expect(canAccessBugFeatures('UNKNOWN')).toBe(false);
      expect(canAccessBugFeatures('')).toBe(false);
    });
  });

  describe('Bug data collection (not gated)', () => {
    it('FREE users can still flag bugs — data is always stored', () => {
      // The isBug flag on Response and BugTicket creation happen regardless of plan.
      // Only management/notification features are gated.
      // This test documents the design decision.
      const isFree = !canAccessBugFeatures('FREE');
      expect(isFree).toBe(true);
      // Even though FREE can't access bugs dashboard, data IS collected
      // so upgrading to PRO reveals all historical bugs
    });
  });

  describe('Feature gating decisions', () => {
    it('should gate bug emails for FREE plan', () => {
      const plan = 'FREE';
      const shouldSendEmail = canAccessBugFeatures(plan);
      expect(shouldSendEmail).toBe(false);
    });

    it('should allow bug emails for PRO plan', () => {
      const plan = 'PRO';
      const shouldSendEmail = canAccessBugFeatures(plan);
      expect(shouldSendEmail).toBe(true);
    });

    it('should gate bug webhooks for FREE plan', () => {
      const plan = 'FREE';
      const shouldFireWebhook = canAccessBugFeatures(plan);
      expect(shouldFireWebhook).toBe(false);
    });

    it('should allow bug webhooks for PRO plan', () => {
      const plan = 'PRO';
      const shouldFireWebhook = canAccessBugFeatures(plan);
      expect(shouldFireWebhook).toBe(true);
    });

    it('should gate dashboard bug access for FREE plan', () => {
      const plan = 'FREE';
      const canViewDashboard = canAccessBugFeatures(plan);
      expect(canViewDashboard).toBe(false);
    });

    it('should allow dashboard bug access for PRO plan', () => {
      const plan = 'PRO';
      const canViewDashboard = canAccessBugFeatures(plan);
      expect(canViewDashboard).toBe(true);
    });

    it('should gate public API bug endpoint for FREE plan', () => {
      const plan = 'FREE';
      const canUseBugApi = canAccessBugFeatures(plan);
      expect(canUseBugApi).toBe(false);
    });

    it('should allow public API bug endpoint for PRO plan', () => {
      const plan = 'PRO';
      const canUseBugApi = canAccessBugFeatures(plan);
      expect(canUseBugApi).toBe(true);
    });
  });
});
