import React, { useEffect, useState } from 'react';
import { Mail, Phone, MapPin, Clock, Tag, ExternalLink, User } from 'lucide-react';
import { Button } from '../common/Button';
import { useStore } from '../../lib/store';
import { TaskLog } from './TaskLog';
import { api } from '../../lib/api';
import { Customer } from '../../types';
import { useNavigate } from 'react-router-dom';

export const CustomerInfo: React.FC = () => {
  const { conversations, selectedConversationId, session } = useStore();
  const navigate = useNavigate();
  const conversation = conversations.find(c => c.id === selectedConversationId);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [customerRevenue, setCustomerRevenue] = useState(0);

  useEffect(() => {
    if (conversation && session?.merchant.id) {
      const query = conversation.visitor_email || conversation.visitor_phone || conversation.visitor_name;
      if (query) {
        api.searchCustomer(session.merchant.id, query)
          .then(async (cust) => {
            setCustomer(cust);
            if (cust) {
                // Fetch revenue
                const orders = await api.getOrders(session.merchant.id, cust.name);
                const bookings = await api.getBookings(session.merchant.id, cust.name);
                const orderRev = (orders as any[]).filter(o => o.status !== 'cancelled').reduce((sum, o) => sum + (o.total_amount || 0), 0);
                const bookingRev = (bookings as any[]).filter(b => b.status !== 'cancelled').reduce((sum, b) => sum + (b.total_amount || 0), 0);
                setCustomerRevenue(orderRev + bookingRev);
            }
          })
          .catch(console.error);
      }
    } else {
      setCustomer(null);
      setCustomerRevenue(0);
    }
  }, [conversation, session?.merchant.id]);

  if (!conversation) return null;

  return (
    <div className="w-96 bg-white border-l border-gray-200 flex flex-col h-full overflow-y-auto">
      <div className="p-6 border-b border-gray-100 flex flex-col items-center text-center">
        <div className="h-20 w-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mb-4 text-2xl font-bold text-blue-600 border-4 border-white shadow-sm">
          {conversation.visitor_name.charAt(0)}
        </div>
        <h2 className="text-xl font-bold text-gray-900">{customer?.name || conversation.visitor_name}</h2>
        <p className="text-sm text-gray-500 mb-2">Customer since {customer ? new Date(customer.created_at).toLocaleDateString() : 'Jan 2025'}</p>
        <div className="bg-green-50 text-green-700 px-3 py-1 rounded-full text-xs font-bold mb-4">
            Total Revenue: ${customerRevenue.toLocaleString()}
        </div>
        
        <div className="flex gap-2 w-full">
          <Button size="sm" variant="outline" className="flex-1">
            <Mail className="h-4 w-4 mr-2" /> Email
          </Button>
          <Button size="sm" variant="outline" className="flex-1">
            <Phone className="h-4 w-4 mr-2" /> Call
          </Button>
        </div>
      </div>

      <div className="p-6 space-y-6">
        <div>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Contact Details
          </h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <Mail className="h-4 w-4 text-gray-400" />
              <span className="text-gray-900">{customer?.email || conversation.visitor_email || '-'}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Phone className="h-4 w-4 text-gray-400" />
              <span className="text-gray-900">{customer?.phone || conversation.visitor_phone || '-'}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <MapPin className="h-4 w-4 text-gray-400" />
              <span className="text-gray-900">San Francisco, CA</span>
            </div>
            
            {/* Display Custom Fields if available */}
            {customer?.custom_fields && Object.entries(customer.custom_fields).map(([key, value]) => (
              <div key={key} className="flex items-center gap-3 text-sm">
                <Tag className="h-4 w-4 text-gray-400" />
                <span className="text-gray-500 capitalize">{key}:</span>
                <span className="text-gray-900">{String(value)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* AI Internal Note */}
        {customer?.internal_notes && (
          <div className="border-t border-gray-100 pt-6">
            <h3 className="text-xs font-semibold text-purple-600 uppercase tracking-wider mb-3 flex items-center">
              <span className="w-2 h-2 bg-purple-500 rounded-full mr-2 animate-pulse"></span>
              AI Insight & Memory
            </h3>
            <div className="bg-purple-50 rounded-md p-3 text-sm text-gray-700 border border-purple-100">
              {customer.internal_notes}
            </div>
            {customer.lead_score !== undefined && (
              <div className="mt-2 flex items-center text-xs text-gray-500">
                 Lead Score: <span className="font-bold ml-1 text-purple-700">{customer.lead_score}/100</span>
              </div>
            )}
          </div>
        )}

        <div className="border-t border-gray-100 pt-6">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Tags
          </h3>
          <div className="flex flex-wrap gap-2">
            {customer?.tags && customer.tags.length > 0 ? (
              customer.tags.map((tag, index) => (
                <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {tag}
                </span>
              ))
            ) : (
              <span className="text-sm text-gray-400 italic">No tags yet</span>
            )}
            
            <button className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border border-gray-300 text-gray-500 hover:bg-gray-50 border-dashed">
              <Tag className="h-3 w-3 mr-1" /> Add Tag
            </button>
          </div>
        </div>

        <div className="border-t border-gray-100 pt-6">
          <TaskLog />
        </div>
        
        <div className="border-t border-gray-100 pt-6">
           <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Actions
          </h3>
          <div className="space-y-2">
            <Button 
              variant="secondary" 
              size="sm" 
              className="w-full justify-start"
              onClick={() => navigate('/customers')}
            >
              <User className="h-4 w-4 mr-2" /> View Customer Page
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
