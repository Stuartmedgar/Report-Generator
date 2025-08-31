import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, AuthContextType } from '../types/auth';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

// Simple password for teacher access during testing
const TEACHER_PASSWORD = "reportgen2024"; // You can change this
const SESSION_STORAGE_KEY = "teacher_authenticated";

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already authenticated
    const isAuthenticated = sessionStorage.getItem(SESSION_STORAGE_KEY) === 'true';
    
    if (isAuthenticated) {
      const teacherUser: User = {
        id: 'teacher-user',
        email: 'teacher@reportgenerator.com',
        user_metadata: {
          full_name: 'Teacher Account',
          first_name: 'Teacher',
          last_name: 'Account'
        },
        app_metadata: {
          roles: ['teacher'],
          plan: 'full_access'
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      setUser(teacherUser);
    }
    
    setLoading(false);
  }, []);

  const signIn = async (email: string, password: string) => {
    return new Promise<void>((resolve, reject) => {
      // Simple password check
      if (password === TEACHER_PASSWORD) {
        const teacherUser: User = {
          id: 'teacher-user',
          email: email || 'teacher@reportgenerator.com',
          user_metadata: {
            full_name: 'Teacher Account',
            first_name: 'Teacher',
            last_name: 'Account'
          },
          app_metadata: {
            roles: ['teacher'],
            plan: 'full_access'
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        setUser(teacherUser);
        sessionStorage.setItem(SESSION_STORAGE_KEY, 'true');
        resolve();
      } else {
        reject(new Error('Invalid password'));
      }
    });
  };

  const signUp = async (email: string, password: string, userData?: any) => {
    // For this simple system, signup is the same as signin
    return signIn(email, password);
  };

  const signOut = async () => {
    return new Promise<void>((resolve) => {
      setUser(null);
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
      resolve();
    });
  };

  const resetPassword = async (email: string) => {
    return new Promise<void>((resolve) => {
      alert(`Password reset requested for ${email}. Please contact support or use the teacher password: ${TEACHER_PASSWORD}`);
      resolve();
    });
  };

  const updateProfile = async (userData: any) => {
    return new Promise<void>((resolve) => {
      if (user) {
        const updatedUser = { ...user, user_metadata: { ...user.user_metadata, ...userData } };
        setUser(updatedUser);
      }
      resolve();
    });
  };

  const contextValue: AuthContextType = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updateProfile
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}