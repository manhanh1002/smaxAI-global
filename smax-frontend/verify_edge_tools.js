
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load env from root or current dir
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
// Also try frontend .env if root fails
dotenv.config({ path: path.resolve(process.cwd(), 'smax-frontend/.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const merchantId = "00000000-0000-0000-0000-000000000001"; 

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY");
  console.log("Current env:", process.env);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testBookingTool() {
  console.log("Testing Booking Tool...");
  
  // 1. Create a dummy conversation
  const { data: conv, error: convError } = await supabase
    .from('conversations')
    .insert({
      merchant_id: merchantId,
      visitor_name: 'Test Bot JS',
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

  // 2. Call Edge Function
  // Note: Edge Function URL might need to be constructed manually if not in env
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
      message_content: "I want to book a Aura Signature Glow Facial for 2026-02-05 at 11:50 AM. My name is Test User JS."
    })
  });

  const data = await response.json();
  console.log("Edge Function Response:", JSON.stringify(data, null, 2));

  // 3. Verify Task Log
  // Give it a moment for async logs if needed (though edge function awaits them)
  const { data: logs } = await supabase
    .from('ai_task_logs')
    .select('*')
    .eq('conversation_id', conv.id);

  console.log("Task Logs:", JSON.stringify(logs, null, 2));

  if (logs && logs.length > 0) {
    console.log("✅ Task Log Verified");
  } else {
    console.error("❌ Task Log Failed");
  }

  // 4. Verify Booking
  const { data: bookings } = await supabase
    .from('bookings')
    .select('*')
    .eq('customer_name', 'Test User JS')
    .eq('date', '2026-02-05');

  console.log("Bookings:", JSON.stringify(bookings, null, 2));

  if (bookings && bookings.length > 0) {
    console.log("✅ Booking Verified");
  } else {
    console.error("❌ Booking Failed");
  }
}

testBookingTool();
