import React, { useState, useEffect } from 'react';
import { useStore } from '../../lib/store';
import { Button } from '../common/Button';

interface StepBusinessInfoProps {
  onNext: () => void;
}

export const StepBusinessInfo: React.FC<StepBusinessInfoProps> = ({ onNext }) => {
  const session = useStore((state) => state.session);
  const updateMerchant = useStore((state) => state.updateMerchant);
  
  const [formData, setFormData] = useState({
    name: '',
    website: '',
    business_type: 'spa',
    description: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (session?.merchant) {
      setFormData({
        name: session.merchant.name || '',
        website: session.merchant.website || '',
        business_type: session.merchant.business_type || 'spa',
        description: session.merchant.description || '',
      });
    }
  }, [session]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Update local session and DB
      await updateMerchant({
        name: formData.name,
        website: formData.website,
        business_type: formData.business_type,
        description: formData.description,
      });
    } catch (error) {
      console.error('Failed to update merchant', error);
    } finally {
      setIsLoading(false);
      onNext();
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Business Information</h2>
        <p className="text-sm text-gray-500">Tell us about your business so the AI can represent you correctly.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Business Name</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
              placeholder="e.g. Demo Spa & Wellness"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Website</label>
            <input
              type="text"
              required
              value={formData.website}
              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
              placeholder="e.g. www.demospa.com"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Business Type</label>
            <select
              value={formData.business_type}
              onChange={(e) => setFormData({ ...formData, business_type: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
            >
              <option value="spa">Spa & Wellness</option>
              <option value="clinic">Medical Clinic</option>
              <option value="restaurant">Restaurant</option>
              <option value="ecom">E-commerce</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Description (Optional)</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
              placeholder="Describe your services, opening hours, etc."
            />
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Saving...' : 'Next Step'}
          </Button>
        </div>
      </form>
    </div>
  );
};
