
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ytcupqvwvqcesqcmucvv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl0Y3VwcXZ3dnFjZXNxY211Y3Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4MjUwMTAsImV4cCI6MjA4NTQwMTAxMH0.F6WFTWJXV5wFMmydCyWUPGc3uKMCmf4iTGX2tEKhkoQ';

const supabase = createClient(supabaseUrl, supabaseAnonKey);
const merchantId = '404f603e-48dc-48e4-a1cc-28fc83b4b852';

async function reproduceIssue() {
    console.log('--- Starting Reproduction Script ---');

    // 1. Create Conversation
    const visitorId = 'visitor_' + Math.random().toString(36).substr(2, 9);
    const content = 'hello from reproduction script ' + Date.now();
    
    console.log(`Creating conversation for ${visitorId} with message "${content}"`);

    const { data: conv, error: convError } = await supabase
        .from('conversations')
        .insert({
          merchant_id: merchantId,
          visitor_name: 'Visitor ' + visitorId,
          channel: 'website',
          status: 'active',
          last_message: content,
          unread_count: 1,
          last_active: new Date().toISOString()
        })
        .select()
        .single();

    if (convError || !conv) {
        console.error('Failed to create conversation:', convError);
        return;
    }
    console.log('Conversation created:', conv.id);

    // 2. Insert Message (Mimicking EmbeddableWidget)
    const { data: msgData, error: msgError } = await supabase.from('messages').insert({
        conversation_id: conv.id,
        role: 'visitor', 
        content: content,
        merchant_id: merchantId
    }).select();

    if (msgError) {
        console.error('Failed to insert message:', msgError);
    } else {
        console.log('Message inserted successfully:', msgData);
    }

    // 3. Verify existence
    const { data: checkData, error: checkError } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conv.id);
    
    if (checkError) {
        console.error('Failed to select messages:', checkError);
    } else {
        console.log('Messages found in DB:', checkData?.length);
        if (checkData && checkData.length > 0) {
            console.log('Message content:', checkData[0].content);
        } else {
            console.log('NO MESSAGES FOUND!');
        }
    }
}

reproduceIssue();
