import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { loadStripe, Stripe } from '@stripe/stripe-js';

// Types for subscription
interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  interval: 'month' | 'year';
  stripePriceId: string;
  features: string[];
}

interface SubscriptionData {
  hasActiveSubscription: boolean;
  planId: string;
  status: string;
  subscriptionId?: string;
  currentPeriodEnd?: number;
  cancelAtPeriodEnd?: boolean;
}

interface SubscriptionContextType {
  subscription: SubscriptionData;
  plans: SubscriptionPlan[];
  isLoading: boolean;
  error: string | null;
  stripe: Stripe | null;
  createCheckoutSession: (priceId: string) => Promise<void>;
  cancelSubscription: (subscriptionId: string) => Promise<void>;
  refreshSubscription: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

// Initialize Stripe
const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY || '');

// Subscription plans configuration
const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'free',
    name: 'Free Plan',
    price: 0,
    currency: 'USD',
    interval: 'month',
    stripePriceId: '',
    features: [
      'Unlimited reports',
      'All templates',
      'All comment types',
      'Community support'
    ]
  },
  {
    id: 'teacher_pro_annual',
    name: 'Teacher Pro (Annual)',
    price: 12.99,
    currency: 'USD',
    interval: 'year',
    stripePriceId: process.env.REACT_APP_STRIPE_PRICE_TEACHER_PRO_YEARLY || '',
    features: [
      'Everything in Free',
      'PDF export',
      'Priority support',
      'Remove branding'
    ]
  }
];

interface SubscriptionProviderProps {
  children: ReactNode;
}

export function SubscriptionProvider({ children }: SubscriptionProviderProps) {
  const [subscription, setSubscription] = useState<SubscriptionData>({
    hasActiveSubscription: false,
    planId: 'free',
    status: 'none'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stripe, setStripe] = useState<Stripe | null>(null);

  // Initialize Stripe
  useEffect(() => {
    const initStripe = async () => {
      const stripeInstance = await stripePromise;
      setStripe(stripeInstance);
    };
    initStripe();
  }, []);

  // Refresh subscription data
  const refreshSubscription = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // For now, just simulate API call since we don't have user authentication yet
      // In production, this would call your Netlify function to get subscription status
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // For testing, assume free plan
      setSubscription({
        hasActiveSubscription: false,
        planId: 'free',
        status: 'none'
      });
      
    } catch (err) {
      console.error('Error refreshing subscription:', err);
      setError('Failed to refresh subscription data');
    } finally {
      setIsLoading(false);
    }
  };

  // Create Stripe checkout session
  const createCheckoutSession = async (priceId: string) => {
    try {
      setIsLoading(true);
      setError(null);

      if (!stripe) {
        throw new Error('Stripe is not initialized');
      }

      // Call your Netlify function to create checkout session
      const response = await fetch('/.netlify/functions/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId,
          successUrl: `${window.location.origin}/subscription-success?session_id={CHECKOUT_SESSION_ID}`,
          cancelUrl: `${window.location.origin}/pricing`,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create checkout session');
      }

      const { url } = await response.json();

      // Redirect to Stripe Checkout
      window.location.href = url;

    } catch (err: any) {
      console.error('Error creating checkout session:', err);
      setError(err.message || 'Failed to start checkout process');
    } finally {
      setIsLoading(false);
    }
  };

  // Cancel subscription
  const cancelSubscription = async (subscriptionId: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/.netlify/functions/cancel-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscriptionId,
          cancelImmediately: false, // Cancel at period end
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to cancel subscription');
      }

      // Refresh subscription data
      await refreshSubscription();

    } catch (err: any) {
      console.error('Error canceling subscription:', err);
      setError(err.message || 'Failed to cancel subscription');
    } finally {
      setIsLoading(false);
    }
  };

  // Load subscription data on component mount
  useEffect(() => {
    refreshSubscription();
  }, []);

  const contextValue: SubscriptionContextType = {
    subscription,
    plans: SUBSCRIPTION_PLANS,
    isLoading,
    error,
    stripe,
    createCheckoutSession,
    cancelSubscription,
    refreshSubscription
  };

  return (
    <SubscriptionContext.Provider value={contextValue}>
      {children}
    </SubscriptionContext.Provider>
  );
}

// Custom hook to use subscription context
export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
}
