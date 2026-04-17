import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { AppSidebar } from './AppSidebar';
import { MobileBottomNav } from './MobileBottomNav';

interface AppLayoutProps {
  children?: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="app-root">
      {/* ── 1. Navbar ngang trên cùng (60px) ── */}
      <Navbar />

      {/* ── 2. Body: Sidebar (240px) + Main (flex:1) ── */}
      <div className="app-body">
        <AppSidebar />
        <main className="app-main">
          <div className="page-enter">
            {children || <Outlet />}
          </div>
        </main>
      </div>

      {/* ── 3. Mobile bottom nav (chỉ hiện < 768px) ── */}
      <MobileBottomNav />
    </div>
  );
}
