
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

// Manual env loading for script
const envPath = path.resolve(process.cwd(), '.env');
dotenv.config({ path: envPath });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function check() {
  console.log('Checking Supabase connection...');
  console.log('URL:', supabaseUrl);

  // 1. Check if we can read merchants
  const { data: merchants, error: mError } = await supabase.from('merchants').select('id');
  if (mError) {
    console.error('Error reading merchants:', mError);
    return;
  } else {
    console.log('Merchants table access: OK', merchants);
  }

  if (merchants.length === 0) {
      console.error('No merchants found in DB. Cannot proceed.');
      return;
  }

  // 2. Check if we can insert a conversation without 'channel' to check if schema is the issue
  const testMerchantId = merchants[0].id;
  console.log(`Using merchant ID: ${testMerchantId}`);

  // Attempt to create a conversation with ONLY merchant_id
  console.log('Attempting to create conversation (ONLY merchant_id)...');
  
  const { data: conv, error: cError } = await supabase
    .from('conversations')
    .insert({ 
      merchant_id: testMerchantId,
      // visitor_name: 'Test Visitor Script',
      // channel: 'website',
      status: 'active'
    })
    .select()
    .single();

  if (cError) {
    console.error('Error creating conversation:', cError);
  } else {
    console.log('Conversation created:', conv.id);
  console.log('Conversation object keys:', Object.keys(conv));
  
  // 3. Check if we can insert a message
  console.log('Attempting to create message (minimal)...');
  const { data: msg, error: msgError } = await supabase
    .from('messages')
    .insert({ 
      conversation_id: conv.id, 
      // role: 'visitor', // Commented out to test schema
      content: 'Hello from script' 
    })
    .select()
    .single();
      
    if (msgError) {
        console.error('Error creating message:', msgError);
      } else {
        console.log('Message created:', msg.id);
        console.log('Message object keys:', Object.keys(msg));
      }
    }
}

check();
