
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole } from '../../types'; // Path is correct relative to src/contexts
import { Faculties as StaticFaculties, getDepartmentsForFaculty as staticGetDepartmentsForFaculty, getFacultyById as staticGetFacultyById, getDepartmentById as staticGetDepartmentById } from '../config/fuoyeData'; // Static data for fallback or initial display

// Define a more detailed User type that matches backend response (including _id)
export interface BackendUser extends Omit<User, 'faculty' | 'department' | 'id' | 'token'> {
  _id: string;
  faculty: { _id: string; name: string; facultyIdString: string; }; // Populated faculty object
  department: { _id: string; name: string; departmentIdString: string; faculty: string }; // Populated department object
  token: string; // JWT token from backend
}


interface AuthContextType {
  user: BackendUser | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: Omit<User, '_id' | 'id' | 'token' | 'faculty' | 'department'> & { faculty: string; department: string; password?: string }) => Promise<void>;
  logout: () => void;
  token: string | null;
  clearError: () => void; // Added clearError
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// For Vite projects, environment variables are accessed via import.meta.env.
// Ensure you have a vite-env.d.ts file for proper TypeScript support.
// Example vite-env.d.ts:
// /// <reference types="vite/client" />
// interface ImportMetaEnv { readonly VITE_BACKEND_URL: string; /* other env vars */ }
// interface ImportMeta { readonly env: ImportMetaEnv; }
const BACKEND_URL = (import.meta as any).env.VITE_BACKEND_URL || 'http://localhost:3001';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<BackendUser | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('fuoyeUserToken'));
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const storedUserString = localStorage.getItem('fuoyeUser');
    if (storedUserString && token) {
      try {
        const storedUser: BackendUser = JSON.parse(storedUserString);
        setUser(storedUser);
      } catch (e) {
        console.error("Failed to parse user from localStorage", e);
        localStorage.removeItem('fuoyeUser');
        localStorage.removeItem('fuoyeUserToken');
        setToken(null);
      }
    }
    setIsLoading(false);
  }, [token]);

  const clearError = () => {
    setError(null);
  };

  const login = async (email: string, password: string): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }
      
      const loggedInUser: BackendUser = data; // Assuming backend returns user object and token separately or token within user
      setUser(loggedInUser);
      setToken(loggedInUser.token);
      localStorage.setItem('fuoyeUser', JSON.stringify(loggedInUser));
      localStorage.setItem('fuoyeUserToken', loggedInUser.token);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred during login.';
      console.error("Login error:", errorMessage);
      setError(errorMessage);
      setUser(null);
      setToken(null);
      localStorage.removeItem('fuoyeUser');
      localStorage.removeItem('fuoyeUserToken');
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userDataWithPassword: Omit<User, '_id' | 'id' | 'token' | 'faculty' | 'department'> & { faculty: string; department: string; password?: string }): Promise<void> => {
    setIsLoading(true);
    setError(null);
    const { password, ...userData } = userDataWithPassword;
    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...userData, password }), // Send password here
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }
      
      const registeredUser: BackendUser = data;
      setUser(registeredUser);
      setToken(registeredUser.token);
      localStorage.setItem('fuoyeUser', JSON.stringify(registeredUser));
      localStorage.setItem('fuoyeUserToken', registeredUser.token);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred during registration.';
      console.error("Registration error:", errorMessage);
      setError(errorMessage);
      setUser(null);
      setToken(null);
      localStorage.removeItem('fuoyeUser');
      localStorage.removeItem('fuoyeUserToken');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = (): void => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('fuoyeUser');
    localStorage.removeItem('fuoyeUserToken');
    // Router will handle redirect
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, error, login, register, logout, clearError }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
