
create table if not exists customers (
  id uuid primary key default uuid_generate_v4(),
  merchant_id uuid references merchants(id) on delete cascade,
  name text not null,
  email text,
  phone text,
  channel text,
  custom_fields jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

alter table customers enable row level security;
create policy "Allow public access to customers" on customers for all using (true) with check (true);

create index if not exists idx_customers_merchant_id on customers(merchant_id);
create index if not exists idx_customers_email on customers(email);
create index if not exists idx_customers_phone on customers(phone);
