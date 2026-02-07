import React, { useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useStore } from '../lib/store';
import { generateAIResponse } from '../lib/ai-engine';
import { api } from '../lib/api';
import { Message } from '../types';

export const AIResponder: React.FC = () => {
  const session = useStore((state) => state.session);
  const aiConfig = useStore((state) => state.aiConfig);
  const fetchAIConfig = useStore((state) => state.fetchAIConfig);

  const processingRefs = React.useRef(new Set<string>());

  useEffect(() => {
    // We only want ONE responder running, typically the merchant's dashboard.
    // In a real app, this is an Edge Function.
    // Here we listen to ALL messages for this merchant's conversations.
    
    if (!session?.merchant.id) return;

    // Ensure we have the latest config
    fetchAIConfig();

    const processMessage = async (newMessage: any) => {
          const msgId = newMessage.id;
          if (processingRefs.current.has(msgId)) {
             console.log('AI Responder: Already processing message', msgId);
             return;
          }

          // Only respond to visitor messages
          // Use 'role' as per schema, fallback to 'sender' if role is missing
          const role = newMessage.role || (newMessage as any).sender;
          
          if (role !== 'visitor') return;

          console.log('AI Responder: New visitor message detected', newMessage.content);

          processingRefs.current.add(msgId);

          try {
            // Fetch Conversation to verify merchant ownership (security)
            const { data: conversation } = await supabase
                .from('conversations')
                .select('*')
                .eq('id', newMessage.conversation_id)
                .single();

            if (!conversation || conversation.merchant_id !== session.merchant.id) {
                console.log('AI Responder: Conversation not found or not owned by merchant');
                return;
            }

            // Check if we ALREADY replied to this message (to avoid double reply from Poller + Realtime)
            // We check if there is a newer message from 'ai'
            const { data: newerMessages } = await supabase
                .from('messages')
                .select('id')
                .eq('conversation_id', newMessage.conversation_id)
                .gt('created_at', newMessage.created_at)
                .eq('sender', 'ai') // Check if AI replied
                .limit(1);
            
            if (newerMessages && newerMessages.length > 0) {
                console.log('AI Responder: Already replied to this message. Skipping.');
                return;
            }

            console.log('AI Responder: Processing message for conversation', conversation.id);

            // Fetch History
            const { data: historyData } = await supabase
                .from('messages')
                .select('*')
                .eq('conversation_id', newMessage.conversation_id)
                .order('created_at', { ascending: true })
                .limit(20);

            // Normalize history
            const history: Message[] = (historyData || []).map((m: any) => ({
                ...m,
                role: m.role || (m.sender === 'visitor' ? 'visitor' : (m.sender === 'ai' ? 'ai' : 'agent')),
                sender: m.sender 
            }));

            // Fetch Customer Context
            let customer = null;
            const query = conversation.visitor_email || conversation.visitor_phone || conversation.visitor_name;
            if (query) {
                try {
                    customer = await api.searchCustomer(session.merchant.id, query);
                } catch (e) {
                    console.error("Error fetching customer for AI context:", e);
                }
            }

            // Generate Response
            const response = await generateAIResponse(
                newMessage.content,
                history,
                aiConfig,
                session.merchant,
                newMessage.conversation_id,
                customer
            );

            // Insert AI Reply
            const { error: insertError } = await supabase.from('messages').insert({
                conversation_id: newMessage.conversation_id,
                sender: 'ai', 
                content: response.reply
            });

            if (insertError) {
                console.error('AI Responder: Error inserting reply', insertError);
            } else {
                console.log('AI Responder: Reply sent', response.reply);
            }

            // Log Actions to ai_task_logs
            if (response.actions.length > 0) {
                console.log('AI Responder: Logging actions', response.actions);
                for (const action of response.actions) {
                    await supabase.from('ai_task_logs').insert({
                        conversation_id: newMessage.conversation_id,
                        merchant_id: session.merchant.id,
                        task_type: action.type,
                        task_title: action.title,
                        task_details: action.details,
                        task_status: action.status
                    });
                }
            }

            // Update Conversation
            await supabase
                .from('conversations')
                .update({
                    last_message: response.reply,
                    unread_count: 0,
                    last_active: new Date().toISOString()
                })
                .eq('id', newMessage.conversation_id);

          } catch (error) {
            console.error('AI Responder: Error generating response', error);
          } finally {
             // Keep in processing set for a bit longer to prevent race conditions from lagging pollers
             setTimeout(() => {
                 processingRefs.current.delete(msgId);
             }, 5000);
          }
    };

    // --- Polling Fallback (in case Realtime fails) ---
    const pollInterval = setInterval(async () => {
      // Fetch active conversations
      const { data: conversations } = await supabase
        .from('conversations')
        .select('id')
        .eq('merchant_id', session.merchant.id)
        .eq('status', 'active');
      
      if (!conversations) return;

      for (const conv of conversations) {
        // Get last message
        const { data: messages } = await supabase
          .from('messages')
          .select('*')
          .eq('conversation_id', conv.id)
          .order('created_at', { ascending: false })
          .limit(1);
        
        if (messages && messages.length > 0) {
          const lastMsg = messages[0];
          const sender = lastMsg.sender || (lastMsg as any).role; // Handle schema diffs
          
          // If last message is from visitor and created recently (within 5 mins), respond
          const msgTime = new Date(lastMsg.created_at).getTime();
          const now = new Date().getTime();
          const isRecent = Math.abs(now - msgTime) < 5 * 60 * 1000; // Use Math.abs for safety

          if (sender === 'visitor' && isRecent) {
             processMessage(lastMsg);
          }
        }
      }
    }, 3000); // Check every 3 seconds

    const channel = supabase
      .channel('ai-responder')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        async (payload) => {
          await processMessage(payload.new);
        }
      )
      .subscribe();
    
    return () => {
      clearInterval(pollInterval);
      supabase.removeChannel(channel);
    };
  }, [session?.merchant.id, aiConfig, fetchAIConfig]);

  return null; // Invisible component
};
