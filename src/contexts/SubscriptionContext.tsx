// src/contexts/SubscriptionContext.tsx
// Complete subscription context - no usage limits for testing

import React, { createContext, useContext, useEffect, useState } from 'react';
import { loadStripe, Stripe } from '@stripe/stripe-js';
import { Subscription, Plan, PLANS } from '../types/subscription';

interface SubscriptionContextType {
  subscription: Subscription | null;
  currentPlan: Plan;
  loading: boolean;
  createCheckoutSession: (planId: string) => Promise<void>;
  cancelSubscription: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

// Initialize Stripe (replace with your publishable key)
const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY || 'pk_test_your_key');

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  // Get current user ID (integrate with your auth system when ready)
  const getCurrentUserId = () => {
    return localStorage.getItem('userId') || `anonymous_${Date.now()}`;
  };

  // Get current plan based on subscription
  const currentPlan = subscription?.status === 'active' 
    ? PLANS.find(plan => plan.id === subscription.planId) || PLANS[0]
    : PLANS[0]; // Default to free plan

  // Load subscription data
  useEffect(() => {
    loadUserSubscription();
  }, []);

  const loadUserSubscription = async () => {
    try {
      const userId = getCurrentUserId();
      
      // For now, simulate subscription check (replace with actual API call when ready)
      const mockSubscription = {
        id: 'sub_' + userId,
        userId: userId,
        planId: 'free', // Start everyone on free plan
        status: 'active' as const,
        currentPeriodStart: new Date().toISOString(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        cancelAtPeriodEnd: false
      };
      
      setSubscription(mockSubscription);
    } catch (error) {
      console.error('Failed to load subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  const createCheckoutSession = async (planId: string) => {
    try {
      const stripe = await stripePromise;
      if (!stripe) throw new Error('Stripe failed to load');

      const userId = getCurrentUserId();
      
      // For testing phase, just show alert
      if (PLANS.find(p => p.id === planId)?.displayPrice === 'Coming Soon') {
        alert('Thanks for your interest! We\'ll notify you when pricing is announced and you can upgrade.');
        return;
      }
      
      const response = await fetch('/.netlify/functions/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, planId })
      });

      if (!response.ok) throw new Error('Network response was not ok');

      const { sessionId } = await response.json();
      
      const { error } = await stripe.redirectToCheckout({ sessionId });
      if (error) {
        console.error('Stripe checkout error:', error);
        alert('Failed to start checkout. Please try again.');
      }
    } catch (error) {
      console.error('Failed to create checkout session:', error);
      alert('Failed to start checkout process. Please try again.');
    }
  };

  const cancelSubscription = async () => {
    try {
      const userId = getCurrentUserId();
      
      const response = await fetch('/.netlify/functions/cancel-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });

      if (response.ok) {
        await loadUserSubscription(); // Refresh subscription data
        alert('Subscription cancelled successfully. You can continue using Pro features until the end of your billing period.');
      } else {
        throw new Error('Failed to cancel subscription');
      }
    } catch (error) {
      console.error('Failed to cancel subscription:', error);
      alert('Failed to cancel subscription. Please contact support.');
    }
  };

  const value: SubscriptionContextType = {
    subscription,
    currentPlan,
    loading,
    createCheckoutSession,
    cancelSubscription
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
}
