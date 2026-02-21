import { shouldBlockCheckout } from '@/lib/stripe-guards';

describe('shouldBlockCheckout', () => {
  it('blocks checkout when plan is PRO and status is ACTIVE', () => {
    expect(shouldBlockCheckout({ plan: 'PRO', status: 'ACTIVE' })).toBe(true);
  });

  it('allows checkout when plan is FREE', () => {
    expect(shouldBlockCheckout({ plan: 'FREE', status: 'ACTIVE' })).toBe(false);
  });

  it('allows checkout when subscription is null', () => {
    expect(shouldBlockCheckout(null)).toBe(false);
  });

  it('allows checkout when PRO but CANCELED', () => {
    expect(shouldBlockCheckout({ plan: 'PRO', status: 'CANCELED' })).toBe(false);
  });
});
