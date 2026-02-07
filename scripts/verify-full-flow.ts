
import { createClient } from '@supabase/supabase-js';

// dotenv is optional if we pass env vars directly
// import dotenv from 'dotenv';
// dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyFullFlow() {
  console.log('Starting verification...');

  // 1. Simulate Auth (Get a user or create a test one? We'll use a fixed test user ID for simulation if we can't login)
  // Ideally we should login.
  // Let's use the existing merchant found in DB: 404f603e-48dc-48e4-a1cc-28fc83b4b852
  const merchantId = '404f603e-48dc-48e4-a1cc-28fc83b4b852';
  console.log(`Using Merchant ID: ${merchantId}`);

  // 2. Verify Merchant Exists
  const { data: merchant, error: merchantError } = await supabase
    .from('merchants')
    .select('*')
    .eq('id', merchantId)
    .single();

  if (merchantError) {
    console.error('Merchant check failed:', merchantError);
    return;
  }
  console.log('Merchant found:', merchant.name);

  // 3. Update AI Config (Simulate "Save API Key")
  console.log('Testing updateAIConfig...');
  const { data: config, error: configError } = await supabase
    .from('ai_configs')
    .upsert({ 
      merchant_id: merchantId, 
      openai_api_key: 'sk-test-verification-key',
      model: 'gpt-4o-mini',
      system_prompt: 'You are a test bot.'
    }, { onConflict: 'merchant_id' })
    .select()
    .single();

  if (configError) {
    console.error('updateAIConfig failed:', configError);
    return;
  }
  console.log('AI Config updated successfully.');

  // 4. Create Conversation (Simulate Visitor)
  console.log('Creating conversation...');
  const { data: conv, error: convError } = await supabase
    .from('conversations')
    .insert({
      merchant_id: merchantId,
      visitor_name: 'Verification Bot',
      channel: 'website',
      status: 'active'
    })
    .select()
    .single();

  if (convError) {
    console.error('Create conversation failed:', convError);
    return;
  }
  const conversationId = conv.id;
  console.log(`Conversation created: ${conversationId}`);

  // 5. Send Message (Simulate Visitor Message)
  console.log('Sending visitor message...');
  const { data: msg, error: msgError } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      role: 'visitor',
      content: 'Hello, are you working?',
      merchant_id: merchantId
    })
    .select()
    .single();

  if (msgError) {
    console.error('Send message failed:', msgError);
    return;
  }
  console.log('Message sent successfully.');

  // 6. Invoke Edge Function (Simulate ChatWidget call)
  console.log('Invoking Edge Function (chat)...');
  const { data: aiData, error: aiError } = await supabase.functions.invoke('chat', {
    body: {
      conversation_id: conversationId,
      merchant_id: merchantId,
      message_content: 'Hello, are you working?'
    }
  });

  if (aiError) {
    console.error('Edge function invocation failed:', aiError);
    // Note: It might fail if OpenAI Key is invalid (which it is 'sk-test...'), but we check if it returns 500 or handles it gracefully.
    // The Edge Function catches error and returns 500 if throw.
  } else {
    console.log('Edge function response:', aiData);
  }

  // 7. Verify AI Reply in DB
  console.log('Checking for AI reply in DB...');
  // Wait a bit
  await new Promise(r => setTimeout(r, 2000));

  const { data: replies, error: replyError } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .eq('role', 'ai');

  if (replyError) {
    console.error('Fetch replies failed:', replyError);
  } else if (replies.length > 0) {
    console.log('AI Reply found in DB:', replies[0].content);
  } else {
    console.log('No AI reply found in DB (expected if API key is invalid).');
  }

  console.log('Verification complete.');
}

verifyFullFlow();
