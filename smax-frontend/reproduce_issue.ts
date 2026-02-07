
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

// Load env
const envPath = path.resolve(process.cwd(), '.env');
dotenv.config({ path: envPath });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const merchantId = '404f603e-48dc-48e4-a1cc-28fc83b4b852'; // Hardcoded from verify-widget-flow.ts

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase env vars');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function main() {
  console.log('Starting reproduction script...');

  // 1. Create a conversation
  const visitorName = 'Guest ' + Math.random().toString(36).substr(2, 4);
  console.log(`Creating conversation for ${visitorName}...`);
  
  const { data: conv, error: convError } = await supabase
    .from('conversations')
    .insert({
      merchant_id: merchantId,
      visitor_name: visitorName,
      channel: 'website',
      status: 'active',
      unread_count: 0,
      last_active: new Date().toISOString()
    })
    .select()
    .single();

  if (convError) {
    console.error('Failed to create conversation:', convError);
    return;
  }
  console.log('Conversation created:', conv.id);

  // 2. Test Case 1: Natural Name Extraction (No "My name is")
  const nameMessage = "Call me Bruce Wayne";
  console.log(`\n--- Test Case 1: Name Extraction ---`);
  console.log(`User says: "${nameMessage}"`);

  // Invoke Edge Function
  const { data: data1, error: error1 } = await supabase.functions.invoke('chat', {
    body: {
      conversation_id: conv.id,
      merchant_id: merchantId,
      message_content: nameMessage
    }
  });

  if (error1) console.error('Error invoking chat:', error1);
  else console.log('AI Reply:', data1?.reply);

  // Check DB for name update
  // We need to wait a bit because the Edge Function updates the customer async *after* the reply sometimes? 
  // Actually, looking at the code, 'create_customer' is a tool call, so it happens BEFORE the final reply.
  // BUT the 'update_customer_insight' and name extraction fallback happens AFTER.
  // Let's check the conversation visitor_name or customer table.
  
  // Wait 2 seconds
  await new Promise(r => setTimeout(r, 2000));

  const { data: updatedConv } = await supabase
    .from('conversations')
    .select('visitor_name')
    .eq('id', conv.id)
    .single();
    
  console.log(`Updated Visitor Name in Conversation: "${updatedConv?.visitor_name}"`);
  if (updatedConv?.visitor_name === 'Bruce Wayne') {
    console.log('✅ PASS: Name extracted correctly.');
  } else {
    console.log('❌ FAIL: Name NOT extracted (Expected "Bruce Wayne").');
  }

  // 3. Test Case 2: Natural Booking Intent (No "Booking" keyword)
  const bookingMessage = "Reserve a spot for me tomorrow at 10am";
  console.log(`\n--- Test Case 2: Tagging Intent ---`);
  console.log(`User says: "${bookingMessage}"`);

  const { data: data2, error: error2 } = await supabase.functions.invoke('chat', {
    body: {
      conversation_id: conv.id,
      merchant_id: merchantId,
      message_content: bookingMessage
    }
  });

  if (error2) console.error('Error invoking chat:', error2);
  else console.log('AI Reply:', data2?.reply);

  // Wait 2 seconds
  await new Promise(r => setTimeout(r, 2000));

  // Check if customer has "Booked Service" tag
  // First find the customer linked to this conversation
  // The 'chat' function returns customer_id, let's use that if available, or query via conversation
  const customerId = data2?.customer_id;
  
  if (customerId) {
      const { data: customer } = await supabase
        .from('customers')
        .select('tags')
        .eq('id', customerId)
        .single();
        
      console.log(`Customer Tags:`, customer?.tags);
      if (customer?.tags?.includes('Booked Service')) {
        console.log('✅ PASS: "Booked Service" tag added.');
      } else {
        console.log('❌ FAIL: Tag missing (Expected "Booked Service").');
      }
  } else {
      console.log('⚠️ Could not find customer_id to verify tags.');
  }

}

main();
