export interface Merchant {
  id: string;
  name: string;
  website: string;
  business_type: 'spa' | 'clinic' | 'restaurant' | 'ecom' | 'other';
  created_at: string;
  // Optional for UI state, though not in DB schema explicitly
  ai_trained?: boolean;
  description?: string;
}

export interface Product {
  id: string;
  merchant_id: string;
  name: string;
  description: string;
  price: number;
  total_quantity?: number;
  current_stock?: number;
  created_at: string;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  name: string;
  price?: number;
  total_quantity?: number;
  current_stock?: number;
  created_at: string;
}

export interface BookingSlot {
  id: string;
  merchant_id: string;
  date: string;
  time: string;
  duration_minutes: number;
  capacity: number;
  booked_count: number;
  is_available?: boolean;
  created_at: string;
}

export interface Service {
  id: string;
  merchant_id: string;
  name: string;
  description?: string;
  price: number;
  created_at: string;
}

export interface ServiceAddon {
  id: string;
  service_id: string;
  name: string;
  description?: string;
  price: number;
  created_at: string;
}

export interface FAQ {
  id: string;
  merchant_id: string;
  category: 'policies' | 'products' | 'services' | 'general';
  question: string;
  answer: string;
  created_at: string;
}

export interface PolicyDoc {
  id: string;
  merchant_id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: string;
  merchant_id: string;
  name: string;
  email?: string;
  phone?: string;
  channel?: string;
  custom_fields?: Record<string, any>;
  internal_notes?: string;
  tags?: string[];
  lead_score?: number;
  created_at: string;
}

export interface Conversation {
  id: string;
  merchant_id: string;
  visitor_name: string;
  channel: 'website' | 'facebook' | 'instagram' | 'whatsapp';
  intent: 'booking' | 'order' | 'inquiry' | 'complaint' | 'other';
  status: 'active' | 'resolved' | 'escalated';
  created_at: string;
  ended_at: string | null;
  // UI helpers
  last_message?: string;
  ai_action?: string;
  unread_count?: number;
  visitor_email?: string;
  visitor_phone?: string;
  last_active?: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: 'visitor' | 'ai' | 'agent';
  sender?: string; // DB column name
  content: string;
  action_type?: 'create_booking' | 'log_order' | 'none';
  action_data?: any;
  created_at: string;
  // UI helpers
  suggestedActions?: string[];
}

export interface Order {
  id: string;
  merchant_id: string;
  customer_id?: string;
  customer_name: string;
  product_name: string;
  quantity: number;
  channel: string;
  created_by_ai: boolean;
  status: 'active' | 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'shipped';
  product_id?: string;
  variant_id?: string;
  created_at: string;
  total_amount?: number;
}

export interface Booking {
  id: string;
  merchant_id: string;
  customer_id?: string;
  customer_name: string;
  service_name: string;
  date: string;
  time: string;
  status: 'confirmed' | 'pending' | 'cancelled';
  addons?: { name: string; price: number }[];
  created_at: string;
  total_amount?: number;
}

export interface AIConfig {
  openai_api_key: string;
  openai_base_url: string;
  model: string;
  temperature: number;
  max_tokens: number;
  system_prompt: string;
  data_sources: {
    products: boolean;
    bookings: boolean;
    faqs: boolean;
    orders: boolean;
    policies: boolean;
  };
}

export interface Session {
  isLoggedIn: boolean;
  user: {
    id: string;
    email: string;
    name: string;
  };
  merchant: {
    id: string;
    name: string;
    business_type: string;
    website: string;
    ai_trained?: boolean;
    description?: string;
  };
  sessionExpiresAt: number;
}
