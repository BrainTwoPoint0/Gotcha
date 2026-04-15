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
import { EditorialButton } from '../../components/editorial/button';
import { EditorialFormField, EditorialInput } from '../../components/editorial/form-field';

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

function EditorialSelect({
  options,
  value,
  onChange,
  ariaLabel,
}: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  ariaLabel: string;
}) {
  return (
    <Select value={value || '__none__'} onValueChange={(v) => onChange(v === '__none__' ? '' : v)}>
      <SelectTrigger aria-label={ariaLabel} className={SELECT_TRIGGER_CLASS}>
        <SelectValue placeholder="Not set" />
      </SelectTrigger>
      <SelectContent className="editorial border-editorial-neutral-2 bg-editorial-paper">
        <SelectItem value="__none__">Not set</SelectItem>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function StatusMessage({
  kind,
  children,
}: {
  kind: 'error' | 'success';
  children: React.ReactNode;
}) {
  const tone =
    kind === 'error'
      ? 'border-editorial-alert bg-editorial-alert/[0.04] text-editorial-alert'
      : 'border-editorial-success bg-editorial-success/[0.04] text-editorial-success';
  return (
    <div
      role={kind === 'error' ? 'alert' : 'status'}
      className={`border-l-2 px-4 py-3 text-[13px] ${tone}`}
    >
      {children}
    </div>
  );
}

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
        headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
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
    <form onSubmit={handleSubmit} className="space-y-5">
      <EditorialFormField label="Email" htmlFor="email" hint="Email cannot be changed.">
        <EditorialInput type="email" id="email" value={email} disabled />
      </EditorialFormField>

      <EditorialFormField label="Name" htmlFor="name">
        <EditorialInput
          type="text"
          id="name"
          value={formName}
          onChange={(e) => setFormName(e.target.value)}
          placeholder="Your name"
          autoComplete="name"
        />
      </EditorialFormField>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <EditorialFormField label="Company size">
          <EditorialSelect
            options={COMPANY_SIZES}
            value={formCompanySize}
            onChange={setFormCompanySize}
            ariaLabel="Company size"
          />
        </EditorialFormField>

        <EditorialFormField label="Role">
          <EditorialSelect
            options={ROLES}
            value={formRole}
            onChange={setFormRole}
            ariaLabel="Role"
          />
        </EditorialFormField>

        <EditorialFormField label="Industry">
          <EditorialSelect
            options={INDUSTRIES}
            value={formIndustry}
            onChange={setFormIndustry}
            ariaLabel="Industry"
          />
        </EditorialFormField>

        <EditorialFormField label="Primary use case">
          <EditorialSelect
            options={USE_CASES}
            value={formUseCase}
            onChange={setFormUseCase}
            ariaLabel="Primary use case"
          />
        </EditorialFormField>
      </div>

      {error && <StatusMessage kind="error">{error}</StatusMessage>}
      {success && <StatusMessage kind="success">Profile updated.</StatusMessage>}

      <div className="pt-2">
        <EditorialButton type="submit" variant="ink" disabled={loading}>
          {loading ? 'Saving…' : 'Save changes'}
        </EditorialButton>
      </div>
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
        headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
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
    const sanitized = value.toLowerCase().replace(/[^a-z0-9-]/g, '');
    setFormSlug(sanitized);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <EditorialFormField label="Workspace name" htmlFor="orgName">
        <EditorialInput
          type="text"
          id="orgName"
          value={formName}
          onChange={(e) => setFormName(e.target.value)}
          placeholder="Workspace name"
        />
      </EditorialFormField>

      <EditorialFormField
        label="Slug"
        htmlFor="orgSlug"
        hint="Lowercase letters, numbers, and hyphens only."
      >
        <EditorialInput
          type="text"
          id="orgSlug"
          value={formSlug}
          onChange={(e) => handleSlugChange(e.target.value)}
          className="font-mono"
          placeholder="workspace-slug"
          autoComplete="off"
          spellCheck={false}
        />
      </EditorialFormField>

      {error && <StatusMessage kind="error">{error}</StatusMessage>}
      {success && <StatusMessage kind="success">Workspace updated.</StatusMessage>}

      <div className="pt-2">
        <EditorialButton type="submit" variant="ink" disabled={loading}>
          {loading ? 'Saving…' : 'Save changes'}
        </EditorialButton>
      </div>
    </form>
  );
}
