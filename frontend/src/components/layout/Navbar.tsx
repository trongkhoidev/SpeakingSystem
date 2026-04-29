import { NavLink, useNavigate } from 'react-router-dom';
import { Menu, Settings, LogOut, LogIn, Diamond } from 'lucide-react';
import { useAuth } from '../../lib/auth-context';
import { useEffect, useState } from 'react';
import api from '../../lib/api';

export function Navbar({ onToggleSidebar }: { onToggleSidebar: () => void }) {
  const { logout, user } = useAuth() as any;
  const navigate = useNavigate();
  const [usage, setUsage] = useState<any>(null);

  useEffect(() => {
    if (user && user.role !== 'guest' && user.role !== 'admin') {
      api.get('/billing/usage')
        .then(res => setUsage(res.data))
        .catch(err => console.error('Navbar usage error:', err));
    }
  }, [user]);

  // Listen for custom event to refresh tokens after consumption
  useEffect(() => {
    const handleRefresh = () => {
      if (user && user.role !== 'guest') {
        api.get('/billing/usage').then(res => setUsage(res.data));
      }
    };
    window.addEventListener('refresh-tokens', handleRefresh);
    return () => window.removeEventListener('refresh-tokens', handleRefresh);
  }, [user]);

  const tokenBalance = usage?.token_balance ?? 0;

  return (
    <header className="app-navbar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px' }}>
      {/* Left: Menu toggle & Logo */}
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

      {/* Right: Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
        {/* Token Display */}
        {user && user.role !== 'guest' && user.role !== 'admin' && (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 6, 
            background: '#F0F9FF', 
            padding: '6px 12px', 
            borderRadius: '20px',
            border: '1px solid #BAE6FD'
          }}>
            <span style={{ fontSize: '14px', fontWeight: 800, color: '#0369A1' }}>{tokenBalance}</span>
            <Diamond size={14} fill="#0EA5E9" color="#0EA5E9" />
          </div>
        )}

        {/* User Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {user ? (
            <>
              <NavLink 
                to="/profile" 
                className="w-10 h-10 rounded-xl hover:bg-slate-100 flex items-center justify-center text-slate-600 transition-all"
                title="Thông tin cài đặt"
              >
                <Settings size={20} />
              </NavLink>
              <button 
                onClick={() => {
                  logout?.();
                  navigate('/login', { replace: true });
                }}
                className="w-10 h-10 rounded-xl hover:bg-rose-50 flex items-center justify-center text-slate-600 hover:text-rose-600 transition-all"
                title="Đăng xuất"
              >
                <LogOut size={20} />
              </button>
            </>
          ) : (
            <button 
              onClick={() => navigate('/login')}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all"
            >
              <LogIn size={18} />
              Đăng nhập
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
