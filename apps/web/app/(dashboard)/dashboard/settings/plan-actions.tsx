'use client';

import { useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { EditorialButton } from '../../components/editorial/button';

interface PlanActionsProps {
  currentPlan: string;
  hasStripeSubscription: boolean;
}

export function PlanActions({ currentPlan, hasStripeSubscription }: PlanActionsProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [billing, setBilling] = useState<'monthly' | 'annual'>('monthly');

  const handleUpgrade = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
        body: JSON.stringify({ billing }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error || 'Failed to start checkout');
      }
    } catch (err) {
      console.error('Upgrade error:', err);
      setError('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleManage = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/stripe/portal', {
        method: 'POST',
        headers: { 'X-Requested-With': 'XMLHttpRequest' },
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error || 'Failed to open portal');
      }
    } catch (err) {
      console.error('Portal error:', err);
      setError('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {error && (
        <div
          role="alert"
          className="mb-4 border-l-2 border-editorial-alert bg-editorial-alert/[0.04] px-4 py-3 text-[13px] text-editorial-alert"
        >
          {error}
        </div>
      )}

      {currentPlan === 'PRO' ? (
        hasStripeSubscription ? (
          <EditorialButton variant="ghost" onClick={handleManage} disabled={loading}>
            {loading ? 'Loading…' : 'Manage subscription'}
          </EditorialButton>
        ) : (
          <p className="text-[13px] text-editorial-neutral-3">
            Your Pro plan was activated manually. No billing to manage.
          </p>
        )
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <span
              className={`text-[13px] ${billing === 'monthly' ? 'text-editorial-ink' : 'text-editorial-neutral-3'}`}
            >
              Monthly
            </span>
            <Switch
              checked={billing === 'annual'}
              onCheckedChange={(checked) => setBilling(checked ? 'annual' : 'monthly')}
              aria-label="Toggle annual billing"
            />
            <span
              className={`text-[13px] ${billing === 'annual' ? 'text-editorial-ink' : 'text-editorial-neutral-3'}`}
            >
              Annual
            </span>
            {billing === 'annual' && (
              <span className="inline-flex items-center rounded-md border border-editorial-success/30 bg-editorial-success/[0.08] px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.18em] text-editorial-success">
                Save 17%
              </span>
            )}
          </div>
          <EditorialButton variant="ink" onClick={handleUpgrade} disabled={loading}>
            {loading
              ? 'Loading…'
              : `Upgrade to Pro · ${billing === 'annual' ? '$24/mo (billed annually)' : '$29/month'}`}
          </EditorialButton>
        </div>
      )}
    </div>
  );
}
