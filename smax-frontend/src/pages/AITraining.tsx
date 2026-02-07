import React, { useState } from 'react';
import { Card } from '../components/common/Card';
import { StepBusinessInfo } from '../components/Onboarding/StepBusinessInfo';
import { StepProductTab } from '../components/Training/StepProductTab';
import { StepServiceTab } from '../components/Training/StepServiceTab';
import { StepBookingSlots } from '../components/Training/StepBookingSlots';
import { StepScopeProcess } from '../components/Training/StepScopeProcess';
import { cn } from '../lib/utils';

type TabId = 'profile' | 'product' | 'service' | 'booking_slot' | 'scope';

export const AITraining: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>('profile');

  const tabs = [
    { id: 'profile', label: 'Business Profile' },
    { id: 'product', label: 'Product' },
    { id: 'service', label: 'Service' },
    { id: 'booking_slot', label: 'Booking Slot' },
    { id: 'scope', label: 'Business Policies' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500 p-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">My Business</h1>
        <p className="text-gray-500 mt-2">Manage your business information, products, services, and booking slots.</p>
      </div>

      <div className="flex space-x-4 border-b border-gray-200 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as TabId)}
            className={cn(
              'px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
              activeTab === tab.id
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <Card className="p-6">
        {activeTab === 'profile' ? (
          <div className="max-w-2xl">
            <StepBusinessInfo onNext={() => {}} />
          </div>
        ) : activeTab === 'product' ? (
          <StepProductTab />
        ) : activeTab === 'service' ? (
          <StepServiceTab />
        ) : activeTab === 'booking_slot' ? (
          <StepBookingSlots />
        ) : (
          <StepScopeProcess />
        )}
      </Card>
    </div>
  );
};
