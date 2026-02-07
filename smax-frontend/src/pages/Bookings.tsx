import React, { useEffect, useState } from 'react';
import { Card } from '../components/common/Card';
import { Calendar, Clock, X, Save, Trash2, Edit2, User, CheckCircle, MoreHorizontal, AlertCircle, TrendingUp } from 'lucide-react';
import { Booking } from '../types';
import { supabase } from '../lib/supabase';
import { useStore } from '../lib/store';
import { api } from '../lib/api';
import { Button } from '../components/common/Button';

export const Bookings: React.FC = () => {
  const session = useStore((state) => state.session);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalRevenue, setTotalRevenue] = useState(0);

  // Drawer & Edit State
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Booking>>({});

  useEffect(() => {
    if (!session?.merchant.id) return;

    const fetchBookings = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('bookings')
        .select('*')
        .eq('merchant_id', session.merchant.id)
        .order('date', { ascending: false }); // Show newest bookings first
      
      if (data) {
        setBookings(data as Booking[]);
        // Calculate Revenue
        const revenue = (data as Booking[])
            .filter(b => b.status !== 'cancelled')
            .reduce((sum, b) => sum + (b.total_amount || 0), 0);
        setTotalRevenue(revenue);
      }
      setLoading(false);
    };

    fetchBookings();

    // Subscribe to new bookings
    const channel = supabase
      .channel('bookings_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bookings', filter: `merchant_id=eq.${session.merchant.id}` },
        (payload) => {
          fetchBookings(); // Refresh list
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session?.merchant.id]);

  const handleUpdateStatus = async (status: Booking['status']) => {
    if (!selectedBooking) return;
    try {
      const updated = await api.updateBooking(selectedBooking.id, { status });
      const newBookings = bookings.map(b => b.id === updated.id ? updated : b);
      setBookings(newBookings);
      setSelectedBooking(updated);
      
      // Update Revenue
      const revenue = newBookings
        .filter(b => b.status !== 'cancelled')
        .reduce((sum, b) => sum + (b.total_amount || 0), 0);
      setTotalRevenue(revenue);
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const handleSaveEdit = async () => {
    if (!selectedBooking) return;
    try {
      const updated = await api.updateBooking(selectedBooking.id, {
        date: editForm.date,
        time: editForm.time,
        status: editForm.status
      });
      const newBookings = bookings.map(b => b.id === updated.id ? updated : b);
      setBookings(newBookings);
      setSelectedBooking(updated);
      setIsEditing(false);
      
      // Update Revenue
      const revenue = newBookings
        .filter(b => b.status !== 'cancelled')
        .reduce((sum, b) => sum + (b.total_amount || 0), 0);
      setTotalRevenue(revenue);
    } catch (error) {
      console.error('Failed to update booking:', error);
    }
  };

  const handleCancel = async () => {
    if (!selectedBooking || !window.confirm('Are you sure you want to cancel this booking?')) return;
    try {
      const updated = await api.cancelBooking(selectedBooking.id);
      const newBookings = bookings.map(b => b.id === updated.id ? updated : b);
      setBookings(newBookings);
      setSelectedBooking(updated);
      
      // Update Revenue
      const revenue = newBookings
        .filter(b => b.status !== 'cancelled')
        .reduce((sum, b) => sum + (b.total_amount || 0), 0);
      setTotalRevenue(revenue);
    } catch (error) {
      console.error('Failed to cancel booking:', error);
    }
  };

  const openDrawer = (booking: Booking) => {
    setSelectedBooking(booking);
    setEditForm({ date: booking.date, time: booking.time, status: booking.status });
    setIsEditing(false);
  };

  // Calculate Metrics
  const totalBookings = bookings.length;
  const cancelledBookings = bookings.filter(b => b.status === 'cancelled').length;
  const confirmedBookings = bookings.filter(b => b.status === 'confirmed').length;
  const completionRate = totalBookings > 0 ? (confirmedBookings / totalBookings) * 100 : 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 p-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Bookings</h1>
        <p className="text-gray-500 mt-2">Manage bookings and reservations.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600">
              <Calendar className="w-6 h-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Bookings</p>
              <h3 className="text-2xl font-bold text-gray-900">{totalBookings}</h3>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600">
              <span className="text-xl font-bold">$</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Service Revenue</p>
              <h3 className="text-2xl font-bold text-gray-900">${totalRevenue.toLocaleString()}</h3>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-indigo-100 text-indigo-600">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Confirmation Rate</p>
              <h3 className="text-2xl font-bold text-gray-900">{completionRate.toFixed(1)}%</h3>
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
              <h3 className="text-2xl font-bold text-gray-900">{cancelledBookings}</h3>
            </div>
          </div>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-700 font-medium border-b">
              <tr>
                <th className="px-6 py-4">Booking ID</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Service</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Time</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading && (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    Loading bookings...
                  </td>
                </tr>
              )}
              {!loading && bookings.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    No bookings yet. Start a conversation with the AI to test booking creation!
                  </td>
                </tr>
              )}
              {bookings.map((booking) => (
                <tr 
                  key={booking.id} 
                  className="hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => openDrawer(booking)}
                >
                  <td className="px-6 py-4 font-medium text-blue-600">#{booking.id.substr(0, 8)}</td>
                  <td className="px-6 py-4 text-gray-900">
                    <div>{booking.customer_name || 'Visitor'}</div>
                    {booking.customer_id && (
                      <div className="text-xs text-gray-400" title={booking.customer_id}>
                        ID: {booking.customer_id.substring(0, 8)}...
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    <div>{booking.service_name || 'Service'}</div>
                    {booking.addons && booking.addons.length > 0 && (
                      <div className="text-xs text-blue-600 mt-1">
                        + {booking.addons.length} addon{booking.addons.length > 1 ? 's' : ''}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 flex items-center gap-2 text-gray-600">
                    <Calendar className="h-4 w-4 text-gray-400" /> {booking.date}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Clock className="h-4 w-4 text-gray-400" /> {booking.time}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                      ${booking.status === 'confirmed' ? 'bg-green-100 text-green-800' : 
                        booking.status === 'cancelled' ? 'bg-red-100 text-red-800' : 
                        'bg-yellow-100 text-yellow-800'}`}>
                      {booking.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); openDrawer(booking); }}>
                      View
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Booking Detail Drawer */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setSelectedBooking(null)} />
          <div className="relative w-full max-w-md bg-white h-full shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-300">
            <div className="p-6 border-b sticky top-0 bg-white z-10 flex justify-between items-start">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Booking Details</h2>
                <p className="text-sm text-gray-500">#{selectedBooking.id}</p>
              </div>
              <button onClick={() => setSelectedBooking(null)} className="p-2 hover:bg-gray-100 rounded-full">
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Status Section */}
              <div className="bg-gray-50 p-4 rounded-lg flex justify-between items-center">
                <div>
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Current Status</span>
                  <div className={`mt-1 font-medium capitalize ${
                    selectedBooking.status === 'confirmed' ? 'text-green-600' :
                    selectedBooking.status === 'cancelled' ? 'text-red-600' : 'text-yellow-600'
                  }`}>
                    {selectedBooking.status}
                  </div>
                </div>
                {!isEditing && selectedBooking.status !== 'cancelled' && (
                   <div className="flex gap-2">
                     {selectedBooking.status !== 'confirmed' && (
                        <Button size="sm" onClick={() => handleUpdateStatus('confirmed')}>Confirm</Button>
                     )}
                   </div>
                )}
              </div>

              {/* Booking Info */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-blue-500" /> Schedule
                  </h3>
                  {!isEditing ? (
                    <Button size="sm" variant="ghost" onClick={() => setIsEditing(true)}>
                      <Edit2 className="w-4 h-4 mr-2" /> Reschedule
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
                      <label className="block text-sm font-medium text-gray-700">Date</label>
                      <input 
                        type="date" 
                        className="mt-1 w-full border rounded-md px-3 py-2"
                        value={editForm.date}
                        onChange={(e) => setEditForm({...editForm, date: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Time</label>
                      <input 
                        type="time" 
                        className="mt-1 w-full border rounded-md px-3 py-2"
                        value={editForm.time}
                        onChange={(e) => setEditForm({...editForm, time: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Status</label>
                      <select 
                        className="mt-1 w-full border rounded-md px-3 py-2"
                        value={editForm.status}
                        onChange={(e) => setEditForm({...editForm, status: e.target.value as Booking['status']})}
                      >
                         <option value="pending">Pending</option>
                         <option value="confirmed">Confirmed</option>
                         <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                  </div>
                ) : (
                  <div className="border rounded-md p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium text-gray-900">{selectedBooking.service_name}</span>
                    </div>
                    
                    {selectedBooking.addons && selectedBooking.addons.length > 0 && (
                      <div className="mb-3 p-3 bg-gray-50 rounded text-sm">
                        <p className="font-medium text-gray-700 mb-1">Add-ons:</p>
                        <ul className="space-y-1">
                          {selectedBooking.addons.map((addon, idx) => (
                            <li key={idx} className="flex justify-between text-gray-600">
                              <span>{addon.name}</span>
                              <span>+${addon.price}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" /> {selectedBooking.date}
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" /> {selectedBooking.time}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Customer Info */}
              <div className="border-t pt-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Customer Information</h3>
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                     {selectedBooking.customer_name ? selectedBooking.customer_name.charAt(0) : 'G'}
                   </div>
                   <div>
                     <p className="font-medium text-gray-900">{selectedBooking.customer_name || 'Guest'}</p>
                     <p className="text-sm text-gray-500">Booked via Website</p>
                   </div>
                </div>
              </div>

               {/* Meta Info */}
               <div className="border-t pt-6 text-sm text-gray-500">
                  <div className="flex justify-between py-1">
                    <span>Created At</span>
                    <span>{new Date(selectedBooking.created_at).toLocaleString()}</span>
                  </div>
               </div>

              {/* Danger Zone */}
              <div className="border-t pt-6 mt-6">
                 {selectedBooking.status !== 'cancelled' && (
                    <Button variant="danger" className="w-full justify-center" onClick={handleCancel}>
                      <Trash2 className="w-4 h-4 mr-2" /> Cancel Booking
                    </Button>
                 )}
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
};
