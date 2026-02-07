
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const merchantId = '404f603e-48dc-48e4-a1cc-28fc83b4b852';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase env vars');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function main() {
  console.log('Starting widget flow verification...');

  // 1. Create a conversation (simulating EmbeddableWidget)
  console.log('Creating conversation...');
  const { data: conv, error: convError } = await supabase
    .from('conversations')
    .insert({
      merchant_id: merchantId,
      visitor_name: 'Test Visitor ' + Math.random().toString(36).substr(2, 4),
      channel: 'website',
      status: 'active',
      last_message: 'Hello from verification script',
      unread_count: 1,
      last_active: new Date().toISOString()
    })
    .select()
    .single();

  if (convError) {
    console.error('Failed to create conversation:', convError);
    return;
  }
  console.log('Conversation created:', conv.id);

  // 2. Insert a message
  console.log('Inserting message...');
  const { error: msgError } = await supabase.from('messages').insert({
    conversation_id: conv.id,
    role: 'visitor',
    content: 'Hello from verification script',
    merchant_id: merchantId
  });

  if (msgError) {
    console.error('Failed to insert message:', msgError);
    return;
  }
  console.log('Message inserted successfully');

  // 3. Invoke Edge Function (optional, but good to check)
  console.log('Invoking Edge Function...');
  const { data: funcData, error: funcError } = await supabase.functions.invoke('chat', {
    body: {
      conversation_id: conv.id,
      merchant_id: merchantId,
      message_content: 'Hello from verification script'
    }
  });

  if (funcError) {
    console.error('Edge function error:', funcError);
  } else {
    console.log('Edge function response:', funcData);
  }

  // 4. Check if we can read it back (simulating ConversationList subscription)
  console.log('Verifying visibility...');
  const { data: checkConv, error: checkError } = await supabase
    .from('conversations')
    .select('*')
    .eq('id', conv.id)
    .single();

  if (checkError) {
    console.error('Failed to read back conversation:', checkError);
  } else {
    console.log('Conversation visible:', checkConv);
  }
}

main();
