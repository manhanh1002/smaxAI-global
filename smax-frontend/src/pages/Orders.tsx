import React, { useEffect, useState } from 'react';
import { Card } from '../components/common/Card';
import { CheckCircle, X, Save, Trash2, Edit2, Package, Filter, Search, MoreHorizontal, ShoppingCart, AlertCircle, TrendingUp } from 'lucide-react';
import { Order } from '../types';
import { supabase } from '../lib/supabase';
import { useStore } from '../lib/store';
import { api } from '../lib/api';
import { Button } from '../components/common/Button';

export const Orders: React.FC = () => {
  const session = useStore((state) => state.session);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalRevenue, setTotalRevenue] = useState(0);
  
  // Drawer & Edit State
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Order>>({});

  useEffect(() => {
    if (!session?.merchant.id) return;

    const fetchOrders = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('orders')
        .select('*')
        .eq('merchant_id', session.merchant.id)
        .order('created_at', { ascending: false });
      
      if (data) {
        setOrders(data as Order[]);
        // Calculate Revenue
        const revenue = (data as Order[])
            .filter(o => o.status !== 'cancelled')
            .reduce((sum, o) => sum + (o.total_amount || 0), 0);
        setTotalRevenue(revenue);
      }
      setLoading(false);
    };

    fetchOrders();

    const channel = supabase
      .channel('orders_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders', filter: `merchant_id=eq.${session.merchant.id}` },
        () => fetchOrders()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session?.merchant.id]);

  const handleUpdateStatus = async (status: Order['status']) => {
    if (!selectedOrder) return;
    try {
      const updated = await api.updateOrder(selectedOrder.id, { status });
      const newOrders = orders.map(o => o.id === updated.id ? updated : o);
      setOrders(newOrders);
      setSelectedOrder(updated);
      
      // Update Revenue
      const revenue = newOrders
        .filter(o => o.status !== 'cancelled')
        .reduce((sum, o) => sum + (o.total_amount || 0), 0);
      setTotalRevenue(revenue);
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const handleSaveEdit = async () => {
    if (!selectedOrder) return;
    try {
      const updated = await api.updateOrder(selectedOrder.id, {
        quantity: editForm.quantity,
        status: editForm.status
      });
      setOrders(orders.map(o => o.id === updated.id ? updated : o));
      setSelectedOrder(updated);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update order:', error);
    }
  };

  const handleDelete = async () => {
    if (!selectedOrder || !window.confirm('Are you sure you want to delete this order?')) return;
    try {
      await api.cancelOrder(selectedOrder.id);
      const newOrders = orders.filter(o => o.id !== selectedOrder.id);
      setOrders(newOrders);
      setSelectedOrder(null);
      
      // Update Revenue
      const revenue = newOrders
        .filter(o => o.status !== 'cancelled')
        .reduce((sum, o) => sum + (o.total_amount || 0), 0);
      setTotalRevenue(revenue);
    } catch (error) {
      console.error('Failed to delete order:', error);
    }
  };

  const openDrawer = (order: Order) => {
    setSelectedOrder(order);
    setEditForm({ quantity: order.quantity, status: order.status });
    setIsEditing(false);
  };

  // Calculate Metrics
  const totalOrders = orders.length;
  const cancelledOrders = orders.filter(o => o.status === 'cancelled').length;
  const completedOrders = orders.filter(o => o.status === 'completed').length;
  const activeOrdersCount = totalOrders - cancelledOrders;
  const avgOrderValue = activeOrdersCount > 0 ? totalRevenue / activeOrdersCount : 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 p-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Orders</h1>
        <p className="text-gray-500 mt-2">Manage orders created by AI or manual entry.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600">
              <ShoppingCart className="w-6 h-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Orders</p>
              <h3 className="text-2xl font-bold text-gray-900">{totalOrders}</h3>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600">
              <span className="text-xl font-bold">$</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Net Revenue</p>
              <h3 className="text-2xl font-bold text-gray-900">${totalRevenue.toLocaleString()}</h3>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Avg Order Value</p>
              <h3 className="text-2xl font-bold text-gray-900">${avgOrderValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</h3>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-red-100 text-red-600">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Cancelled</p>
              <h3 className="text-2xl font-bold text-gray-900">{cancelledOrders}</h3>
            </div>
          </div>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-700 font-medium border-b">
              <tr>
                <th className="px-6 py-4">Order ID</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Product</th>
                <th className="px-6 py-4">Qty</th>
                <th className="px-6 py-4">Channel</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading && (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                    Loading orders...
                  </td>
                </tr>
              )}
              {!loading && orders.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                    No orders found.
                  </td>
                </tr>
              )}
              {orders.map((order) => (
                <tr 
                  key={order.id} 
                  className="hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => openDrawer(order)}
                >
                  <td className="px-6 py-4 font-medium text-blue-600">#{order.id.substr(0, 8)}</td>
                  <td className="px-6 py-4 text-gray-900 font-medium">
                    <div>{order.customer_name || 'Guest'}</div>
                    {order.customer_id && (
                      <div className="text-xs text-gray-400" title={order.customer_id}>
                        ID: {order.customer_id.substring(0, 8)}...
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-gray-600">{order.product_name}</td>
                  <td className="px-6 py-4 text-gray-600">{order.quantity}</td>
                  <td className="px-6 py-4 text-gray-500 capitalize">{order.channel || 'Website'}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                      ${order.status === 'completed' ? 'bg-green-100 text-green-800' : 
                        order.status === 'cancelled' ? 'bg-red-100 text-red-800' : 
                        order.status === 'shipped' ? 'bg-blue-100 text-blue-800' :
                        'bg-yellow-100 text-yellow-800'}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-500">
                    {new Date(order.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); openDrawer(order); }}>
                      View
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Order Detail Drawer */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setSelectedOrder(null)} />
          <div className="relative w-full max-w-md bg-white h-full shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-300">
            <div className="p-6 border-b sticky top-0 bg-white z-10 flex justify-between items-start">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Order Details</h2>
                <p className="text-sm text-gray-500">#{selectedOrder.id}</p>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="p-2 hover:bg-gray-100 rounded-full">
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Status Section */}
              <div className="bg-gray-50 p-4 rounded-lg flex justify-between items-center">
                <div>
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Current Status</span>
                  <div className={`mt-1 font-medium capitalize ${
                    selectedOrder.status === 'completed' ? 'text-green-600' :
                    selectedOrder.status === 'cancelled' ? 'text-red-600' : 'text-yellow-600'
                  }`}>
                    {selectedOrder.status}
                  </div>
                </div>
                {!isEditing && (
                   <div className="flex gap-2">
                     {selectedOrder.status === 'pending' && (
                        <Button size="sm" onClick={() => handleUpdateStatus('confirmed')}>Confirm</Button>
                     )}
                     {selectedOrder.status === 'confirmed' && (
                        <Button size="sm" onClick={() => handleUpdateStatus('completed')}>Complete</Button>
                     )}
                   </div>
                )}
              </div>

              {/* Order Info */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Package className="w-5 h-5 text-blue-500" /> Items
                  </h3>
                  {!isEditing ? (
                    <Button size="sm" variant="ghost" onClick={() => setIsEditing(true)}>
                      <Edit2 className="w-4 h-4 mr-2" /> Edit
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)}>Cancel</Button>
                      <Button size="sm" onClick={handleSaveEdit}><Save className="w-3 h-3 mr-1" /> Save</Button>
                    </div>
                  )}
                </div>

                {isEditing ? (
                  <div className="space-y-4 border p-4 rounded-md">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Quantity</label>
                      <input 
                        type="number" 
                        min="1"
                        className="mt-1 w-full border rounded-md px-3 py-2"
                        value={editForm.quantity}
                        onChange={(e) => setEditForm({...editForm, quantity: parseInt(e.target.value)})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Status</label>
                      <select 
                        className="mt-1 w-full border rounded-md px-3 py-2"
                        value={editForm.status}
                        onChange={(e) => setEditForm({...editForm, status: e.target.value as Order['status']})}
                      >
                         <option value="pending">Pending</option>
                         <option value="confirmed">Confirmed</option>
                         <option value="shipped">Shipped</option>
                         <option value="completed">Completed</option>
                         <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                  </div>
                ) : (
                  <div className="border rounded-md p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium text-gray-900">{selectedOrder.product_name}</span>
                      <span className="text-gray-600">x{selectedOrder.quantity}</span>
                    </div>
                    <div className="text-sm text-gray-500">
                      Product ID: N/A (Name-based linkage)
                    </div>
                  </div>
                )}
              </div>

              {/* Customer Info */}
              <div className="border-t pt-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Customer Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                   <div>
                     <span className="text-gray-500 block">Name</span>
                     <span className="font-medium">{selectedOrder.customer_name}</span>
                   </div>
                   <div>
                     <span className="text-gray-500 block">Channel</span>
                     <span className="font-medium capitalize">{selectedOrder.channel}</span>
                   </div>
                </div>
              </div>

               {/* Meta Info */}
               <div className="border-t pt-6 text-sm text-gray-500">
                  <div className="flex justify-between py-1">
                    <span>Created At</span>
                    <span>{new Date(selectedOrder.created_at).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span>Created By</span>
                    <span>{selectedOrder.created_by_ai ? 'AI Agent' : 'Manual Entry'}</span>
                  </div>
               </div>

              {/* Danger Zone */}
              <div className="border-t pt-6 mt-6">
                <Button variant="danger" className="w-full justify-center" onClick={handleDelete}>
                  <Trash2 className="w-4 h-4 mr-2" /> Delete Order
                </Button>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
};
