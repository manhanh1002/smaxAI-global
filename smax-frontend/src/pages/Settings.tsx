import React, { useState } from 'react';
import { Settings as SettingsIcon, LogOut, Zap, LayoutGrid, CreditCard, Users } from 'lucide-react';
import { useStore } from '../lib/store';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';
import { GeneralSettings } from '../components/Settings/GeneralSettings';
import { AIConfiguration } from '../components/Settings/AIConfiguration';
import { BillingSettings } from '../components/settings/BillingSettings';

export const Settings: React.FC = () => {
  const logout = useStore((state) => state.logout);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('general');

  const tabs = [
    { id: 'general', label: 'General', icon: SettingsIcon },
    { id: 'ai', label: 'AI Configuration', icon: Zap },
    { id: 'channels', label: 'Channels', icon: LayoutGrid },
    { id: 'billing', label: 'Billing', icon: CreditCard },
    { id: 'team', label: 'Team', icon: Users },
  ];

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Settings Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-100">
          <h1 className="text-xl font-bold text-gray-900">Settings</h1>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors text-left',
                activeTab === tab.id
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              )}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Settings Content */}
      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {tabs.find(t => t.id === activeTab)?.label}
            </h2>
            <p className="text-gray-500">Manage your settings and preferences.</p>
          </div>

          {activeTab === 'general' && <GeneralSettings />}
          {activeTab === 'ai' && <AIConfiguration />}
          {activeTab === 'billing' && <BillingSettings />}
          
          {['channels', 'team'].includes(activeTab) && (
            <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
              <div className="h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <SettingsIcon className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900">Coming Soon</h3>
              <p className="text-gray-500 mt-2">This settings section is under development.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
