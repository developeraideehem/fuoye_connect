import { GoogleGenAI, Chat, GenerateContentResponse } from "@google/genai";

let googleAi: GoogleGenAI | null = null;

const COLLEGE_ADVISOR_PERSONA_GEMINI = `You are "CollegeConnect AI (Gemini Engine)", a friendly and knowledgeable virtual assistant for college students and prospective students of Federal University Oye-Ekiti (FUOYE). Your goal is to provide helpful information, guidance, and support on topics such as:
- FUOYE-specific information: admissions, courses, faculties, campus life.
- General College applications and admissions processes.
- Choosing a major and career paths.
- Study tips and academic success strategies.
- Campus life, clubs, and extracurricular activities.
- Financial aid and scholarships.
- Mental health and well-being resources for students.
- General advice for navigating college life.
Keep your responses clear, concise, empathetic, and encouraging. Use markdown for formatting like lists or bold text when it enhances readability. If you don't know an answer, admit it rather than speculating. Focus solely on providing information and advice. You are powered by Google Gemini.`;

const COLLEGE_ADVISOR_PERSONA_DEEPSEEK = `You are "CollegeConnect AI (DeepSeek Engine)", an intelligent and insightful virtual assistant for students at Federal University Oye-Ekiti (FUOYE). Your expertise covers:
- In-depth details about FUOYE: programs, research opportunities, staff.
- Broader academic queries and career counseling.
- Advanced study techniques and research methodologies.
- Student life, innovation hubs, and entrepreneurial activities at FUOYE.
- Scholarship and funding databases.
- Student well-being and support services.
Respond with clarity and precision. Use markdown for structured information. If information is outside your scope, clearly state it. You are powered by DeepSeek.`;


export const initializeGeminiChatSession = async (): Promise<Chat> => {
  // API_KEY is now directly available as process.env.API_KEY due to Vite's define config.
  // This value is sourced from VITE_GEMINI_API_KEY in the .env file.
  const apiKey = process.env.API_KEY;

  if (!apiKey) {
    console.error("Gemini API_KEY (from VITE_GEMINI_API_KEY via process.env.API_KEY) is not configured.");
    throw new Error("Gemini API_KEY not configured. AI features may be limited.");
  }

  if (!googleAi) {
    // Initialize GoogleGenAI using process.env.API_KEY as per strict guidelines
    googleAi = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }
  
  const newChatInstance = googleAi.chats.create({
    model: 'gemini-2.5-flash-preview-04-17',
    config: {
      systemInstruction: COLLEGE_ADVISOR_PERSONA_GEMINI,
    },
  });
  
  return newChatInstance;
};

export const sendMessageToGeminiStream = async (
  chat: Chat,
  message: string
): Promise<AsyncIterable<GenerateContentResponse>> => {
  if (!chat) {
    throw new Error("Gemini Chat not initialized. Call initializeGeminiChatSession first.");
  }
  try {
    return await chat.sendMessageStream({ message });
  } catch (error) {
    console.error("Error sending message to Gemini:", error);
    if (error instanceof Error && (error.message.includes('API_KEY_INVALID') || error.message.includes('API key not valid') || error.message.includes('API_KEY_UNAUTHENTICATED'))) {
        throw new Error("The Gemini API key is invalid or not properly authenticated. Please check your VITE_GEMINI_API_KEY configuration.");
    }
    throw new Error("Failed to send message to Gemini AI. Please try again later.");
  }
};

// --- DeepSeek AI Integration ---
interface DeepSeekMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

// History for DeepSeek, managed per session instance (implicitly, as this service is stateless unless you make it a class)
let deepSeekMessageHistory: DeepSeekMessage[] = []; 

export const initializeDeepSeekChatSession = async (): Promise<DeepSeekMessage[]> => {
    // DeepSeek uses import.meta.env directly as it's not subject to the same strict guideline
    const apiKey = import.meta.env.VITE_DEEPSEEK_API_KEY;
    const endpoint = import.meta.env.VITE_DEEPSEEK_API_ENDPOINT;

    if (!apiKey) {
        throw new Error("VITE_DEEPSEEK_API_KEY not configured. DeepSeek AI features may be limited.");
    }
    if (!endpoint) {
        throw new Error("VITE_DEEPSEEK_API_ENDPOINT not configured. DeepSeek AI features may be limited.");
    }
    
    deepSeekMessageHistory = [{ role: "system", content: COLLEGE_ADVISOR_PERSONA_DEEPSEEK }];
    return deepSeekMessageHistory; // Returns the initial history with system prompt
};


export const sendMessageToDeepSeek = async (prompt: string): Promise<string> => {
  const apiKey = import.meta.env.VITE_DEEPSEEK_API_KEY;
  const apiEndpoint = import.meta.env.VITE_DEEPSEEK_API_ENDPOINT;

  if (!apiKey) {
    throw new Error("VITE_DEEPSEEK_API_KEY not configured.");
  }
  if (!apiEndpoint) {
    throw new Error("VITE_DEEPSEEK_API_ENDPOINT not configured.");
  }

  if (deepSeekMessageHistory.length === 0 || deepSeekMessageHistory[0].role !== 'system') {
    // Ensure history is initialized if somehow cleared or not started with system prompt
    await initializeDeepSeekChatSession();
  }
  
  // Add user message to history
  deepSeekMessageHistory.push({ role: "user", content: prompt });

  try {
    const response = await fetch(apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat", // Common model, adjust if needed
        messages: deepSeekMessageHistory,
        // stream: false, // For non-streaming response
        // temperature: 0.7, // Optional: Adjust creativity
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      // Remove last user message from history if API call failed before assistant response
      if(deepSeekMessageHistory[deepSeekMessageHistory.length -1].role === 'user') {
        deepSeekMessageHistory.pop(); 
      }
      console.error("DeepSeek API Error Response Text:", errorData);
      try {
        const parsedError = JSON.parse(errorData); 
        if (parsedError && parsedError.error && parsedError.error.message) {
           throw new Error(`DeepSeek API error: ${response.status} - ${parsedError.error.message}`);
        }
      } catch(e) { /* ignore parsing error, use raw text */ }
      throw new Error(`DeepSeek API error: ${response.status} - ${errorData}`);
    }

    const data = await response.json();
    
    if (!data.choices || data.choices.length === 0 || !data.choices[0].message || !data.choices[0].message.content) {
        // Remove last user message from history if response is malformed
        if(deepSeekMessageHistory[deepSeekMessageHistory.length -1].role === 'user') {
            deepSeekMessageHistory.pop(); 
        }
        throw new Error("DeepSeek API response is malformed or missing content.");
    }
    
    const assistantResponse = data.choices[0].message.content;
    
    // Add real assistant response to history
    deepSeekMessageHistory.push({ role: "assistant", content: assistantResponse });

    return assistantResponse;

  } catch (error) {
    // Ensure last user message is popped if it was added and an error occurred
    if(deepSeekMessageHistory.length > 0 && deepSeekMessageHistory[deepSeekMessageHistory.length -1].role === 'user') {
        deepSeekMessageHistory.pop();
    }
    console.error("Error sending message to DeepSeek:", error);
    if (error instanceof Error && (error.message.toLowerCase().includes('api key') || error.message.toLowerCase().includes('authentication'))) {
         throw new Error("The DeepSeek API key is invalid or authentication failed. Please check your VITE_DEEPSEEK_API_KEY.");
    }
    throw new Error(`Failed to communicate with DeepSeek AI: ${error instanceof Error ? error.message : String(error)}`);
  }
};

// --- End of DeepSeek AI Integration ---
