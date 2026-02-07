import React, { useEffect, useRef } from 'react';
import { useStore } from '../../lib/store';
import { MessageInput } from './MessageInput';
import { cn } from '../../lib/utils';
import { Bot, User, CheckCheck, MoreHorizontal, AlertTriangle } from 'lucide-react';
import { Button } from '../common';

export const ChatThread: React.FC = () => {
  const { 
    selectedConversationId, 
    conversations, 
    conversationMessages, 
    fetchMessages,
    subscribeToMessages,
    sendMessage
  } = useStore();
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const conversation = conversations.find(c => c.id === selectedConversationId);

  // Load messages and subscribe
  useEffect(() => {
    if (selectedConversationId) {
      fetchMessages(selectedConversationId);
      subscribeToMessages(selectedConversationId);
    }
  }, [selectedConversationId, fetchMessages, subscribeToMessages]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [conversationMessages, selectedConversationId]);

  const handleSendMessage = async (content: string) => {
    if (!selectedConversationId) return;
    await sendMessage(selectedConversationId, content, 'agent');
  };

  if (!selectedConversationId || !conversation) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50 flex-col gap-4 text-center p-8">
        <div className="h-24 w-24 bg-gray-100 rounded-full flex items-center justify-center">
          <Bot className="h-12 w-12 text-gray-300" />
        </div>
        <div>
          <h3 className="text-xl font-semibold text-gray-900">Select a conversation</h3>
          <p className="text-gray-500 max-w-sm mt-2">
            Choose a conversation from the list to view details, chat history, and manage AI actions.
          </p>
        </div>
      </div>
    );
  }

  const messages = conversationMessages[selectedConversationId] || [];

  return (
    <div className="flex-1 flex flex-col h-full bg-white relative">
      {/* Header */}
      <div className="h-16 border-b border-gray-200 flex items-center justify-between px-6 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center text-blue-600 font-bold border-2 border-white shadow-sm">
            {conversation.visitor_name.charAt(0)}
          </div>
          <div>
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              {conversation.visitor_name}
              {conversation.status === 'escalated' && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                  <AlertTriangle className="h-3 w-3 mr-1" /> Escalated
                </span>
              )}
            </h3>
            <p className="text-xs text-gray-500 flex items-center gap-1">
              via <span className="capitalize">{conversation.channel}</span> • {conversation.intent}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
           <Button variant="outline" size="sm" className="text-gray-600">
             Resolve
           </Button>
           <button className="p-2 hover:bg-gray-100 rounded text-gray-400">
             <MoreHorizontal className="h-5 w-5" />
           </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50/50" ref={scrollRef}>
        <div className="text-center text-xs text-gray-400 my-4">
          <span>Today, {new Date().toLocaleDateString()}</span>
        </div>

        {messages.map((msg, index) => {
          const isMe = msg.role === 'agent';
          const isAI = msg.role === 'ai';
          const isVisitor = msg.role === 'visitor';
          
          return (
            <div
              key={msg.id}
              className={cn(
                "flex gap-3 max-w-2xl group",
                (isMe || isAI) ? "ml-auto flex-row-reverse" : ""
              )}
            >
              <div className={cn(
                "h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs shadow-sm border border-white",
                isVisitor ? "bg-white text-gray-600" : 
                isAI ? "bg-green-100 text-green-600" : "bg-blue-600 text-white"
              )}>
                {isVisitor ? <User className="h-4 w-4" /> : 
                 isAI ? <Bot className="h-4 w-4" /> : "Me"}
              </div>
              
              <div className={cn(
                "flex flex-col gap-1 min-w-[120px]",
                (isMe || isAI) ? "items-end" : "items-start"
              )}>
                <div className="flex items-baseline gap-2">
                  <span className="text-xs font-medium text-gray-600">
                    {isVisitor ? conversation.visitor_name : isAI ? 'Smax AI' : 'You'}
                  </span>
                  <span className="text-[10px] text-gray-400">
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                
                <div className={cn(
                  "px-4 py-2.5 rounded-2xl text-sm shadow-sm",
                  isVisitor ? "bg-white text-gray-800 border border-gray-100 rounded-tl-none" : 
                  isAI ? "bg-green-50 text-gray-800 border border-green-100 rounded-tr-none" :
                  "bg-blue-600 text-white rounded-tr-none"
                )}>
                  {msg.content}
                </div>
                
                {msg.suggestedActions && (
                  <div className="flex flex-wrap gap-2 mt-1 justify-end">
                    {msg.suggestedActions.map((action, i) => (
                      <span key={i} className="text-xs bg-white border border-gray-200 px-2 py-1 rounded-md text-gray-500">
                        {action}
                      </span>
                    ))}
                  </div>
                )}
                
                {/* Status for sent messages */}
                {(isMe || isAI) && (
                   <div className="text-[10px] text-gray-400 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                     <CheckCheck className="h-3 w-3 text-blue-500" /> Seen
                   </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Input */}
      <MessageInput 
        onSendMessage={handleSendMessage} 
        disabled={conversation.status === 'resolved'}
      />
    </div>
  );
};
