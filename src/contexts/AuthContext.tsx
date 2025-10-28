import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import type { User as SupabaseUser } from '@supabase/supabase-js';

// Custom User type that matches our needs
interface User {
  id: string;
  email: string;
  user_metadata?: {
    full_name?: string;
    first_name?: string;
    last_name?: string;
  };
  app_metadata?: {
    roles?: string[];
    plan?: string;
  };
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, firstName: string, lastName: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateProfile: (userData: any) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check active sessions and sets the user
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        checkUserApproval(session.user);
      } else {
        setLoading(false);
      }
    });

    // Listen for changes on auth state (sign in, sign out, etc.)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        checkUserApproval(session.user);
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Check if user is approved in our users table
  const checkUserApproval = async (supabaseUser: SupabaseUser) => {
    try {
      console.log('CheckApproval: Checking approval for user ID:', supabaseUser.id);
      
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', supabaseUser.id)
        .single();

      if (error) {
        console.error('CheckApproval: Error fetching user:', error);
        setUser(null);
        setLoading(false);
        throw new Error('Could not verify user account. Please contact support.');
      }

      console.log('CheckApproval: User data from database:', data);
      console.log('CheckApproval: Approved status:', data?.is_approved);
      console.log('CheckApproval: Approved type:', typeof data?.is_approved);

      // Check if user is approved (using correct column name)
      const isApproved = data && (data.is_approved === true || data.is_approved === 'true');
      
      if (isApproved) {
        console.log('CheckApproval: User is APPROVED - setting user state');
        // User is approved, set the user state
        const mappedUser: User = {
          id: supabaseUser.id,
          email: supabaseUser.email || '',
          user_metadata: {
            full_name: `${data.first_name || ''} ${data.last_name || ''}`.trim(),
            first_name: data.first_name,
            last_name: data.last_name,
          },
          app_metadata: {
            roles: data.role ? [data.role] : ['teacher'],
            plan: 'full_access',
          },
          created_at: data.created_at,
          updated_at: data.updated_at,
        };
        setUser(mappedUser);
        console.log('CheckApproval: User state set successfully');
      } else {
        // User exists but not approved
        console.log('CheckApproval: User NOT APPROVED - setting user to null');
        setUser(null);
        throw new Error('Your account is pending admin approval. Please wait for an administrator to approve your account.');
      }
    } catch (error: any) {
      console.error('CheckApproval: Error in checkUserApproval:', error);
      setUser(null);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      console.log('SignIn: Starting login for', email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('SignIn: Supabase auth error:', error);
        throw error;
      }

      console.log('SignIn: Auth successful, checking approval...');
      console.log('SignIn: User data:', data.user);

      if (data.user) {
        await checkUserApproval(data.user);
      }
    } catch (error: any) {
      console.error('SignIn: Error in signIn:', error);
      throw error;
    }
  };

  const signUp = async (email: string, password: string, firstName: string, lastName: string) => {
    try {
      console.log('SignUp: Starting signup for', email);
      
      // Sign up with Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
          },
        },
      });

      console.log('SignUp: Auth response:', { data, error });

      if (error) {
        console.error('SignUp: Auth error:', error);
        throw error;
      }

      if (data.user) {
        console.log('SignUp: User created in auth, now creating in users table...');
        
        // Create user record in our users table (without full_name)
        const { error: insertError } = await supabase
          .from('users')
          .insert({
            id: data.user.id,
            email: data.user.email,
            first_name: firstName,
            last_name: lastName,
            role: 'teacher',
            is_approved: false,
          });

        if (insertError) {
          console.error('SignUp: Error creating user record:', insertError);
          throw insertError;
        }

        console.log('SignUp: User signed up successfully. Awaiting admin approval.');
      }
    } catch (error: any) {
      console.error('SignUp: Error signing up:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
    } catch (error: any) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
    } catch (error: any) {
      console.error('Error resetting password:', error);
      throw error;
    }
  };

  const updateProfile = async (userData: any) => {
    try {
      if (!user) throw new Error('No user logged in');

      // Update auth metadata
      const { error: authError } = await supabase.auth.updateUser({
        data: userData,
      });

      if (authError) throw authError;

      // Update users table
      const { error: dbError } = await supabase
        .from('users')
        .update({
          first_name: userData.first_name,
          last_name: userData.last_name,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (dbError) throw dbError;

      // Update local user state
      setUser({
        ...user,
        user_metadata: {
          ...user.user_metadata,
          first_name: userData.first_name,
          last_name: userData.last_name,
          full_name: `${userData.first_name} ${userData.last_name}`.trim(),
        },
        updated_at: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error('Error updating profile:', error);
      throw error;
    }
  };

  const contextValue: AuthContextType = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updateProfile,
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