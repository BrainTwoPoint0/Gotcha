'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/app/components/Button';

interface ProfileFormProps {
  name: string | null;
  email: string;
}

export function ProfileForm({ name, email }: ProfileFormProps) {
  const [formName, setFormName] = useState(name || '');
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
      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: formName }),
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
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-500">
          Email
        </label>
        <input
          type="email"
          id="email"
          value={email}
          disabled
          className="mt-1 block w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 sm:text-sm"
        />
        <p className="mt-1 text-xs text-gray-400">Email cannot be changed</p>
      </div>

      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
          Name
        </label>
        <input
          type="text"
          id="name"
          value={formName}
          onChange={(e) => setFormName(e.target.value)}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-slate-500 focus:border-slate-500 sm:text-sm"
          placeholder="Your name"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {success && <p className="text-sm text-green-600">Profile updated successfully!</p>}

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
      <div>
        <label htmlFor="orgName" className="block text-sm font-medium text-gray-700">
          Organization Name
        </label>
        <input
          type="text"
          id="orgName"
          value={formName}
          onChange={(e) => setFormName(e.target.value)}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-slate-500 focus:border-slate-500 sm:text-sm"
          placeholder="Organization name"
        />
      </div>

      <div>
        <label htmlFor="orgSlug" className="block text-sm font-medium text-gray-700">
          Slug
        </label>
        <input
          type="text"
          id="orgSlug"
          value={formSlug}
          onChange={(e) => handleSlugChange(e.target.value)}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-slate-500 focus:border-slate-500 sm:text-sm font-mono"
          placeholder="organization-slug"
        />
        <p className="mt-1 text-xs text-gray-400">Only lowercase letters, numbers, and hyphens</p>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {success && <p className="text-sm text-green-600">Organization updated successfully!</p>}

      <Button type="submit" loading={loading} loadingText="Saving...">
        Save Changes
      </Button>
    </form>
  );
}
