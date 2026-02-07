import React from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { ChatWidget } from './ChatWidget';
import { useStore } from '../lib/store';
import { cn } from '../lib/utils';

export const Layout: React.FC = () => {
  const session = useStore((state) => state.session);
  const location = useLocation();

  if (!session?.isLoggedIn) {
    return <Navigate to="/login" replace />;
  }
  
  if (!session.merchant.ai_trained && window.location.pathname !== '/onboarding') {
     return <Navigate to="/onboarding" replace />;
  }

  const isFullWidthPage = ['/conversations', '/settings'].includes(location.pathname);

  return (
    <div className="min-h-screen bg-gray-50">
      <ChatWidget />
      <Sidebar />
      <main className="pl-64 min-h-screen">
        <div className={cn(
          "h-full",
          !isFullWidthPage && "max-w-7xl mx-auto"
        )}>
          <Outlet />
        </div>
      </main>
    </div>
  );
};
