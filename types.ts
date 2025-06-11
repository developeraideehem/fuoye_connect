
export enum UserRole {
  STUDENT = 'student',
  LECTURER = 'lecturer',
}

// This User type is what the frontend primarily works with internally after login.
// It's derived from the BackendUser in AuthContext.
export interface User {
  _id: string; // Changed from id to _id to match MongoDB
  fullName: string;
  email: string;
  role: UserRole;
  // These will be objects populated from the backend
  faculty: { _id: string; name: string; facultyIdString: string; }; 
  department: { _id: string; name: string; departmentIdString: string; faculty: string; }; // faculty here is faculty _id
  isClassRep?: boolean;
  token?: string; // JWT token
}

// Kept for static data structure in fuoyeData.ts and potentially for form selections
export interface Department {
  id: string; // departmentIdString e.g. "dept_comp_sci"
  name: string;
  facultyId: string; // facultyIdString e.g. "faculty_sci"
}

export interface Faculty {
  id: string; // facultyIdString e.g. "faculty_sci"
  name: string;
  departments: Department[];
}

export enum MessageSenderType {
  USER = 'USER', // Current logged-in user - use uppercase to match backend/socket potential
  OTHER_USER = 'OTHER_USER', // Another human user in the chat
  BOT = 'BOT', // AI bot (client-side for AI chat page)
  SYSTEM = 'SYSTEM', // System messages (e.g., user joined, from backend)
}

export interface ChatMessage {
  _id?: string; // MongoDB ID, optional for optimistic updates
  id: string; // Unique ID for React keys, can be same as _id
  chatRoomId: string; // roomIdString, e.g., "dept_comp_eng"
  text: string;
  senderType: MessageSenderType;
  senderId?: string; // _id of the user or 'bot' or 'system'
  senderName?: string; // Display name of the sender
  timestamp: Date;
  isStreaming?: boolean; // For AI messages
  // Optional: if sender is a full User object from backend populated message
  sender?: { _id: string; fullName: string; /* other fields */ }; 
}

export interface AiChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'bot' | 'system'; // Simplified for AI chat
  timestamp: Date;
  isStreaming?: boolean;
}
