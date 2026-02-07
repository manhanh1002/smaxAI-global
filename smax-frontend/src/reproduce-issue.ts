
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

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function reproduce() {
  console.log('Starting Multi-turn Reproduction...');

  // 1. Get Merchant
  const { data: merchants } = await supabase.from('merchants').select('id').limit(1);
  if (!merchants || merchants.length === 0) return;
  const merchantId = merchants[0].id;

  // 2. Create Conversation
  const { data: conv } = await supabase.from('conversations').insert({
      merchant_id: merchantId,
      status: 'active'
  }).select().single();
  console.log('Conversation:', conv.id);

  // 3. Turn 1
  console.log('--- Turn 1: Sending "Hello" ---');
  await supabase.from('messages').insert({
      conversation_id: conv.id,
      sender: 'visitor',
      content: 'Hello'
  });

  // Wait for reply (poll DB)
  let replied1 = false;
  for (let i = 0; i < 10; i++) {
      await sleep(2000);
      const { data: msgs } = await supabase.from('messages')
          .select('*')
          .eq('conversation_id', conv.id)
          .eq('sender', 'ai')
          .order('created_at', { ascending: false })
          .limit(1);
      
      if (msgs && msgs.length > 0) {
          console.log('Turn 1 Reply:', msgs[0].content);
          replied1 = true;
          break;
      }
      console.log('Waiting for Turn 1 reply...');
  }

  if (!replied1) {
      console.error('FAILED: No reply for Turn 1');
      return;
  }

  // 4. Turn 2
  console.log('--- Turn 2: Sending "Do you have slots?" ---');
  await supabase.from('messages').insert({
      conversation_id: conv.id,
      sender: 'visitor',
      content: 'Do you have slots?'
  });

  // Wait for reply
  let replied2 = false;
  let lastReplyId = null;
  
  // Get the ID of the first reply to distinguish
  const { data: firstReply } = await supabase.from('messages')
      .select('id')
      .eq('conversation_id', conv.id)
      .eq('sender', 'ai')
      .order('created_at', { ascending: false })
      .limit(1);
  if (firstReply) lastReplyId = firstReply[0].id;

  for (let i = 0; i < 15; i++) {
      await sleep(2000);
      const { data: msgs } = await supabase.from('messages')
          .select('*')
          .eq('conversation_id', conv.id)
          .eq('sender', 'ai')
          .order('created_at', { ascending: false })
          .limit(1);
      
      if (msgs && msgs.length > 0) {
          if (msgs[0].id !== lastReplyId) {
              console.log('Turn 2 Reply:', msgs[0].content);
              replied2 = true;
              break;
          }
      }
      console.log('Waiting for Turn 2 reply...');
  }

  if (!replied2) {
      console.error('FAILED: No reply for Turn 2');
  } else {
      console.log('SUCCESS: Multi-turn working via script.');
  }
}

reproduce();
