import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { apiPost } from '@/lib/api';
import { Loader2, XCircle } from 'lucide-react';

export default function AcceptInvite() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // No token = show error
  if (!token) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-bg-primary px-4">
        <div className="w-full max-w-[420px] rounded-radius-lg border border-border-subtle bg-bg-surface p-6 lg:p-8">
          <div className="flex flex-col items-center text-center">
            <XCircle size={48} className="text-status-error" />
            <h2 className="mt-4 text-lg font-semibold text-text-primary">
              Invalid Invitation
            </h2>
            <p className="mt-2 text-sm text-text-secondary">
              No invitation token provided. Please use the link from your invitation email.
            </p>
            <a
              href="#/login"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-accent-blue px-5 py-2 text-sm font-semibold text-white transition-all hover:bg-accent-blue-hover"
            >
              Go to Login
            </a>
          </div>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim() || !password.trim() || !confirmPassword.trim()) {
      setError('Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setSubmitting(true);
    try {
      const response = await apiPost<{
        token: string;
        user: { id: number; email: string; name: string; role: string };
      }>(`/api/invitations/${token}/accept`, {
        name,
        password,
      });

      localStorage.setItem('rid_token', response.token);
      // Auto-login and redirect
      window.location.hash = '#/';
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create account. The invitation may be invalid or expired.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-bg-primary px-4">
      <div className="w-full max-w-[420px]">
        {/* Card */}
        <div className="rounded-radius-lg border border-border-subtle bg-bg-surface p-6 lg:p-8">
          {/* Logo */}
          <div className="mb-6 flex items-center justify-center gap-0 font-mono text-2xl font-bold tracking-tight text-text-primary select-none">
            RID
            <span className="text-accent-cyan">.</span>
          </div>

          {/* Title */}
          <h1 className="text-center text-xl font-bold text-text-primary lg:text-2xl">
            You're invited
          </h1>
          <p className="mt-2 text-center text-sm text-text-secondary">
            Join the Research Intelligence Dashboard
          </p>

          {/* Form */}
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {/* Name */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-text-secondary">
                Full Name
              </label>
              <Input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="h-10 w-full rounded-radius-md border-border-subtle bg-bg-surface px-4 text-text-primary placeholder:text-text-tertiary focus:border-accent-cyan focus:ring-accent-cyan/20"
                disabled={submitting}
              />
            </div>

            {/* Password */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-text-secondary">
                Password
              </label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create a password"
                className="h-10 w-full rounded-radius-md border-border-subtle bg-bg-surface px-4 text-text-primary placeholder:text-text-tertiary focus:border-accent-cyan focus:ring-accent-cyan/20"
                disabled={submitting}
              />
            </div>

            {/* Confirm Password */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-text-secondary">
                Confirm Password
              </label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                className="h-10 w-full rounded-radius-md border-border-subtle bg-bg-surface px-4 text-text-primary placeholder:text-text-tertiary focus:border-accent-cyan focus:ring-accent-cyan/20"
                disabled={submitting}
              />
            </div>

            {/* Error */}
            {error && (
              <p className="text-sm text-status-error">{error}</p>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={submitting}
              className="flex h-10 w-full items-center justify-center gap-2 rounded-full bg-accent-blue px-5 text-sm font-semibold text-white transition-all duration-200 hover:bg-accent-blue-hover hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100"
            >
              {submitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Creating account...
                </>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          {/* Login link */}
          <p className="mt-6 text-center text-sm text-text-secondary">
            Already have an account?{' '}
            <a
              href="#/login"
              className="text-accent-cyan transition-colors hover:text-accent-cyan/80"
            >
              Sign in
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
