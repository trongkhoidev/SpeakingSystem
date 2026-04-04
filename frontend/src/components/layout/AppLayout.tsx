import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';

interface AppLayoutProps {
  children?: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-bg-dark text-text-primary flex">
      {/* Background blobs for depth */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] opacity-20" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-secondary/10 rounded-full blur-[150px] opacity-15" />
        <div className="absolute top-[20%] right-[10%] w-[25%] h-[25%] bg-accent/5 rounded-full blur-[100px] opacity-10" />
      </div>

      {/* Main Sidebar (Desktop Only) */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {/* Mobile Bottom Nav */}
      <div className="lg:hidden">
        <Sidebar mode="mobile" />
      </div>

      {/* Main Content Area */}
      <main className="flex-1 lg:ml-64 p-4 md:p-8 relative overflow-y-auto h-screen pb-32 lg:pb-8">
        <div className="max-w-7xl mx-auto w-full animate-fade-in mb-20 lg:mb-0">
          {children || <Outlet />}
        </div>
      </main>
    </div>
  );
}
