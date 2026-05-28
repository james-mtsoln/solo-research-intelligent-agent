import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';

export default function Login() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Redirect if already authenticated — useEffect runs after commit
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password.trim()) {
      setError('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    try {
      await login(email, password);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-bg-primary px-4">
      <div className="w-full max-w-[420px]">
        {/* Card */}
        <div className="rounded-radius-lg border border-border-subtle bg-bg-surface p-6 lg:p-8">
          {/* Logo */}
          <div className="mb-8 flex items-center justify-center gap-0 font-mono text-2xl font-bold tracking-tight text-text-primary select-none">
            RID
            <span className="text-accent-cyan">.</span>
          </div>

          {/* Title */}
          <h1 className="text-center text-xl font-bold text-text-primary lg:text-2xl">
            Welcome back
          </h1>
          <p className="mt-2 text-center text-sm text-text-secondary">
            Sign in to your Research Intelligence Dashboard
          </p>

          {/* Form */}
          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            {/* Email */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-text-secondary">
                Email
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="h-10 w-full rounded-radius-md border-border-subtle bg-bg-surface px-4 text-text-primary placeholder:text-text-tertiary focus:border-accent-cyan focus:ring-accent-cyan/20"
                disabled={isLoading}
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
                placeholder="Enter your password"
                className="h-10 w-full rounded-radius-md border-border-subtle bg-bg-surface px-4 text-text-primary placeholder:text-text-tertiary focus:border-accent-cyan focus:ring-accent-cyan/20"
                disabled={isLoading}
              />
            </div>

            {/* Error */}
            {error && (
              <p className="text-sm text-status-error">{error}</p>
            )}

            {/* Sign In button */}
            <button
              type="submit"
              disabled={isLoading}
              className="flex h-10 w-full items-center justify-center gap-2 rounded-full bg-accent-blue px-5 text-sm font-semibold text-white transition-all duration-200 hover:bg-accent-blue-hover hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100"
            >
              {isLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-border-subtle" />
            <span className="text-xs font-medium uppercase tracking-wider text-text-muted">
              or
            </span>
            <div className="h-px flex-1 bg-border-subtle" />
          </div>

          {/* Invite message */}
          <p className="text-center text-sm text-text-secondary">
            Don't have an account?{' '}
            <span className="text-text-tertiary">
              Contact your administrator for an invitation.
            </span>
          </p>
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-text-muted">
          Research Intelligence Dashboard
        </p>
      </div>
    </div>
  );
}
