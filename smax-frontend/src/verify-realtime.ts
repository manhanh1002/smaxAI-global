
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

// Load env
const envPath = path.resolve(process.cwd(), '.env');
dotenv.config({ path: envPath });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase env vars');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testRealtime() {
  console.log('Testing Supabase Realtime...');

  // 1. Get a merchant and create a conversation to listen to
  const { data: merchants } = await supabase.from('merchants').select('id').limit(1);
  if (!merchants || merchants.length === 0) {
      console.error('No merchants found');
      return;
  }
  const merchantId = merchants[0].id;
  console.log('Using Merchant:', merchantId);

  const { data: conv } = await supabase.from('conversations').insert({
      merchant_id: merchantId,
      status: 'active'
  }).select().single();

  if (!conv) {
      console.error('Failed to create conversation');
      return;
  }
  console.log('Created test conversation:', conv.id);

  // 2. Subscribe
  console.log('Subscribing to messages...');
  let receivedEvent = false;

  const channel = supabase.channel('test-realtime')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conv.id}` },
      (payload) => {
        console.log('✅ RECEIVED REALTIME EVENT:', payload.new);
        receivedEvent = true;
      }
    )
    .subscribe((status) => {
      console.log('Subscription status:', status);
      if (status === 'SUBSCRIBED') {
        // 3. Trigger Insert after subscribed
        console.log('Inserting message to trigger event...');
        setTimeout(async () => {
            await supabase.from('messages').insert({
                conversation_id: conv.id,
                sender: 'visitor',
                content: 'Realtime Test Message'
            });
            console.log('Message inserted.');
        }, 1000);
      }
    });

  // Wait for event
  setTimeout(() => {
    if (receivedEvent) {
        console.log('SUCCESS: Realtime is working.');
        process.exit(0);
    } else {
        console.error('TIMEOUT: Did not receive realtime event within 10 seconds.');
        console.error('POSSIBLE CAUSE: Realtime replication is NOT enabled for the "messages" table in Supabase Dashboard.');
        process.exit(1);
    }
  }, 10000);
}

testRealtime();
