import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, AuthContextType } from '../types/auth';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

const SESSION_STORAGE_KEY = "teacher_authenticated";
const USER_CODE_KEY = "teacher_user_code";

// Valid teacher codes - you can add/remove teachers here
const VALID_TEACHER_CODES = [
  'sarah-smith-2024',
  'john-doe-2024',
  'maria-garcia-2024',
  'david-wilson-2024',
  'lisa-brown-2024',
  'admin-test-2024'
];

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already authenticated
    const isAuthenticated = sessionStorage.getItem(SESSION_STORAGE_KEY) === 'true';
    const savedUserCode = sessionStorage.getItem(USER_CODE_KEY);
    
    if (isAuthenticated && savedUserCode && VALID_TEACHER_CODES.includes(savedUserCode)) {
      const teacherUser: User = {
        id: savedUserCode,
        email: `${savedUserCode}@reportgenerator.com`,
        user_metadata: {
          full_name: formatTeacherName(savedUserCode),
          first_name: extractFirstName(savedUserCode),
          last_name: extractLastName(savedUserCode)
        },
        app_metadata: {
          roles: ['teacher'],
          plan: 'full_access',
          teacher_code: savedUserCode
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      setUser(teacherUser);
    }
    
    setLoading(false);
  }, []);

  // Helper functions to format teacher names
  const formatTeacherName = (code: string): string => {
    const parts = code.split('-');
    if (parts.length >= 2) {
      const firstName = parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
      const lastName = parts[1].charAt(0).toUpperCase() + parts[1].slice(1);
      return `${firstName} ${lastName}`;
    }
    return code.charAt(0).toUpperCase() + code.slice(1);
  };

  const extractFirstName = (code: string): string => {
    const parts = code.split('-');
    return parts[0] ? parts[0].charAt(0).toUpperCase() + parts[0].slice(1) : 'Teacher';
  };

  const extractLastName = (code: string): string => {
    const parts = code.split('-');
    return parts[1] ? parts[1].charAt(0).toUpperCase() + parts[1].slice(1) : '';
  };

  const signIn = async (email: string, teacherCode: string) => {
    return new Promise<void>((resolve, reject) => {
      // Clean up the teacher code (remove spaces, convert to lowercase)
      const cleanCode = teacherCode.toLowerCase().trim();
      
      // Check if it's a valid teacher code
      if (VALID_TEACHER_CODES.includes(cleanCode)) {
        const teacherUser: User = {
          id: cleanCode,
          email: email || `${cleanCode}@reportgenerator.com`,
          user_metadata: {
            full_name: formatTeacherName(cleanCode),
            first_name: extractFirstName(cleanCode),
            last_name: extractLastName(cleanCode)
          },
          app_metadata: {
            roles: ['teacher'],
            plan: 'full_access',
            teacher_code: cleanCode
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        setUser(teacherUser);
        sessionStorage.setItem(SESSION_STORAGE_KEY, 'true');
        sessionStorage.setItem(USER_CODE_KEY, cleanCode);
        resolve();
      } else {
        reject(new Error('Invalid teacher code. Please check your code and try again.'));
      }
    });
  };

  const signUp = async (email: string, teacherCode: string, userData?: any) => {
    // For this simple system, signup is the same as signin
    return signIn(email, teacherCode);
  };

  const signOut = async () => {
    return new Promise<void>((resolve) => {
      setUser(null);
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
      sessionStorage.removeItem(USER_CODE_KEY);
      resolve();
    });
  };

  const resetPassword = async (email: string) => {
    return new Promise<void>((resolve) => {
      alert(`Password reset requested for ${email}. Please contact the app administrator for a new teacher code.`);
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