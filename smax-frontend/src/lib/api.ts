import { supabase } from './supabase';
import { Merchant, Conversation, Message, Product, BookingSlot, FAQ, ProductVariant, Service, ServiceAddon, Customer, Order, Booking } from '../types';

export const api = {
  // Merchant
  async getMerchant(id: string) {
    const { data, error } = await supabase
      .from('merchants')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data as Merchant;
  },

  async updateMerchant(id: string, updates: Partial<Merchant>) {
    const { data, error } = await supabase
      .from('merchants')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as Merchant;
  },

  // AI Config
  async getAIConfig(merchantId: string) {
    const { data, error } = await supabase
      .from('ai_configs')
      .select('*')
      .eq('merchant_id', merchantId)
      .single();
    // It's okay if no config exists yet, we can return default
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  async updateAIConfig(merchantId: string, updates: any) {
    console.log('Updating AI Config for merchant:', merchantId, updates);
    const { data, error } = await supabase
      .from('ai_configs')
      .upsert({ merchant_id: merchantId, ...updates }, { onConflict: 'merchant_id' })
      .select()
      .single();
    if (error) {
        console.error('Failed to update AI config:', error);
        throw error;
    }
    return data;
  },

  // Conversations
  async getConversations(merchantId: string) {
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('merchant_id', merchantId)
      .order('created_at', { ascending: false }); // order by created_at as last_active might be missing
    if (error) throw error;
    
    // Map missing fields
    return (data || []).map((c: any) => ({
      ...c,
      visitor_name: c.visitor_name || 'Visitor',
      channel: c.channel || 'website',
      last_message: c.last_message || 'Start of conversation',
      unread_count: c.unread_count || 0
    })) as Conversation[];
  },

  // Messages
  async getMessages(conversationId: string) {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });
    if (error) throw error;
    
    // Map sender to role
    return (data || []).map((m: any) => ({
      ...m,
      role: m.role || (m.sender === 'visitor' ? 'visitor' : (m.sender === 'ai' ? 'ai' : 'agent')),
      // Keep sender for backward compatibility if needed, or remove it
      sender: m.role || m.sender
    })) as Message[];
  },

  async sendMessage(conversationId: string, content: string, role: 'visitor' | 'ai' | 'agent', merchantId?: string) {
    const payload: any = {
      conversation_id: conversationId,
      role, 
      content
    };
    if (merchantId) {
      payload.merchant_id = merchantId;
    }

    const { data, error } = await supabase
      .from('messages')
      .insert(payload)
      .select()
      .single();
    
    if (error) throw error;
    
    // Update conversation last_message (Skip if fields missing, but try update status/active if possible)
    // Note: DB schema missing last_message
    /*
    await supabase
      .from('conversations')
      .update({ 
        // last_message: content, 
        // last_active: new Date().toISOString() 
      })
      .eq('id', conversationId);
    */

    const m = data as any;
    return {
      ...m,
      role: m.role,
      sender: m.role
    } as Message;
  },

  // Training Data
  async getProducts(merchantId: string) {
    const { data, error } = await supabase.from('products').select('*').eq('merchant_id', merchantId);
    if (error) throw error;
    return data as Product[];
  },
  async getProductVariants(productId: string) {
    const { data, error } = await supabase.from('product_variants').select('*').eq('product_id', productId);
    if (error) throw error;
    return data as ProductVariant[];
  },
  async createProduct(merchantId: string, payload: { name: string; description?: string; price: number; total_quantity?: number; current_stock?: number; }) {
    const { data, error } = await supabase.from('products').insert({ merchant_id: merchantId, ...payload }).select().single();
    if (error) throw error;
    return data as Product;
  },
  async updateProduct(id: string, payload: Partial<{ name: string; description?: string; price: number; total_quantity: number; current_stock: number; }>) {
    const { data, error } = await supabase.from('products').update(payload).eq('id', id).select().single();
    if (error) throw error;
    return data as Product;
  },
  async deleteProduct(id: string) {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) throw error;
  },
  async createVariant(productId: string, payload: { name: string; price?: number; total_quantity?: number; current_stock?: number; }) {
    const { data, error } = await supabase.from('product_variants').insert({ product_id: productId, ...payload }).select().single();
    if (error) throw error;
    return data as ProductVariant;
  },
  async updateVariant(id: string, payload: Partial<{ name: string; price?: number; total_quantity?: number; current_stock?: number; }>) {
    const { data, error } = await supabase.from('product_variants').update(payload).eq('id', id).select().single();
    if (error) throw error;
    return data as ProductVariant;
  },
  async deleteVariant(id: string) {
    const { error } = await supabase.from('product_variants').delete().eq('id', id);
    if (error) throw error;
  },

  async getSlots(merchantId: string) {
    const { data, error } = await supabase.from('booking_slots').select('*').eq('merchant_id', merchantId);
    if (error) throw error;
    return data as BookingSlot[];
  },
  async getServices(merchantId: string) {
    const { data, error } = await supabase.from('services').select('*').eq('merchant_id', merchantId);
    if (error) throw error;
    return data as Service[];
  },
  async createService(merchantId: string, payload: { name: string; description?: string; price: number; }) {
    const { data, error } = await supabase.from('services').insert({ merchant_id: merchantId, ...payload }).select().single();
    if (error) throw error;
    return data as Service;
  },
  async updateService(id: string, payload: Partial<{ name: string; description?: string; price: number; }>) {
    const { data, error } = await supabase.from('services').update(payload).eq('id', id).select().single();
    if (error) throw error;
    return data as Service;
  },
  async deleteService(id: string) {
    const { error } = await supabase.from('services').delete().eq('id', id);
    if (error) throw error;
  },

  async getServiceAddons(serviceId: string) {
    const { data, error } = await supabase.from('service_addons').select('*').eq('service_id', serviceId);
    if (error) throw error;
    return data as ServiceAddon[];
  },
  async createServiceAddon(serviceId: string, payload: { name: string; description?: string; price: number; }) {
    const { data, error } = await supabase.from('service_addons').insert({ service_id: serviceId, ...payload }).select().single();
    if (error) throw error;
    return data as ServiceAddon;
  },
  async updateServiceAddon(id: string, payload: Partial<{ name: string; description?: string; price: number; }>) {
    const { data, error } = await supabase.from('service_addons').update(payload).eq('id', id).select().single();
    if (error) throw error;
    return data as ServiceAddon;
  },
  async deleteServiceAddon(id: string) {
    const { error } = await supabase.from('service_addons').delete().eq('id', id);
    if (error) throw error;
  },

  // Customers
  async getCustomers(merchantId: string) {
    const { data, error } = await supabase.from('customers').select('*').eq('merchant_id', merchantId).order('created_at', { ascending: false });
    if (error) throw error;
    return data as Customer[];
  },

  async createCustomer(merchantId: string, payload: { name: string; email?: string; phone?: string; channel?: string; custom_fields?: any }) {
    const { data, error } = await supabase.from('customers').insert({ merchant_id: merchantId, ...payload }).select().single();
    if (error) throw error;
    return data as Customer;
  },

  async updateCustomer(id: string, payload: Partial<Customer>) {
    const { data, error } = await supabase.from('customers').update(payload).eq('id', id).select().single();
    if (error) throw error;
    return data as Customer;
  },

  async deleteCustomer(id: string) {
    const { error } = await supabase.from('customers').delete().eq('id', id);
    if (error) throw error;
  },

  async searchCustomer(merchantId: string, query: string) {
    if (!query) return null;
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('merchant_id', merchantId)
      .or(`email.eq.${query},phone.eq.${query},name.eq.${query}`)
      .maybeSingle();
    if (error && error.code !== 'PGRST116') throw error;
    return data as Customer | null;
  },

  async getFAQs(merchantId: string) {
    const { data, error } = await supabase.from('faqs').select('*').eq('merchant_id', merchantId);
    if (error) throw error;
    return data as FAQ[];
  },

  // --- CRUD Operations for AI Tools ---

  // Bookings
  async createBooking(merchantId: string, customerName: string, date: string, time: string, serviceName: string, customerId?: string) {
    const payload: any = {
      merchant_id: merchantId,
      customer_name: customerName,
      service_name: serviceName,
      date,
      time,
      status: 'confirmed'
    };
    if (customerId) payload.customer_id = customerId;

    const { data, error } = await supabase
      .from('bookings')
      .insert(payload)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async getBookings(merchantId: string, customerName?: string, customerId?: string) {
    let query = supabase.from('bookings').select('*').eq('merchant_id', merchantId);
    
    if (customerId) {
      query = query.eq('customer_id', customerId);
    } else if (customerName) {
      query = query.ilike('customer_name', `%${customerName}%`);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  async updateBooking(id: string, updates: Partial<Booking>) {
    const { data, error } = await supabase
      .from('bookings')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as Booking;
  },

  async cancelBooking(bookingId: string) {
    const { data, error } = await supabase
      .from('bookings')
      .update({ status: 'cancelled' })
      .eq('id', bookingId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // Orders
  async createOrder(merchantId: string, customerName: string, items: { product_name: string; quantity: number }[], customerId?: string) {
    const orders = [];
    for (const item of items) {
      const payload: any = {
        merchant_id: merchantId,
        customer_name: customerName,
        product_name: item.product_name,
        quantity: item.quantity,
        channel: 'ai_agent',
        created_by_ai: true,
        status: 'pending'
      };
      if (customerId) payload.customer_id = customerId;

      const { data, error } = await supabase
        .from('orders')
        .insert(payload)
        .select()
        .single();
      
      if (error) throw error;
      orders.push(data);
    }
    return orders;
  },

  async getOrders(merchantId: string, customerName?: string, customerId?: string) {
    let query = supabase.from('orders').select('*').eq('merchant_id', merchantId);
    
    if (customerId) {
      query = query.eq('customer_id', customerId);
    } else if (customerName) {
      query = query.ilike('customer_name', `%${customerName}%`);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  async updateOrder(id: string, updates: Partial<Order>) {
    const { data, error } = await supabase
      .from('orders')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as Order;
  },

  async cancelOrder(orderId: string) {
    const { data, error } = await supabase
      .from('orders')
      .update({ status: 'cancelled' })
      .eq('id', orderId)
      .select()
      .single();
    if (error) throw error;
    return data;
  }
};
