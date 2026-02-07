-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Merchants Table
create table if not exists merchants (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  website text,
  business_type text check (business_type in ('spa', 'clinic', 'restaurant', 'ecom', 'other')),
  ai_trained boolean default false,
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- AI Configuration Table (One to One with Merchant)
create table if not exists ai_configs (
  merchant_id uuid primary key references merchants(id) on delete cascade,
  openai_api_key text,
  openai_base_url text default 'https://token.ai.vn/v1',
  model text default 'gpt-4',
  temperature float default 0.7,
  max_tokens int default 500,
  system_prompt text,
  data_sources jsonb default '{"products": true, "bookings": true, "faqs": true, "orders": true, "policies": true}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Products Table
create table if not exists products (
  id uuid primary key default uuid_generate_v4(),
  merchant_id uuid references merchants(id) on delete cascade,
  name text not null,
  description text,
  price numeric(10, 2) not null,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Booking Slots Table
create table if not exists booking_slots (
  id uuid primary key default uuid_generate_v4(),
  merchant_id uuid references merchants(id) on delete cascade,
  date date not null,
  time time not null,
  duration_minutes int default 60,
  capacity int default 1,
  booked_count int default 0,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- FAQs Table
create table if not exists faqs (
  id uuid primary key default uuid_generate_v4(),
  merchant_id uuid references merchants(id) on delete cascade,
  category text check (category in ('policies', 'products', 'services', 'general')),
  question text not null,
  answer text not null,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Conversations Table
create table if not exists conversations (
  id uuid primary key default uuid_generate_v4(),
  merchant_id uuid references merchants(id) on delete cascade,
  visitor_name text,
  visitor_email text,
  visitor_phone text,
  channel text check (channel in ('website', 'facebook', 'instagram', 'whatsapp')),
  intent text check (intent in ('booking', 'order', 'inquiry', 'complaint', 'other')),
  status text check (status in ('active', 'resolved', 'escalated')) default 'active',
  last_message text,
  unread_count int default 0,
  last_active timestamp with time zone default timezone('utc'::text, now()),
  created_at timestamp with time zone default timezone('utc'::text, now()),
  ended_at timestamp with time zone
);

-- Messages Table
create table if not exists messages (
  id uuid primary key default uuid_generate_v4(),
  conversation_id uuid references conversations(id) on delete cascade,
  role text check (role in ('visitor', 'ai', 'agent')),
  content text not null,
  action_type text,
  action_data jsonb,
  suggested_actions jsonb, -- Array of strings
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Orders Table
create table if not exists orders (
  id uuid primary key default uuid_generate_v4(),
  merchant_id uuid references merchants(id) on delete cascade,
  customer_name text,
  product_name text,
  quantity int default 1,
  channel text,
  created_by_ai boolean default false,
  status text check (status in ('active', 'pending', 'completed')) default 'pending',
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Bookings Table
create table if not exists bookings (
  id uuid primary key default uuid_generate_v4(),
  merchant_id uuid references merchants(id) on delete cascade,
  customer_name text,
  service_name text,
  date date,
  time time,
  status text check (status in ('confirmed', 'pending', 'cancelled')) default 'pending',
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Enable Realtime for Conversations and Messages
alter publication supabase_realtime add table conversations;
alter publication supabase_realtime add table messages;

-- Simple RLS Policies (Allow public access for Demo/Self-hosted convenience)
-- In production, these should be locked down to authenticated users/anon with specific rules.
alter table merchants enable row level security;
create policy "Allow public access to merchants" on merchants for all using (true) with check (true);

alter table ai_configs enable row level security;
create policy "Allow public access to ai_configs" on ai_configs for all using (true) with check (true);

alter table products enable row level security;
create policy "Allow public access to products" on products for all using (true) with check (true);

alter table booking_slots enable row level security;
create policy "Allow public access to booking_slots" on booking_slots for all using (true) with check (true);

alter table faqs enable row level security;
create policy "Allow public access to faqs" on faqs for all using (true) with check (true);

alter table conversations enable row level security;
create policy "Allow public access to conversations" on conversations for all using (true) with check (true);

alter table messages enable row level security;
create policy "Allow public access to messages" on messages for all using (true) with check (true);

alter table orders enable row level security;
create policy "Allow public access to orders" on orders for all using (true) with check (true);

alter table bookings enable row level security;
create policy "Allow public access to bookings" on bookings for all using (true) with check (true);

-- Insert Demo Merchant
insert into merchants (id, name, website, business_type, ai_trained)
values ('00000000-0000-0000-0000-000000000001', 'Demo Spa', 'https://demospa.com', 'spa', true);

-- Insert Demo AI Config
insert into ai_configs (merchant_id, system_prompt)
values ('00000000-0000-0000-0000-000000000001', 'You are a helpful assistant for Demo Spa.');

-- Insert Seed Conversations
insert into conversations (id, merchant_id, visitor_name, channel, intent, status, last_message, unread_count, last_active)
values 
('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000001', 'John Davis', 'website', 'booking', 'active', 'Is 2 PM available?', 1, now() - interval '2 minutes'),
('22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000001', 'Sarah Miller', 'website', 'inquiry', 'resolved', 'Thanks for the help!', 0, now() - interval '30 minutes'),
('33333333-3333-3333-3333-333333333333', '00000000-0000-0000-0000-000000000001', 'Mike Lewis', 'facebook', 'complaint', 'escalated', 'I want a refund please.', 0, now() - interval '2 hours');

-- Insert Seed Messages for John Davis
insert into messages (conversation_id, role, content, created_at)
values
('11111111-1111-1111-1111-111111111111', 'visitor', 'Hi, I would like to book an appointment.', now() - interval '10 minutes'),
('11111111-1111-1111-1111-111111111111', 'ai', 'Hello! I''d be happy to help with that. What service are you interested in?', now() - interval '9 minutes'),
('11111111-1111-1111-1111-111111111111', 'visitor', 'I need a full body massage.', now() - interval '8 minutes'),
('11111111-1111-1111-1111-111111111111', 'ai', 'Great choice! We have slots available tomorrow at 2 PM and 4 PM. Which one works for you?', now() - interval '7 minutes');
