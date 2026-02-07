
-- Add missing columns to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS description text;

-- Add missing columns to booking_slots table
ALTER TABLE booking_slots ADD COLUMN IF NOT EXISTS booked_count int default 0;

-- Add missing columns to merchants table
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS ai_trained boolean default false;

-- Reload schema cache just in case
NOTIFY pgrst, 'reload config';
