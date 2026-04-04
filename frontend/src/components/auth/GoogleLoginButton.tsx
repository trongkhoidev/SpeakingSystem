import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../../lib/auth-context';

export function GoogleLoginButton() {
  const { login } = useAuth();
  
  return (
    <div className="flex flex-col items-center justify-center p-6 glass-card animate-float">
      <h2 className="text-2xl font-bold mb-6 text-center gradient-text">
        Bắt đầu Luyện tập ngay
      </h2>
      <p className="text-text-secondary mb-8 text-center max-w-xs">
        Đăng nhập với Google để lưu lịch sử luyện tập và nhận đánh giá IELTS từ AI.
      </p>
      
      <GoogleLogin
        onSuccess={credentialResponse => {
          if (credentialResponse.credential) {
            login(credentialResponse.credential);
          }
        }}
        onError={() => {
          console.error('Login Failed');
        }}
        useOneTap
        theme="filled_black"
        shape="pill"
        size="large"
        width="280"
        text="continue_with"
      />
      
      <p className="mt-8 text-xs text-text-muted text-center italic">
        Thông tin của bạn được bảo mật tuyệt đối.
      </p>
    </div>
  );
}
