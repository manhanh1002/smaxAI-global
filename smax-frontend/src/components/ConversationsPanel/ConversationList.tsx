import React, { useState, useEffect } from 'react';
import { useStore } from '../../lib/store';
import { cn } from '../../lib/utils';
import { Search, Plus } from 'lucide-react';

export const ConversationList: React.FC = () => {
  const { 
    conversations, 
    fetchConversations,
    subscribeToConversations,
    selectedConversationId, 
    selectConversation,
    session 
  } = useStore();
  
  const [filter, setFilter] = useState<'all' | 'active' | 'resolved' | 'escalated'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Initial load and subscription
  useEffect(() => {
    if (session?.merchant?.id) {
      fetchConversations();
      subscribeToConversations();
    }
  }, [fetchConversations, subscribeToConversations, session?.merchant?.id]);

  useEffect(() => {
    if (!selectedConversationId && conversations.length > 0) {
      selectConversation(conversations[0].id);
    }
  }, [conversations, selectedConversationId, selectConversation]);

  const filteredConversations = conversations
    .filter(c => filter === 'all' || c.status === filter)
    .filter(c => 
      c.visitor_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      c.last_message?.toLowerCase().includes(searchTerm.toLowerCase())
    );

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 1000 * 60 * 60 * 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString();
  };

  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-200 w-80 flex-shrink-0">
      <div className="p-4 border-b border-gray-200 space-y-3">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900">Conversations</h2>
          <button className="text-blue-600 hover:bg-blue-50 p-1 rounded">
            <Plus className="h-5 w-5" />
          </button>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {['all', 'active', 'resolved', 'escalated'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f as any)}
              className={cn(
                'px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap capitalize transition-colors',
                filter === f 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {filteredConversations.map((conv) => (
          <button
            key={conv.id}
            onClick={() => selectConversation(conv.id)}
            className={cn(
              'w-full text-left p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors relative',
              selectedConversationId === conv.id && 'bg-blue-50 hover:bg-blue-50 border-l-4 border-l-blue-600'
            )}
          >
            <div className="flex justify-between items-start mb-1">
              <span className={cn(
                "font-medium truncate",
                conv.unread_count && conv.unread_count > 0 ? "text-gray-900 font-bold" : "text-gray-700"
              )}>
                {conv.visitor_name}
              </span>
              <span className="text-xs text-gray-400 flex-shrink-0 ml-2">
                {conv.last_active && formatTime(conv.last_active)}
              </span>
            </div>
            
            <p className={cn(
              "text-sm truncate mb-2",
              conv.unread_count && conv.unread_count > 0 ? "text-gray-900 font-medium" : "text-gray-500"
            )}>
              {conv.last_message || 'No messages yet'}
            </p>

            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                 <span className={cn(
                   "text-[10px] px-1.5 py-0.5 rounded capitalize border",
                   conv.channel === 'website' ? "bg-blue-50 text-blue-600 border-blue-100" :
                   conv.channel === 'facebook' ? "bg-indigo-50 text-indigo-600 border-indigo-100" :
                   "bg-gray-50 text-gray-600 border-gray-100"
                 )}>
                   {conv.channel}
                 </span>
                 <span className={cn(
                   "text-[10px] px-1.5 py-0.5 rounded capitalize",
                   conv.intent === 'booking' ? "bg-purple-100 text-purple-700" :
                   conv.intent === 'complaint' ? "bg-red-100 text-red-700" :
                   "bg-gray-100 text-gray-600"
                 )}>
                   {conv.intent}
                 </span>
              </div>
              
              {conv.unread_count && conv.unread_count > 0 ? (
                <span className="h-5 w-5 bg-blue-600 text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {conv.unread_count}
                </span>
              ) : null}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
