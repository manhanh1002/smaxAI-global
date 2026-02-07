
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function debugSlots() {
  console.log('🔍 Debugging Booking Slots...');

  // 1. Get Merchant
  const { data: merchants } = await supabase.from('merchants').select('id, name').limit(1);
  if (!merchants?.length) {
    console.log('❌ No merchants found');
    return;
  }
  const merchantId = merchants[0].id;
  console.log(`Merchant: ${merchants[0].name} (${merchantId})`);

  // 2. Check all slots for this merchant
  const { data: allSlots } = await supabase
    .from('booking_slots')
    .select('*')
    .eq('merchant_id', merchantId);
    
  console.log(`\nFound ${allSlots?.length || 0} total slots for merchant:`);
  if (allSlots) {
      allSlots.forEach(s => console.log(` - Date: ${s.date}, Time: ${s.time}, Available: ${s.is_available}`));
  }

  // 3. Test the "Future Slots" query used in ai-engine.ts
  const today = new Date().toISOString().split("T")[0];
  console.log(`\nQuerying for date >= ${today}...`);
  
  const { data: futureSlots, error } = await supabase
    .from("booking_slots")
    .select("*")
    .eq("merchant_id", merchantId)
    .gte("date", today)
    .order("date", { ascending: true });

  if (error) {
      console.error('❌ Query Error:', error.message);
  } else {
      console.log(`Found ${futureSlots?.length || 0} future slots:`);
      futureSlots?.forEach(s => console.log(` - ${s.date} @ ${s.time}`));
  }
}

debugSlots();
