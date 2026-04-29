import { NavLink, useNavigate } from 'react-router-dom';
import { Home, BookOpen, GraduationCap, Menu } from 'lucide-react';
import { useAuth } from '../../lib/auth-context';

const NAV_LINKS = [
  { to: '/',         label: 'Trang chủ',      icon: Home,          end: true },
  { to: '/practice', label: 'Luyện theo câu',  icon: BookOpen,      end: false },
  { to: '/test',     label: 'Thi thử',         icon: GraduationCap, end: false },
];

export function Navbar({ onToggleSidebar }: { onToggleSidebar: () => void }) {
  const navigate = useNavigate();

  return (
    <header className="app-navbar">
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <button 
          onClick={onToggleSidebar}
          className="w-10 h-10 rounded-lg hover:bg-slate-50 flex items-center justify-center text-slate-500 transition-colors"
        >
          <Menu size={20} />
        </button>
        <NavLink to="/" className="nav-logo">
          <div className="nav-logo-icon">L</div>
          <span className="nav-logo-text">
            Lexi<span>Learn</span>
          </span>
        </NavLink>
      </div>

      {/* Nav links */}
      <nav>
        <ul className="nav-links">
          {NAV_LINKS.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `nav-link${isActive ? ' active' : ''}`
                }
              >
                <item.icon size={15} />
                {item.label}
              </NavLink>
            </li>
          ))}

        </ul>
      </nav>
    </header>
  );
}
