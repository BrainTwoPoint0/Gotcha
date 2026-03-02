'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/app/components/AppButton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
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

interface ProfileFormProps {
  name: string | null;
  email: string;
  companySize: string | null;
  role: string | null;
  industry: string | null;
  useCase: string | null;
}

export function ProfileForm({
  name,
  email,
  companySize,
  role,
  industry,
  useCase,
}: ProfileFormProps) {
  const [formName, setFormName] = useState(name || '');
  const [formCompanySize, setFormCompanySize] = useState(companySize || '');
  const [formRole, setFormRole] = useState(role || '');
  const [formIndustry, setFormIndustry] = useState(industry || '');
  const [formUseCase, setFormUseCase] = useState(useCase || '');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const body: Record<string, unknown> = { name: formName };
      if (formCompanySize) body.companySize = formCompanySize;
      if (formRole) body.role = formRole;
      if (formIndustry) body.industry = formIndustry;
      if (formUseCase) body.useCase = formUseCase;

      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update profile');
      }

      setSuccess(true);
      router.refresh();
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email" className="text-muted-foreground">
          Email
        </Label>
        <Input type="email" id="email" value={email} disabled />
        <p className="text-xs text-muted-foreground">Email cannot be changed</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input
          type="text"
          id="name"
          value={formName}
          onChange={(e) => setFormName(e.target.value)}
          placeholder="Your name"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label>Company Size</Label>
          <Select
            value={formCompanySize || '__none__'}
            onValueChange={(v) => setFormCompanySize(v === '__none__' ? '' : v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Not set" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">Not set</SelectItem>
              {COMPANY_SIZES.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label>Role</Label>
          <Select
            value={formRole || '__none__'}
            onValueChange={(v) => setFormRole(v === '__none__' ? '' : v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Not set" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">Not set</SelectItem>
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
            value={formIndustry || '__none__'}
            onValueChange={(v) => setFormIndustry(v === '__none__' ? '' : v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Not set" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">Not set</SelectItem>
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
            value={formUseCase || '__none__'}
            onValueChange={(v) => setFormUseCase(v === '__none__' ? '' : v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Not set" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">Not set</SelectItem>
              {USE_CASES.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-200 bg-green-50 text-green-800">
          <AlertDescription>Profile updated successfully!</AlertDescription>
        </Alert>
      )}

      <Button type="submit" loading={loading} loadingText="Saving...">
        Save Changes
      </Button>
    </form>
  );
}

interface OrganizationFormProps {
  name: string;
  slug: string;
}

export function OrganizationForm({ name, slug }: OrganizationFormProps) {
  const [formName, setFormName] = useState(name);
  const [formSlug, setFormSlug] = useState(slug);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await fetch('/api/organization', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: formName, slug: formSlug }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update organization');
      }

      setSuccess(true);
      router.refresh();
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleSlugChange = (value: string) => {
    // Only allow lowercase letters, numbers, and hyphens
    const sanitized = value.toLowerCase().replace(/[^a-z0-9-]/g, '');
    setFormSlug(sanitized);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="orgName">Organization Name</Label>
        <Input
          type="text"
          id="orgName"
          value={formName}
          onChange={(e) => setFormName(e.target.value)}
          placeholder="Organization name"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="orgSlug">Slug</Label>
        <Input
          type="text"
          id="orgSlug"
          value={formSlug}
          onChange={(e) => handleSlugChange(e.target.value)}
          className="font-mono"
          placeholder="organization-slug"
        />
        <p className="text-xs text-muted-foreground">
          Only lowercase letters, numbers, and hyphens
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-200 bg-green-50 text-green-800">
          <AlertDescription>Organization updated successfully!</AlertDescription>
        </Alert>
      )}

      <Button type="submit" loading={loading} loadingText="Saving...">
        Save Changes
      </Button>
    </form>
  );
}
