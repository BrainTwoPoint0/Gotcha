'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/app/components/AppButton';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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

interface OnboardingBannerProps {
  userName?: string;
}

export function OnboardingBanner({ userName }: OnboardingBannerProps) {
  const [companySize, setCompanySize] = useState('');
  const [role, setRole] = useState('');
  const [industry, setIndustry] = useState('');
  const [useCase, setUseCase] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSave = async () => {
    setLoading(true);
    try {
      const body: Record<string, unknown> = { onboardedAt: true };
      if (companySize) body.companySize = companySize;
      if (role) body.role = role;
      if (industry) body.industry = industry;
      if (useCase) body.useCase = useCase;

      await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      router.refresh();
    } catch {
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="mb-6 max-w-2xl border-l-4 border-l-primary">
      <CardHeader>
        <CardTitle>
          Welcome{userName ? `, ${userName}` : ''}! Tell us a bit about yourself
        </CardTitle>
        <CardDescription>
          This helps us understand our users better. You can always update this in Settings.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div className="space-y-1">
            <Label>Company Size</Label>
            <Select
              value={companySize || '__none__'}
              onValueChange={(v) => setCompanySize(v === '__none__' ? '' : v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Select...</SelectItem>
                {COMPANY_SIZES.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label>Your Role</Label>
            <Select
              value={role || '__none__'}
              onValueChange={(v) => setRole(v === '__none__' ? '' : v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Select...</SelectItem>
                {ROLES.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label>Industry</Label>
            <Select
              value={industry || '__none__'}
              onValueChange={(v) => setIndustry(v === '__none__' ? '' : v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Select...</SelectItem>
                {INDUSTRIES.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label>Primary Use Case</Label>
            <Select
              value={useCase || '__none__'}
              onValueChange={(v) => setUseCase(v === '__none__' ? '' : v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Select...</SelectItem>
                {USE_CASES.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button type="button" onClick={handleSave} loading={loading} loadingText="Saving...">
          Save &amp; Continue
        </Button>
      </CardContent>
    </Card>
  );
}
