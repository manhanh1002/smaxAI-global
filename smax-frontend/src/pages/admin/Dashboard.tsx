import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Card } from '../../components/common/Card';
import { DollarSign, Users, ShoppingBag, Zap, TrendingUp } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalMerchants: 0,
    totalTasks: 0,
    activeMerchants: 0
  });
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      // 1. Total Revenue from transactions
      const { data: transactions } = await supabase
        .from('transactions')
        .select('amount_usd, created_at')
        .eq('status', 'completed');
      
      const revenue = (transactions || []).reduce((sum, t) => sum + (Number(t.amount_usd) || 0), 0);

      // 2. Merchants Count
      const { count: merchantCount } = await supabase.from('merchants').select('*', { count: 'exact', head: true });
      
      // 3. Total Tasks Executed
      const { count: taskCount } = await supabase.from('ai_task_logs').select('*', { count: 'exact', head: true });

      // 4. Chart Data (Revenue by Date - Last 30 days)
      const dailyRevenue = new Map<string, number>();
      const now = new Date();
      for(let i=29; i>=0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        dailyRevenue.set(d.toISOString().split('T')[0], 0);
      }

      transactions?.forEach(t => {
        const date = t.created_at.split('T')[0];
        if (dailyRevenue.has(date)) {
          dailyRevenue.set(date, (dailyRevenue.get(date) || 0) + Number(t.amount_usd));
        }
      });

      const chart = Array.from(dailyRevenue.entries()).map(([date, value]) => ({
        date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        value
      }));

      setStats({
        totalRevenue: revenue,
        totalMerchants: merchantCount || 0,
        totalTasks: taskCount || 0,
        activeMerchants: merchantCount || 0 // Simplify for now
      });
      setChartData(chart);

    } catch (error) {
      console.error('Error fetching admin stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const cards = [
    { label: 'Total Revenue', value: `$${stats.totalRevenue.toLocaleString()}`, icon: DollarSign, color: 'text-green-600', bg: 'bg-green-100' },
    { label: 'Total Merchants', value: stats.totalMerchants, icon: Users, color: 'text-blue-600', bg: 'bg-blue-100' },
    { label: 'Total AI Tasks', value: stats.totalTasks.toLocaleString(), icon: Zap, color: 'text-purple-600', bg: 'bg-purple-100' },
    { label: 'Active Merchants', value: stats.activeMerchants, icon: TrendingUp, color: 'text-indigo-600', bg: 'bg-indigo-100' },
  ];

  if (loading) return <div className="p-8">Loading dashboard...</div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-500 mt-2">System-wide performance and metrics.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {cards.map((card, index) => (
          <Card key={index} className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">{card.label}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{card.value}</p>
              </div>
              <div className={`p-3 rounded-full ${card.bg}`}>
                <card.icon className={`w-6 h-6 ${card.color}`} />
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-6">Revenue Trend (30 Days)</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" axisLine={false} tickLine={false} />
              <YAxis axisLine={false} tickLine={false} prefix="$" />
              <Tooltip formatter={(value: number) => [`$${value}`, 'Revenue']} />
              <Area type="monotone" dataKey="value" stroke="#10B981" fillOpacity={1} fill="url(#colorRevenue)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
};
