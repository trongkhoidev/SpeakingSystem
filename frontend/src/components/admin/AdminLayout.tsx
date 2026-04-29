import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from '../layout/Navbar';
import { AdminSidebar } from './AdminSidebar';
import { MobileBottomNav } from '../layout/MobileBottomNav';

export function AdminLayout() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = React.useState(false);

  return (
    <div className={isSidebarCollapsed ? "app-root sidebar-collapsed" : "app-root"}>
      {/* ── 1. Shared Navbar ── */}
      <Navbar onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)} />

      {/* ── 2. Admin Body: AdminSidebar + Admin Pages ── */}
      <div className="app-body">
        <AdminSidebar isCollapsed={isSidebarCollapsed} onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)} />
        <main className="app-main">
          <div className="page-enter">
            <Outlet />
          </div>
        </main>
      </div>

      {/* ── 3. Mobile Bottom Nav (optional for admin, but keep for consistency) ── */}
      <MobileBottomNav />
    </div>
  );
}
