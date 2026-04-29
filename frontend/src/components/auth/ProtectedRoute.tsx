import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../lib/auth-context';

export function ProtectedRoute({ adminOnly = false }: { adminOnly?: boolean }) {
  const { isAuthenticated, isAdmin, user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#F5F7FA]">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-[#4361EE]/20 rounded-full"></div>
          <div className="absolute top-0 left-0 w-16 h-16 border-4 border-[#4361EE] border-t-transparent rounded-full animate-spin"></div>
          <div className="mt-4 text-[#4361EE] font-bold text-sm animate-pulse text-center uppercase tracking-widest">
            Xác thực...
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    console.log('[ProtectedRoute] Not authenticated, redirecting to login. From:', location.pathname);
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (adminOnly && !isAdmin) {
    console.warn('[ProtectedRoute] Access denied: User is not admin. Role:', (user as any)?.role);
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
