import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, Minus } from 'lucide-react';
import { cn } from '../lib/utils';
import { supabase } from '../lib/supabase';
import { Message } from '../types';

interface EmbeddableWidgetProps {
  merchantId: string;
}

export const EmbeddableWidget: React.FC<EmbeddableWidgetProps> = ({ merchantId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [visitorId, setVisitorId] = useState<string | null>(null);
  const [customerId, setCustomerId] = useState<string | null>(localStorage.getItem('smax_customer_id'));
  const scrollRef = useRef<HTMLDivElement>(null);

  // Initialize visitor
  useEffect(() => {
    const vid = 'visitor_' + Math.random().toString(36).substr(2, 9);
    setVisitorId(vid);
  }, []);

  // Fetch or create conversation
  useEffect(() => {
    if (!visitorId || !merchantId) return;

    // No local storage persistence for conversation ID
    // We start fresh or rely on other mechanisms if implemented
  }, [visitorId, merchantId]);

  const fetchMessages = async (convId: string) => {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', convId)
      .order('created_at', { ascending: true });
    
    if (data) {
      const mappedMessages = data.map((m: any) => ({
        ...m,
        role: m.role || (m.sender === 'visitor' ? 'visitor' : (m.sender === 'ai' ? 'ai' : 'agent')),
        sender: m.role || m.sender // Backwards compatibility
      }));
      setMessages(mappedMessages as Message[]);
    }
  };

  const subscribeToMessages = (convId: string) => {
    // Realtime subscription
    const channel = supabase
      .channel(`widget-${convId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${convId}` },
        (payload) => {
          const newMsg = payload.new as any;
          const mappedMsg: Message = {
            ...newMsg,
            role: newMsg.role || (newMsg.sender === 'visitor' ? 'visitor' : (newMsg.sender === 'ai' ? 'ai' : 'agent')),
            sender: newMsg.role || newMsg.sender
          };
          
          setMessages((prev) => {
            // Check if we have a temp message with same content (simple dedup for optimistic updates)
            const tempMatchIndex = prev.findIndex(m => m.id.startsWith('temp-') && m.content === mappedMsg.content);
             
            if (tempMatchIndex !== -1) {
                 // Replace temp message with real one
                 const newMessages = [...prev];
                 newMessages[tempMatchIndex] = mappedMsg;
                 return newMessages;
            }

            if (prev.some(m => m.id === mappedMsg.id)) return prev;
            return [...prev, mappedMsg];
          });
        }
      )
      .subscribe();
    
    // Polling Fallback
    const pollInterval = setInterval(() => {
        fetchMessages(convId);
    }, 3000);

    // Cleanup function for useEffect (if we were returning this)
    // But here subscribeToMessages is called once. 
    // Ideally we should store the cleanup function in a ref or useEffect return.
    return () => {
        supabase.removeChannel(channel);
        clearInterval(pollInterval);
    };
  };

  // We need to store cleanup function
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
      if (conversationId) {
          if (cleanupRef.current) cleanupRef.current();
          cleanupRef.current = subscribeToMessages(conversationId);
      }
      return () => {
          if (cleanupRef.current) cleanupRef.current();
      };
  }, [conversationId]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputValue.trim()) return;

    const content = inputValue;
    setInputValue('');

    let currentConvId = conversationId;

    if (!currentConvId) {
      // Create new conversation
      const { data: conv, error } = await supabase
        .from('conversations')
        .insert({
          merchant_id: merchantId,
          visitor_name: 'Visitor ' + (visitorId?.substr(0, 4) || 'Guest'),
          channel: 'website',
          status: 'active',
          last_message: content,
          unread_count: 1,
          last_active: new Date().toISOString()
        })
        .select()
        .single();

      if (error || !conv) {
        console.error('Failed to create conversation', error);
        return;
      }

      currentConvId = conv.id;
      setConversationId(currentConvId);
      // subscribeToMessages(currentConvId); // Handled by useEffect
    } else {
        // Update existing conversation with last message
        await supabase.from('conversations').update({
            last_message: content,
            last_active: new Date().toISOString(),
            unread_count: 1 // Incrementing logic would be better but simple set to 1 for now or rely on backend trigger
        }).eq('id', currentConvId);
    }

    // Send message
    const newMessage = {
      id: 'temp-' + Date.now(),
      conversation_id: currentConvId,
      role: 'visitor',
      sender: 'visitor',
      content,
      created_at: new Date().toISOString()
    } as Message;

    // Optimistic update
    setMessages((prev) => [...prev, newMessage]);

    // 1. Insert User Message
    const msgPayload: any = {
      conversation_id: currentConvId,
      role: 'visitor', 
      content,
    };
    // Only add merchant_id if it's a valid non-empty string, otherwise let DB handle it (nullable)
    if (merchantId && merchantId.trim() !== '') {
        msgPayload.merchant_id = merchantId;
    }

    const { error: msgError } = await supabase.from('messages').insert(msgPayload);

    if (msgError) {
      console.error('Failed to insert message:', msgError);
      // Optional: Show error in UI
      setMessages(prev => [...prev, {
          id: 'error-' + Date.now(),
          conversation_id: currentConvId || '',
          role: 'ai',
          content: 'Error sending message. Please try again.',
          created_at: new Date().toISOString()
      } as Message]);
    }

    // 2. Call Edge Function (Fire and Forget or Await)
    // We support both Supabase Edge Functions (standard) and Custom Coolify URL (self-hosted)
    const customEdgeUrl = import.meta.env.VITE_EDGE_FUNCTION_URL;

    if (customEdgeUrl) {
        // Self-Hosted / Coolify Mode
        fetch(customEdgeUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
            },
            body: JSON.stringify({
                conversation_id: currentConvId,
                merchant_id: merchantId,
                message_content: content
            })
        }).then(async (res) => {
            if (!res.ok) console.error('Custom Edge Error:', await res.text());
            else console.log('Custom Edge Triggered:', await res.json());
        }).catch(err => console.error('Custom Edge Network Error:', err));
    } else {
        // Standard Supabase Cloud Mode - use direct fetch with Authorization to avoid 401s
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
        fetch(`${supabaseUrl}/functions/v1/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${anonKey}`
            },
            body: JSON.stringify({
                conversation_id: currentConvId,
                merchant_id: merchantId,
                message_content: content,
                customer_id: customerId
            })
        }).then(async (res) => {
            if (!res.ok) {
                console.error('Edge Function Error:', await res.text());
            } else {
                const data = await res.json();
                console.log('Edge Function Triggered:', data);
                if (data && data.customer_id) {
                    setCustomerId(data.customer_id);
                    localStorage.setItem('smax_customer_id', data.customer_id);
                }
            }
        }).catch(err => console.error('Edge Function Network Error:', err));
    }
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  return (
    <div className="fixed bottom-4 right-4 z-50 font-sans">
      {isOpen && (
        <div className="mb-4 w-[350px] h-[500px] bg-white rounded-2xl shadow-2xl flex flex-col border border-gray-200 overflow-hidden animate-in slide-in-from-bottom-10 fade-in duration-200">
          {/* Header */}
          <div className="bg-primary-900 p-4 flex justify-between items-center text-white rounded-t-2xl">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 bg-white/20 rounded-full flex items-center justify-center">
                <MessageSquare className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm">Chat Support</h3>
                <p className="text-xs text-primary-200">Typically replies instantly</p>
              </div>
            </div>
            <div className="flex gap-1">
              <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-white/20 rounded">
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50" ref={scrollRef}>
            {messages.length === 0 && (
              <div className="text-center text-gray-500 text-sm mt-8">
                <p>👋 Hi! How can we help you today?</p>
              </div>
            )}
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  "flex flex-col max-w-[85%]",
                  msg.role === 'visitor' ? "ml-auto items-end" : "mr-auto items-start"
                )}
              >
                <div
                  className={cn(
                    "px-4 py-2 rounded-2xl text-sm",
                    msg.role === 'visitor'
                      ? "bg-primary-600 text-white rounded-tr-none"
                      : "bg-white text-gray-800 border border-gray-200 rounded-tl-none shadow-sm"
                  )}
                >
                  {msg.content}
                </div>
                <span className="text-[10px] text-gray-400 mt-1 px-1">
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>

          {/* Input */}
          <div className="p-3 bg-white border-t border-gray-100 rounded-b-2xl">
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 bg-gray-100 border-0 rounded-full px-4 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all outline-none"
              />
              <button
                type="submit"
                disabled={!inputValue.trim()}
                className="h-9 w-9 bg-primary-600 text-white rounded-full flex items-center justify-center hover:bg-primary-700 disabled:opacity-50 disabled:hover:bg-primary-600 transition-colors"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      )}

      {!isOpen && (
        <button
            onClick={() => setIsOpen(true)}
            className="h-14 w-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-105 bg-primary-600 text-white hover:bg-primary-700"
        >
            <MessageSquare className="h-6 w-6" />
        </button>
      )}

      {/* Floating Close Button (Only when open) - Removed as icon is now in header */}
      {/* {isOpen && (
        <button
            onClick={() => setIsOpen(false)}
            className="absolute -bottom-0 -right-0 h-14 w-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-105 bg-gray-900 text-white hover:bg-gray-800 z-50"
        >
            <X className="h-6 w-6" />
        </button>
      )} */}
    </div>
  );
};
