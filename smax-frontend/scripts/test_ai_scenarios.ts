
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://ytcupqvwvqcesqcmucvv.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl0Y3VwcXZ3dnFjZXNxY211Y3Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4MjUwMTAsImV4cCI6MjA4NTQwMTAxMH0.F6WFTWJXV5wFMmydCyWUPGc3uKMCmf4iTGX2tEKhkoQ";
const MERCHANT_ID = "404f603e-48dc-48e4-a1cc-28fc83b4b852";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const FUNCTION_URL = `${SUPABASE_URL}/functions/v1/chat`;

async function runTest() {
  console.log("🚀 Starting End-to-End AI Merchant Test...");
  console.log(`Merchant ID: ${MERCHANT_ID}`);

  // --- PRE-CHECK: Fetch Valid Data from DB ---
  console.log("\n[Pre-Check] Fetching available slots and products...");

  // 1. Fetch Service
  const { data: service, error: serviceError } = await supabase
    .from('services')
    .select('name')
    .eq('merchant_id', MERCHANT_ID)
    .ilike('name', '%Massage%') // Try to find a massage service
    .limit(1)
    .maybeSingle();

  const serviceName = service ? service.name : 'Express Revitalize Massage';
  console.log(`ℹ️ Target Service: ${serviceName}`);

  // 2. Fetch Available Slot (Matching AI Context Logic)
  // AI only sees the first 20 upcoming slots. We must pick one from there.
  const today = new Date().toISOString().split('T')[0];
  const { data: slots, error: slotError } = await supabase
    .from('booking_slots')
    .select('*')
    .eq('merchant_id', MERCHANT_ID)
    .gte('date', today)
    .order('date', { ascending: true }) // CRITICAL: Match AI's sort order
    .limit(20); // CRITICAL: Match AI's limit

  // Find a slot with capacity > booked_count
  const availableSlot = slots?.find(s => s.booked_count < s.capacity);

  if (!availableSlot) {
    console.error("❌ No available slots found in the first 20 upcoming slots! AI will not see any availability.");
    process.exit(1);
  }

  const slotDate = availableSlot.date;
  const slotTime = availableSlot.time;
  console.log(`✅ Found Available Slot (in AI Context): ${slotDate} at ${slotTime} (Booked: ${availableSlot.booked_count}/${availableSlot.capacity})`);

  // 3. Fetch Available Product
  const { data: product, error: productError } = await supabase
    .from('products')
    .select('*, product_variants(*)')
    .eq('merchant_id', MERCHANT_ID)
    .gt('current_stock', 0)
    .limit(1)
    .maybeSingle();

  if (!product) {
    console.error("❌ No available products found in DB!");
    process.exit(1);
  }

  let productName = product.name;
  let variantName = null;
  
  if (product.product_variants && product.product_variants.length > 0) {
      // Pick a variant with stock
      const v = product.product_variants.find((v: any) => (v.current_stock > 0 || v.total_quantity > 0));
      if (v) {
          variantName = v.name;
          console.log(`ℹ️ Product has variants. Selected: ${productName} - ${variantName}`);
      }
  }
  
  console.log(`✅ Found Available Product: ${productName} ${variantName ? `(${variantName})` : ''} (Stock: ${product.current_stock})`);


  // --- START CONVERSATION ---
  console.log("\n[Step 1] Creating Conversation...");
  const { data: conversation, error: convoError } = await supabase
    .from('conversations')
    .insert({
      merchant_id: MERCHANT_ID,
      channel: 'website',
      status: 'active',
      visitor_name: 'Test Visitor'
    })
    .select()
    .single();

  if (convoError) {
    console.error("❌ Failed to create conversation:", convoError);
    process.exit(1);
  }
  console.log(`✅ Conversation created: ${conversation.id}`);

  // Helper to send message
  async function sendMessage(content: string) {
    console.log(`\n📤 User: "${content}"`);
    
    // Save user message to DB
    await supabase.from('messages').insert({
        conversation_id: conversation.id,
        merchant_id: MERCHANT_ID,
        role: 'visitor',
        content: content
    });

    const res = await fetch(FUNCTION_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        conversation_id: conversation.id,
        merchant_id: MERCHANT_ID,
        message_content: content
      })
    });

    if (!res.ok) {
      const txt = await res.text();
      console.error(`❌ Chat API Error (${res.status}):`, txt);
      return null;
    }

    const data = await res.json();
    console.log(`🤖 AI: "${data.reply}"`);
    return data.reply;
  }

  // --- SCENARIO 1: Info Collection ---
  console.log("\n--- Scenario 1: Customer Info Collection ---");
  await sendMessage("Hi, I am new here.");
  await sendMessage("My name is AutoTest, email is auto@test.com, phone is 0909000000.");
  
  // Verify Customer
  console.log("🔍 Verifying Customer creation...");
  const { data: customer } = await supabase
    .from('customers')
    .select('*')
    .eq('email', 'auto@test.com')
    .eq('merchant_id', MERCHANT_ID)
    .single();
    
  if (customer) {
    console.log(`✅ Customer Found: ${customer.name} (${customer.email}) - ID: ${customer.id}`);
  } else {
    console.error("❌ Customer NOT found in DB!");
  }

  // --- SCENARIO 2: FAQ ---
  console.log("\n--- Scenario 2: FAQ ---");
  const faqReply = await sendMessage("What is your cancellation policy?");
  if (faqReply && (faqReply.toLowerCase().includes("24 hours") || faqReply.toLowerCase().includes("24 giờ"))) {
    console.log("✅ FAQ Answered correctly.");
  } else {
    console.warn("⚠️ FAQ Answer might be incorrect. Check log.");
  }

  // --- SCENARIO 3: Booking ---
  console.log("\n--- Scenario 3: Service Booking ---");
  console.log(`ℹ️ Attempting to book: ${serviceName} on ${slotDate} at ${slotTime}`);
  
  await sendMessage(`I want to book ${serviceName} on ${slotDate} at ${slotTime}.`);
  // Remove explicit confirmation to avoid double booking
  // await sendMessage(`Yes, I confirm the booking for ${slotTime}.`);

  // Verify Booking
  console.log("🔍 Verifying Booking creation...");
  await new Promise(r => setTimeout(r, 2000)); // Wait for async
  
  const { data: bookings } = await supabase
    .from('bookings')
    .select('*')
    .eq('merchant_id', MERCHANT_ID)
    .eq('customer_id', customer?.id)
    .eq('date', slotDate)
    .order('created_at', { ascending: false })
    .limit(1);

  let bookingId = null;

  if (bookings && bookings.length > 0) {
    const booking = bookings[0];
    bookingId = booking.id;
    console.log(`✅ Booking Found: ID ${booking.id}, Status: ${booking.status}`);
    
    // Verify Slot Count
    const { data: slot } = await supabase
      .from('booking_slots')
      .select('*')
      .eq('merchant_id', MERCHANT_ID)
      .eq('date', slotDate)
      .eq('time', slotTime)
      .single();
      
    if (slot) {
      console.log(`✅ Slot Booked Count: ${slot.booked_count} (Capacity: ${slot.capacity})`);
      if (slot.booked_count > availableSlot.booked_count) console.log("✅ Slot count incremented.");
      else console.error("❌ Slot count NOT incremented!");
    }
  } else {
    console.error("❌ Booking NOT found in DB!");
  }

  // --- SCENARIO 4: Product Order ---
  console.log("\n--- Scenario 4: Product Order ---");
  const orderItem = variantName ? `${productName} (${variantName})` : productName;
  console.log(`ℹ️ Attempting to buy: ${orderItem}`);
  
  await sendMessage(`I also want to buy 2 bottles of ${orderItem}.`);
  // Remove explicit confirmation to avoid double ordering
  // await sendMessage("Yes, confirm the order.");

  // Verify Order
  console.log("🔍 Verifying Order creation...");
  await new Promise(r => setTimeout(r, 2000));
  
  const { data: orders } = await supabase
    .from('orders')
    .select('*, items:order_items(*)')
    .eq('merchant_id', MERCHANT_ID)
    .eq('customer_id', customer?.id)
    .order('created_at', { ascending: false })
    .limit(1);

  if (orders && orders.length > 0) {
    const order = orders[0];
    console.log(`✅ Order Found: ID ${order.id}, Total: ${order.total_amount}`);
    
    // Verify Stock
    const { data: updatedProduct } = await supabase
      .from('products')
      .select('current_stock')
      .eq('id', product.id)
      .single();
      
    console.log(`✅ Current Stock of ${productName}: ${updatedProduct?.current_stock} (Initial: ${product.current_stock})`);
  } else {
    console.error("❌ Order NOT found for this customer!");
    // Debug: Check if any order exists for this merchant recently
    const { data: anyOrders } = await supabase
        .from('orders')
        .select('*')
        .eq('merchant_id', MERCHANT_ID)
        .order('created_at', { ascending: false })
        .limit(3);
    console.log("DEBUG: Recent orders for merchant:", anyOrders?.map(o => `${o.id} (Cust: ${o.customer_id})`));
  }

  // --- SCENARIO 5: Cancellation ---
  console.log("\n--- Scenario 5: Booking Cancellation ---");
  if (bookingId) {
    await sendMessage("Actually, please cancel my massage booking.");
    
    // Verify Cancellation
    console.log("🔍 Verifying Booking Cancellation...");
    await new Promise(r => setTimeout(r, 2000));
    
    // --- DEBUG: Check AI Task Logs ---
    console.log("\n[DEBUG] Checking AI Task Logs...");
    const { data: taskLogs } = await supabase
      .from('ai_task_logs')
      .select('*')
      .eq('conversation_id', conversation.id)
      .order('created_at', { ascending: true });

    if (taskLogs && taskLogs.length > 0) {
      taskLogs.forEach(log => {
        console.log(`[Task Log] ${log.task_type} - ${log.task_status}: ${JSON.stringify(log.task_details).substring(0, 100)}...`);
      });
    } else {
      console.warn("⚠️ No AI Task Logs found!");
    }
    // ---------------------------------

    const { data: updatedBooking } = await supabase
      .from('bookings')
      .select('status')
      .eq('id', bookingId)
      .single();
      
    console.log(`✅ Booking Status: ${updatedBooking?.status} (Should be 'cancelled')`);
    
    // Verify Slot Count Reverted
    const { data: slotReverted } = await supabase
      .from('booking_slots')
      .select('booked_count')
      .eq('merchant_id', MERCHANT_ID)
      .eq('date', slotDate)
      .eq('time', slotTime)
      .single();
      
    if (slotReverted && slotReverted.booked_count === availableSlot.booked_count) {
       console.log(`✅ Slot Booked Count reverted to: ${slotReverted.booked_count}`);
    } else {
       console.log(`⚠️ Slot Booked Count: ${slotReverted?.booked_count} (Expected: ${availableSlot.booked_count})`);
    }

  } else {
    console.log("⚠️ Skipping Cancellation test as Booking was not created.");
  }

  console.log("\n🏁 Test Completed.");
}

runTest();
