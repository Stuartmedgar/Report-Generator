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
    proExpiresAt?: string;
  };
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, firstName: string, lastName: string, promoCode?: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateProfile: (userData: any) => Promise<void>;
  promoRedemption: { type: 'success' | 'error'; message: string } | null;
  clearPromoRedemption: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

const PENDING_PROMO_CODE_KEY = 'pendingPromoCode';

const PROMO_REDEMPTION_MESSAGES: Record<string, string> = {
  invalid_code: "That code doesn't exist.",
  code_inactive: 'That code is no longer active.',
  code_expired: 'That code has expired.',
  code_exhausted: 'That code has reached its redemption limit.',
  already_redeemed: "You've already redeemed this code.",
};

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [promoRedemption, setPromoRedemption] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

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

  // Check if the user's email is verified and load their profile row
  const checkUserApproval = async (supabaseUser: SupabaseUser) => {
    try {
      console.log('CheckApproval: Checking email verification for user ID:', supabaseUser.id);

      // Email verification (Supabase's own confirmation flow) is the login gate now —
      // no more manual admin approval. This is already on the session, no DB round-trip needed.
      if (!supabaseUser.email_confirmed_at) {
        console.log('CheckApproval: Email not yet verified - setting user to null');
        setUser(null);
        throw new Error('Please verify your email before logging in. Check your inbox for a confirmation link.');
      }

      // A promo code entered at signup can't be redeemed until the user has a
      // real session (the RPC requires `authenticated`), which only exists
      // after email verification — so it's applied here, on first successful
      // login, rather than at signup time.
      const pendingRaw = localStorage.getItem(PENDING_PROMO_CODE_KEY);
      if (pendingRaw) {
        try {
          const pending = JSON.parse(pendingRaw);
          if (pending?.email?.toLowerCase() === supabaseUser.email?.toLowerCase() && pending?.code) {
            const { error: redeemError } = await supabase.rpc('redeem_promo_code', {
              p_code: pending.code,
              p_user_id: supabaseUser.id,
            });
            if (redeemError) {
              setPromoRedemption({
                type: 'error',
                message: PROMO_REDEMPTION_MESSAGES[redeemError.message] || 'Could not redeem your promo code.',
              });
            } else {
              setPromoRedemption({ type: 'success', message: 'Your promo code has been applied to your account.' });
            }
          }
        } catch (promoErr) {
          console.error('CheckApproval: Error redeeming pending promo code:', promoErr);
        } finally {
          localStorage.removeItem(PENDING_PROMO_CODE_KEY);
        }
      }

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

      // Promo-granted Pro (pro_expires_at set) lapses back to free once the
      // date passes, without needing a cron job to flip the plan column —
      // Stripe-subscription Pro has no pro_expires_at, so it's unaffected.
      const proExpired = data.pro_expires_at && new Date(data.pro_expires_at) < new Date();
      const effectivePlan = data.plan === 'pro' && !proExpired ? 'pro' : 'free';

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
          plan: effectivePlan,
          proExpiresAt: effectivePlan === 'pro' ? data.pro_expires_at || undefined : undefined,
        },
        created_at: data.created_at,
        updated_at: data.updated_at,
      };
      setUser(mappedUser);
      console.log('CheckApproval: User state set successfully');
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

  const signUp = async (email: string, password: string, firstName: string, lastName: string, promoCode?: string) => {
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
        // The public.users profile row is created server-side by the
        // on_auth_user_created trigger (see migration 20260716220000) —
        // it runs as part of the same transaction as the auth signup, so
        // there's no client-side insert or session-timing dependency here.
        console.log('SignUp: User signed up successfully. Awaiting email verification.');

        // Redemption requires an authenticated session, which doesn't exist
        // yet at signup time — stash the code and redeem it on first login
        // (see checkUserApproval) once email verification has happened.
        if (promoCode?.trim()) {
          localStorage.setItem(PENDING_PROMO_CODE_KEY, JSON.stringify({ code: promoCode.trim(), email }));
        }
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
    promoRedemption,
    clearPromoRedemption: () => setPromoRedemption(null),
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