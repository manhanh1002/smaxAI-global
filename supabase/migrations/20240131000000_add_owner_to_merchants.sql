ALTER TABLE merchants ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id);
CREATE INDEX IF NOT EXISTS idx_merchants_owner_id ON merchants(owner_id);
