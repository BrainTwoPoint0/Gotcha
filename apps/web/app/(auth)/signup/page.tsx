'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/app/components/AppButton';
import { Button as ShadcnButton } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [githubLoading, setGithubLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const hasInviteCookie =
    typeof document !== 'undefined' && document.cookie.includes('gotcha_has_invite=1');
  const inviteToken = searchParams.get('invite') || (hasInviteCookie ? '__cookie__' : null);
  const supabase = createClient();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.signUp({
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
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Create your account</h1>
        <p className="mt-1.5 text-sm text-gray-500">
          Already have an account?{' '}
          <Link href="/login" className="text-gray-900 font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </div>

      <div className="space-y-6">
        <ShadcnButton
          variant="outline"
          className="w-full h-11 gap-3 text-sm font-medium"
          onClick={handleGithubLogin}
          disabled={githubLoading}
        >
          {githubLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path
                fillRule="evenodd"
                d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                clipRule="evenodd"
              />
            </svg>
          )}
          {githubLoading ? 'Connecting...' : 'Continue with GitHub'}
        </ShadcnButton>

        <div className="relative flex items-center">
          <div className="flex-1 border-t border-gray-200" />
          <span className="px-4 text-xs text-gray-400 uppercase tracking-wider">or</span>
          <div className="flex-1 border-t border-gray-200" />
        </div>

        <form onSubmit={handleSignup} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-sm text-gray-600">
              Email
            </Label>
            <Input
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
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-sm text-gray-600">
              Password
            </Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="h-11"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="confirmPassword" className="text-sm text-gray-600">
              Confirm password
            </Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="h-11"
            />
          </div>

          <Button
            type="submit"
            loading={loading}
            loadingText="Creating account..."
            className="w-full h-11"
          >
            Create account
          </Button>

          <p className="text-xs text-center text-gray-400">
            By creating an account, you agree to our{' '}
            <Link href="/terms" className="text-gray-500 hover:underline">
              Terms
            </Link>{' '}
            and{' '}
            <Link href="/privacy" className="text-gray-500 hover:underline">
              Privacy Policy
            </Link>
            .
          </p>
        </form>
      </div>
    </div>
  );
}
