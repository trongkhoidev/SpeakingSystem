import { NavLink } from 'react-router-dom';
import { Home, BookOpen, GraduationCap, Settings, LogOut } from 'lucide-react';
import { cn } from '../../lib/utils';

const navItems = [
  { icon: Home, label: 'Trang chủ', to: '/' },
  { icon: BookOpen, label: 'Luyện theo câu', to: '/practice' },
  { icon: GraduationCap, label: 'Thi thử', to: '/test' },
];

interface SidebarProps {
  mode?: 'desktop' | 'mobile';
}

export function Sidebar({ mode = 'desktop' }: SidebarProps) {
  if (mode === 'mobile') {
    return (
      <nav className="fixed bottom-0 left-0 right-0 h-20 bg-background-primary/80 backdrop-blur-3xl border-t border-white/10 z-[60] flex items-center justify-around px-6 safe-area-pb">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center gap-1.5 p-2 transition-all duration-500 rounded-2xl",
                isActive ? "text-primary" : "text-white/40"
              )
            }
          >
            {({ isActive }) => (
              <>
                <div className={cn(
                  "p-2 rounded-xl transition-all duration-500",
                  isActive ? "bg-primary/20 scale-110 shadow-[0_0_15px_rgba(124,58,237,0.3)]" : "bg-transparent"
                )}>
                  <item.icon className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest">{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    );
  }

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 glass sidebar-blur border-r border-white/10 z-50 flex flex-col overflow-hidden">
      <div className="p-10">
        <h1 className="text-3xl font-black gradient-text font-heading tracking-tighter italic drop-shadow-lg">
          LexiLearn
        </h1>
        <p className="text-[10px] text-primary font-black tracking-[0.3em] uppercase mt-1 opacity-80">
          IELTS Speaking Pro
        </p>
      </div>

      <nav className="flex-1 px-6 space-y-4 pt-10">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-4 px-6 py-4 rounded-2xl transition-all duration-500 group relative overflow-hidden",
                isActive 
                  ? "bg-primary text-white shadow-2xl shadow-primary/30" 
                  : "text-white/40 hover:bg-white/[0.05] hover:text-white"
              )
            }
          >
            <item.icon className="w-5 h-5 transition-transform group-hover:scale-125 duration-500" />
            <span className="font-extrabold text-sm uppercase tracking-widest">{item.label}</span>
            <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          </NavLink>
        ))}
      </nav>

      <div className="p-6 border-t border-white/5 space-y-3 bg-white/[0.02]">
        <button className="w-full flex items-center gap-4 px-6 py-4 text-white/40 hover:text-white hover:bg-white/[0.05] rounded-2xl transition-all duration-500 group">
          <Settings className="w-5 h-5 group-hover:rotate-45 duration-700" />
          <span className="font-extrabold text-xs uppercase tracking-widest">Cài đặt</span>
        </button>
        <button className="w-full flex items-center gap-4 px-6 py-4 text-rose-500/60 hover:text-rose-500 hover:bg-rose-500/10 rounded-2xl transition-all duration-500 group">
          <LogOut className="w-5 h-5 group-hover:-translate-x-1 duration-500" />
          <span className="font-extrabold text-xs uppercase tracking-widest">Đăng xuất</span>
        </button>
      </div>
    </aside>
  );
}
