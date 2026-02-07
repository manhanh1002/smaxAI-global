
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ytcupqvwvqcesqcmucvv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl0Y3VwcXZ3dnFjZXNxY211Y3Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4MjUwMTAsImV4cCI6MjA4NTQwMTAxMH0.F6WFTWJXV5wFMmydCyWUPGc3uKMCmf4iTGX2tEKhkoQ';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const merchantId = '404f603e-48dc-48e4-a1cc-28fc83b4b852'; // manhanh0210@gmail.com

async function verifyManualSend() {
  console.log('Verifying manual message sending...');

  // 1. Get a conversation
  const { data: conversations, error: convError } = await supabase
    .from('conversations')
    .select('*')
    .eq('merchant_id', merchantId)
    .limit(1);

  if (convError || !conversations || conversations.length === 0) {
    console.error('No conversations found for merchant:', convError);
    // Create one if none exists
    console.log('Creating a test conversation...');
    const { data: newConv, error: createError } = await supabase
        .from('conversations')
        .insert({
            merchant_id: merchantId,
            visitor_name: 'Manual Test Visitor',
            channel: 'website',
            status: 'active'
        })
        .select()
        .single();
    
    if (createError) {
        console.error('Failed to create conversation:', createError);
        return;
    }
    console.log('Created conversation:', newConv.id);
    await sendMessage(newConv.id);
  } else {
    console.log('Found conversation:', conversations[0].id);
    await sendMessage(conversations[0].id);
  }
}

async function sendMessage(conversationId: string) {
    const content = 'Manual test message from script ' + new Date().toISOString();
    const role = 'agent';

    console.log(`Sending message to ${conversationId}...`);

    const { data, error } = await supabase
        .from('messages')
        .insert({
            conversation_id: conversationId,
            role: role,
            content: content,
            merchant_id: merchantId
        })
        .select()
        .single();

    if (error) {
        console.error('Failed to send message:', error);
    } else {
        console.log('Message sent successfully:', data);
    }
}

verifyManualSend();
