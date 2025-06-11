# FUOYE Connect

**FUOYE Connect** is a web application designed to enhance communication and provide intelligent assistance for students and lecturers at the Federal University Oye-Ekiti (FUOYE). It features faculty/department-based chat rooms, real-time messaging, and a versatile AI assistant powered by a choice of leading AI models.

## Core Functionalities

1.  **User Authentication & Roles:**
    *   Secure registration and login for students and lecturers via a Node.js backend.
    *   Passwords are hashed (`bcryptjs`) and sessions managed with JSON Web Tokens (JWT).
    *   Role-based access control (Student, Lecturer).
    *   Special designation for Class Representatives with potential admin privileges.
    *   Users are associated with their specific faculty and department within FUOYE, stored in a MongoDB database named `fuoye_connect`.

2.  **Dashboard:**
    *   Personalized landing page after login.
    *   Quick access to the AI Assistant.
    *   Navigation to relevant department and faculty chat rooms.
    *   Conditional link to an Admin Panel for authorized users (Lecturers, Class Reps).

3.  **Real-Time Multi-User Chat Rooms:**
    *   Chat rooms for each department and faculty, dynamically managed by the backend.
    *   Real-time messaging powered by Node.js, Express, Socket.IO, and MongoDB.
    *   Users can join and participate in discussions relevant to their academic context.
    *   Messages display sender's name and timestamp.
    *   Typing indicators for active users.
    *   Chat history is fetched from the backend.

4.  **Dual AI Assistant:**
    *   An integrated AI chat assistant to help with FUOYE-specific queries, academic advice, and general college life.
    *   **User-selectable AI Engines:** Users can choose to interact with either:
        *   **Google Gemini:** Leveraging Google's advanced AI model (requires `VITE_GEMINI_API_KEY`).
        *   **DeepSeek AI:** Utilizing the DeepSeek AI model (requires `VITE_DEEPSEEK_API_KEY` and `VITE_DEEPSEEK_API_ENDPOINT`).
    *   The AI persona is tailored to the selected engine. AI interactions are client-side.

5.  **Responsive Design:**
    *   The application is designed to be accessible and user-friendly across various devices.

6.  **Backend Service:**
    *   A Node.js backend using Express.js, MongoDB (via Mongoose), and Socket.IO for real-time communication.
    *   Handles authentication, data management (faculties, departments, users, messages within the `fuoye_connect` database where each model has its own collection like `users`, `messages`, etc.), and chat functionalities.

## Technology Stack

*   **Frontend:**
    *   React 19 (`react`, `react-dom`)
    *   TypeScript
    *   React Router (`react-router-dom`) for navigation
    *   Tailwind CSS for styling
    *   Socket.IO Client (`socket.io-client`)
    *   Google Gemini API (`@google/genai`)
*   **Backend (Node.js):**
    *   Express.js
    *   MongoDB (with Mongoose ODM)
    *   Socket.IO (for real-time chat)
    *   JSON Web Tokens (`jsonwebtoken`) for authentication
    *   `bcryptjs` for password hashing
    *   `dotenv` for environment variable management
    *   CORS
*   **Build Tool (for local frontend development):**
    *   Vite

## Local Development Setup

Follow these instructions to set up and run the FUOYE Connect application on your local machine.

**1. Prerequisites:**

*   Node.js (v18 or later recommended)
*   npm (usually comes with Node.js) or yarn
*   MongoDB (ensure it's installed and running locally, or use a cloud instance like MongoDB Atlas). The application will attempt to connect to a database named `fuoye_connect`.

**2. Clone the Repository:**

```bash
git clone <repository-url>
cd fuoye-connect-app
```

**3. Create Environment Variables File:**

Navigate to the project root (`fuoye-connect-app`) and copy the example environment file:

```bash
cp .env.example .env
```

Now, **edit the `.env` file**. This file is critical for storing your API keys and database connection strings.

```env
# .env file content

# --- Frontend AI Service Keys ---
# These VITE_ prefixed variables are directly used by the frontend code (e.g., in services/aiService.ts)
# Vite makes these available via "import.meta.env.VITE_YOUR_VARIABLE"
VITE_GEMINI_API_KEY="YOUR_ACTUAL_GEMINI_API_KEY"
VITE_DEEPSEEK_API_KEY="sk-230209eef89141fd9c895f0f20a0bd2e" # Your provided DeepSeek Key
VITE_DEEPSEEK_API_ENDPOINT="https://api.deepseek.com/v1/chat/completions" # Official DeepSeek endpoint
VITE_BACKEND_URL="http://localhost:3001"

# --- Backend Configuration ---
# These variables are used by the Node.js backend (conceptual_backend/server.js)
PORT=3001
# Ensure your MongoDB is running and accessible. 'fuoye_connect' is the database name.
# Collections (e.g., 'users', 'messages') will be created automatically by Mongoose within this database.
MONGO_URI="mongodb://localhost:27017/fuoye_connect" 
JWT_SECRET="GENERATE_A_STRONG_RANDOM_SECRET_KEY_AT_LEAST_32_CHARACTERS_LONG" # IMPORTANT for security

# --- Optional: Root level keys for reference or other scripts (if any) ---
# These are not directly used by Vite frontend or the primary backend server.js if VITE_ or direct process.env access is used.
# API_KEY="YOUR_ACTUAL_GEMINI_API_KEY" 
# DEEPSEEK_API_KEY_ROOT="sk-230209eef89141fd9c895f0f20a0bd2e"
# DEEPSEEK_API_ENDPOINT_ROOT="https://api.deepseek.com/v1/chat/completions"
```
*   **Important:**
    *   Replace `"YOUR_ACTUAL_GEMINI_API_KEY"` with your real Google Gemini API Key.
    *   The `VITE_DEEPSEEK_API_KEY` is pre-filled with the key you provided.
    *   Ensure `VITE_DEEPSEEK_API_ENDPOINT` is correct.
    *   `MONGO_URI` must point to your running MongoDB instance (e.g., `mongodb://localhost:27017/fuoye_connect` if MongoDB is running locally without authentication). The database specified, `fuoye_connect`, will be created if it doesn't exist upon first connection. Collections like `users`, `faculties`, `messages` etc., will be created by Mongoose within this database.
    *   `JWT_SECRET` **must** be a long, random, and secret string for securing tokens. Generate a strong one.
    *   `VITE_BACKEND_URL` tells the frontend where to find the backend API.

**4. Install Dependencies:**

Navigate to the project root and install the necessary packages:

```bash
npm install
```
or if you prefer yarn:
```bash
yarn install
```
The `postinstall` script in `package.json` will attempt to copy `.env.example` to `.env` if `.env` doesn't exist (useful for fresh clones, but ensure you still edit it as described above).

**5. Running the Application:**

The `package.json` includes scripts to run the frontend development server and the backend server.

*   **Ensure MongoDB is running.**
*   **To run both frontend and backend concurrently (recommended):**
    ```bash
    npm run dev
    ```
    This will typically start:
    *   The Vite frontend development server (e.g., on `http://localhost:5173`).
    *   The Node.js backend server (e.g., on `http://localhost:3001`). The backend will attempt to populate initial faculty/department data into the `fuoye_connect` MongoDB database on its first successful connection.

*   **To run only the frontend development server:**
    ```bash
    npm run dev:frontend
    ```

*   **To run only the backend server:**
    ```bash
    npm run dev:backend
    ```

Open your browser and navigate to the frontend URL provided by Vite (usually `http://localhost:5173`).

**6. Building for Production (Frontend):**

To create an optimized production build of the frontend:

```bash
npm run build:frontend
```
The output will be in the `dist` directory. The backend would need separate deployment strategies (e.g., Docker, PaaS like Heroku/Render).

---

## Chapter 2: System Overview and Core Functionalities (Thesis-Style Rundown)

### 2.1 Introduction

FUOYE Connect is a multifaceted digital platform designed to serve the academic community of the Federal University Oye-Ekiti (FUOYE). It aims to bridge communication gaps, foster collaboration, and provide intelligent academic support for both students and lecturers. The system integrates robust real-time chat functionalities with advanced AI-driven assistance, creating a centralized hub for academic interaction and information retrieval.

### 2.2 System Architecture

The application is architected with a decoupled frontend and a dedicated backend:

*   **Frontend:** A modern, responsive web application built with React, TypeScript, and Tailwind CSS. It handles user interface, user experience, client-side state management, and real-time communication with the backend via Socket.IO. It interacts with AI services directly for assistant features.
*   **Backend:** A Node.js-based server using Express.js, MongoDB (as the database via Mongoose), and Socket.IO. This backend is responsible for:
    *   User authentication (JWT-based) and authorization.
    *   Managing user data, faculties, departments, chat rooms, and messages within the `fuoye_connect` database. Each data type (model) typically resides in its own collection (e.g., `users`, `messages`).
    *   Facilitating real-time multi-user chat via WebSockets.
    *   Serving chat history and other relevant data via a RESTful API.
    *   Initial data seeding for faculties and departments.

### 2.3 Core Functionalities Detailed

#### 2.3.1 User Management and Authentication

*   **Registration:** New users (students or lecturers) can register by providing their full name, email, password, role, FUOYE faculty (selected by ID string), and department (selected by ID string). Student users can also indicate if they are a Class Representative. Passwords are securely hashed on the backend.
*   **Login:** Registered users can log in using their email and password. Upon successful authentication, the backend issues a JWT.
*   **Role-Based Access:** The system differentiates between `STUDENT` and `LECTURER` roles. Class Representatives (`isClassRep`) gain certain administrative visibility.
*   **Session Management:** User sessions are managed on the frontend using the JWT stored in `localStorage`. Protected backend routes require this token.

#### 2.3.2 Communication Platform: Real-Time Chat Rooms

*   **Departmental and Faculty Chats:** Upon login, users gain access to chat rooms specific to their registered department and faculty, as well as other public faculty chats.
*   **Real-Time Messaging:** Powered by Socket.IO, messages are delivered instantly to all participants in a room. Typing indicators show when other users are actively composing messages.
*   **Message Display:** Messages include the sender's name and timestamp. The UI differentiates messages from the current user, other users, the AI bot (client-side), and system announcements (can be backend-driven).
*   **Persistent Chat History:** Messages are stored in the MongoDB database (`fuoye_connect`, typically in a `messages` collection) and fetched when a user enters a chat room.

#### 2.3.3 Intelligent Assistance: Dual AI Engines

A key feature of FUOYE Connect is its AI-powered assistant, designed to provide on-demand support (client-side interaction with AI APIs).

*   **User-Selectable AI Models:** Users can choose their preferred AI engine for interaction:
    1.  **Google Gemini:** Offers robust, general-purpose AI assistance.
    2.  **DeepSeek AI:** Provides an alternative powerful AI engine.
*   **Contextual Persona:** Each AI engine is configured with a distinct system persona.
*   **Interaction:** Users can ask questions related to academics, campus life, etc. Gemini interactions support streaming responses. DeepSeek responses are non-streaming in the current implementation.

#### 2.3.4 Dashboard and Navigation

The dashboard serves as the central navigation hub, providing quick links to the AI Assistant, user-specific chat rooms, and other explorable chats.

### 2.4 Future Enhancements

*   **Full Admin Panel Functionality:** Building out features for user management, chat moderation, and system configuration.
*   **Persistent AI Chat History:** Optionally storing AI chat conversations per user on the backend.
*   **Direct Messaging:** Allowing one-on-one chats between users.
*   **File Sharing:** Enabling users to share files within chat rooms.
*   **Notifications:** Implementing push notifications for new messages or important announcements.
*   **Enhanced User Profiles:** More detailed user profiles with options for customization.
*   **Deployment:** Preparing both frontend and backend for production deployment.

By implementing this robust backend, FUOYE Connect transitions from a conceptual prototype to a functional, real-time communication and support platform for the Federal University Oye-Ekiti.