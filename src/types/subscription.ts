// src/types/subscription.ts
// Complete subscription types file

export interface Subscription {
  id: string;
  userId: string;
  planId: string;
  status: 'active' | 'canceled' | 'past_due' | 'incomplete';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
}

export interface Plan {
  id: string;
  name: string;
  price: number;
  interval: 'month' | 'year';
  features: string[];
  stripePriceId: string;
  reportsLimit?: number; // undefined = unlimited
  templatesLimit?: number; // undefined = unlimited
  displayPrice?: string; // For showing custom pricing during testing
}

export const PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    interval: 'month',
    features: [
      'Unlimited template creation',
      '$1 of AI credit for building templates',
      'Write up to 5 reports',
      'All comment types'
    ],
    stripePriceId: '',
    reportsLimit: 5,
    templatesLimit: undefined, // Unlimited
    displayPrice: 'Free'
  },
  {
    id: 'teacher_pro_annual',
    name: 'Teacher Pro',
    price: 12.99, // Keep actual price for backend logic
    interval: 'year',
    features: [
      'Everything in Free',
      'Unlimited reports',
      '$4 of AI credit for building templates',
      'Template sharing',
      'Priority email support'
    ],
    stripePriceId: 'price_teacherpro_yearly',
    reportsLimit: undefined,
    templatesLimit: undefined,
    displayPrice: 'Coming Soon' // Hide actual price during testing
  },
  {
    id: 'teacher_pro_monthly',
    name: 'Teacher Pro Monthly',
    price: 1.99,
    interval: 'month',
    features: [
      'Everything in Free',
      'PDF export',
      'Priority email support',
      'Pay monthly if preferred',
      'Cancel anytime'
    ],
    stripePriceId: 'price_teacherpro_monthly',
    reportsLimit: undefined,
    templatesLimit: undefined,
    displayPrice: 'Coming Soon'
  }
];

export interface UsageTracking {
  userId: string;
  month: string; // format: 'YYYY-MM'
  reportsCreated: number;
  templatesUsed: Set<string>;
}
