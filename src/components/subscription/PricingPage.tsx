// src/components/subscription/PricingPage.tsx
// Complete desktop pricing page

import React from 'react';
import { useSubscription } from '../../contexts/SubscriptionContext';
import { PLANS, Plan } from '../../types/subscription';

export default function PricingPage() {
  const { currentPlan, createCheckoutSession, loading } = useSubscription();

  const handleUpgrade = async (planId: string) => {
    if (loading) return;
    await createCheckoutSession(planId);
  };

  const PlanCard = ({ plan, isCurrentPlan }: { plan: Plan; isCurrentPlan: boolean }) => (
    <div className={`bg-white rounded-lg shadow-lg p-8 relative ${
      plan.id === 'teacher_pro_annual' ? 'border-2 border-blue-500 transform scale-105' : 'border border-gray-200'
    }`}>
      {plan.id === 'teacher_pro_annual' && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
          <span className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-medium">
            🌟 Most Popular
          </span>
        </div>
      )}
      
      <div className="text-center">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
        
        <div className="mb-4">
          {plan.price === 0 ? (
            <span className="text-4xl font-bold text-gray-900">Free</span>
          ) : (
            <>
              <div className="text-4xl font-bold text-gray-900 mb-2">
                {plan.displayPrice || `$${plan.price}`}
              </div>
              {plan.displayPrice === 'Coming Soon' && (
                <div className="text-sm text-blue-600 font-medium">
                  Launching Soon - Join Waitlist
                </div>
              )}
              {!plan.displayPrice && (
                <>
                  <span className="text-gray-600">/{plan.interval}</span>
                  {plan.interval === 'year' && (
                    <div className="text-sm text-green-600 font-medium mt-1">
                      Just $1.08/month!
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>

        <ul className="text-left space-y-3 mb-8">
          {plan.features.map((feature, index) => (
            <li key={index} className="flex items-start">
              <svg className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span className="text-gray-700">{feature}</span>
            </li>
          ))}
        </ul>

        {isCurrentPlan ? (
          <button
            disabled
            className="w-full bg-gray-100 text-gray-500 py-3 px-6 rounded-lg font-medium cursor-not-allowed"
          >
            Current Plan
          </button>
        ) : plan.price === 0 ? (
          <button
            disabled
            className="w-full bg-gray-100 text-gray-500 py-3 px-6 rounded-lg font-medium cursor-not-allowed"
          >
            Always Free
          </button>
        ) : plan.displayPrice === 'Coming Soon' ? (
          <button
            onClick={() => handleUpgrade(plan.id)}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-lg font-medium transition-colors"
          >
            🚀 Join Early Access List
          </button>
        ) : (
          <button
            onClick={() => handleUpgrade(plan.id)}
            disabled={loading}
            className={`w-full py-3 px-6 rounded-lg font-medium transition-colors ${
              plan.id === 'teacher_pro_annual'
                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg'
                : 'bg-gray-800 hover:bg-gray-900 text-white'
            } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {loading ? 'Loading...' : `Get ${plan.name}`}
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Save 58+ Hours Per Year on Report Writing
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Professional reports in 10 minutes instead of 45. Transform your most dreaded teaching 
            task into something quick and effortless.
          </p>
          <div className="mt-6 inline-flex items-center px-4 py-2 bg-blue-100 border border-blue-200 rounded-full">
            <span className="text-blue-700 font-medium text-sm">🚀 Coming Soon - Get Early Access</span>
          </div>
        </div>

        {/* Value Proposition */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-8 mb-12 text-center border border-blue-100">
          <div className="grid md:grid-cols-3 gap-6 items-center">
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900">58+ Hours</div>
              <div className="text-sm text-gray-600">Saved per year</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">$1,740</div>
              <div className="text-sm text-gray-600">Value of time saved</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">100%</div>
              <div className="text-sm text-gray-600">Free during testing</div>
            </div>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {PLANS.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              isCurrentPlan={currentPlan.id === plan.id}
            />
          ))}
        </div>

        {/* FAQ Section */}
        <div className="mt-16 max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-8">
            Frequently Asked Questions
          </h2>
          
          <div className="space-y-6">
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-2">
                When will pricing be announced?
              </h3>
              <p className="text-gray-600">
                We're currently getting feedback from teachers to ensure fair, affordable pricing. Join our early access list to be notified first and get special launch pricing.
              </p>
            </div>
            
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-2">
                What happens to my data if I don't subscribe?
              </h3>
              <p className="text-gray-600">
                Your data remains safe and accessible. You'll continue with the free plan features and can upgrade anytime to unlock unlimited access.
              </p>
            </div>
            
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-2">
                Will there be educational discounts?
              </h3>
              <p className="text-gray-600">
                Absolutely! We're educators supporting educators. We're planning special rates for schools, districts, and bulk purchases.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
