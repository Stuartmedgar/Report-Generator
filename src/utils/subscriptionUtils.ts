// Subscription utility functions - matches your utils folder pattern

/**
 * Format subscription status for display
 */
export function formatSubscriptionStatus(status: string): string {
  switch (status) {
    case 'active':
      return 'Active';
    case 'trialing':
      return 'Trial';
    case 'past_due':
      return 'Past Due';
    case 'canceled':
      return 'Canceled';
    case 'unpaid':
      return 'Payment Required';
    default:
      return 'Unknown';
  }
}

/**
 * Check if subscription includes a specific feature
 */
export function hasFeature(planId: string, feature: string): boolean {
  const planFeatures: Record<string, string[]> = {
    'free': ['basic_templates', 'limited_reports', 'community_support'],
    'teacher_pro_annual': [
      'all_templates', 
      'unlimited_reports', 
      'pdf_export', 
      'priority_support', 
      'remove_branding'
    ],
    'teacher_pro_monthly': [
      'all_templates', 
      'unlimited_reports', 
      'pdf_export', 
      'priority_support', 
      'remove_branding'
    ]
  };

  return planFeatures[planId]?.includes(feature) || false;
}

/**
 * Get plan display name
 */
export function getPlanDisplayName(planId: string): string {
  const planNames: Record<string, string> = {
    'free': 'Free Plan',
    'teacher_pro_annual': 'Teacher Pro (Annual)',
    'teacher_pro_monthly': 'Teacher Pro (Monthly)'
  };

  return planNames[planId] || 'Unknown Plan';
}

/**
 * Calculate savings for annual vs monthly
 */
export function calculateAnnualSavings(monthlyPrice: number, annualPrice: number): number {
  const monthlyTotal = monthlyPrice * 12;
  return Math.round((monthlyTotal - annualPrice) * 100) / 100;
}

/**
 * Format currency for display
 */
export function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2
  }).format(amount);
}

/**
 * Get plan color theme for UI
 */
export function getPlanColor(planId: string): { bg: string; text: string; border: string } {
  const colors: Record<string, { bg: string; text: string; border: string }> = {
    'free': {
      bg: 'bg-gray-50',
      text: 'text-gray-700',
      border: 'border-gray-200'
    },
    'teacher_pro_annual': {
      bg: 'bg-blue-50',
      text: 'text-blue-700',
      border: 'border-blue-200'
    },
    'teacher_pro_monthly': {
      bg: 'bg-purple-50',
      text: 'text-purple-700',
      border: 'border-purple-200'
    }
  };

  return colors[planId] || colors['free'];
}

/**
 * Validate subscription webhook signature (for security)
 */
export function validateWebhookSignature(signature: string, secret: string, payload: string): boolean {
  // This would typically use crypto.createHmac in a Node.js environment
  // For now, just return true - implement proper validation in production
  return true;
}

/**
 * Get friendly error messages for subscription errors
 */
export function getSubscriptionErrorMessage(error: any): string {
  if (error?.code) {
    switch (error.code) {
      case 'card_declined':
        return 'Your card was declined. Please check your card details and try again.';
      case 'expired_card':
        return 'Your card has expired. Please update your payment method.';
      case 'insufficient_funds':
        return 'Your card has insufficient funds. Please try a different payment method.';
      case 'incorrect_cvc':
        return 'Your card security code is incorrect. Please check and try again.';
      case 'processing_error':
        return 'There was an error processing your payment. Please try again.';
      case 'rate_limit':
        return 'Too many requests. Please wait a moment and try again.';
      default:
        return error.message || 'An unexpected error occurred. Please try again.';
    }
  }
  
  return error?.message || 'An unexpected error occurred. Please try again.';
}
