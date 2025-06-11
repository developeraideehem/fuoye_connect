import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AiChatMessage } from '../../types';
import ChatMessageItem from '../../components/ChatMessageItem';
import ChatInput from '../../components/ChatInput';
import LoadingSpinner from '../../components/LoadingSpinner';
import { 
  initializeGeminiChatSession, 
  sendMessageToGeminiStream,
  initializeDeepSeekChatSession,
  sendMessageToDeepSeek
} from '../../services/aiService'; // Updated import
import { Chat as GeminiChat, GenerateContentResponse } from '@google/genai';
import { SparklesIcon, ArrowLeftIcon, UserIcon, BotIcon } from '../../components/IconComponents';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

type AiProvider = 'gemini' | 'deepseek';

const AiChatPage: React.FC = () => {
  const [messages, setMessages] = useState<AiChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const [geminiChatSession, setGeminiChatSession] = useState<GeminiChat | null>(null);
  const [deepSeekInitialized, setDeepSeekInitialized] = useState<boolean>(false);

  const [selectedAiProvider, setSelectedAiProvider] = useState<AiProvider>('gemini');
  const [isSwitchingAi, setIsSwitchingAi] = useState<boolean>(false);

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  const getApiKeyStatus = useCallback((provider: AiProvider) => {
    if (provider === 'gemini') {
      // process.env.API_KEY is made available by Vite's `define` config,
      // sourced from VITE_GEMINI_API_KEY.
      return !!process.env.API_KEY;
    } else if (provider === 'deepseek') {
      // DeepSeek uses import.meta.env directly.
      return !!import.meta.env.VITE_DEEPSEEK_API_KEY && !!import.meta.env.VITE_DEEPSEEK_API_ENDPOINT;
    }
    return false;
  }, []);

  const [isGeminiKeyConfigured, setIsGeminiKeyConfigured] = useState<boolean>(getApiKeyStatus('gemini'));
  const [isDeepSeekKeyConfigured, setIsDeepSeekKeyConfigured] = useState<boolean>(getApiKeyStatus('deepseek'));


  const initializeChatProvider = useCallback(async (provider: AiProvider) => {
    setIsSwitchingAi(true);
    setIsLoading(true);
    setError(null);
    setMessages([]); // Clear messages when switching AI

    let initialMessageText = "";
    let success = false;

    try {
      if (provider === 'gemini') {
        if (!isGeminiKeyConfigured) throw new Error("Gemini API_KEY not configured.");
        const newGeminiSession = await initializeGeminiChatSession();
        setGeminiChatSession(newGeminiSession);
        setDeepSeekInitialized(false); 
        initialMessageText = "Hello! I'm CollegeConnect AI (Gemini Engine). How can I assist with your FUOYE journey today?";
        success = true;
      } else if (provider === 'deepseek') {
        if (!isDeepSeekKeyConfigured) throw new Error("DeepSeek API_KEY or API_ENDPOINT not configured.");
        await initializeDeepSeekChatSession(); 
        setDeepSeekInitialized(true);
        setGeminiChatSession(null); 
        initialMessageText = "Greetings! I'm CollegeConnect AI (DeepSeek Engine). How can I help you explore FUOYE opportunities?";
        success = true;
      }
      if (success) {
        setMessages([{
          id: crypto.randomUUID(),
          text: initialMessageText,
          sender: 'bot',
          timestamp: new Date(),
        }]);
      }
    } catch (err) {
      console.error(`${provider} Initialization Error:`, err);
      const errorMessage = err instanceof Error ? err.message : `An unknown error occurred during ${provider} AI initialization.`;
      setError(errorMessage);
      setMessages([{
        id: crypto.randomUUID(),
        text: `Error initializing ${provider} AI: ${errorMessage}. Some features might not be available.`,
        sender: 'system',
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
      setIsSwitchingAi(false);
    }
  }, [isGeminiKeyConfigured, isDeepSeekKeyConfigured]); // Dependencies for re-initialization if key status changes

  useEffect(() => {
    // Re-check key configuration status dynamically (e.g. if .env changes and HMR reloads)
    // Though, for build-time defines like process.env.API_KEY, this might not change post-build without a rebuild.
    setIsGeminiKeyConfigured(getApiKeyStatus('gemini'));
    setIsDeepSeekKeyConfigured(getApiKeyStatus('deepseek'));
  }, [getApiKeyStatus]);

  useEffect(() => {
    // Initialize with the default or currently selected provider
    initializeChatProvider(selectedAiProvider);
  }, [initializeChatProvider, selectedAiProvider]); 


   useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (text: string) => {
    const userMessage: AiChatMessage = {
      id: crypto.randomUUID(),
      text,
      sender: 'user',
      timestamp: new Date(),
    };
    setMessages((prevMessages) => [...prevMessages, userMessage]);
    setIsLoading(true);
    setError(null);

    const botMessageId = crypto.randomUUID();
    setMessages((prevMessages) => [
      ...prevMessages,
      { id: botMessageId, text: '', sender: 'bot', timestamp: new Date(), isStreaming: selectedAiProvider === 'gemini' }
    ]);

    try {
      if (selectedAiProvider === 'gemini') {
        if (!geminiChatSession) throw new Error("Gemini chat session not active.");
        const stream: AsyncIterable<GenerateContentResponse> = await sendMessageToGeminiStream(geminiChatSession, text);
        let accumulatedText = "";
        for await (const chunk of stream) {
          const chunkText = chunk.text;
          if (chunkText) {
            accumulatedText += chunkText;
            setMessages((prevMessages) =>
              prevMessages.map((msg) =>
                msg.id === botMessageId ? { ...msg, text: accumulatedText, isStreaming: true } : msg
              )
            );
          }
        }
        setMessages((prevMessages) =>
          prevMessages.map((msg) =>
            msg.id === botMessageId ? { ...msg, text: accumulatedText, isStreaming: false } : msg
          )
        );
      } else if (selectedAiProvider === 'deepseek') {
        if (!deepSeekInitialized) throw new Error("DeepSeek session not active.");
        const responseText = await sendMessageToDeepSeek(text); 
        setMessages((prevMessages) =>
          prevMessages.map((msg) =>
            msg.id === botMessageId ? { ...msg, text: responseText, isStreaming: false } : msg
          )
        );
      }
    } catch (err) {
      console.error(`Error sending/receiving ${selectedAiProvider} AI message:`, err);
      const errorMessage = err instanceof Error ? err.message : "An unknown AI error occurred.";
      setError(`${selectedAiProvider.toUpperCase()} AI Error: ${errorMessage}`);
      setMessages((prevMessages) =>
        prevMessages.map((msg) =>
          msg.id === botMessageId ? { ...msg, text: `Sorry, I encountered an error with ${selectedAiProvider.toUpperCase()} AI: ${errorMessage}`, isStreaming: false, sender: 'system' } : msg
        )
      );
    } finally {
      setIsLoading(false);
      setMessages((prevMessages) =>
        prevMessages.map((msg) =>
          msg.id === botMessageId ? { ...msg, isStreaming: false } : msg 
        )
      );
    }
  };
  
  const handleAiProviderChange = (provider: AiProvider) => {
    if (provider !== selectedAiProvider) {
      setSelectedAiProvider(provider);
    }
  };

  const currentProviderKeyConfigured = selectedAiProvider === 'gemini' ? isGeminiKeyConfigured : isDeepSeekKeyConfigured;

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-slate-100 to-sky-100 font-sans">
      <header className="bg-purple-600 text-white p-4 shadow-lg flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center">
          <button onClick={() => navigate('/')} className="mr-3 p-2 rounded-full hover:bg-purple-500 transition-colors" aria-label="Go to Dashboard">
            <ArrowLeftIcon className="w-6 h-6" />
          </button>
          <SparklesIcon className="w-8 h-8 mr-2" />
          <h1 className="text-lg sm:text-xl font-bold tracking-tight">College AI Assistant</h1>
        </div>
        <div className="flex items-center space-x-2 text-xs sm:text-sm">
          <span className="mr-1">AI Engine:</span>
          <label className="flex items-center space-x-1 cursor-pointer p-1 rounded hover:bg-purple-500">
            <input 
              type="radio" 
              name="aiProvider" 
              value="gemini" 
              checked={selectedAiProvider === 'gemini'} 
              onChange={() => handleAiProviderChange('gemini')}
              className="form-radio text-pink-500 focus:ring-pink-400"
            />
            <span>Gemini</span>
          </label>
          <label className="flex items-center space-x-1 cursor-pointer p-1 rounded hover:bg-purple-500">
            <input 
              type="radio" 
              name="aiProvider" 
              value="deepseek" 
              checked={selectedAiProvider === 'deepseek'} 
              onChange={() => handleAiProviderChange('deepseek')}
              className="form-radio text-teal-500 focus:ring-teal-400"
            />
            <span>DeepSeek</span>
          </label>
        </div>
      </header>

      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-3 m-3 rounded-md shadow-sm text-sm" role="alert">
          <p className="font-bold">Error</p>
          <p>{error}</p>
        </div>
      )}
      {!currentProviderKeyConfigured && !error && !isSwitchingAi && (
          <div className="bg-orange-100 border-l-4 border-orange-500 text-orange-700 p-3 m-3 rounded-md shadow-sm text-sm" role="alert">
            <p className="font-bold">Configuration Warning</p>
            <p>The API Key/Endpoint for {selectedAiProvider.toUpperCase()} is not configured. This AI may not work as expected.</p>
          </div>
        )}


      <main ref={chatContainerRef} className="flex-grow overflow-y-auto p-4 md:p-6 space-y-4">
        {isSwitchingAi && messages.length === 0 && (
             <div className="flex justify-center items-center h-full">
                <div className="text-center text-gray-500">
                    <SparklesIcon className="w-12 h-12 text-purple-400 animate-pulse mx-auto mb-2" />
                    <p>Switching to {selectedAiProvider.toUpperCase()} AI...</p>
                </div>
            </div>
        )}
        {!isSwitchingAi && messages.map((msg) => (
          <ChatMessageItem key={msg.id} message={msg} currentUserId={user?._id} />
        ))}
        {isLoading && !isSwitchingAi && messages[messages.length -1]?.sender !== 'user' && ( 
          <div className="flex justify-start pl-10">
             <LoadingSpinner />
          </div>
        )}
      </main>

      <footer className="bg-white/80 backdrop-blur-md p-3 md:p-4 border-t border-gray-200 shadow-t-lg sticky bottom-0 z-10">
        <ChatInput 
            onSendMessage={handleSendMessage} 
            isLoading={isLoading || isSwitchingAi || !currentProviderKeyConfigured}
            placeholder={`Ask CollegeConnect AI (${selectedAiProvider.toUpperCase()})...`}
        />
      </footer>
    </div>
  );
};

export default AiChatPage;