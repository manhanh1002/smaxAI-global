
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ytcupqvwvqcesqcmucvv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl0Y3VwcXZ3dnFjZXNxY211Y3Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4MjUwMTAsImV4cCI6MjA4NTQwMTAxMH0.F6WFTWJXV5wFMmydCyWUPGc3uKMCmf4iTGX2tEKhkoQ';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const merchantId = '404f603e-48dc-48e4-a1cc-28fc83b4b852'; // manhanh0210@gmail.com

async function verifyVisitorSend() {
  console.log('Verifying VISITOR message sending...');

  // 1. Create a new conversation (simulate new visitor)
  const visitorId = 'visitor_' + Math.random().toString(36).substr(2, 9);
  
  console.log('Creating conversation for visitor:', visitorId);
  
  const { data: conv, error: createError } = await supabase
    .from('conversations')
    .insert({
      merchant_id: merchantId,
      visitor_name: 'Visitor ' + visitorId,
      channel: 'website',
      status: 'active',
      last_message: 'Init',
      unread_count: 0,
      last_active: new Date().toISOString()
    })
    .select()
    .single();

  if (createError) {
    console.error('Failed to create conversation:', createError);
    return;
  }
  
  console.log('Created conversation:', conv.id);

  // 2. Send Message as Visitor
  const content = 'Hello from verification script (Visitor Role)';
  
  console.log(`Sending message to ${conv.id}...`);

  const { data, error } = await supabase
    .from('messages')
    .insert({
      conversation_id: conv.id,
      role: 'visitor', 
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

verifyVisitorSend();
