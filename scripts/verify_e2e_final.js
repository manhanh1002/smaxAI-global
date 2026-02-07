
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const fs = require('fs');

// Load env from smax-frontend/.env
const envPath = path.resolve(__dirname, '../smax-frontend/.env');
if (fs.existsSync(envPath)) {
    const envConfig = require('dotenv').parse(fs.readFileSync(envPath));
    for (const k in envConfig) {
        process.env[k] = envConfig[k];
    }
}

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
const MERCHANT_ID = "00000000-0000-0000-0000-000000000001"; // Demo Spa

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_KEY in .env");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function runTest() {
  console.log("=== STARTING END-TO-END TEST: NAME THEN PHONE & INVENTORY SYNC ===");

  // 0. Cleanup Previous Run Data
  console.log("\n--- 0. Cleanup Previous Data ---");
  await supabase.from('services').delete().eq('name', 'Test Service E2E A');
  await supabase.from('services').delete().eq('name', 'Test Service E2E B');
  await supabase.from('products').delete().eq('name', 'Test Product E2E');
  
  // 1. Setup: Create Services, Product, and Slot
  console.log("\n--- 1. Setting up Test Data ---");
  const testDate = new Date();
  testDate.setDate(testDate.getDate() + 1); // Tomorrow
  const dateStr = testDate.toISOString().split('T')[0];
  const timeStr = "10:00:00";
  
  // Create Service A
  const { data: serviceA, error: sErrA } = await supabase
    .from('services')
    .insert({ merchant_id: MERCHANT_ID, name: "Test Service E2E A", price: 100 })
    .select().single();
  if (sErrA) throw sErrA;
  console.log("Created Service A:", serviceA.name);

  // Create Service B
  const { data: serviceB, error: sErrB } = await supabase
    .from('services')
    .insert({ merchant_id: MERCHANT_ID, name: "Test Service E2E B", price: 150 })
    .select().single();
  if (sErrB) throw sErrB;
  console.log("Created Service B:", serviceB.name);

  // Create Addon for Service B
  const { data: addon, error: aErr } = await supabase
    .from('service_addons')
    .insert({ service_id: serviceB.id, name: "Test Addon E2E", price: 20 })
    .select().single();
  if (aErr) throw aErr;
  console.log("Created Addon for Service B:", addon.name);

  // Create Product
  const { data: product, error: pErr } = await supabase
    .from('products')
    .insert({ merchant_id: MERCHANT_ID, name: "Test Product E2E", price: 50, total_quantity: 10, current_stock: 10 })
    .select().single();
  if (pErr) throw pErr;
  console.log("Created Product:", product.name, "Stock:", product.current_stock);

  // Create/Ensure Slot
  let { data: slot, error: slErr } = await supabase
    .from('booking_slots')
    .select('*')
    .eq('merchant_id', MERCHANT_ID)
    .eq('date', dateStr)
    .eq('time', timeStr)
    .maybeSingle();

  if (slErr) throw slErr;

  if (!slot) {
    const { data: newSlot, error: insErr } = await supabase
      .from('booking_slots')
      .insert({ 
          merchant_id: MERCHANT_ID, 
          date: dateStr, 
          time: timeStr, 
          capacity: 5, 
          booked_count: 0 
      })
      .select().single();
    if (insErr) throw insErr;
    slot = newSlot;
  } else {
    // Reset booked count for test
    const { data: updatedSlot, error: upErr } = await supabase
        .from('booking_slots')
        .update({ booked_count: 0 })
        .eq('id', slot.id)
        .select().single();
    if (upErr) throw upErr;
    slot = updatedSlot;
  }
  
  console.log("Created/Found Slot:", slot.date, slot.time, "Booked:", slot.booked_count);

  // Create Conversation
  const { data: convo, error: cErr } = await supabase
    .from('conversations')
    .insert({ merchant_id: MERCHANT_ID, visitor_name: 'Visitor' })
    .select().single();
  if (cErr) throw cErr;
  console.log("Created Conversation:", convo.id);

  // 2. Simulate "Double Booking" Check
  // Step 2a: Manually Create Initial Booking (Simulating "Name only" phase)
  console.log("\n--- 2. Simulating 'Name only' Booking (Manual Insert) ---");
  const { data: initialBooking, error: ibErr } = await supabase
    .from('bookings')
    .insert({
        merchant_id: MERCHANT_ID,
        customer_name: "Nguyen Van Test",
        service_name: serviceA.name,
        date: dateStr,
        time: timeStr,
        status: 'confirmed',
        total_amount: 100
    })
    .select().single();
  
  if (ibErr) throw ibErr;
  console.log("Manually Created Initial Booking:", initialBooking.id);

  // Increment Slot (Simulate system action)
  await supabase.rpc('increment_slot_booked_count', { p_slot_id: slot.id });
  console.log("Incremented slot booked_count to 1");

  // Step 2b: User sends request that would normally trigger a NEW booking
  console.log("\n--- 2b. User requests booking with Phone (Should Trigger Loose Check) ---");
  const functionUrl = `${SUPABASE_URL}/functions/v1/chat`;
  const headers = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${SUPABASE_KEY}`
  };

  async function sendMsg(content) {
    console.log(`User: "${content}"`);
    const res = await fetch(functionUrl, {
        method: "POST",
        headers: headers,
        body: JSON.stringify({
            conversation_id: convo.id,
            merchant_id: MERCHANT_ID,
            message_content: content
        })
    });
    const data = await res.json();
    console.log(`AI: "${data.reply}"`);
    if (data.error) console.error("Error:", data.error);
    return data;
  }

  // "I want to book [Service] at [Time]. Name: [Name]. Phone: [Phone]"
  // This explicitly asks for a booking. 
  // If Loose Check works, it should detect the manual booking above (same name, time) and Update it.
  // If Loose Check fails, it will create a 2nd booking.
  await sendMsg(`I want to book ${serviceA.name} on ${dateStr} at 10:00. My name is Nguyen Van Test. My phone is 0909123456.`);

  // Verify Booking Count
  const { data: bookings, error: bErr } = await supabase
    .from('bookings')
    .select('*')
    .eq('merchant_id', MERCHANT_ID)
    .eq('date', dateStr)
    .eq('time', timeStr)
    .ilike('customer_name', 'Nguyen Van Test');
  
  if (bErr) throw bErr;
  console.log(`Found ${bookings.length} bookings for this customer/time.`);
  if (bookings.length !== 1) {
    console.error("FAIL: Double booking occurred! (Or booking deleted?)");
    if (bookings.length > 1) {
        console.log("Booking IDs:", bookings.map(b => b.id));
    }
  } else {
    console.log("PASS: Only 1 booking exists (Loose Check worked).");
    console.log("Booking ID:", bookings[0].id);
    console.log("Booking Phone:", bookings[0].customer_phone); // Might be updated if AI linked customer
    
    // Check if customer_id was linked
    if (bookings[0].customer_id) {
        console.log("PASS: Booking linked to customer ID:", bookings[0].customer_id);
    } else {
        console.log("WARNING: Booking not linked to customer ID (maybe create_customer failed or wasn't called).");
    }
  }

  // 3. Change Service & Add Addon (Test update_booking)
  console.log("\n--- 3. Changing Service to B and Adding Addon (Test update_booking) ---");
  await sendMsg(`Change my booking to ${serviceB.name} and add ${addon.name}`);

  const { data: bookingUpdated } = await supabase
    .from('bookings')
    .select('*')
    .eq('id', bookings[0].id)
    .single();
  
  console.log("Updated Booking Service:", bookingUpdated.service_name);
  console.log("Updated Booking Addons:", bookingUpdated.addons);
  console.log("Updated Booking Total:", bookingUpdated.total_amount);

  if (bookingUpdated.service_name === serviceB.name) {
    console.log("PASS: Service changed successfully.");
  } else {
    console.error("FAIL: Service not changed. (Expected: " + serviceB.name + ")");
  }

  const hasAddon = bookingUpdated.addons && bookingUpdated.addons.some(a => (a.name || a) === addon.name);
  if (hasAddon) {
    console.log("PASS: Addon added successfully.");
  } else {
    console.error("FAIL: Addon not added.");
  }
  
  // Expected Total: Service B (150) + Addon (20) = 170
  if (Number(bookingUpdated.total_amount) === 170) {
      console.log("PASS: Total amount updated correctly.");
  } else {
      console.error(`FAIL: Total amount mismatch. Expected 170, got ${bookingUpdated.total_amount}`);
  }

  // 4. Buy Product & Check Stock
  console.log("\n--- 4. Buying Product & Checking Stock ---");
  await sendMsg(`Please find the product 'Test Product E2E' and use the create_order tool to buy 2 of them.`);

  const { data: productAfter } = await supabase
    .from('products')
    .select('*')
    .eq('id', product.id)
    .single();
  
  console.log(`Product Stock: ${product.current_stock} -> ${productAfter.current_stock}`);
  
  // Debug Orders
  const { data: debugOrders } = await supabase.from('orders').select('*').eq('product_id', product.id);
  console.log("Debug Orders Found:", debugOrders.length);
  debugOrders.forEach(o => console.log(`Order ${o.id}: Qty ${o.quantity}, Status ${o.status}`));

  if (productAfter.current_stock === product.current_stock - 2) {
    console.log("PASS: Stock decremented correctly.");
  } else {
    console.log("FAIL: Stock not decremented correctly. (Expected 8, got " + productAfter.current_stock + ")");
  }

  // 5. Cancel Order & Restore Stock
  console.log("\n--- 5. Cancelling Order & Restoring Stock ---");
  await sendMsg(`Cancel my order for ${product.name}`);
      
  const { data: productFinal } = await supabase
    .from('products')
    .select('*')
    .eq('id', product.id)
    .single();
  
  console.log(`Product Stock After Cancel: ${productFinal.current_stock}`);
  if (productFinal.current_stock === product.current_stock) {
    console.log("PASS: Stock restored correctly.");
  } else {
    console.error("FAIL: Stock not restored.");
  }

  // Cleanup
  console.log("\n--- Cleanup ---");
  await supabase.from('bookings').delete().eq('id', bookings[0].id);
  await supabase.from('booking_slots').update({ booked_count: Math.max(0, slot.booked_count) }).eq('id', slot.id); // Reset slot
  await supabase.from('services').delete().eq('id', serviceA.id);
  await supabase.from('services').delete().eq('id', serviceB.id);
  await supabase.from('products').delete().eq('id', product.id);
  await supabase.from('conversations').delete().eq('id', convo.id);
  console.log("Cleanup done.");
}

runTest().catch(console.error);
