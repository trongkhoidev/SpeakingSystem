import { NavLink, useNavigate } from 'react-router-dom';
import { Home, BookOpen, GraduationCap, Settings, LogOut } from 'lucide-react';
import { useAuth } from '../../lib/auth-context';

const NAV_LINKS = [
  { to: '/',         label: 'Trang chủ',      icon: Home,          end: true },
  { to: '/practice', label: 'Luyện theo câu',  icon: BookOpen,      end: false },
  { to: '/test',     label: 'Thi thử',         icon: GraduationCap, end: false },
];

export function Navbar() {
  const { logout } = useAuth() as any;
  const navigate = useNavigate();

  return (
    <header className="app-navbar">
      {/* Logo */}
      <NavLink to="/" className="nav-logo">
        <div className="nav-logo-icon">L</div>
        <span className="nav-logo-text">
          Lexi<span>Learn</span>
        </span>
      </NavLink>

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

          <li><div className="nav-divider" /></li>

          <li>
            <button className="nav-link">
              <Settings size={15} />
              Cài đặt
            </button>
          </li>

          <li>
            <button
              className="nav-link nav-link--danger"
              onClick={() => {
                logout?.();
                navigate('/login', { replace: true });
              }}
            >
              <LogOut size={15} />
              Đăng xuất
            </button>
          </li>
        </ul>
      </nav>
    </header>
  );
}
