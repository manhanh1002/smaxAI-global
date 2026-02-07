import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bot, CheckCircle, MessageSquare, LayoutGrid, ArrowRight, Play, Calendar, DollarSign, Activity } from 'lucide-react';
import { Card, Button } from '../components/common';
import { useStore } from '../lib/store';
import { supabase } from '../lib/supabase';
import { DashboardChecklist } from '../components/dashboard/DashboardChecklist';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export const Dashboard: React.FC = () => {
  const session = useStore((state) => state.session);
  const merchantId = session?.merchant?.id;
  const [dateRange, setDateRange] = useState<'7d' | '30d' | 'month'>('7d');

  // Overview Stats (Filtered)
  const [overviewStats, setOverviewStats] = useState({
    conversations: 0,
    bookings: 0,
    orders: 0,
    revenue: 0,
    chartData: [] as any[]
  });

  // Today's Stats (Fixed)
  const [todayStats, setTodayStats] = useState({
    revenue: 0,
    messages: 0,
    bookings: 0
  });

  const [checklistItems, setChecklistItems] = useState([
    { id: '1', label: 'Connect AI to Channels', description: 'Enable chat widget or Facebook Messenger.', isCompleted: false, link: '/channels', actionLabel: 'Connect' },
    { id: '2', label: 'Train your Assistant', description: 'Add products, services, and business info.', isCompleted: false, link: '/business', actionLabel: 'Train' },
    { id: '3', label: 'Embed on Website', description: 'Add the chat widget to your site.', isCompleted: false, link: '/channels', actionLabel: 'Get Code' },
    { id: '4', label: 'Test the AI', description: 'Have a conversation with your assistant.', isCompleted: false, link: '/conversations', actionLabel: 'Test' },
  ]);

  useEffect(() => {
    if (merchantId) {
      fetchOverviewData();
      fetchTodayData();
      checkSystemStatus();
    }
  }, [merchantId, dateRange]);

  const getDateFilter = () => {
    const now = new Date();
    const startDate = new Date();
    
    if (dateRange === '7d') startDate.setDate(now.getDate() - 7);
    if (dateRange === '30d') startDate.setDate(now.getDate() - 30);
    if (dateRange === 'month') startDate.setDate(1); // Start of month

    return startDate.toISOString();
  };

  const fetchOverviewData = async () => {
    const startDate = getDateFilter();
    
    // Fetch filtered counts
    const [conv, book, ord, rev] = await Promise.all([
      supabase.from('conversations').select('*', { count: 'exact', head: true }).eq('merchant_id', merchantId).gte('created_at', startDate),
      supabase.from('bookings').select('*', { count: 'exact', head: true }).eq('merchant_id', merchantId).gte('created_at', startDate),
      supabase.from('orders').select('*', { count: 'exact', head: true }).eq('merchant_id', merchantId).gte('created_at', startDate),
      supabase.from('orders').select('total_amount').eq('merchant_id', merchantId).gte('created_at', startDate).neq('status', 'cancelled')
    ]);

    const totalRevenue = (rev.data || []).reduce((sum, o) => sum + (o.total_amount || 0), 0);

    // Mock Chart Data (Replace with real aggregation if needed)
    const mockChartData = Array.from({ length: dateRange === '7d' ? 7 : 10 }).map((_, i) => ({
      name: `Day ${i + 1}`,
      value: Math.floor(Math.random() * 10) + 1
    }));

    setOverviewStats({
      conversations: conv.count || 0,
      bookings: book.count || 0,
      orders: ord.count || 0,
      revenue: totalRevenue,
      chartData: mockChartData
    });
  };

  const fetchTodayData = async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString();

    const [orders, msgs, bookings] = await Promise.all([
      supabase.from('orders').select('total_amount').eq('merchant_id', merchantId).gte('created_at', todayStr).neq('status', 'cancelled'),
      supabase.from('messages').select('*', { count: 'exact', head: true }).eq('merchant_id', merchantId).gte('created_at', todayStr),
      supabase.from('bookings').select('*', { count: 'exact', head: true }).eq('merchant_id', merchantId).gte('created_at', todayStr)
    ]);

    const todayRev = (orders.data || []).reduce((sum, o) => sum + (o.total_amount || 0), 0);

    setTodayStats({
      revenue: todayRev,
      messages: msgs.count || 0,
      bookings: bookings.count || 0
    });
  };

  const checkSystemStatus = async () => {
    // Simple checks to update checklist UI
    const { count: productCount } = await supabase.from('products').select('*', { count: 'exact', head: true }).eq('merchant_id', merchantId);
    const { count: msgCount } = await supabase.from('messages').select('*', { count: 'exact', head: true }).eq('merchant_id', merchantId);

    setChecklistItems(prev => prev.map(item => {
      if (item.id === '2' && (productCount || 0) > 0) return { ...item, isCompleted: true };
      if (item.id === '4' && (msgCount || 0) > 0) return { ...item, isCompleted: true };
      return item;
    }));
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 p-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Welcome back, {session?.merchant?.name}</p>
      </div>

      {/* Top: Checklist */}
      <DashboardChecklist items={checklistItems} />

      {/* Main Grid: 70% Overview / 30% Today */}
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
        
        {/* Left Column (70%) - System Overview */}
        <div className="lg:col-span-7 space-y-6">
          <Card className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">System Overview</h2>
              <div className="flex gap-2 mt-2 sm:mt-0">
                {(['7d', '30d', 'month'] as const).map((range) => (
                  <button
                    key={range}
                    onClick={() => setDateRange(range)}
                    className={`
                      px-3 py-1 text-xs font-medium rounded-full transition-colors
                      ${dateRange === range 
                        ? 'bg-primary-50 text-primary-700' 
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}
                    `}
                  >
                    {range === '7d' ? 'Last 7 Days' : range === '30d' ? 'Last 30 Days' : 'This Month'}
                  </button>
                ))}
              </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                <p className="text-sm text-gray-500">Conversations</p>
                <p className="text-2xl font-bold text-gray-900">{overviewStats.conversations}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                <p className="text-sm text-gray-500">Bookings</p>
                <p className="text-2xl font-bold text-gray-900">{overviewStats.bookings}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                <p className="text-sm text-gray-500">Revenue</p>
                <p className="text-2xl font-bold text-gray-900">${overviewStats.revenue.toLocaleString()}</p>
              </div>
            </div>

            {/* Chart Area */}
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={overviewStats.chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 12}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 12}} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                  />
                  <Line type="monotone" dataKey="value" stroke="#e25a4a" strokeWidth={3} dot={{ r: 4, fill: '#e25a4a', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        {/* Right Column (30%) - Today's Pulse */}
        <div className="lg:col-span-3 space-y-6">
          <Card className="p-6 h-full bg-primary-900 text-white border-none shadow-lg">
             <div className="flex items-center gap-2 mb-6">
               <Activity className="w-5 h-5 text-accent-400" />
               <h2 className="text-lg font-semibold">Today's Pulse</h2>
             </div>

             <div className="space-y-6">
               <div>
                 <p className="text-primary-200 text-sm mb-1">Revenue Today</p>
                 <div className="flex items-center gap-3">
                   <div className="p-3 bg-white/10 rounded-lg">
                     <DollarSign className="w-6 h-6 text-white" />
                   </div>
                   <span className="text-3xl font-bold">${todayStats.revenue.toLocaleString()}</span>
                 </div>
               </div>

               <div className="w-full h-px bg-white/10" />

               <div>
                 <p className="text-primary-200 text-sm mb-1">Messages Processed</p>
                 <div className="flex items-center gap-3">
                   <div className="p-3 bg-white/10 rounded-lg">
                     <MessageSquare className="w-6 h-6 text-white" />
                   </div>
                   <span className="text-3xl font-bold">{todayStats.messages}</span>
                 </div>
               </div>

               <div className="w-full h-px bg-white/10" />

               <div>
                 <p className="text-primary-200 text-sm mb-1">New Bookings</p>
                 <div className="flex items-center gap-3">
                   <div className="p-3 bg-white/10 rounded-lg">
                     <Calendar className="w-6 h-6 text-white" />
                   </div>
                   <span className="text-3xl font-bold">{todayStats.bookings}</span>
                 </div>
               </div>
             </div>
          </Card>
        </div>

      </div>
    </div>
  );
};
