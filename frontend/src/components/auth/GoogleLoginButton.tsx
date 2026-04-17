import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../../lib/auth-context';

export function GoogleLoginButton() {
  const { login } = useAuth();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Custom styled Google button wrapper */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-start',
        }}
      >
        <GoogleLogin
          onSuccess={(credentialResponse) => {
            if (credentialResponse.credential) {
              login(credentialResponse.credential);
            }
          }}
          onError={() => console.error('Login Failed')}
          useOneTap={false}
          theme="outline"
          shape="rectangular"
          size="large"
          width={320}
          text="signin_with"
          logo_alignment="left"
        />
      </div>

      {/* Divider */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ flex: 1, height: 1, background: '#F0F2F5' }} />
        <span style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 500 }}>
          hoặc
        </span>
        <div style={{ flex: 1, height: 1, background: '#F0F2F5' }} />
      </div>

      {/* Demo hint */}
      <div
        style={{
          padding: '10px 14px',
          background: '#F8F9FE',
          border: '1px solid #E8ECF1',
          borderRadius: 9,
          fontSize: 11.5,
          color: '#9CA3AF',
          textAlign: 'center',
        }}
      >
        Sử dụng tài khoản <strong style={{ color: '#4361EE' }}>Google</strong> bạn đã đăng ký để tiếp tục
      </div>
    </div>
  );
}
