import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, AuthContextType } from '../types/auth';

// Netlify Identity SDK
declare global {
  interface Window {
    netlifyIdentity: any;
  }
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('AuthContext: Starting initialization');
    console.log('window.netlifyIdentity exists:', !!window.netlifyIdentity);
    console.log('Current hostname:', window.location.hostname);
    
    // Check if we're running locally
    const isLocalhost = window.location.hostname === 'localhost' || 
                   window.location.hostname === '127.0.0.1' ||
                   window.location.hostname.includes('netlify.app');
    
    if (isLocalhost) {
      console.log('Running on localhost - using mock authentication for development');
      // For local development, simulate a logged-in user
      const mockUser: User = {
        id: 'mock-user-123',
        email: 'teacher@example.com',
        user_metadata: {
          full_name: 'Test Teacher',
          first_name: 'Test',
          last_name: 'Teacher'
        },
        app_metadata: {
          roles: ['teacher'],
          plan: 'free'
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      setTimeout(() => {
        console.log('Setting mock user for localhost');
        setUser(mockUser);
        setLoading(false);
      }, 1000); // Simulate loading time
      
      return;
    }
    
    // Initialize Netlify Identity for production
    const initNetlifyIdentity = () => {
      console.log('Trying to initialize Netlify Identity');
      
      if (window.netlifyIdentity) {
        console.log('Netlify Identity found, initializing...');
        
        window.netlifyIdentity.init({
          locale: 'en'
        });

        // Check if user is already logged in
        const currentUser = window.netlifyIdentity.currentUser();
        if (currentUser) {
          console.log('Found existing user:', currentUser.email);
          setUser(currentUser);
        }

        // Set up event listeners
        window.netlifyIdentity.on('init', (user: User | null) => {
          console.log('Netlify Identity initialized, user:', user);
          if (user) {
            setUser(user);
          }
          setLoading(false);
        });

        window.netlifyIdentity.on('login', (user: User) => {
          console.log('User logged in:', user.email);
          setUser(user);
          window.netlifyIdentity.close();
        });

        window.netlifyIdentity.on('logout', () => {
          console.log('User logged out');
          setUser(null);
        });

        window.netlifyIdentity.on('error', (err: Error) => {
          console.error('Netlify Identity error:', err);
          setLoading(false);
        });

        setLoading(false);
      } else {
        console.log('Netlify Identity not loaded yet, retrying...');
        // If netlifyIdentity is not loaded yet, wait and try again
        setTimeout(initNetlifyIdentity, 100);
      }
    };

    initNetlifyIdentity();
  }, []);

  const signIn = async (email: string, password: string) => {
    // For localhost, simulate login
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    
    if (isLocalhost) {
      console.log('Mock login for localhost');
      return Promise.resolve();
    }
    
    return new Promise<void>((resolve, reject) => {
      if (!window.netlifyIdentity) {
        reject(new Error('Netlify Identity not loaded'));
        return;
      }

      window.netlifyIdentity.on('login', (user: User) => {
        setUser(user);
        resolve();
      });

      window.netlifyIdentity.on('error', (err: Error) => {
        reject(err);
      });

      // Open the login modal
      window.netlifyIdentity.open('login');
    });
  };

  const signUp = async (email: string, password: string, userData?: any) => {
    // For localhost, simulate signup
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    
    if (isLocalhost) {
      console.log('Mock signup for localhost');
      return Promise.resolve();
    }
    
    return new Promise<void>((resolve, reject) => {
      if (!window.netlifyIdentity) {
        reject(new Error('Netlify Identity not loaded'));
        return;
      }

      window.netlifyIdentity.on('login', (user: User) => {
        setUser(user);
        resolve();
      });

      window.netlifyIdentity.on('error', (err: Error) => {
        reject(err);
      });

      // Open the signup modal
      window.netlifyIdentity.open('signup');
    });
  };

  const signOut = async () => {
    // For localhost, simulate logout
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    
    if (isLocalhost) {
      console.log('Mock logout for localhost');
      setUser(null);
      return Promise.resolve();
    }
    
    return new Promise<void>((resolve) => {
      if (window.netlifyIdentity) {
        window.netlifyIdentity.logout();
        setUser(null);
      }
      resolve();
    });
  };

  const resetPassword = async (email: string) => {
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    
    if (isLocalhost) {
      console.log('Mock password reset for localhost');
      return Promise.resolve();
    }
    
    return new Promise<void>((resolve, reject) => {
      if (!window.netlifyIdentity) {
        reject(new Error('Netlify Identity not loaded'));
        return;
      }

      // For password reset, we'll use the Netlify Identity widget
      window.netlifyIdentity.open('login');
      resolve();
    });
  };

  const updateProfile = async (userData: any) => {
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    
    if (isLocalhost && user) {
      console.log('Mock profile update for localhost');
      const updatedUser = { ...user, user_metadata: { ...user.user_metadata, ...userData } };
      setUser(updatedUser);
      return Promise.resolve();
    }
    
    return new Promise<void>((resolve, reject) => {
      if (!window.netlifyIdentity || !user) {
        reject(new Error('No authenticated user'));
        return;
      }

      try {
        // Update user metadata
        const updatedUser = { ...user, user_metadata: { ...user.user_metadata, ...userData } };
        setUser(updatedUser);
        resolve();
      } catch (error) {
        reject(error);
      }
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