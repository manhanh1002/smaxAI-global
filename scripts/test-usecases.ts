// @ts-nocheck
const { createClient } = require('@supabase/supabase-js');
// const dotenv = require('dotenv');
// dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testUsecases() {
  console.log('Starting Usecase Verification...');

  // Use existing merchant
  const merchantId = '404f603e-48dc-48e4-a1cc-28fc83b4b852';

  // Create a fresh conversation for this test
  const { data: conv, error: convError } = await supabase
    .from('conversations')
    .insert({
      merchant_id: merchantId,
      visitor_name: 'Test User Usecase',
      channel: 'website',
      status: 'active'
    })
    .select()
    .single();

  if (convError) {
    console.error('Failed to create conversation:', convError);
    return;
  }
  const conversationId = conv.id;
  console.log(`Created conversation: ${conversationId}`);

  // Helper to send user message and get AI response
  async function interact(userMessage) {
    console.log(`\n--- User: "${userMessage}" ---`);
    
    // 1. Insert User Message
    await supabase.from('messages').insert({
      conversation_id: conversationId,
      role: 'visitor',
      content: userMessage,
      merchant_id: merchantId
    });

    // 2. Invoke Edge Function
    console.log('Invoking AI...');
    const { data, error } = await supabase.functions.invoke('chat', {
      body: {
        conversation_id: conversationId,
        merchant_id: merchantId,
        message_content: userMessage
      }
    });

    if (error) {
      console.error('AI Invocation Error:', error);
      if (error.context && typeof error.context.text === 'function') {
        try {
            const errorBody = await error.context.text();
            console.error('Error Body:', errorBody);
        } catch (e) {
            console.error('Failed to read error body:', e);
        }
      }
      return null;
    }

    console.log('AI Response:', data.response);
    return data;
  }

  // Usecase 1: Book Main Service
  // "Express Revitalize Massage"
  await interact("I want to book Express Revitalize Massage for tomorrow at 10am.");

  // Check Booking in DB
  const { data: bookings1 } = await supabase
    .from('bookings')
    .select('*, service:services(name)')
    .eq('customer_id', (await getCustomerId(conversationId)))
    .order('created_at', { ascending: false })
    .limit(1);
  
  if (bookings1 && bookings1.length > 0) {
      console.log(`[VERIFY] Booking created: ${bookings1[0].service.name} at ${bookings1[0].booking_time}`);
  } else {
      console.log(`[VERIFY] No booking found!`);
  }

  // Usecase 2: Add Addon
  // "Aroma Oil"
  await interact("Please add Aroma Oil addon to it.");

  // Check Booking Addons
  const { data: bookings2 } = await supabase
    .from('bookings')
    .select('*')
    .eq('id', bookings1?.[0]?.id)
    .single();
  
  console.log(`[VERIFY] Booking addons after add:`, bookings2?.addons);

  // Usecase 3: Cancel Addon
  await interact("Actually, cancel the Aroma Oil addon.");

  // Check Booking Addons
  const { data: bookings3 } = await supabase
    .from('bookings')
    .select('*')
    .eq('id', bookings1?.[0]?.id)
    .single();
  
  console.log(`[VERIFY] Booking addons after cancel:`, bookings3?.addons);

  // Check Private Note
  const customerId = await getCustomerId(conversationId);
  const { data: customer } = await supabase
    .from('customers')
    .select('notes')
    .eq('id', customerId)
    .single();
  
  console.log(`[VERIFY] Private Note:`, customer?.notes);
}

async function getCustomerId(conversationId) {
    const { data } = await supabase.from('conversations').select('customer_id').eq('id', conversationId).single();
    return data?.customer_id;
}

testUsecases();
