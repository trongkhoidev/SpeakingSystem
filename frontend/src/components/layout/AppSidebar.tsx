import { NavLink, useNavigate } from 'react-router-dom';
import { Home, BookOpen, GraduationCap, Settings, LogOut, LogIn, TrendingUp, Star, ShieldCheck, Wallet } from 'lucide-react';
import { useAuth } from '../../lib/auth-context';
import { useEffect, useState } from 'react';
import api from '../../lib/api';
import { toast } from 'sonner';

const NAV_ITEMS = [
  { to: '/',         label: 'Trang chủ',      icon: Home,          end: true },
  { to: '/practice', label: 'Luyện theo câu',  icon: BookOpen,      end: false },
  { to: '/test',     label: 'Thi thử',         icon: GraduationCap, end: false },
  { to: '/plans',    label: 'Gói & Token',     icon: Wallet,        end: false },
];

const ADMIN_NAV_ITEMS = [
  { to: '/admin',    label: 'Quản trị hệ thống', icon: ShieldCheck,   end: false },
];

export function AppSidebar({ isCollapsed, onToggle }: { isCollapsed: boolean, onToggle: () => void }) {
  const { user } = useAuth() as any;
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    if (user) {
      api.get('/user/dashboard')
        .then(res => setStats(res.data))
        .catch(err => console.error('Sidebar stats error:', err));
    }
  }, [user]);

  const streak = stats?.streak ?? 0;
  const band = stats?.bandEstimate?.current ?? 0;

  return (
    <aside className={`app-sidebar ${isCollapsed ? 'collapsed' : ''}`}>
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
            {(user.email || user.name || 'U')[0].toUpperCase()}
          </div>
          <div style={{ minWidth: 0, display: isCollapsed ? 'none' : 'block' }}>
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
              {user.email ? user.email.split('@')[0] : user.name || 'Người dùng'}
            </div>
            <div style={{ fontSize: 11, color: user.role === 'admin' ? '#4361EE' : '#9CA3AF', fontWeight: user.role === 'admin' ? 700 : 400 }}>
              {user.role === 'admin' ? 'Administrator' : 'IELTS Learner'}
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      {!isCollapsed && <p className="sidebar-section-label">Menu chính</p>}

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
          {!isCollapsed && <span>{item.label}</span>}
        </NavLink>
      ))}

      {user?.role === 'admin' && (
        <>
          {!isCollapsed && <div className="sidebar-divider" />}
          {!isCollapsed && <p className="sidebar-section-label">Quản trị</p>}
          {ADMIN_NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `sidebar-item admin-item${isActive ? ' active' : ''}`
              }
              style={{ color: '#4361EE' }}
            >
              <item.icon size={16} />
              {!isCollapsed && <span>{item.label}</span>}
            </NavLink>
          ))}
        </>
      )}


      {!isCollapsed && <div className="sidebar-divider" />}

      {!isCollapsed && <p className="sidebar-section-label">Tiến độ</p>}

      {!isCollapsed && (
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
          {stats ? (
            <div style={{ fontSize: 26, fontWeight: 800, color: '#4361EE', lineHeight: 1 }}>{band.toFixed(1)}</div>
          ) : (
            <div className="skeleton" style={{ width: 40, height: 26, borderRadius: 4 }} />
          )}
          <div style={{ fontSize: 10, color: '#6B7280', marginTop: 2 }}>Dựa trên 10 bài gần nhất</div>
        </div>
      )}

      {!isCollapsed && (
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
            {stats ? (
              <span style={{ fontSize: 11.5, fontWeight: 600, color: '#B45309' }}>Streak: {streak} ngày</span>
            ) : (
              <div className="skeleton" style={{ width: 80, height: 14, borderRadius: 4 }} />
            )}
          </div>
        </div>
      )}

      {/* Push bottom actions down */}
      <div style={{ flex: 1 }} />
    </aside>
  );
}
