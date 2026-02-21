/**
 * Check if a user should be blocked from creating a new checkout session.
 * Users with an active PRO subscription should not be able to double-checkout.
 */
export function shouldBlockCheckout(
  subscription: { plan: string; status: string } | null | undefined
): boolean {
  if (!subscription) return false;
  return subscription.plan === 'PRO' && subscription.status === 'ACTIVE';
}
