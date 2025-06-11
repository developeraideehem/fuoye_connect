import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './src/contexts/AuthContext'; // Updated path
import AuthPage from './src/pages/AuthPage'; // Updated path
import DashboardPage from './src/pages/DashboardPage'; // Updated path
import ChatRoomPage from './src/pages/ChatRoomPage'; // Updated path
import AiChatPage from './src/pages/AiChatPage'; // Updated path

const AppRoutes: React.FC = () => {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/auth" element={!user ? <AuthPage /> : <Navigate to="/" />} />
      <Route path="/" element={user ? <DashboardPage /> : <Navigate to="/auth" />} />
      <Route path="/chat/:roomId" element={user ? <ChatRoomPage /> : <Navigate to="/auth" />} />
      <Route path="/ai-assistant" element={user ? <AiChatPage /> : <Navigate to="/auth" />} />
      <Route path="*" element={<Navigate to={user ? "/" : "/auth"} />} />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <div className="h-full flex flex-col">
          <AppRoutes />
        </div>
      </Router>
    </AuthProvider>
  );
};

export default App;