'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { EditorialButton } from '@/app/(dashboard)/components/editorial/button';
import {
  EditorialFormField,
  EditorialInput,
} from '@/app/(dashboard)/components/editorial/form-field';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [githubLoading, setGithubLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const hasInviteCookie =
    typeof document !== 'undefined' && document.cookie.includes('gotcha_has_invite=1');
  const inviteToken = searchParams.get('invite') || (hasInviteCookie ? '__cookie__' : null);
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    if (inviteToken) {
      const acceptUrl =
        inviteToken === '__cookie__'
          ? '/api/invitations/accept'
          : `/api/invitations/accept?token=${inviteToken}`;
      router.push(acceptUrl);
    } else {
      router.push('/dashboard');
    }
    router.refresh();
  };

  const handleGithubLogin = async () => {
    setError(null);
    setGithubLoading(true);
    const isLocalhost = window.location.hostname === 'localhost';
    const siteUrl = isLocalhost
      ? window.location.origin
      : process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
    const callbackUrl = inviteToken
      ? `${siteUrl}/auth/callback?next=/api/invitations/accept${inviteToken !== '__cookie__' ? `?token=${inviteToken}` : ''}`
      : `${siteUrl}/auth/callback`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: callbackUrl,
      },
    });

    if (error) {
      setError(error.message);
      setGithubLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm">
      <div className="mb-10 flex items-center gap-3">
        <span className="h-px w-6 bg-editorial-accent" aria-hidden="true" />
        <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-editorial-neutral-3">
          Welcome back
        </span>
      </div>

      <h1 className="font-display text-4xl font-normal leading-[1.1] tracking-[-0.02em] text-editorial-ink">
        Sign in
        <span className="text-editorial-accent">.</span>
      </h1>
      <p className="mt-3 text-[14px] text-editorial-neutral-3">
        New here?{' '}
        <Link
          href={inviteToken ? `/signup?invite=${inviteToken}` : '/signup'}
          className="text-editorial-ink underline decoration-editorial-neutral-2 decoration-1 underline-offset-4 transition-colors hover:decoration-editorial-accent"
        >
          Create an account
        </Link>
      </p>

      <div className="mt-10 space-y-5">
        <button
          type="button"
          onClick={handleGithubLogin}
          disabled={githubLoading}
          className="inline-flex h-11 w-full items-center justify-center gap-3 rounded-md border border-editorial-neutral-2 bg-editorial-paper text-[14px] text-editorial-ink transition-colors duration-240 ease-page-turn hover:bg-editorial-ink/[0.03] disabled:pointer-events-none disabled:opacity-50"
        >
          {githubLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fillRule="evenodd"
                d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                clipRule="evenodd"
              />
            </svg>
          )}
          {githubLoading ? 'Connecting…' : 'Continue with GitHub'}
        </button>

        <div className="flex items-center gap-4">
          <div className="h-px flex-1 bg-editorial-neutral-2" aria-hidden="true" />
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-editorial-neutral-3">
            or
          </span>
          <div className="h-px flex-1 bg-editorial-neutral-2" aria-hidden="true" />
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          {error && (
            <div
              role="alert"
              className="border-l-2 border-editorial-alert bg-editorial-alert/[0.04] px-4 py-3 text-[13px] text-editorial-alert"
            >
              {error}
            </div>
          )}

          <EditorialFormField label="Email" htmlFor="email">
            <EditorialInput
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              className="h-11"
            />
          </EditorialFormField>

          <EditorialFormField label="Password" htmlFor="password">
            <EditorialInput
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="h-11"
            />
          </EditorialFormField>

          <EditorialButton
            type="submit"
            variant="ink"
            size="md"
            className="h-11 w-full"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                Signing in…
              </>
            ) : (
              'Sign in'
            )}
          </EditorialButton>
        </form>
      </div>
    </div>
  );
}
