import React, { useState, useEffect } from 'react';
import { useStore } from '../../lib/store';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { supabase } from '../../lib/supabase';

export const GeneralSettings: React.FC = () => {
  const { session, updateMerchant } = useStore();
  const [merchantData, setMerchantData] = useState({
    name: session?.merchant.name || '',
    website: session?.merchant.website || '',
    business_type: session?.merchant.business_type || 'spa'
  });

  const [profileData, setProfileData] = useState({
    full_name: '',
    position: '',
    usage_intent: ''
  });

  const [passwordData, setPasswordData] = useState({
    newPassword: '',
    confirmPassword: ''
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (session?.user?.id) {
      fetchProfile();
    }
  }, [session?.user?.id]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session?.user?.id)
        .single();

      if (data) {
        setProfileData({
          full_name: data.full_name || '',
          position: data.position || '',
          usage_intent: data.usage_intent || ''
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const handleSave = async () => {
    if (!session?.merchant.id || !session?.user?.id) return;
    setLoading(true);
    
    try {
      // 1. Update Merchant Info
      await updateMerchant(merchantData);

      // 2. Update Profile Info
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: session.user.id,
          full_name: profileData.full_name,
          position: profileData.position,
          usage_intent: profileData.usage_intent,
          updated_at: new Date()
        });

      if (profileError) throw profileError;

      // 3. Update Password (if provided)
      if (passwordData.newPassword) {
        if (passwordData.newPassword !== passwordData.confirmPassword) {
          alert("Passwords do not match!");
          setLoading(false);
          return;
        }

        const { error: passwordError } = await supabase.auth.updateUser({
          password: passwordData.newPassword
        });

        if (passwordError) throw passwordError;
        setPasswordData({ newPassword: '', confirmPassword: '' });
      }

      alert('Account information saved successfully!');
    } catch (error: any) {
      console.error('Failed to save settings:', error);
      alert(`Failed to save settings: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Account information</h3>
        
        {/* User Profile Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700">Email Address</label>
            <input
              type="email"
              value={session?.user?.email || ''}
              disabled
              className="mt-1 block w-full rounded-md border-gray-300 bg-gray-100 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border cursor-not-allowed"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Full Name</label>
            <input
              type="text"
              value={profileData.full_name}
              onChange={(e) => setProfileData({...profileData, full_name: e.target.value})}
              placeholder="e.g. John Doe"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Position / Job Title</label>
            <input
              type="text"
              value={profileData.position}
              onChange={(e) => setProfileData({...profileData, position: e.target.value})}
              placeholder="e.g. Manager"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700">Usage Needs / Intent</label>
            <textarea
              value={profileData.usage_intent}
              onChange={(e) => setProfileData({...profileData, usage_intent: e.target.value})}
              placeholder="Describe how you plan to use the system..."
              rows={3}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
            />
          </div>
        </div>

        <div className="border-t border-gray-200 my-6 pt-6">
            <h4 className="text-md font-medium text-gray-900 mb-4">Merchant Details</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Merchant Name</label>
                    <input
                    type="text"
                    value={merchantData.name}
                    onChange={(e) => setMerchantData({...merchantData, name: e.target.value})}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Website</label>
                    <input
                    type="url"
                    value={merchantData.website}
                    onChange={(e) => setMerchantData({...merchantData, website: e.target.value})}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Business Type</label>
                    <select
                    value={merchantData.business_type}
                    onChange={(e) => setMerchantData({...merchantData, business_type: e.target.value})}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
                    >
                    <option value="spa">Spa / Salon</option>
                    <option value="clinic">Clinic</option>
                    <option value="restaurant">Restaurant</option>
                    <option value="ecom">E-commerce</option>
                    <option value="other">Other</option>
                    </select>
                </div>
            </div>
        </div>

        <div className="border-t border-gray-200 my-6 pt-6">
            <h4 className="text-md font-medium text-gray-900 mb-4">Security</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700">New Password</label>
                    <input
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                    placeholder="Leave blank to keep current"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Confirm Password</label>
                    <input
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                    placeholder="Confirm new password"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
                    />
                </div>
            </div>
        </div>

        <div className="mt-6 flex justify-end">
          <Button onClick={handleSave} disabled={loading}>
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </Card>
    </div>
  );
};
