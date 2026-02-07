
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: 'smax-frontend/.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyState() {
  console.log('--- Database Verification ---');

  // 1. Check all merchants
  const { data: merchants, error: mError } = await supabase.from('merchants').select('*');
  if (mError) console.error('Merchants Error:', mError);
  console.log(`Total Merchants: ${merchants?.length || 0}`);
  if (merchants) merchants.forEach(m => console.log(` - ID: ${m.id}, Name: ${m.name}, Owner: ${m.owner_id}`));

  // 2. Check AI Configs
  const { data: configs, error: cError } = await supabase.from('ai_configs').select('*');
  if (cError) console.error('AI Configs Error:', cError);
  console.log(`Total AI Configs: ${configs?.length || 0}`);
  if (configs) configs.forEach(c => console.log(` - MerchantID: ${c.merchant_id}, Model: ${c.model}`));

  // 3. Check Products
  const { count: pCount } = await supabase.from('products').select('*', { count: 'exact', head: true });
  console.log(`Total Products: ${pCount}`);
}

verifyState();
