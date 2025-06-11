
import React, { useState, useRef, useEffect } from 'react';
import { SendIcon } from './IconComponents';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  placeholder?: string;
  onTyping?: (isTyping: boolean) => void; // New prop
}

const ChatInput: React.FC<ChatInputProps> = ({ 
  onSendMessage, 
  isLoading, 
  placeholder = "Type your message...",
  onTyping 
}) => {
  const [inputValue, setInputValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedMessage = inputValue.trim();
    if (trimmedMessage && !isLoading) {
      onSendMessage(trimmedMessage);
      setInputValue('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'; // Reset height
      }
      if (onTyping) onTyping(false); // Indicate not typing after send
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent);
    }
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }

    if (onTyping) {
      if (inputValue.trim().length > 0) {
        onTyping(true); // User is typing
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
          onTyping(false); // User stopped typing (after delay)
        }, 1500); // 1.5 seconds delay
      } else {
        onTyping(false); // User cleared input or it's empty
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      }
    }
    
    return () => { // Cleanup timeout on unmount or inputValue change
        if(typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    }

  }, [inputValue, onTyping]);


  return (
    <form onSubmit={handleSubmit} className="flex items-end space-x-2 sm:space-x-3 p-1">
      <textarea
        ref={textareaRef}
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyPress={handleKeyPress}
        placeholder={placeholder}
        className="flex-grow p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none min-h-[48px] max-h-40 leading-tight text-sm sm:text-base bg-white shadow-sm transition-shadow focus:shadow-md"
        rows={1}
        disabled={isLoading}
        style={{ scrollbarWidth: 'thin', scrollbarColor: '#a0aec0 #f7fafc' }}
        aria-label="Chat message input"
      />
      <button
        type="submit"
        disabled={isLoading || !inputValue.trim()}
        className="bg-blue-600 text-white p-3 rounded-xl hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-150 ease-in-out transform hover:scale-105 active:scale-95 shadow-md hover:shadow-lg"
        aria-label="Send message"
      >
        <SendIcon className="w-5 h-5 sm:w-6 sm:h-6" />
      </button>
    </form>
  );
};

export default ChatInput;
