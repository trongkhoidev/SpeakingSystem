import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../../lib/auth-context';
import { ShieldCheck } from 'lucide-react';

export function GoogleLoginButton() {
  const { login } = useAuth();

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="text-center space-y-2">
        <h2 className="text-xl font-bold font-heading" style={{ color: 'var(--text-primary)' }}>
          Đăng nhập để bắt đầu
        </h2>
        <p className="text-sm leading-relaxed max-w-xs mx-auto" style={{ color: 'var(--text-secondary)' }}>
          Sử dụng tài khoản Google để lưu tiến trình và nhận đánh giá IELTS từ AI.
        </p>
      </div>

      {/* Divider */}
      <div className="flex items-center gap-3 w-full">
        <div className="flex-1 h-[1px]" style={{ background: 'var(--border-light)' }} />
        <span className="text-[11px] font-medium" style={{ color: 'var(--text-muted)' }}>
          Đăng nhập bằng
        </span>
        <div className="flex-1 h-[1px]" style={{ background: 'var(--border-light)' }} />
      </div>

      {/* Google button */}
      <div id="google-login-btn" className="w-full flex justify-center">
        <GoogleLogin
          onSuccess={(credentialResponse) => {
            if (credentialResponse.credential) {
              login(credentialResponse.credential);
            }
          }}
          onError={() => console.error('Login Failed')}
          useOneTap
          prompt_parent_id="google-onetap-container"
          theme="outline"
          shape="pill"
          size="large"
          width="300"
          text="continue_with"
        />
      </div>

      <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
        <ShieldCheck className="w-3.5 h-3.5" style={{ color: 'var(--success)' }} />
        Thông tin của bạn được bảo mật tuyệt đối
      </div>
    </div>
  );
}
