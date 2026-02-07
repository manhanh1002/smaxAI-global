import React, { useEffect, useState } from 'react';
import { Card } from '../components/common/Card';
import { useStore } from '../lib/store';
import { supabase } from '../lib/supabase';
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { 
  TrendingUp, Users, ShoppingCart, Calendar, MessageSquare, 
  Activity, DollarSign, AlertCircle, CheckCircle, Clock, Zap 
} from 'lucide-react';

export const Analytics: React.FC = () => {
  const session = useStore((state) => state.session);
  const merchantId = session?.merchant?.id;

  const [activeTab, setActiveTab] = useState<'overalls' | 'ai' | 'sales' | 'interaction'>('overalls');
  const [loading, setLoading] = useState(true);
  
  // Data
  const [orders, setOrders] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [conversations, setConversations] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);

  useEffect(() => {
    if (merchantId) loadData();
  }, [merchantId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [
        { data: ordersData },
        { data: bookingsData },
        { data: conversationsData },
        { data: customersData }
      ] = await Promise.all([
        supabase.from('orders').select('*').eq('merchant_id', merchantId),
        supabase.from('bookings').select('*').eq('merchant_id', merchantId),
        supabase.from('conversations').select('*').eq('merchant_id', merchantId),
        supabase.from('customers').select('*').eq('merchant_id', merchantId)
      ]);

      setOrders(ordersData || []);
      setBookings(bookingsData || []);
      setConversations(conversationsData || []);
      setCustomers(customersData || []);

      // Fetch messages for these conversations
      // Optimized: Fetch messages where conversation_id in (conversationsData.ids)
      // Or if messages has merchant_id, use that. Let's try merchant_id first, fallback to conversation ids.
      const { data: messagesData, error: msgError } = await supabase
        .from('messages')
        .select('*')
        .eq('merchant_id', merchantId);
      
      if (msgError || !messagesData || messagesData.length === 0) {
         // Fallback if merchant_id not populated on messages
         const convIds = (conversationsData || []).map(c => c.id);
         if (convIds.length > 0) {
             const { data: msgData2 } = await supabase
                .from('messages')
                .select('*')
                .in('conversation_id', convIds);
             setMessages(msgData2 || []);
         } else {
             setMessages([]);
         }
      } else {
          setMessages(messagesData);
      }

    } catch (error) {
      console.error('Failed to load analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  // --- Metrics Calculation ---

  // Overalls
  const totalRevenue = 
    orders.filter(o => o.status !== 'cancelled').reduce((sum, o) => sum + (o.total_amount || 0), 0) +
    bookings.filter(b => b.status !== 'cancelled').reduce((sum, b) => sum + (b.total_amount || 0), 0);
  
  const lostRevenue = 
    orders.filter(o => o.status === 'cancelled').reduce((sum, o) => sum + (o.total_amount || 0), 0) +
    bookings.filter(b => b.status === 'cancelled').reduce((sum, b) => sum + (b.total_amount || 0), 0);

  const totalTasks = orders.length + bookings.length;
  const globalCancellationRate = totalTasks > 0 
    ? ((orders.filter(o => o.status === 'cancelled').length + bookings.filter(b => b.status === 'cancelled').length) / totalTasks) * 100 
    : 0;

  // Chart: Revenue Trend (Last 30 Days)
  // Group by date
  const revenueTrend = (() => {
      const days = 30;
      const data: any[] = [];
      const now = new Date();
      for (let i = days - 1; i >= 0; i--) {
          const d = new Date(now);
          d.setDate(d.getDate() - i);
          const dateStr = d.toISOString().split('T')[0];
          
          const dailyOrders = orders.filter(o => o.created_at.startsWith(dateStr) && o.status !== 'cancelled');
          const dailyBookings = bookings.filter(b => b.created_at.startsWith(dateStr) && b.status !== 'cancelled');
          
          const ordersRevenue = dailyOrders.reduce((s, x) => s + (x.total_amount||0), 0);
          const bookingsRevenue = dailyBookings.reduce((s, x) => s + (x.total_amount||0), 0);

          data.push({
              date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
              revenue: ordersRevenue + bookingsRevenue,
              ordersRevenue,
              bookingsRevenue,
              cancelled: dailyOrders.filter(o => o.status === 'cancelled').reduce((s, x) => s + (x.total_amount||0), 0) // Just order cancellation value
          });
      }
      return data;
  })();

  // AI Performance
  const aiOrders = orders.filter(o => o.created_by_ai);
  // Assuming all bookings are AI driven for now as per user requirement, or until we have created_by_ai column
  const aiBookings = bookings.filter(b => b.status !== 'cancelled');
  
  const aiRevenue = 
    aiOrders.filter(o => o.status !== 'cancelled').reduce((sum, o) => sum + (o.total_amount || 0), 0) +
    aiBookings.reduce((sum, b) => sum + (b.total_amount || 0), 0);
    
  const aiMessages = messages.filter(m => m.role === 'ai');
  const humanMessages = messages.filter(m => m.role === 'agent'); // 'agent' role for human
  const automationRate = messages.length > 0 ? (aiMessages.length / messages.length) * 100 : 0;
  
  // AI vs Human Chart
  const aiVsHuman = [
      { name: 'AI Messages', value: aiMessages.length, color: '#3B82F6' },
      { name: 'Human Messages', value: humanMessages.length, color: '#10B981' }
  ];

  // Sales
  // "confirmed" is the success status for orders in this system
  const completedOrdersCount = orders.filter(o => o.status === 'confirmed' || o.status === 'completed').length;
  const pendingOrdersCount = orders.filter(o => o.status === 'pending').length;
  const orderCancellationRate = orders.length > 0 ? (orders.filter(o => o.status === 'cancelled').length / orders.length) * 100 : 0;
  const aov = orders.length > 0 ? orders.reduce((s, o) => s + (o.total_amount || 0), 0) / orders.length : 0;

  // Interaction
  const totalMessages = messages.length;
  const uniqueUsers = new Set(messages.filter(m => m.role === 'visitor').map(m => m.sender_id || m.conversation_id)).size; // approximate
  
  // Peak Hours
  const peakHoursData = (() => {
      const hours = new Array(24).fill(0);
      messages.forEach(m => {
          const h = new Date(m.created_at).getHours();
          hours[h]++;
      });
      return hours.map((count, h) => ({ hour: `${h}:00`, count }));
  })();


  const renderTabContent = () => {
    switch (activeTab) {
      case 'overalls':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="p-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-green-100 text-green-600"><DollarSign className="w-6 h-6" /></div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Net Revenue</p>
                    <h3 className="text-2xl font-bold text-gray-900">${totalRevenue.toLocaleString()}</h3>
                  </div>
                </div>
              </Card>
              <Card className="p-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-red-100 text-red-600"><TrendingUp className="w-6 h-6" /></div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Lost Revenue</p>
                    <h3 className="text-2xl font-bold text-gray-900">${lostRevenue.toLocaleString()}</h3>
                  </div>
                </div>
              </Card>
              <Card className="p-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-blue-100 text-blue-600"><CheckCircle className="w-6 h-6" /></div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Completed Tasks</p>
                    <h3 className="text-2xl font-bold text-gray-900">{totalTasks}</h3>
                  </div>
                </div>
              </Card>
              <Card className="p-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-yellow-100 text-yellow-600"><AlertCircle className="w-6 h-6" /></div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Cancellation Rate</p>
                    <h3 className="text-2xl font-bold text-gray-900">{globalCancellationRate.toFixed(1)}%</h3>
                  </div>
                </div>
              </Card>
            </div>

            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Revenue Trend (30 Days)</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueTrend}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="revenue" stroke="#10B981" fillOpacity={1} fill="url(#colorRevenue)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>
        );

      case 'ai':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="p-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-indigo-100 text-indigo-600"><Zap className="w-6 h-6" /></div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">AI Automation</p>
                    <h3 className="text-2xl font-bold text-gray-900">{automationRate.toFixed(1)}%</h3>
                  </div>
                </div>
              </Card>
              <Card className="p-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-blue-100 text-blue-600"><ShoppingCart className="w-6 h-6" /></div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">AI Conversions</p>
                    <h3 className="text-2xl font-bold text-gray-900">{aiOrders.length + aiBookings.length}</h3>
                  </div>
                </div>
              </Card>
              <Card className="p-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-green-100 text-green-600"><DollarSign className="w-6 h-6" /></div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">AI Revenue</p>
                    <h3 className="text-2xl font-bold text-gray-900">${aiRevenue.toLocaleString()}</h3>
                  </div>
                </div>
              </Card>
              <Card className="p-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-purple-100 text-purple-600"><MessageSquare className="w-6 h-6" /></div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">AI Messages</p>
                    <h3 className="text-2xl font-bold text-gray-900">{aiMessages.length}</h3>
                  </div>
                </div>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4">AI vs Human Messages</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={aiVsHuman}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {aiVsHuman.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </Card>
                <Card className="p-6 flex flex-col justify-center items-center text-center">
                    <h3 className="text-lg font-semibold mb-2">AI Impact Score</h3>
                    <div className="text-5xl font-bold text-blue-600 mb-2">
                        {Math.min(100, (automationRate + (aiRevenue > 0 ? 20 : 0))).toFixed(0)}
                    </div>
                    <p className="text-gray-500">Calculated based on automation rate and revenue contribution.</p>
                </Card>
            </div>
          </div>
        );

      case 'sales':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="p-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-green-100 text-green-600"><DollarSign className="w-6 h-6" /></div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Gross Sales (GMV)</p>
                    <h3 className="text-2xl font-bold text-gray-900">${(totalRevenue + lostRevenue).toLocaleString()}</h3>
                  </div>
                </div>
              </Card>
              <Card className="p-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-yellow-100 text-yellow-600"><Activity className="w-6 h-6" /></div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Avg Order Value</p>
                    <h3 className="text-2xl font-bold text-gray-900">${aov.toLocaleString(undefined, { maximumFractionDigits: 0 })}</h3>
                  </div>
                </div>
              </Card>
              <Card className="p-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-blue-100 text-blue-600"><CheckCircle className="w-6 h-6" /></div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Completed Orders</p>
                    <h3 className="text-2xl font-bold text-gray-900">{completedOrdersCount}</h3>
                  </div>
                </div>
              </Card>
              <Card className="p-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-red-100 text-red-600"><AlertCircle className="w-6 h-6" /></div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Cancel Rate</p>
                    <h3 className="text-2xl font-bold text-gray-900">{orderCancellationRate.toFixed(1)}%</h3>
                  </div>
                </div>
              </Card>
            </div>
            {/* Sales Charts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Daily Sales Performance</h3>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={revenueTrend}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" />
                                <YAxis />
                                <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
                                <Legend />
                                <Bar dataKey="ordersRevenue" name="Orders" stackId="a" fill="#3B82F6" />
                                <Bar dataKey="bookingsRevenue" name="Bookings" stackId="a" fill="#10B981" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </Card>
                
                <Card className="p-6">
                     <h3 className="text-lg font-semibold mb-4">Revenue Composition</h3>
                     <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={[
                                        { name: 'Orders', value: orders.filter(o => o.status !== 'cancelled').reduce((s, x) => s + (x.total_amount||0), 0), color: '#3B82F6' },
                                        { name: 'Bookings', value: bookings.filter(b => b.status !== 'cancelled').reduce((s, x) => s + (x.total_amount||0), 0), color: '#10B981' }
                                    ]}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    paddingAngle={5}
                                    dataKey="value"
                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                >
                                    <Cell key="cell-0" fill="#3B82F6" />
                                    <Cell key="cell-1" fill="#10B981" />
                                </Pie>
                                <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                     </div>
                </Card>
            </div>
          </div>
        );

      case 'interaction':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="p-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-purple-100 text-purple-600"><MessageSquare className="w-6 h-6" /></div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Total Messages</p>
                    <h3 className="text-2xl font-bold text-gray-900">{totalMessages.toLocaleString()}</h3>
                  </div>
                </div>
              </Card>
              <Card className="p-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-blue-100 text-blue-600"><Users className="w-6 h-6" /></div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Unique Visitors</p>
                    <h3 className="text-2xl font-bold text-gray-900">{uniqueUsers}</h3>
                  </div>
                </div>
              </Card>
              <Card className="p-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-green-100 text-green-600"><Calendar className="w-6 h-6" /></div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Active Conversations</p>
                    <h3 className="text-2xl font-bold text-gray-900">{conversations.length}</h3>
                  </div>
                </div>
              </Card>
            </div>

            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Peak Interaction Hours</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={peakHoursData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hour" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>
        );
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 p-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
        <p className="text-gray-500 mt-2">Comprehensive insights into your business performance.</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          {[
            { id: 'overalls', name: 'Overalls' },
            { id: 'ai', name: 'AI Performance' },
            { id: 'sales', name: 'Sales' },
            { id: 'interaction', name: 'Interaction' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`
                whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                ${activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
              `}
            >
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading analytics data...</div>
      ) : (
        renderTabContent()
      )}
    </div>
  );
};
