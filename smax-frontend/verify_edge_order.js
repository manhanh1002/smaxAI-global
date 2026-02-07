import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), 'smax-frontend/.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const merchantId = "00000000-0000-0000-0000-000000000001";

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testOrderTool() {
  console.log("Testing Order Tool...");

  const { data: conv, error: convError } = await supabase
    .from('conversations')
    .insert({
      merchant_id: merchantId,
      visitor_name: 'Order Test JS',
      channel: 'website',
      status: 'active'
    })
    .select()
    .single();

  if (convError) {
    console.error("Failed to create conversation:", convError);
    return;
  }

  console.log("Created conversation:", conv.id);

  const edgeFunctionUrl = `${supabaseUrl}/functions/v1/chat`;
  console.log("Calling Edge Function at:", edgeFunctionUrl);

  const response = await fetch(edgeFunctionUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${supabaseKey}`
    },
    body: JSON.stringify({
      conversation_id: conv.id,
      merchant_id: merchantId,
      message_content: "I want to order the Aura Signature Glow Facial service, quantity 1. My name is Order User JS."
    })
  });

  const data = await response.json();
  console.log("Edge Function Response:", JSON.stringify(data, null, 2));

  const { data: logs } = await supabase
    .from('ai_task_logs')
    .select('*')
    .eq('conversation_id', conv.id);

  console.log("Task Logs:", JSON.stringify(logs, null, 2));

  const { data: orders } = await supabase
    .from('orders')
    .select('*')
    .eq('customer_name', 'Order User JS');

  console.log("Orders:", JSON.stringify(orders, null, 2));
}

testOrderTool();
