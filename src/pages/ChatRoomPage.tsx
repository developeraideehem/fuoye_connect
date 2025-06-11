
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ChatMessage, MessageSenderType } from '../../types';
import ChatMessageItem from '../../components/ChatMessageItem';
import ChatInput from '../../components/ChatInput';
import LoadingSpinner from '../../components/LoadingSpinner';
import { ArrowLeftIcon } from '../../components/IconComponents';
import { io, Socket } from 'socket.io-client';

// For Vite projects, environment variables are accessed via import.meta.env.
// Ensure you have a vite-env.d.ts file for proper TypeScript support.
const BACKEND_URL = (import.meta as any).env.VITE_BACKEND_URL || 'http://localhost:3001';

// Type for messages coming from backend (raw structure)
interface BackendReceivedMessageData {
  _id: string;
  id?: string; // Sometimes might be present, _id is primary
  chatRoomIdString: string;
  text: string;
  sender: { _id: string; fullName: string; /* other user fields if needed */ };
  senderType?: MessageSenderType; // Optional if backend always sets it or if it can be derived
  createdAt: string; // Mongoose timestamp (string from JSON)
  timestamp?: string | Date; // Fallback or alternative timestamp
  isStreaming?: boolean;
}


const ChatRoomPage: React.FC = () => {
  const { roomId: roomIdStringFromParams } = useParams<{ roomId: string }>(); // This is roomIdString
  const location = useLocation();
  const navigate = useNavigate();
  const { user, token } = useAuth(); // user is BackendUser type from AuthContext
  
  const roomNameFromState = location.state?.roomName;
  const passedRoomIdString = location.state?.roomIdString || roomIdStringFromParams;

  const defaultRoomName = passedRoomIdString 
    ? `Chat: ${passedRoomIdString.replace(/dept_|faculty_|_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}` 
    : 'Chat Room';
  const roomName = roomNameFromState || defaultRoomName;

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState<boolean>(false);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);

  const transformBackendMessage = (msg: BackendReceivedMessageData): ChatMessage => ({
    _id: msg._id, // Use _id from backend
    id: msg._id || msg.id || crypto.randomUUID(), // Ensure id for React keys
    chatRoomId: msg.chatRoomIdString, // Map from backend's chatRoomIdString
    text: msg.text,
    senderType: msg.sender._id === user?._id ? MessageSenderType.USER : (msg.senderType || MessageSenderType.OTHER_USER),
    senderId: msg.sender._id,
    senderName: msg.sender.fullName,
    timestamp: new Date(msg.createdAt || msg.timestamp || Date.now()), // Use createdAt from backend
    isStreaming: msg.isStreaming,
  });

  // Fetch initial messages
  useEffect(() => {
    if (!passedRoomIdString || !token) {
      setError("Chat room ID or authentication token is missing.");
      return;
    }
    const loadMessages = async () => {
      setIsLoadingMessages(true);
      setError(null);
      try {
        const response = await fetch(`${BACKEND_URL}/api/chat/${passedRoomIdString}/messages`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.message || `Failed to load messages (${response.status})`);
        }
        const fetchedBackendMessages: BackendReceivedMessageData[] = await response.json();
        setMessages(fetchedBackendMessages.map(transformBackendMessage));
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to load messages.";
        console.error("Error loading messages:", errorMessage);
        setError(errorMessage);
      } finally {
        setIsLoadingMessages(false);
      }
    };
    loadMessages();
  }, [passedRoomIdString, token]);

  // Socket.IO setup
  useEffect(() => {
    if (!passedRoomIdString || !user?._id || !token) return;

    // Ensure existing socket is disconnected before creating a new one
    if (socketRef.current) {
        socketRef.current.disconnect();
    }

    const newSocket = io(BACKEND_URL, {
      auth: { token }, // Send token for socket authentication if your backend supports it
      query: { userId: user._id } // Send userId for backend tracking
    });
    socketRef.current = newSocket;

    newSocket.emit('joinRoom', { roomIdString: passedRoomIdString, userId: user._id });

    newSocket.on('connect', () => {
      console.log(`Socket connected: ${newSocket.id} for room ${passedRoomIdString}`);
    });
    
    newSocket.on('newChatMessage', (newMessage: BackendReceivedMessageData) => {
      console.log("Received new message via socket:", newMessage);
      setMessages(prevMessages => [...prevMessages, transformBackendMessage(newMessage)]);
    });

    newSocket.on('socketError', (socketErr: { message: string }) => {
        console.error('Socket Error:', socketErr.message);
        setError(`Socket connection error: ${socketErr.message}`);
    });
    
    newSocket.on('userTyping', ({ userName, isTyping: remoteIsTyping, roomIdString: remoteRoomIdString }) => {
        if (remoteRoomIdString === passedRoomIdString && userName !== user.fullName) {
            setTypingUsers(prev => remoteIsTyping ? [...new Set([...prev, userName])] : prev.filter(name => name !== userName));
        }
    });

    newSocket.on('disconnect', (reason) => {
        console.log(`Socket disconnected from ${passedRoomIdString}: ${reason}`);
        // Optionally, attempt to reconnect or notify user
    });

    return () => {
      if (newSocket) {
        newSocket.emit('leaveRoom', { roomIdString: passedRoomIdString, userId: user._id });
        newSocket.disconnect();
        socketRef.current = null;
        console.log(`Socket disconnected and cleaned up for room ${passedRoomIdString}`);
      }
      setTypingUsers([]);
    };
  }, [passedRoomIdString, user?._id, token, user?.fullName]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, typingUsers]);

  const handleSendMessage = async (text: string) => {
    if (!passedRoomIdString || !user || !socketRef.current || !socketRef.current.connected) {
      setError("Cannot send message: Not connected to chat service or user not authenticated.");
      return;
    }
    setIsSending(true);
    setError(null);

    const messagePayload = {
      roomIdString: passedRoomIdString,
      text,
      senderId: user._id,
      senderType: MessageSenderType.USER, // This will be set by backend based on senderId if needed
    };
    
    socketRef.current.emit('chatMessage', messagePayload);
    // Optimistic update is handled by the server broadcasting the message back
    setIsSending(false); // Reset sending state, actual message display relies on broadcast

    // Stop typing indication
    if (isTyping) {
        socketRef.current.emit('typing', { roomIdString: passedRoomIdString, userName: user.fullName, isTyping: false });
        setIsTyping(false);
    }
  };

  const handleTyping = useCallback((isCurrentlyTyping: boolean) => {
    if (socketRef.current && socketRef.current.connected && user && passedRoomIdString) {
        if (isCurrentlyTyping && !isTyping) { // Send typing start only once
            socketRef.current.emit('typing', { roomIdString: passedRoomIdString, userName: user.fullName, isTyping: true });
            setIsTyping(true);
        } else if (!isCurrentlyTyping && isTyping) { // Send typing stop only once
            socketRef.current.emit('typing', { roomIdString: passedRoomIdString, userName: user.fullName, isTyping: false });
            setIsTyping(false);
        }
    }
  }, [isTyping, user, passedRoomIdString]);


  if (!user) return <div className="p-4 text-center">Please log in to access chat rooms.</div>;
  if (error && !isLoadingMessages) return <div className="p-4 text-red-500 bg-red-100 rounded-md m-3">{error}</div>;
  
  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-slate-100 to-sky-100">
      <header className="bg-blue-700 text-white p-4 shadow-md flex items-center sticky top-0 z-20">
        <button onClick={() => navigate(-1)} className="mr-3 p-2 rounded-full hover:bg-blue-600 transition-colors" aria-label="Go back">
          <ArrowLeftIcon className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-semibold truncate">{roomName}</h1>
      </header>

      <main ref={chatContainerRef} className="flex-grow overflow-y-auto p-4 md:p-6 space-y-3">
        {isLoadingMessages && messages.length === 0 && (
            <div className="flex justify-center items-center h-full">
                 <LoadingSpinner />
            </div>
        )}
        {messages.map((msg) => (
          <ChatMessageItem key={msg.id} message={msg} currentUserId={user._id} />
        ))}
        {typingUsers.length > 0 && (
            <div className="text-xs text-gray-500 italic px-2 pb-1">
                {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
            </div>
        )}
      </main>

      <footer className="bg-white/90 backdrop-blur-md p-3 md:p-4 border-t border-gray-200 shadow-t-lg sticky bottom-0 z-20">
        <ChatInput 
            onSendMessage={handleSendMessage} 
            isLoading={isSending || !socketRef.current?.connected}
            placeholder={`Message ${roomName}...`}
            onTyping={handleTyping} // Pass typing handler
        />
         {error && <p className="text-xs text-red-500 mt-1 px-1">{error}</p>}
      </footer>
    </div>
  );
};

export default ChatRoomPage;
