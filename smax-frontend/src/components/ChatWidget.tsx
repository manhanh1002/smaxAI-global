import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, Minimize2, Loader2 } from 'lucide-react';
import { Button } from './common/Button';
import { useStore } from '../lib/store';
import { supabase } from '../lib/supabase';

interface Message {
  id: string;
  role: 'user' | 'ai';
  content: string;
  created_at: string;
}

export const ChatWidget: React.FC = () => {
  const { isChatWidgetOpen, toggleChatWidget } = useStore();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'ai',
      content: 'Hello! I am your SmaxAI System Assistant. How can I help you configure or use the platform today?',
      created_at: new Date().toISOString()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isChatWidgetOpen) {
      scrollToBottom();
    }
  }, [messages, isChatWidgetOpen]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputValue.trim() || isTyping) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue.trim(),
      created_at: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsTyping(true);

    try {
      // Get the anon key from the supabase client instance
      const supabaseKey = (supabase as any).supabaseKey;
      
      const { data, error } = await supabase.functions.invoke('merchant-ai', {
        body: {
          message: userMsg.content,
          history: messages.map(m => ({ role: m.role, content: m.content }))
        },
        headers: {
          // Force use of Anon key to avoid 401 issues with expired user sessions
          Authorization: `Bearer ${supabaseKey}`
        }
      });

      if (error) throw error;

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        content: data.reply,
        created_at: new Date().toISOString()
      };

      setMessages(prev => [...prev, aiMsg]);
    } catch (err) {
      console.error('Failed to get AI response:', err);
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        content: 'Sorry, I encountered an error while processing your request. Please try again.',
        created_at: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  if (!isChatWidgetOpen) {
    return (
      <button
        onClick={toggleChatWidget}
        className="fixed bottom-6 right-6 h-14 w-14 bg-primary-900 rounded-full shadow-lg flex items-center justify-center text-white hover:bg-primary-800 transition-all hover:scale-105 z-50 cursor-pointer"
        aria-label="Open SmaxAI Assistant"
      >
        <MessageCircle className="h-6 w-6" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-96 bg-white rounded-xl shadow-2xl flex flex-col z-50 max-h-[600px] border border-gray-200">
      {/* Header */}
      <div className="p-4 bg-primary-900 text-white rounded-t-xl flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 bg-white rounded-full flex items-center justify-center p-1">
            <img src="/logo.png" alt="SmaxAI" className="h-full w-full object-contain" />
          </div>
          <div>
            <h3 className="font-semibold text-white">SmaxAI Assistant</h3>
            <p className="text-xs text-primary-200">System Support</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button 
            onClick={toggleChatWidget}
            className="p-1 hover:bg-white/20 rounded transition-colors"
          >
            <Minimize2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 h-96 bg-gray-50">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl p-3 text-sm ${
                msg.role === 'user'
                  ? 'bg-primary-600 text-white rounded-br-none'
                  : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none shadow-sm'
              }`}
            >
              <div className="whitespace-pre-wrap">{msg.content}</div>
              <div className={`text-[10px] mt-1 ${msg.role === 'user' ? 'text-primary-100' : 'text-gray-400'}`}>
                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-none p-3 shadow-sm">
              <Loader2 className="h-4 w-4 animate-spin text-primary-600" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-100 bg-white rounded-b-xl">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask about system features..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm bg-gray-50"
            disabled={isTyping}
          />
          <Button 
            type="submit" 
            disabled={!inputValue.trim() || isTyping}
            size="sm"
            className="h-9 w-9 p-0 rounded-full flex items-center justify-center bg-primary-600 hover:bg-primary-700"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  );
};
