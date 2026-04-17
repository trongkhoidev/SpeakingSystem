import { NavLink, useNavigate } from 'react-router-dom';
import { Home, BookOpen, GraduationCap, Settings, LogOut } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuth } from '../../lib/auth-context';

const navItems = [
  { icon: Home,          label: 'Trang chủ',      to: '/' },
  { icon: BookOpen,      label: 'Luyện theo câu',  to: '/practice' },
  { icon: GraduationCap, label: 'Thi thử',         to: '/test' },
];

interface SidebarProps {
  mode?: 'desktop' | 'mobile';
}

export function Sidebar({ mode = 'desktop' }: SidebarProps) {
  const { logout } = useAuth() as any;
  const navigate = useNavigate();

  /* ── Mobile bottom nav ── */
  if (mode === 'mobile') {
    return (
      <nav
        className="fixed bottom-0 left-0 right-0 h-16 z-[60] flex items-center justify-around px-4"
        style={{
          background: '#FFFFFF',
          borderTop: '1px solid var(--border-light)',
          boxShadow: '0 -2px 10px rgba(0,0,0,0.04)',
        }}
      >
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center gap-1 px-4 py-1.5 rounded-lg transition-colors',
                isActive ? 'text-[var(--primary)]' : 'text-[var(--text-muted)]'
              )
            }
          >
            <item.icon className="w-5 h-5" />
            <span className="text-[10px] font-semibold">{item.label}</span>
          </NavLink>
        ))}
      </nav>
    );
  }

  /* ── Desktop sidebar ── */
  return (
    <aside
      className="fixed left-0 top-0 h-screen w-[256px] flex flex-col z-50"
      style={{
        background: '#FFFFFF',
        borderRight: '1px solid var(--border-light)',
      }}
    >
      {/* Logo */}
      <div className="px-6 pt-6 pb-5">
        <div className="flex items-center gap-2.5">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: 'var(--primary)', color: '#fff' }}
          >
            <span className="text-base font-extrabold font-heading">L</span>
          </div>
          <div>
            <h1 className="text-lg font-bold font-heading leading-none" style={{ color: 'var(--text-primary)' }}>
              Lexi<span style={{ color: 'var(--primary)' }}>Learn</span>
            </h1>
            <p className="text-[10px] font-medium mt-0.5" style={{ color: 'var(--text-muted)' }}>
              IELTS Speaking AI
            </p>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="mx-5 h-[1px]" style={{ background: 'var(--border-light)' }} />

      {/* Nav */}
      <nav className="flex-1 px-4 pt-5 space-y-1">
        <p className="section-label px-3 pb-2">Menu</p>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              cn('nav-item w-full', isActive ? 'nav-item--active' : '')
            }
          >
            <item.icon className="w-[18px] h-[18px] flex-shrink-0" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Bottom */}
      <div className="px-4 pb-5 pt-3 space-y-1" style={{ borderTop: '1px solid var(--border-light)' }}>
        <button className="nav-item w-full">
          <Settings className="w-[18px] h-[18px]" />
          <span>Cài đặt</span>
        </button>
        <button
          onClick={() => { logout?.(); navigate('/login', { replace: true }); }}
          className="nav-item w-full"
          style={{ color: 'var(--error)' }}
        >
          <LogOut className="w-[18px] h-[18px]" />
          <span>Đăng xuất</span>
        </button>
      </div>
    </aside>
  );
}
