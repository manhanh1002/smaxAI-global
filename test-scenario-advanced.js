// @ts-nocheck
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ytcupqvwvqcesqcmucvv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl0Y3VwcXZ3dnFjZXNxY211Y3Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4MjUwMTAsImV4cCI6MjA4NTQwMTAxMH0.F6WFTWJXV5wFMmydCyWUPGc3uKMCmf4iTGX2tEKhkoQ';

const supabase = createClient(supabaseUrl, supabaseAnonKey);
const merchantId = '404f603e-48dc-48e4-a1cc-28fc83b4b852';

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function runAdvancedScenario() {
  console.log('=== STARTING ADVANCED SCENARIO TEST ===');
  
  // 1. Create Conversation
  const randomSuffix = Math.random().toString(36).substr(2, 5).replace(/[0-9]/g, 'a'); // Letters only
  const visitorId = 'AdvUser' + randomSuffix;
  const testPhone = '09' + Math.floor(Math.random() * 100000000).toString().padStart(8, '0');
  const testName = visitorId; // Just the name, no spaces or complex structure
  
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
        visitor_id: visitorId,
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
      const data = funcData;
      if (data && data.reply) {
        try {
            const aiResponse = JSON.parse(data.reply);
            console.log('AI Response:', JSON.stringify(aiResponse));
            
            // Capture customer_id from AI response if available
            if (aiResponse.customer_id) {
                const { data: found } = await supabase.from('customers').select('*').eq('id', aiResponse.customer_id).single();
                if (found) {
                    console.log(`💡 AI provided customer_id: ${aiResponse.customer_id} - Using this for context.`);
                    customers = [found];
                }
            }
        } catch (e) {
            console.log('AI Response (Text):', data.reply);
        }
      } else {
        console.log('AI Response (Raw):', data);
      }
    }
    
    // Wait for async processing (DB writes)
    console.log('Waiting for DB updates...');
    await delay(5000);
  }

  // --- STEP 1: IDENTIFY ---
  await sendMessage(`Chào bạn, mình là ${testName}, số điện thoại là ${testPhone}`);
  
  // Check Customer
  console.log('\n--- VERIFYING STEP 1: Customer Creation ---');
  let customers = [];
  // Retry loop for customer creation
  for (let i = 0; i < 5; i++) {
      const { data: found } = await supabase
        .from('customers')
        .select('*')
        .eq('phone', testPhone)
        .eq('merchant_id', merchantId);
      if (found && found.length > 0) {
          customers = found;
          break;
      }
      await delay(2000);
  }
    
  if (customers.length > 0) {
    console.log('✅ SUCCESS: Customer found:', customers[0].id, customers[0].name);
  } else {
    console.log('❌ FAILURE: Customer not found for phone', testPhone);
    // Try to recover by searching by name just in case
    const { data: byName } = await supabase.from('customers').select('*').eq('name', testName).eq('merchant_id', merchantId);
    if (byName && byName.length > 0) {
        console.log('⚠️ RECOVERY: Customer found by name:', byName[0].id);
        customers = byName;
    }
  }

  // --- STEP 2: BOOKING ---
  await sendMessage('Mình muốn đặt lịch Express Revitalize Massage vào 10h sáng mai');
  
  // Check Booking
  console.log('\n--- VERIFYING STEP 2: Booking Creation ---');
  let bookingId = null;
  const { data: bookings, error: bookError } = await supabase
    .from('bookings')
    .select('*')
    .eq('customer_id', customers?.[0]?.id)
    .order('created_at', { ascending: false })
    .limit(1);

  if (bookings && bookings.length > 0) {
    bookingId = bookings[0].id;
    console.log('✅ SUCCESS: Booking found:', bookingId, bookings[0].service_name, bookings[0].date, bookings[0].time);
  } else {
    console.log('❌ FAILURE: No booking found for customer');
  }

  // --- STEP 3: ORDER ---
  await sendMessage('Mình muốn mua 1 chai Aroma Oil. Tạo đơn ngay nhé.');
  
  // Check Order
  console.log('\n--- VERIFYING STEP 3: Order Creation ---');
  let orderId = null;
  const { data: orders, error: orderError } = await supabase
    .from('orders')
    .select('*')
    .eq('customer_id', customers?.[0]?.id)
    .order('created_at', { ascending: false })
    .limit(1);
    
  if (orders && orders.length > 0) {
    orderId = orders[0].id;
    console.log('✅ SUCCESS: Order found:', orderId, orders[0].product_name, orders[0].status);
  } else {
    console.log('❌ FAILURE: No order found for customer');
  }

  // --- STEP 4: RESCHEDULE ---
  await sendMessage('Mình muốn đổi lịch sang 10h sáng ngày 08/02/2026');
  
  console.log('\n--- VERIFYING STEP 4: Reschedule Booking ---');
  const { data: updatedBooking } = await supabase
    .from('bookings')
    .select('*')
    .eq('id', bookingId)
    .single();

  if (updatedBooking && updatedBooking.date === '2026-02-08') {
      console.log('✅ SUCCESS: Booking rescheduled to:', updatedBooking.date, updatedBooking.time);
  } else {
      console.log('❌ FAILURE: Booking reschedule failed. Current date:', updatedBooking?.date);
  }

  // --- STEP 5: CHANGE SERVICE ---
  // Note: There isn't a direct "change_service" tool, but "update_booking" usually handles time/addons. 
  // If the AI is smart, it might cancel and create new, or we might need to see if update_booking supports service change (it doesn't explicitly in the schema I saw earlier, but let's see how AI handles it).
  // Checking schema again... update_booking params: date, time, addons. NO service_name.
  // So AI should technically Cancel -> Create New, OR fail and say it can't.
  // Let's see what happens.
  await sendMessage('À mà mình muốn đổi sang dịch vụ Deep Tissue Recovery nhé');
  
  console.log('\n--- VERIFYING STEP 5: Change Service ---');
  // Check if old booking is cancelled and new one created, OR if old booking is updated
  const { data: latestBookings } = await supabase
      .from('bookings')
      .select('*')
      .eq('customer_id', customers?.[0]?.id)
      .order('created_at', { ascending: false })
      .limit(5); // Increase limit to see more history
      
  if (!latestBookings || latestBookings.length === 0) {
      console.log('❌ FAILURE: No bookings found at all');
  } else {
      const deepTissueBooking = latestBookings.find(b => b.service_name.includes('Deep Tissue') && b.status !== 'cancelled');
      
      if (deepTissueBooking) {
          console.log('✅ SUCCESS: New service booking found:', deepTissueBooking.service_name);
          // Check if old one is cancelled?
          if (deepTissueBooking.id !== bookingId) {
              const { data: oldBooking } = await supabase.from('bookings').select('status').eq('id', bookingId).single();
              console.log('Old booking status:', oldBooking?.status);
          }
      } else {
          console.log('❌ FAILURE: No booking found for Deep Tissue Recovery');
          console.log('Latest bookings:', JSON.stringify(latestBookings.map(b => ({id: b.id, service: b.service_name, status: b.status})), null, 2));
      }
  }

  // --- STEP 6: CANCEL ORDER ---
  await sendMessage('Thôi mình không lấy Aroma Oil nữa, huỷ đơn giúp mình');
  
  console.log('\n--- VERIFYING STEP 6: Cancel Order ---');
  const { data: cancelledOrder } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();
      
  if (cancelledOrder && cancelledOrder.status === 'cancelled') {
      console.log('✅ SUCCESS: Order cancelled successfully');
  } else {
      console.log('❌ FAILURE: Order status is:', cancelledOrder?.status);
  }

  // --- FINAL: CHECK LOGS & NOTES ---
  console.log('\n--- VERIFYING FINAL: Logs & Notes ---');
  const { data: taskLogs } = await supabase
      .from('ai_task_logs')
      .select('task_type, task_status, task_details')
      .eq('conversation_id', conv.id)
      .order('created_at', { ascending: true });
      
  console.log('Task Logs:', JSON.stringify(taskLogs, null, 2));
  
  // Debug: List recent customers
  const { data: recentCustomers } = await supabase
    .from('customers')
    .select('id, name, phone, created_at')
    .eq('merchant_id', merchantId)
    .order('created_at', { ascending: false })
    .limit(5);
  console.log('Recent Customers in DB:', JSON.stringify(recentCustomers, null, 2));

  const { data: customerFinal } = await supabase
      .from('customers')
      .select('internal_notes')
      .eq('id', customers?.[0]?.id)
      .single();
      
  console.log('Internal Notes:', customerFinal?.internal_notes);

  console.log('\n=== ADVANCED TEST COMPLETE ===');
}

runAdvancedScenario().catch(console.error);
