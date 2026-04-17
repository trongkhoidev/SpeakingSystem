import { NavLink, useNavigate } from 'react-router-dom';
import { Home, BookOpen, GraduationCap, Settings, LogOut, TrendingUp, Star } from 'lucide-react';
import { useAuth } from '../../lib/auth-context';

const NAV_ITEMS = [
  { to: '/',         label: 'Trang chủ',      icon: Home,          end: true },
  { to: '/practice', label: 'Luyện theo câu',  icon: BookOpen,      end: false },
  { to: '/test',     label: 'Thi thử',         icon: GraduationCap, end: false },
];

export function AppSidebar() {
  const { logout, user } = useAuth() as any;
  const navigate = useNavigate();

  return (
    <aside className="app-sidebar">
      {/* User info mini */}
      {user && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '10px 10px 14px',
            marginBottom: 4,
            borderBottom: '1px solid #E8ECF1',
          }}
        >
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: '50%',
              background: '#EEF0FD',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 13,
              fontWeight: 700,
              color: '#4361EE',
              flexShrink: 0,
            }}
          >
            {(user.name || user.email || 'U')[0].toUpperCase()}
          </div>
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontSize: 12.5,
                fontWeight: 600,
                color: '#1A1D2B',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {user.name || 'Người dùng'}
            </div>
            <div style={{ fontSize: 11, color: '#9CA3AF' }}>IELTS Learner</div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <p className="sidebar-section-label">Menu chính</p>

      {NAV_ITEMS.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={({ isActive }) =>
            `sidebar-item${isActive ? ' active' : ''}`
          }
        >
          <item.icon size={16} />
          {item.label}
        </NavLink>
      ))}

      <div className="sidebar-divider" />

      <p className="sidebar-section-label">Tiến độ</p>

      <div
        style={{
          padding: '10px 12px',
          borderRadius: 8,
          background: '#EEF0FD',
          marginBottom: 4,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
          <TrendingUp size={13} color="#4361EE" />
          <span style={{ fontSize: 11.5, fontWeight: 600, color: '#4361EE' }}>Band ước tính</span>
        </div>
        <div style={{ fontSize: 26, fontWeight: 800, color: '#4361EE', lineHeight: 1 }}>6.0</div>
        <div style={{ fontSize: 10, color: '#6B7280', marginTop: 2 }}>Dựa trên 10 bài gần nhất</div>
      </div>

      <div
        style={{
          padding: '8px 12px',
          borderRadius: 8,
          background: '#FFF7E6',
          marginBottom: 4,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Star size={13} color="#B45309" fill="#B45309" />
          <span style={{ fontSize: 11.5, fontWeight: 600, color: '#B45309' }}>Streak: 5 ngày</span>
        </div>
      </div>

      {/* Push bottom actions down */}
      <div style={{ flex: 1 }} />

      <div className="sidebar-divider" />

      <button className="sidebar-item">
        <Settings size={16} />
        Cài đặt
      </button>

      <button
        className="sidebar-item sidebar-item--danger"
        onClick={() => {
          logout?.();
          navigate('/login', { replace: true });
        }}
      >
        <LogOut size={16} />
        Đăng xuất
      </button>
    </aside>
  );
}
