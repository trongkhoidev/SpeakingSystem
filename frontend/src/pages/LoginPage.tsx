import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { GoogleLoginButton } from '../components/auth/GoogleLoginButton';
import { useAuth } from '../lib/auth-context';

export function LoginPage() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';

  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  return (
    <div className="login-page">
      <div className="w-full max-w-md px-5 animate-scale-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-5">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ background: 'var(--primary)', boxShadow: '0 6px 20px rgba(67,97,238,0.3)' }}
            >
              <span className="text-3xl font-extrabold text-white font-heading">L</span>
            </div>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight font-heading">
            <span style={{ color: 'var(--text-primary)' }}>Lexi</span>
            <span style={{ color: 'var(--primary)' }}>Learn</span>
          </h1>
          <p className="text-sm mt-2 font-medium" style={{ color: 'var(--text-muted)' }}>
            Hệ thống Luyện nói IELTS thông minh
          </p>
        </div>

        {/* Login card */}
        <div className="login-card">
          <GoogleLoginButton />
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-xs" style={{ color: 'var(--text-muted)' }}>
          Hoàn thiện kỹ năng • Nâng cao Band điểm • Tự tin trước giám khảo
        </p>
      </div>

      {/* Google One Tap container — render popup ở giữa màn hình */}
      <div id="google-onetap-container" />
    </div>
  );
}
