import React, { useState, useEffect } from 'react';
import { useStore } from '../lib/store';
import { api } from '../lib/api';
import { Customer, Order, Booking } from '../types';
import { Plus, Search, Filter, X, Save, Trash2, User, Phone, Mail, MessageSquare, Calendar, ShoppingBag, UserPlus, Users, Activity, DollarSign } from 'lucide-react';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { Modal } from '../components/common/Modal';

export const Customers: React.FC = () => {
  const session = useStore((state) => state.session);
  const merchantId = session?.merchant?.id;

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [channelFilter, setChannelFilter] = useState<string>('all');

  // Drawer/Modal State
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // History Data
  const [customerOrders, setCustomerOrders] = useState<Order[]>([]);
  const [customerBookings, setCustomerBookings] = useState<Booking[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [customerRevenue, setCustomerRevenue] = useState(0);

  // Form State
  const [formData, setFormData] = useState<Partial<Customer>>({
    name: '',
    email: '',
    phone: '',
    channel: '',
    custom_fields: {}
  });

  useEffect(() => {
    if (merchantId) {
      loadData();
    }
  }, [merchantId]);

  const loadData = async () => {
    if (!merchantId) return;
    setLoading(true);
    try {
      const [customersData, ordersData] = await Promise.all([
        api.getCustomers(merchantId),
        api.getOrders(merchantId)
      ]);
      setCustomers(customersData);
      setAllOrders(ordersData as Order[]);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCustomers = async () => {
      // Re-fetch only customers if needed, but loadData handles both
      if (!merchantId) return;
      try {
          const data = await api.getCustomers(merchantId);
          setCustomers(data);
      } catch (e) { console.error(e); }
  };

  const loadHistory = async (customer: Customer) => {
    if (!merchantId) return;
    setHistoryLoading(true);
    try {
      // Fetch orders and bookings matching customer name (fuzzy match or exact)
      // Note: Ideally we should link by ID, but current schema uses names
      const orders = await api.getOrders(merchantId, customer.name);
      const bookings = await api.getBookings(merchantId, customer.name);
      setCustomerOrders(orders as Order[]);
      setCustomerBookings(bookings as Booking[]);
      
      // Calculate Revenue
      const orderRevenue = (orders as Order[])
        .filter(o => o.status !== 'cancelled')
        .reduce((sum, o) => sum + (o.total_amount || 0), 0);
      
      const bookingRevenue = (bookings as Booking[])
        .filter(b => b.status !== 'cancelled')
        .reduce((sum, b) => sum + (b.total_amount || 0), 0);
        
      setCustomerRevenue(orderRevenue + bookingRevenue);
    } catch (error) {
      console.error('Failed to load history:', error);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!merchantId) return;
    try {
      await api.createCustomer(merchantId, {
        name: formData.name || 'New Customer',
        email: formData.email,
        phone: formData.phone,
        channel: formData.channel,
        custom_fields: formData.custom_fields
      });
      setShowCreateModal(false);
      loadCustomers();
      setFormData({ name: '', email: '', phone: '', channel: '', custom_fields: {} });
    } catch (error) {
      console.error('Failed to create customer:', error);
    }
  };

  const handleUpdate = async () => {
    if (!selectedCustomer) return;
    try {
      const updated = await api.updateCustomer(selectedCustomer.id, {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        channel: formData.channel,
        custom_fields: formData.custom_fields
      });
      setCustomers(customers.map(c => c.id === updated.id ? updated : c));
      setSelectedCustomer(updated);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update customer:', error);
    }
  };

  const openCustomerDetail = (customer: Customer) => {
    setSelectedCustomer(customer);
    setFormData({
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      channel: customer.channel,
      custom_fields: customer.custom_fields || {}
    });
    setIsEditing(false);
    loadHistory(customer);
  };

  const filteredCustomers = customers.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          c.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          c.phone?.includes(searchTerm);
    const matchesChannel = channelFilter === 'all' || c.channel === channelFilter;
    return matchesSearch && matchesChannel;
  });

  const uniqueChannels = Array.from(new Set(customers.map(c => c.channel).filter(Boolean)));

  // Custom Field Helper
  const addCustomField = () => {
    const key = prompt('Enter field name:');
    if (key) {
      setFormData(prev => ({
        ...prev,
        custom_fields: { ...prev.custom_fields, [key]: '' }
      }));
    }
  };

  const updateCustomField = (key: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      custom_fields: { ...prev.custom_fields, [key]: value }
    }));
  };

  const removeCustomField = (key: string) => {
    const newFields = { ...formData.custom_fields };
    delete newFields[key];
    setFormData(prev => ({ ...prev, custom_fields: newFields }));
  };

  // Metrics Calculation
  const totalCustomers = customers.length;
  
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const newCustomers = customers.filter(c => new Date(c.created_at) >= startOfMonth).length;

  const activeCustomerIds = new Set(allOrders.map(o => o.customer_id).filter(Boolean));
  const activeCustomersCount = activeCustomerIds.size; // Customers with at least one order

  const totalRevenue = allOrders
    .filter(o => o.status !== 'cancelled')
    .reduce((sum, o) => sum + (o.total_amount || 0), 0);
  
  const avgCLV = totalCustomers > 0 ? totalRevenue / totalCustomers : 0;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Customers</h1>
          <p className="text-gray-500 mt-2">Manage customer relationships and view history.</p>
        </div>
        <Button onClick={() => {
          setFormData({ name: '', email: '', phone: '', channel: '', custom_fields: {} });
          setShowCreateModal(true);
        }}>
          <Plus className="w-4 h-4 mr-2" />
          Add Customer
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600">
              <Users className="w-6 h-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Customers</p>
              <h3 className="text-2xl font-bold text-gray-900">{totalCustomers}</h3>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600">
              <UserPlus className="w-6 h-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">New This Month</p>
              <h3 className="text-2xl font-bold text-gray-900">{newCustomers}</h3>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100 text-purple-600">
              <Activity className="w-6 h-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Active Customers</p>
              <h3 className="text-2xl font-bold text-gray-900">{activeCustomersCount}</h3>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
              <DollarSign className="w-6 h-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Avg CLV</p>
              <h3 className="text-2xl font-bold text-gray-900">${avgCLV.toLocaleString(undefined, { maximumFractionDigits: 0 })}</h3>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search customers..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <select
            className="border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={channelFilter}
            onChange={(e) => setChannelFilter(e.target.value)}
          >
            <option value="all">All Channels</option>
            {uniqueChannels.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Customer List */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-700 font-medium border-b">
              <tr>
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Contact</th>
                <th className="px-6 py-4">Channel</th>
                <th className="px-6 py-4">Created</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={5} className="text-center py-8 text-gray-500">Loading...</td></tr>
              ) : filteredCustomers.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-8 text-gray-500">No customers found</td></tr>
              ) : (
                filteredCustomers.map(customer => (
                  <tr 
                    key={customer.id} 
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => openCustomerDetail(customer)}
                  >
                    <td className="px-6 py-4 font-medium text-gray-900">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                          {customer.name.charAt(0).toUpperCase()}
                        </div>
                        {customer.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      <div className="flex flex-col gap-1">
                        {customer.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {customer.email}</span>}
                        {customer.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {customer.phone}</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {customer.channel ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          {customer.channel}
                        </span>
                      ) : <span className="text-gray-400">-</span>}
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {new Date(customer.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); openCustomerDetail(customer); }}>
                        View
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Create Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Add New Customer"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input
              type="text"
              className="w-full px-3 py-2 border rounded-md"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              placeholder="e.g. John Doe"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                className="w-full px-3 py-2 border rounded-md"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                placeholder="john@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input
                type="text"
                className="w-full px-3 py-2 border rounded-md"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                placeholder="+1 234 567 8900"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Channel</label>
            <select
              className="w-full px-3 py-2 border rounded-md"
              value={formData.channel}
              onChange={(e) => setFormData({...formData, channel: e.target.value})}
            >
              <option value="">Select Channel</option>
              <option value="website">Website</option>
              <option value="facebook">Facebook</option>
              <option value="instagram">Instagram</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="other">Other</option>
            </select>
          </div>
          
          <div className="border-t pt-4 mt-4">
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700">Custom Fields</label>
              <Button size="sm" variant="secondary" onClick={addCustomField}><Plus className="w-3 h-3 mr-1" /> Add Field</Button>
            </div>
            <div className="space-y-2">
              {Object.entries(formData.custom_fields || {}).map(([key, value]) => (
                <div key={key} className="flex gap-2 items-center">
                  <span className="text-sm font-medium text-gray-600 w-1/3 truncate" title={key}>{key}:</span>
                  <input
                    type="text"
                    className="flex-1 px-2 py-1 border rounded text-sm"
                    value={value as string}
                    onChange={(e) => updateCustomField(key, e.target.value)}
                  />
                  <button onClick={() => removeCustomField(key)} className="text-red-500 hover:text-red-700">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={() => setShowCreateModal(false)}>Cancel</Button>
            <Button onClick={handleCreate}>Create Customer</Button>
          </div>
        </div>
      </Modal>

      {/* Detail Modal/Drawer */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setSelectedCustomer(null)} />
          <div className="relative w-full max-w-2xl bg-white h-full shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-300">
            <div className="p-6 border-b sticky top-0 bg-white z-10 flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{selectedCustomer.name}</h2>
                <p className="text-sm text-gray-500">Customer ID: {selectedCustomer.id}</p>
              </div>
              <button onClick={() => setSelectedCustomer(null)} className="p-2 hover:bg-gray-100 rounded-full">
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-8">
              {/* Basic Info */}
              <section>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <User className="w-5 h-5 text-blue-500" /> Basic Information
                  </h3>
                  <div className="flex items-center gap-4">
                    <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
                      Total Spent: ${customerRevenue.toLocaleString()}
                    </div>
                    {!isEditing ? (
                      <Button size="sm" variant="secondary" onClick={() => setIsEditing(true)}>Edit</Button>
                    ) : (
                      <div className="flex gap-2">
                        <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)}>Cancel</Button>
                        <Button size="sm" onClick={handleUpdate}><Save className="w-3 h-3 mr-1" /> Save</Button>
                      </div>
                    )}
                  </div>
                </div>
                
                {isEditing ? (
                   <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
                      {/* Same fields as Create Modal */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 border rounded-md"
                          value={formData.name}
                          onChange={(e) => setFormData({...formData, name: e.target.value})}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                          <input
                            type="email"
                            className="w-full px-3 py-2 border rounded-md"
                            value={formData.email}
                            onChange={(e) => setFormData({...formData, email: e.target.value})}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                          <input
                            type="text"
                            className="w-full px-3 py-2 border rounded-md"
                            value={formData.phone}
                            onChange={(e) => setFormData({...formData, phone: e.target.value})}
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Channel</label>
                        <select
                          className="w-full px-3 py-2 border rounded-md"
                          value={formData.channel}
                          onChange={(e) => setFormData({...formData, channel: e.target.value})}
                        >
                          <option value="">Select Channel</option>
                          <option value="website">Website</option>
                          <option value="facebook">Facebook</option>
                          <option value="instagram">Instagram</option>
                          <option value="whatsapp">WhatsApp</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                      <div className="border-t pt-4 mt-4">
                        <div className="flex justify-between items-center mb-2">
                          <label className="block text-sm font-medium text-gray-700">Custom Fields</label>
                          <Button size="sm" variant="secondary" onClick={addCustomField}><Plus className="w-3 h-3 mr-1" /> Add Field</Button>
                        </div>
                        <div className="space-y-2">
                          {Object.entries(formData.custom_fields || {}).map(([key, value]) => (
                            <div key={key} className="flex gap-2 items-center">
                              <span className="text-sm font-medium text-gray-600 w-1/3 truncate" title={key}>{key}:</span>
                              <input
                                type="text"
                                className="flex-1 px-2 py-1 border rounded text-sm"
                                value={value as string}
                                onChange={(e) => updateCustomField(key, e.target.value)}
                              />
                              <button onClick={() => removeCustomField(key)} className="text-red-500 hover:text-red-700">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                   </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                    <div>
                      <span className="text-xs text-gray-500 uppercase tracking-wider">Email</span>
                      <p className="font-medium text-gray-900">{selectedCustomer.email || '-'}</p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500 uppercase tracking-wider">Phone</span>
                      <p className="font-medium text-gray-900">{selectedCustomer.phone || '-'}</p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500 uppercase tracking-wider">Channel</span>
                      <p className="font-medium text-gray-900 capitalize">{selectedCustomer.channel || '-'}</p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500 uppercase tracking-wider">Created</span>
                      <p className="font-medium text-gray-900">{new Date(selectedCustomer.created_at).toLocaleDateString()}</p>
                    </div>
                    {Object.entries(selectedCustomer.custom_fields || {}).map(([key, value]) => (
                      <div key={key} className="col-span-2 border-t pt-2 mt-2">
                        <span className="text-xs text-gray-500 uppercase tracking-wider">{key}</span>
                        <p className="font-medium text-gray-900">{String(value)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* Booking History */}
              <section>
                <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
                  <Calendar className="w-5 h-5 text-green-500" /> Booking History
                </h3>
                {historyLoading ? (
                  <div className="text-center py-4 text-gray-500">Loading history...</div>
                ) : customerBookings.length === 0 ? (
                  <p className="text-gray-500 italic">No bookings found.</p>
                ) : (
                  <div className="space-y-3">
                    {customerBookings.map(booking => (
                      <div key={booking.id} className="bg-white border rounded-lg p-3 flex justify-between items-center shadow-sm">
                        <div>
                          <p className="font-medium text-gray-900">{booking.service_name}</p>
                          <p className="text-sm text-gray-500">{booking.date} at {booking.time}</p>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                          booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {booking.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* Order History */}
              <section>
                <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
                  <ShoppingBag className="w-5 h-5 text-purple-500" /> Order History
                </h3>
                {historyLoading ? (
                  <div className="text-center py-4 text-gray-500">Loading history...</div>
                ) : customerOrders.length === 0 ? (
                  <p className="text-gray-500 italic">No orders found.</p>
                ) : (
                  <div className="space-y-3">
                    {customerOrders.map(order => (
                      <div key={order.id} className="bg-white border rounded-lg p-3 flex justify-between items-center shadow-sm">
                        <div>
                          <p className="font-medium text-gray-900">{order.product_name} (x{order.quantity})</p>
                          <p className="text-sm text-gray-500">Channel: {order.channel}</p>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          order.status === 'completed' ? 'bg-green-100 text-green-800' :
                          order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {order.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
