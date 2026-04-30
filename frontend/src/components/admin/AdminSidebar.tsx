import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Diamond, 
  Settings,
  ShieldCheck,
  TrendingUp,
  Star,
  FileText
} from 'lucide-react';
import { useAuth } from '../../lib/auth-context';
import { useEffect, useState } from 'react';
import api from '../../lib/api';

const ADMIN_NAV_ITEMS = [
  { to: '/admin',          label: 'Dashboard',         icon: LayoutDashboard, end: true },
  { to: '/admin/accounts', label: 'Quản lý tài khoản',  icon: Users,           end: false },
  { to: '/admin/tokens',   label: 'Cấp phát Token',    icon: Diamond,         end: false },
  { to: '/admin/plans',    label: 'Quản lý các gói',   icon: Settings,        end: false },
  { to: '/admin/exam-sets',label: 'Quản lý bộ đề',     icon: FileText,        end: false },
];

export function AdminSidebar({ isCollapsed, onToggle }: { isCollapsed: boolean, onToggle: () => void }) {
  const { user } = useAuth() as any;
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    if (user) {
      api.get('/admin/dashboard')
        .then(res => setStats(res.data.stats))
        .catch(err => console.error('Admin Sidebar stats error:', err));
    }
  }, [user]);

  return (
    <aside className={`app-sidebar admin-sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      {/* Admin Profile Section */}
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
              background: '#4361EE',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 13,
              fontWeight: 700,
              color: '#FFFFFF',
              flexShrink: 0,
            }}
          >
            {(user.email || 'A')[0].toUpperCase()}
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
              {user.full_name || user.email?.split('@')[0]}
            </div>
            <div style={{ fontSize: 10, color: '#4361EE', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Administrator
            </div>
          </div>
        </div>
      )}

      {/* Admin Navigation */}
      {!isCollapsed && <p className="sidebar-section-label">Quản trị hệ thống</p>}

      {ADMIN_NAV_ITEMS.map((item) => (
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

      {!isCollapsed && <div className="sidebar-divider" />}

      {/* Admin Insight Section (Optional) */}
      {!isCollapsed && stats && (
        <>
          <p className="sidebar-section-label">Nhanh</p>
          <div
            style={{
              padding: '10px 12px',
              borderRadius: 8,
              background: '#F8FAFC',
              marginBottom: 4,
              border: '1px solid #E2E8F0'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <ShieldCheck size={13} color="#4361EE" />
              <span style={{ fontSize: 11, fontWeight: 600, color: '#64748B' }}>Hệ thống ổn định</span>
            </div>
            <div style={{ fontSize: 11, color: '#94A3B8' }}>
              {stats.totalUsers} người dùng đang hoạt động
            </div>
          </div>
        </>
      )}

      <div style={{ flex: 1 }} />
    </aside>
  );
}
