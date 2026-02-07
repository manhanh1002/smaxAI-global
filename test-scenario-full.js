// @ts-nocheck
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ytcupqvwvqcesqcmucvv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl0Y3VwcXZ3dnFjZXNxY211Y3Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4MjUwMTAsImV4cCI6MjA4NTQwMTAxMH0.F6WFTWJXV5wFMmydCyWUPGc3uKMCmf4iTGX2tEKhkoQ';

const supabase = createClient(supabaseUrl, supabaseAnonKey);
const merchantId = '404f603e-48dc-48e4-a1cc-28fc83b4b852';

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function runFullScenario() {
  console.log('=== STARTING FULL SCENARIO TEST ===');
  
  // 1. Create Conversation
  const visitorId = 'test_vis_' + Math.random().toString(36).substr(2, 5);
  const testPhone = '09' + Math.floor(Math.random() * 100000000).toString().padStart(8, '0');
  const testName = 'Test User ' + visitorId;
  
  console.log(`\n--- SETUP: Creating Conversation ---`);
  console.log(`Visitor: ${testName}, Phone: ${testPhone}`);

  const { data: conv, error: convError } = await supabase
    .from('conversations')
    .insert({
      merchant_id: merchantId,
      visitor_name: testName,
      channel: 'website',
      status: 'active',
      last_message: 'Init test',
      unread_count: 0,
      last_active: new Date().toISOString()
    })
    .select()
    .single();

  if (convError) {
    console.error('FATAL: Failed to create conversation', convError);
    return;
  }
  console.log('Conversation created:', conv.id);

  // Helper to send message and trigger AI
  async function sendMessage(content) {
    console.log(`\n[VISITOR]: "${content}"`);
    
    // Insert message
    const { error: msgError } = await supabase
      .from('messages')
      .insert({
        conversation_id: conv.id,
        role: 'visitor',
        content: content
      });
      
    if (msgError) console.error('Error sending message:', msgError);
    
    // Trigger Chat Edge Function (simulate ChatWidget behavior)
    console.log('Invoking chat function...');
    const { data: funcData, error: funcError } = await supabase.functions.invoke('chat', {
      body: {
        message_content: content,
        conversation_id: conv.id,
        merchant_id: merchantId,
        visitor_id: visitorId, // Passing visitor_id as in ChatWidget
        history: [] // Simplified for test
      }
    });

    if (funcError) {
      console.error('Chat function error:', funcError);
      if (funcError.context && funcError.context.json) {
        try {
            const errorBody = await funcError.context.json();
            console.error('Error Body:', JSON.stringify(errorBody, null, 2));
        } catch (e) {
            console.error('Could not read error body', e);
        }
      }
    } else {
      console.log('AI Response:', JSON.stringify(funcData));
    }
    
    // Wait for async processing (DB writes)
    console.log('Waiting for DB updates...');
    await delay(5000);
  }

  // --- STEP 1: IDENTIFY ---
  await sendMessage(`Chào bạn, mình là ${testName}, số điện thoại là ${testPhone}`);
  
  // Check Customer
  console.log('\n--- VERIFYING STEP 1: Customer Creation ---');
  let { data: customers, error: custError } = await supabase
    .from('customers')
    .select('*')
    .eq('phone', testPhone)
    .eq('merchant_id', merchantId);
    
  if (custError) console.error('Check customer error:', custError);
  else if (customers.length > 0) {
    console.log('✅ SUCCESS: Customer found:', customers[0].id, customers[0].full_name);
  } else {
    console.log('❌ FAILURE: Customer not found for phone', testPhone);
  }

  // --- STEP 2: BOOKING ---
  await sendMessage('Mình muốn đặt lịch Express Revitalize Massage vào 10h sáng mai');
  
  // Re-check Customer if not found in Step 1 (AI might have created it late)
  if (!customers || customers.length === 0) {
      console.log('Re-checking customer...');
      const { data: found } = await supabase
        .from('customers')
        .select('*')
        .eq('phone', testPhone)
        .eq('merchant_id', merchantId);
      if (found && found.length > 0) {
          customers = found; // Update local variable
          console.log('✅ Customer found on retry:', customers[0].id);
      }
  }

  // Check Booking
  console.log('\n--- VERIFYING STEP 2: Booking Creation ---');
  const { data: bookings, error: bookError } = await supabase
    .from('bookings')
    .select('*')
    .eq('customer_id', customers?.[0]?.id) // Use newly created customer ID
    .order('created_at', { ascending: false })
    .limit(1);

  if (bookError) console.error('Check booking error:', bookError);
  else if (bookings && bookings.length > 0) {
    console.log('✅ SUCCESS: Booking found:', bookings[0].id, bookings[0].service_name, bookings[0].start_time);
  } else {
    console.log('❌ FAILURE: No booking found for customer');
  }

  // --- STEP 3: ORDER ---
  await sendMessage('Mình muốn mua 1 chai Aroma Oil');
  
  // Check Order
  console.log('\n--- VERIFYING STEP 3: Order Creation ---');
  const { data: orders, error: orderError } = await supabase
    .from('orders')
    .select('*')
    .eq('customer_id', customers?.[0]?.id)
    .order('created_at', { ascending: false })
    .limit(1);
    
  if (orderError) console.error('Check order error:', orderError);
  else if (orders && orders.length > 0) {
    console.log('✅ SUCCESS: Order found:', orders[0].id, orders[0].total_amount);
  } else {
    console.log('❌ FAILURE: No order found for customer');
  }
  
  console.log('\n=== TEST COMPLETE ===');
}

runFullScenario().catch(console.error);
