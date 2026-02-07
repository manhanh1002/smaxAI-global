import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  MessageSquare, 
  Settings, 
  LogOut, 
  LayoutGrid, 
  ShoppingBag, 
  Calendar, 
  Store, 
  BarChart,
  Users 
} from 'lucide-react';
import { useStore } from '../lib/store';
import { cn } from '../lib/utils';

export const Sidebar: React.FC = () => {
  const logout = useStore((state) => state.logout);
  const location = useLocation();

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', to: '/dashboard' },
    { icon: LayoutGrid, label: 'Channels', to: '/channels' },
    { icon: MessageSquare, label: 'Conversations', to: '/conversations' },
    { icon: Users, label: 'Customers', to: '/customers' },
    { icon: ShoppingBag, label: 'Orders', to: '/orders' },
    { icon: Calendar, label: 'Bookings', to: '/bookings' },
    { icon: Store, label: 'My Business', to: '/business' },
    { icon: BarChart, label: 'Analytics', to: '/analytics' },
    { icon: Settings, label: 'Settings', to: '/settings' },
  ];

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col h-screen fixed left-0 top-0 z-10">
      <div className="p-6 border-b border-gray-100">
        <div className="h-8 flex items-center">
          <img src="/logo.png" alt="Smax AI" className="h-full object-contain" />
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                isActive
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              )
            }
          >
            <item.icon className="h-5 w-5" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-100">
        <button
          onClick={logout}
          className="flex items-center gap-3 px-3 py-2 w-full text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 rounded-md transition-colors"
        >
          <LogOut className="h-5 w-5" />
          Sign Out
        </button>
      </div>
    </aside>
  );
};
