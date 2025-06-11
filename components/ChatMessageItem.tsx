import React from 'react';
import { ChatMessage, MessageSenderType, AiChatMessage } from '../types'; // Use ChatMessage for general, AiChatMessage for AI-specific
import { UserIcon, BotIcon } from './IconComponents'; // SparklesIcon might be for system/announcements

// Helper to determine if the message is of type AiChatMessage
function isAiChatMessage(message: ChatMessage | AiChatMessage): message is AiChatMessage {
  return 'sender' in message && (message.sender === 'user' || message.sender === 'bot' || message.sender === 'system');
}


interface ChatMessageItemProps {
  message: ChatMessage | AiChatMessage; // Can accept both types
  currentUserId?: string; // Needed to distinguish 'USER' from 'OTHER_USER' in ChatMessage
}

const ChatMessageItem: React.FC<ChatMessageItemProps> = ({ message, currentUserId }) => {
  const textContent = message.text;

  // Basic markdown parsing for bold and lists
  const formatText = (text: string): React.ReactNode => {
    let formattedText = text;
    formattedText = formattedText.replace(/\*\*(.*?)\*\*|__(.*?)__/g, '<strong>$1$2</strong>');
    formattedText = formattedText.replace(/\*(.*?)\*|_(.*?)_/g, '<em>$1$2</em>');
    
    const lines = formattedText.split('\n').map((line, index) => {
      if (line.match(/^(\*|-)\s/)) {
        return <li key={index} dangerouslySetInnerHTML={{ __html: line.replace(/^(\*|-)\s/, '') }} className="ml-4" />;
      }
      // Allow HTML for flexibility, ensure sanitization if user input can contain HTML
      return <span key={index} dangerouslySetInnerHTML={{ __html: line }} />;
    });
    
    const groupedLines: React.ReactNode[] = [];
    let currentListItems: React.ReactNode[] = [];

    lines.forEach((line, index) => {
        if (React.isValidElement(line) && line.type === 'li') {
            currentListItems.push(line);
        } else {
            if (currentListItems.length > 0) {
                groupedLines.push(<ul key={`ul-${index-currentListItems.length}`} className="list-disc pl-5 space-y-1 my-1">{currentListItems}</ul>);
                currentListItems = [];
            }
            groupedLines.push(line);
            if (index < lines.length -1) { 
                const nextLine = lines[index+1];
                if (!(React.isValidElement(nextLine) && nextLine.type === 'li')) {
                     groupedLines.push(<br key={`br-${index}`} />);
                }
            }
        }
    });
    if (currentListItems.length > 0) {
        groupedLines.push(<ul key={`ul-final`} className="list-disc pl-5 space-y-1 my-1">{currentListItems}</ul>);
    }
    return groupedLines;
  };

  let isSystemMsg: boolean;
  let isBotMsg: boolean;
  let isUserMsg: boolean; // Represents the current logged-in user
  // let isOtherUserMsg: boolean; // Represents another human user in the chat
  let displayName: string | undefined;

  if (isAiChatMessage(message)) {
    isSystemMsg = message.sender === 'system';
    isBotMsg = message.sender === 'bot';
    isUserMsg = message.sender === 'user'; // In AI chat, 'user' is always the current user
    // isOtherUserMsg = false; // No 'other_user' in AiChatMessage
    if (isBotMsg) {
      displayName = "CollegeConnect AI";
    }
  } else {
    // General ChatMessage
    isSystemMsg = message.senderType === MessageSenderType.SYSTEM;
    isBotMsg = message.senderType === MessageSenderType.BOT;
    isUserMsg = message.senderType === MessageSenderType.USER && message.senderId === currentUserId;
    // isOtherUserMsg = message.senderType === MessageSenderType.OTHER_USER;
    displayName = message.senderName;
  }


  if (isSystemMsg) {
    return (
      <div className="text-center my-2.5">
        <p className="text-xs text-gray-500 italic px-3 py-1.5 bg-gray-200 rounded-lg inline-block shadow-sm">
          {textContent}
        </p>
      </div>
    );
  }

  const alignment = isUserMsg ? 'justify-end' : 'justify-start';
  const bubbleColor = isUserMsg 
    ? 'bg-blue-600 text-white rounded-br-none' 
    : (isBotMsg ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-bl-none' : 'bg-white text-gray-800 rounded-bl-none'); // Default for other users
  
  const iconToShow = isUserMsg 
    ? <UserIcon className="w-8 h-8 text-blue-600" /> 
    : (isBotMsg 
        ? <BotIcon className="w-8 h-8 text-purple-500" /> 
        : <UserIcon className="w-8 h-8 text-gray-500" /> // Icon for other users
      );

  const nameColor = isUserMsg 
    ? 'text-blue-200' 
    : (isBotMsg ? 'text-indigo-200' : 'text-gray-500 font-medium'); // Default for other users

  return (
    <div className={`flex ${alignment} mb-3.5 group`}>
      <div className={`flex items-end max-w-sm sm:max-w-md md:max-w-lg lg:max-w-xl ${isUserMsg ? 'flex-row-reverse' : 'flex-row'}`}>
        <div className={`self-start flex-shrink-0 ${isUserMsg ? 'ml-2' : 'mr-2'} opacity-80 group-hover:opacity-100 transition-opacity`}>
          {iconToShow}
        </div>
        
        <div
          className={`px-4 py-3 rounded-xl shadow-lg break-words ${bubbleColor} transition-all duration-150 ease-in-out transform group-hover:scale-[1.01]`}
          aria-live="polite"
        >
          {!isUserMsg && displayName && (
            <p className={`text-xs mb-1 font-semibold ${nameColor}`}>{displayName}</p>
          )}
          <div className="prose prose-sm max-w-none text-inherit leading-relaxed">
            {formatText(textContent)}
            {message.isStreaming && <span className="inline-block w-1 h-4 bg-current animate-pulse ml-1 opacity-70"></span>}
          </div>
          <p className={`text-xs mt-1.5 ${isUserMsg ? 'text-blue-200 text-right' : 'text-gray-400 text-left'} ${isBotMsg ? 'text-indigo-200' : ''}`}>
            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ChatMessageItem;