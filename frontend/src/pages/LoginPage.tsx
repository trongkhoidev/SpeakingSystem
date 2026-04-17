import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { GoogleLoginButton } from '../components/auth/GoogleLoginButton';
import { useAuth } from '../lib/auth-context';
import {
  Mic2, BookOpen, GraduationCap, BarChart3,
  MessageSquare, Star, Layers, Volume2, Trophy, Zap
} from 'lucide-react';

/* ── Feature grid items ── */
const FEATURES = [
  { icon: Mic2,         label: 'AI Speaking',     color: '#EEF0FD', iconColor: '#4361EE' },
  { icon: BookOpen,     label: 'Luyện theo câu',   color: '#E6F9F0', iconColor: '#22A06B' },
  { icon: GraduationCap,label: 'Thi thử IELTS',   color: '#F3F0FF', iconColor: '#7C3AED' },
  { icon: BarChart3,    label: 'Phân tích band',   color: '#FFF7E6', iconColor: '#B45309' },
  { icon: MessageSquare,label: 'Phản hồi tức thì', color: '#FEE2E2', iconColor: '#DC2626' },
  { icon: Star,         label: 'Forecast 2025',    color: '#F0FDF4', iconColor: '#16A34A' },
  { icon: Layers,       label: 'Flashcards',       color: '#EEF0FD', iconColor: '#4361EE' },
  { icon: Volume2,      label: 'Phát âm chuẩn',   color: '#F3F0FF', iconColor: '#7C3AED' },
  { icon: Trophy,       label: 'Bảng xếp hạng',   color: '#FFF7E6', iconColor: '#B45309' },
  { icon: Zap,          label: 'Daily mission',    color: '#E6F9F0', iconColor: '#22A06B' },
];

export function LoginPage() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as any)?.from?.pathname || '/';

  useEffect(() => {
    if (isAuthenticated) navigate(from, { replace: true });
  }, [isAuthenticated, navigate, from]);

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        background: '#FFFFFF',
        display: 'flex',
        alignItems: 'stretch',
        overflow: 'hidden',
      }}
    >
      {/* ═══════════════════════════════════════
          LEFT PANEL — Login form
      ═══════════════════════════════════════ */}
      <div
        style={{
          width: 460,
          minWidth: 380,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '60px 52px',
          background: '#FFFFFF',
          borderRight: '1px solid #F0F2F5',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 52 }}>
          <div
            style={{
              width: 46,
              height: 46,
              borderRadius: 13,
              background: 'linear-gradient(135deg, #4361EE 0%, #7C3AED 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(67,97,238,0.35)',
            }}
          >
            <Mic2 size={22} color="#fff" />
          </div>
          <div>
            <div
              style={{
                fontSize: 20,
                fontWeight: 800,
                fontFamily: 'Outfit, sans-serif',
                letterSpacing: '-0.3px',
                lineHeight: 1,
              }}
            >
              <span style={{ color: '#1A1D2B' }}>Lexi</span>
              <span style={{ color: '#4361EE' }}>Learn</span>
            </div>
            <div style={{ fontSize: 10.5, color: '#9CA3AF', fontWeight: 600, letterSpacing: '0.06em', marginTop: 2 }}>
              IELTS SPEAKING AI
            </div>
          </div>

          {/* Divider */}
          <div style={{ width: 1, height: 32, background: '#E8ECF1', margin: '0 6px' }} />

          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#6B7280' }}>Super</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#6B7280' }}>Platform</div>
          </div>
        </div>

        {/* Headline */}
        <h1
          style={{
            fontSize: 26,
            fontWeight: 800,
            color: '#1A1D2B',
            fontFamily: 'Outfit, sans-serif',
            lineHeight: 1.3,
            marginBottom: 10,
          }}
        >
          Đăng nhập vào <br />
          <span
            style={{
              background: 'linear-gradient(135deg, #4361EE, #7C3AED)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            LexiLearn
          </span>
        </h1>

        <p style={{ fontSize: 13.5, color: '#6B7280', lineHeight: 1.7, marginBottom: 36, maxWidth: 320 }}>
          Vui lòng đăng nhập bằng tài khoản{' '}
          <span style={{ fontWeight: 600, color: '#4361EE' }}>Google</span>{' '}
          để bắt đầu hành trình nâng Band IELTS Speaking cùng AI.
        </p>

        {/* Google login button */}
        <GoogleLoginButton />

        {/* Trust signals */}
        <div
          style={{
            marginTop: 36,
            paddingTop: 24,
            borderTop: '1px solid #F0F2F5',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}
        >
          {[
            '🔒 Thông tin của bạn được bảo mật tuyệt đối',
            '🎯 Miễn phí sử dụng — không cần thẻ tín dụng',
            '🤖 Được hỗ trợ bởi Google AI & Azure Speech',
          ].map((text) => (
            <p key={text} style={{ fontSize: 12, color: '#9CA3AF', margin: 0 }}>
              {text}
            </p>
          ))}
        </div>
      </div>

      {/* ═══════════════════════════════════════
          RIGHT PANEL — Features showcase
      ═══════════════════════════════════════ */}
      <div
        style={{
          flex: 1,
          background: '#FAFBFF',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '48px 60px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Background decoration */}
        <div
          style={{
            position: 'absolute',
            top: -80,
            right: -80,
            width: 320,
            height: 320,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(67,97,238,0.08) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: -60,
            left: -60,
            width: 260,
            height: 260,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(124,58,237,0.07) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />

        {/* Top badge */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 7,
            padding: '6px 16px',
            background: '#FEE2E2',
            borderRadius: 999,
            marginBottom: 28,
          }}
        >
          <Zap size={13} color="#DC2626" fill="#DC2626" />
          <span style={{ fontSize: 12.5, fontWeight: 700, color: '#DC2626' }}>
            Hơn 10 tính năng luyện tập
          </span>
        </div>

        {/* Feature grid — 2 columns */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 12,
            width: '100%',
            maxWidth: 460,
            marginBottom: 28,
            position: 'relative',
            zIndex: 1,
          }}
        >
          {FEATURES.map((feat, idx) => (
            <div
              key={feat.label}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 11,
                padding: '11px 16px',
                background: '#FFFFFF',
                border: '1px solid #E8ECF1',
                borderRadius: 12,
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                animation: `fadeUp 0.4s ease ${idx * 0.04}s both`,
                cursor: 'default',
                transition: 'transform 0.15s, box-shadow 0.15s',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
                (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                (e.currentTarget as HTMLElement).style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)';
              }}
            >
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 9,
                  background: feat.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <feat.icon size={16} color={feat.iconColor} />
              </div>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>
                {feat.label}
              </span>
            </div>
          ))}
        </div>

        {/* Mascot */}
        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
          <img
            src="/mascot.png"
            alt="LexiLearn mascot"
            style={{
              width: 160,
              height: 160,
              objectFit: 'contain',
              filter: 'drop-shadow(0 8px 24px rgba(67,97,238,0.15))',
            }}
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
          />
        </div>
      </div>

      {/* Keyframes */}
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
