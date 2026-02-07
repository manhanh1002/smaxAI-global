import React, { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, Smile } from 'lucide-react';
import { Button } from '../common/Button';

interface MessageInputProps {
  onSendMessage: (content: string) => void;
  disabled?: boolean;
}

export const MessageInput: React.FC<MessageInputProps> = ({ onSendMessage, disabled }) => {
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!message.trim() || disabled) return;
    onSendMessage(message);
    setMessage('');
    
    // Reset height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [message]);

  return (
    <div className="p-4 bg-white border-t border-gray-200">
      <form onSubmit={handleSubmit} className="relative">
        <div className="flex gap-2 items-end bg-white border border-gray-300 rounded-lg p-2 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent transition-all shadow-sm">
          <div className="flex gap-1 pb-1">
             <button type="button" className="p-1.5 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors">
               <Paperclip className="h-5 w-5" />
             </button>
             <button type="button" className="p-1.5 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors">
               <Smile className="h-5 w-5" />
             </button>
          </div>
          
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={disabled ? "This conversation is closed." : "Type a message..."}
            disabled={disabled}
            className="flex-1 max-h-32 min-h-[40px] resize-none border-0 focus:ring-0 text-sm py-2 px-1 bg-transparent placeholder-gray-400"
            rows={1}
          />
          
          <Button 
            type="submit" 
            disabled={!message.trim() || disabled}
            size="sm"
            className="mb-0.5 rounded-full h-8 w-8 p-0 flex items-center justify-center flex-shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <div className="text-xs text-gray-400 mt-2 flex justify-between px-1">
          <span>Enter to send, Shift + Enter for new line</span>
          {disabled && <span className="text-amber-600">Conversation is read-only</span>}
        </div>
      </form>
    </div>
  );
};
