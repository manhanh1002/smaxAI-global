import React, { useEffect, useState } from 'react';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { TopUpModal } from './TopUpModal';
import { useStore } from '../../lib/store';
import { supabase } from '../../lib/supabase';
import { CreditCard, Zap, Clock, AlertTriangle } from 'lucide-react';

export const BillingSettings: React.FC = () => {
  const session = useStore((state) => state.session);
  const merchantId = session?.merchant?.id;

  const [loading, setLoading] = useState(true);
  const [credits, setCredits] = useState<number>(0);
  const [tasksUsed, setTasksUsed] = useState<number>(0);
  const [pricePer1k, setPricePer1k] = useState<number>(10); // Default fallback
  const [isTopUpOpen, setIsTopUpOpen] = useState(false);
  const [packages, setPackages] = useState<any[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<any>(null);

  useEffect(() => {
    if (merchantId) {
      loadBillingData();
    }
  }, [merchantId]);

  const loadBillingData = async () => {
    setLoading(true);
    try {
      // Fetch Packages
      const { data: pkgData } = await supabase.from('credit_packages').select('*').eq('is_active', true).order('price_usd', { ascending: true });
      setPackages(pkgData || []);

      // 1. Get Merchant Credits
      const { data: merchantData, error: merchantError } = await supabase
        .from('merchants')
        .select('credits')
        .eq('id', merchantId)
        .single();
      
      if (merchantData) {
        setCredits(merchantData.credits || 0);
      }

      // 2. Get Pricing Config
      const { data: configData, error: configError } = await supabase
        .from('system_settings')
        .select('value')
        .eq('key', 'credit_price_usd_per_1k')
        .single();
      
      if (configData?.value) {
        setPricePer1k(Number(configData.value));
      }

      // 3. Get Task Usage (This Month)
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { count, error: usageError } = await supabase
        .from('ai_task_logs')
        .select('*', { count: 'exact', head: true })
        .eq('merchant_id', merchantId)
        .gte('created_at', startOfMonth.toISOString());

      if (count !== null) {
        setTasksUsed(count);
      }

    } catch (error) {
      console.error('Error loading billing data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTopUpSuccess = () => {
    // Refresh data
    loadBillingData();
  };

  const handleSelectPackage = (pkg: any) => {
    setSelectedPackage(pkg);
    setIsTopUpOpen(true);
  };

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Loading billing information...</div>;
  }

  return (
    <div className="space-y-8 max-w-5xl">
      <div>
        <h2 className="text-lg font-medium text-gray-900">Billing & Usage</h2>
        <p className="mt-1 text-sm text-gray-500">
          Manage your AI credits and view usage statistics.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Current Balance Card */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg text-blue-600 mr-3">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-medium text-gray-900">Available Credits</h3>
            </div>
            {credits < 100 && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                <AlertTriangle className="w-3 h-3 mr-1" />
                Low Balance
              </span>
            )}
          </div>
          
          <div className="mt-4">
            <div className="text-4xl font-bold text-gray-900">{credits.toLocaleString()}</div>
            <p className="text-sm text-gray-500 mt-1">1 Task = 1 Credit</p>
          </div>

          <div className="mt-6">
            <Button 
              className="w-full" 
              onClick={() => setIsTopUpOpen(true)}
            >
              Top Up Credits
            </Button>
            <p className="text-xs text-center text-gray-400 mt-2">
              Current Rate: ${pricePer1k} per 1,000 Credits
            </p>
          </div>
        </Card>

        {/* Usage Stats Card */}
        <Card className="p-6">
          <div className="flex items-center mb-4">
            <div className="p-2 bg-purple-100 rounded-lg text-purple-600 mr-3">
              <Clock className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-medium text-gray-900">Usage This Month</h3>
          </div>

          <div className="mt-4">
             <div className="text-4xl font-bold text-gray-900">{tasksUsed.toLocaleString()}</div>
             <p className="text-sm text-gray-500 mt-1">AI Tasks Executed</p>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-100">
             <div className="flex justify-between text-sm">
                <span className="text-gray-500">Estimated Monthly Cost</span>
                <span className="font-medium text-gray-900">
                  ${((tasksUsed / 1000) * pricePer1k).toFixed(2)}
                </span>
             </div>
             <div className="flex justify-between text-sm mt-2">
                <span className="text-gray-500">Next Billing Date</span>
                <span className="font-medium text-gray-900">Prepaid</span>
             </div>
          </div>
        </Card>
      </div>

      {/* Pricing Table */}
      <div className="mt-8">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Pricing Packages</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           {packages.map((pkg) => (
             <Card key={pkg.id} className="p-6 hover:border-blue-300 transition-colors cursor-pointer" onClick={() => handleSelectPackage(pkg)}>
                <h4 className="font-semibold text-lg text-gray-900">{pkg.name}</h4>
                <div className="mt-2 mb-4">
                  <span className="text-3xl font-bold">${pkg.price_usd}</span>
                  <span className="text-gray-500"> / one-time</span>
                </div>
                <p className="text-sm text-gray-500 mb-4">{pkg.credits.toLocaleString()} AI Tasks</p>
                <ul className="space-y-2 text-sm text-gray-600 mb-6">
                  <li className="flex items-center"><Zap className="w-4 h-4 mr-2 text-blue-500"/> Full AI Access</li>
                  <li className="flex items-center"><Clock className="w-4 h-4 mr-2 text-blue-500"/> No Expiry</li>
                </ul>
                <Button variant="outline" className="w-full">Select Plan</Button>
             </Card>
           ))}
        </div>
      </div>

      <TopUpModal 
        isOpen={isTopUpOpen} 
        onClose={() => setIsTopUpOpen(false)} 
        pricePer1k={pricePer1k}
        onSuccess={handleTopUpSuccess}
      />
    </div>
  );
};
