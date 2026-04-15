'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { EditorialButton } from '../components/editorial/button';

const COMPANY_SIZES = [
  { value: 'solo', label: 'Solo / Freelancer' },
  { value: '2-10', label: '2–10 employees' },
  { value: '11-50', label: '11–50 employees' },
  { value: '50+', label: '50+ employees' },
];

const ROLES = [
  { value: 'founder', label: 'Founder / CEO' },
  { value: 'engineer', label: 'Engineer' },
  { value: 'pm', label: 'Product Manager' },
  { value: 'designer', label: 'Designer' },
  { value: 'other', label: 'Other' },
];

const INDUSTRIES = [
  { value: 'saas', label: 'SaaS' },
  { value: 'ecommerce', label: 'E-commerce' },
  { value: 'education', label: 'Education' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'agency', label: 'Agency' },
  { value: 'fintech', label: 'Fintech / VC' },
  { value: 'analytics', label: 'Analytics / Data' },
  { value: 'media', label: 'Media / Content' },
  { value: 'devtools', label: 'Developer Tools' },
  { value: 'other', label: 'Other' },
];

const USE_CASES = [
  { value: 'user-feedback', label: 'User Feedback' },
  { value: 'feature-validation', label: 'Feature Validation' },
  { value: 'bug-reports', label: 'Bug Reports' },
  { value: 'nps', label: 'NPS / Satisfaction' },
  { value: 'polls', label: 'Polls' },
  { value: 'other', label: 'Other' },
];

const SELECT_TRIGGER_CLASS =
  'h-10 rounded-md border-editorial-neutral-2 bg-editorial-paper text-[14px] text-editorial-ink focus:border-editorial-accent focus:ring-2 focus:ring-editorial-accent/25';

function Field({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-2">
      <span className="block font-mono text-[10px] uppercase tracking-[0.18em] text-editorial-ink">
        {label}
      </span>
      <Select
        value={value || '__none__'}
        onValueChange={(v) => onChange(v === '__none__' ? '' : v)}
      >
        <SelectTrigger aria-label={label} className={SELECT_TRIGGER_CLASS}>
          <SelectValue placeholder="Select…" />
        </SelectTrigger>
        <SelectContent className="editorial border-editorial-neutral-2 bg-editorial-paper">
          <SelectItem value="__none__">Select…</SelectItem>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

interface OnboardingBannerProps {
  userName?: string;
}

export function OnboardingBanner({ userName }: OnboardingBannerProps) {
  const [companySize, setCompanySize] = useState('');
  const [role, setRole] = useState('');
  const [industry, setIndustry] = useState('');
  const [useCase, setUseCase] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSave = async () => {
    setLoading(true);
    setError(null);
    try {
      const body: Record<string, unknown> = { onboardedAt: true };
      if (companySize) body.companySize = companySize;
      if (role) body.role = role;
      if (industry) body.industry = industry;
      if (useCase) body.useCase = useCase;

      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Could not save your profile');
      }
      // Success — banner disappears because onboardedAt is now set on the user.
      router.refresh();
    } catch (err) {
      // Leave the banner visible so the user can retry. Don't mark them
      // onboarded if the save failed — that would silently strand them
      // without the profile data we need.
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mb-10 overflow-hidden rounded-md border-l-2 border-editorial-accent bg-editorial-paper">
      <div className="border-b border-editorial-neutral-2 px-6 py-5">
        <div className="mb-3 flex items-center gap-3">
          <span className="h-px w-6 bg-editorial-accent" aria-hidden="true" />
          <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-editorial-neutral-3">
            Quick intro
          </span>
        </div>
        <h2 className="font-display text-[1.5rem] font-normal leading-[1.15] tracking-[-0.01em] text-editorial-ink">
          Welcome{userName ? `, ${userName}` : ''} — tell us a bit about yourself
        </h2>
        <p className="mt-2 max-w-2xl text-[14px] leading-[1.6] text-editorial-neutral-3">
          This helps shape which features we prioritise for teams like yours. You can update it
          anytime in Settings.
        </p>
      </div>
      <div className="px-6 py-6">
        <div className="mb-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Field
            label="Company size"
            options={COMPANY_SIZES}
            value={companySize}
            onChange={setCompanySize}
          />
          <Field label="Your role" options={ROLES} value={role} onChange={setRole} />
          <Field label="Industry" options={INDUSTRIES} value={industry} onChange={setIndustry} />
          <Field
            label="Primary use case"
            options={USE_CASES}
            value={useCase}
            onChange={setUseCase}
          />
        </div>
        {error && (
          <div
            role="alert"
            className="mb-4 border-l-2 border-editorial-alert bg-editorial-alert/[0.04] px-4 py-3 text-[13px] text-editorial-alert"
          >
            {error}
          </div>
        )}
        <EditorialButton type="button" variant="ink" onClick={handleSave} disabled={loading}>
          {loading ? 'Saving…' : 'Save & continue'}
        </EditorialButton>
      </div>
    </div>
  );
}
