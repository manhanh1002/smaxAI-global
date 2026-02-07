import React from 'react';
import { ConversationList } from '../components/ConversationsPanel/ConversationList';
import { ChatThread } from '../components/ConversationsPanel/ChatThread';
import { CustomerInfo } from '../components/ConversationsPanel/CustomerInfo';

export const Conversations: React.FC = () => {
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Left Panel: List */}
      <ConversationList />
      
      {/* Center Panel: Chat */}
      <ChatThread />
      
      {/* Right Panel: Info */}
      <CustomerInfo />
    </div>
  );
};
