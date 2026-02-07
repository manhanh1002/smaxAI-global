
-- Add AI Task Logs table for tracking AI actions
create table if not exists ai_task_logs (
  id uuid primary key default uuid_generate_v4(),
  conversation_id uuid references conversations(id) on delete cascade,
  merchant_id uuid references merchants(id) on delete cascade,
  task_type text,
  task_title text,
  task_details jsonb,
  task_status text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Enable RLS for ai_task_logs (allow public for demo)
alter table ai_task_logs enable row level security;
create policy "Allow public access to ai_task_logs" on ai_task_logs for all using (true) with check (true);

-- Enable Realtime for ai_task_logs
alter publication supabase_realtime add table ai_task_logs;
