
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ytcupqvwvqcesqcmucvv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl0Y3VwcXZ3dnFjZXNxY211Y3Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4MjUwMTAsImV4cCI6MjA4NTQwMTAxMH0.F6WFTWJXV5wFMmydCyWUPGc3uKMCmf4iTGX2tEKhkoQ';
const supabase = createClient(supabaseUrl, supabaseKey);

const MERCHANT_ID = '404f603e-48dc-48e4-a1cc-28fc83b4b852';

async function seed() {
  console.log('Seeding data for merchant:', MERCHANT_ID);

  // 1. Ensure Services
  const services = [
    { name: 'Express Revitalize Massage', price: 60, duration_minutes: 60, description: 'Quick relief' },
    { name: 'Deep Tissue Recovery', price: 145, duration_minutes: 90, description: 'Intense recovery' }
  ];

  for (const s of services) {
    const { data: existing } = await supabase.from('services').select('id').eq('merchant_id', MERCHANT_ID).eq('name', s.name).maybeSingle();
    if (!existing) {
      console.log(`Creating service: ${s.name}`);
      const { error } = await supabase.from('services').insert({ merchant_id: MERCHANT_ID, ...s });
      if (error) console.error('Error creating service:', error);
    } else {
      console.log(`Service exists: ${s.name}`);
    }
  }

  // 2. Ensure Products
  const products = [
    { name: 'Aroma Oil', price: 25, total_quantity: 100, current_stock: 100, description: 'Relaxing oil' }
  ];

  for (const p of products) {
    const { data: existing } = await supabase.from('products').select('id').eq('merchant_id', MERCHANT_ID).eq('name', p.name).maybeSingle();
    if (!existing) {
      console.log(`Creating product: ${p.name}`);
      const { error } = await supabase.from('products').insert({ merchant_id: MERCHANT_ID, ...p });
      if (error) console.error('Error creating product:', error);
    } else {
        // Reset stock for tests
        await supabase.from('products').update({ current_stock: 100 }).eq('id', existing.id);
        console.log(`Product exists (stock reset): ${p.name}`);
    }
  }

  // 3. Ensure Booking Slots (Feb 7 and Feb 8, 2026)
  // Times: 10:00, 14:00
  const dates = ['2026-02-07', '2026-02-08'];
  const times = ['10:00:00', '14:00:00'];

  for (const date of dates) {
    for (const time of times) {
      const { data: existing } = await supabase
        .from('booking_slots')
        .select('id')
        .eq('merchant_id', MERCHANT_ID)
        .eq('date', date)
        .eq('time', time)
        .maybeSingle();

      if (!existing) {
        console.log(`Creating slot: ${date} ${time}`);
        const { error } = await supabase.from('booking_slots').insert({
          merchant_id: MERCHANT_ID,
          date: date,
          time: time,
          capacity: 10,
          booked_count: 0
        });
        if (error) console.error('Error creating slot:', error);
      } else {
        console.log(`Slot exists (resetting capacity): ${date} ${time}`);
        await supabase.from('booking_slots').update({ capacity: 10, booked_count: 0 }).eq('id', existing.id);
      }
    }
  }

  console.log('Seeding complete.');
}

seed().catch(console.error);
