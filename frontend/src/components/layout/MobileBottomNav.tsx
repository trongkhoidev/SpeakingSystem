import { NavLink } from 'react-router-dom';
import { Home, BookOpen, GraduationCap } from 'lucide-react';

const ITEMS = [
  { to: '/',         label: 'Trang chủ', icon: Home,          end: true },
  { to: '/practice', label: 'Luyện tập', icon: BookOpen,      end: false },
  { to: '/test',     label: 'Thi thử',   icon: GraduationCap, end: false },
];

export function MobileBottomNav() {
  return (
    <nav className="mobile-bottom-nav">
      {ITEMS.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          style={({ isActive }) => ({
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 3,
            padding: '6px 16px',
            borderRadius: 8,
            textDecoration: 'none',
            color: isActive ? '#4361EE' : '#9CA3AF',
            fontWeight: isActive ? 600 : 400,
            fontSize: 10,
          })}
        >
          <item.icon size={20} />
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}
