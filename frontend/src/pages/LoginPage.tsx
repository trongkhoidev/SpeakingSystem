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
    <div className="min-h-screen flex items-center justify-center bg-bg-dark relative overflow-hidden">
      {/* Dynamic Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-primary/20 rounded-full blur-[120px] animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-secondary/10 rounded-full blur-[120px] animate-pulse-ring"></div>
      
      <div className="relative z-10 w-full max-w-md px-6">
        <div className="text-center mb-10">
          <div className="flex items-center justify-center mb-6">
            <div className="w-16 h-16 bg-gradient-premium rounded-2xl flex items-center justify-center shadow-lg shadow-primary/30 transform -rotate-6">
              <span className="text-3xl font-black text-white">L</span>
            </div>
          </div>
          <h1 className="text-4xl font-black mb-2 tracking-tighter">
            <span className="text-white">Lexi</span>
            <span className="gradient-text">Learn</span>
          </h1>
          <p className="text-text-secondary font-medium uppercase tracking-[0.2em] text-xs">
            Hệ thống Luyện nói IELTS thông minh
          </p>
        </div>
        
        <GoogleLoginButton />
        
        <div className="mt-12 text-center text-text-muted text-sm max-w-xs mx-auto">
          Hoàn thiện kỹ năng, Nâng cao Band điểm và Tự tin trước giám khảo.
        </div>
      </div>
      
      {/* Decorative Floating Circles */}
      <div className="absolute top-1/4 right-1/4 w-3 h-3 bg-primary rounded-full animate-float delay-100 opacity-60"></div>
      <div className="absolute bottom-1/3 left-1/4 w-2 h-2 bg-secondary rounded-full animate-float delay-500 opacity-40"></div>
      <div className="absolute top-1/2 left-20 w-4 h-4 bg-accent rounded-full animate-float delay-1000 opacity-30"></div>
    </div>
  );
}
