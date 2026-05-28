import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface RouteGuardProps {
  children: ReactNode;
  requireAdmin?: boolean;
  requireEditor?: boolean;
}

export default function RouteGuard({
  children,
  requireAdmin = false,
  requireEditor = false,
}: RouteGuardProps) {
  const { isAuthenticated, isAdmin, isEditor, loading } = useAuth();
  const navigate = useNavigate();

  // Redirect side effects must run after commit, not during render
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate('/login', { replace: true });
    }
  }, [loading, isAuthenticated, navigate]);

  useEffect(() => {
    if (!loading && isAuthenticated && requireAdmin && !isAdmin) {
      navigate('/', { replace: true });
    }
  }, [loading, isAuthenticated, requireAdmin, isAdmin, navigate]);

  useEffect(() => {
    if (!loading && isAuthenticated && requireEditor && !isEditor) {
      navigate('/', { replace: true });
    }
  }, [loading, isAuthenticated, requireEditor, isEditor, navigate]);

  // Show loading spinner while checking auth
  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="flex items-center gap-3 text-text-secondary">
          <Loader2 size={20} className="animate-spin" />
          Loading...
        </div>
      </div>
    );
  }

  // Not authenticated — render nothing while redirect effect fires
  if (!isAuthenticated) {
    return null;
  }

  // Check admin requirement
  if (requireAdmin && !isAdmin) {
    return null;
  }

  // Check editor requirement
  if (requireEditor && !isEditor) {
    return null;
  }

  return <>{children}</>;
}
