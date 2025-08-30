// src/components/subscription/MobilePricingPage.tsx
// Complete mobile-optimized pricing page

import React from 'react';
import { useSubscription } from '../../contexts/SubscriptionContext';
import { PLANS, Plan } from '../../types/subscription';

export default function MobilePricingPage() {
  const { currentPlan, createCheckoutSession, loading } = useSubscription();

  const handleUpgrade = async (planId: string) => {
    if (loading) return;
    await createCheckoutSession(planId);
  };

  const MobilePlanCard = ({ plan, isCurrentPlan }: { plan: Plan; isCurrentPlan: boolean }) => (
    <div className={`bg-white rounded-xl shadow-lg p-6 mb-4 mx-4 ${
      plan.id === 'teacher_pro_annual' ? 'border-2 border-blue-500 relative' : 'border border-gray-200'
    }`}>
      {plan.id === 'teacher_pro_annual' && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-medium">
            🌟 Most Popular
          </span>
        </div>
      )}
      
      <div className="text-center">
        <h3 className="text-xl font-bold text-gray-900 mb-3">{plan.name}</h3>
        
        <div className="mb-4">
          {plan.price === 0 ? (
            <span className="text-3xl font-bold text-gray-900">Free</span>
          ) : (
            <>
              <div className="text-3xl font-bold text-gray-900 mb-2">
                {plan.displayPrice || `$${plan.price}`}
              </div>
              {plan.displayPrice === 'Coming Soon' && (
                <div className="text-sm text-blue-600 font-medium">
                  Launching Soon - Join Waitlist
                </div>
              )}
            </>
          )}
        </div>

        <ul className="text-left space-y-2 mb-6 text-sm">
          {plan.features.map((feature, index) => (
            <li key={index} className="flex items-start">
              <svg className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span className="text-gray-700">{feature}</span>
            </li>
          ))}
        </ul>

        {isCurrentPlan ? (
          <button
            disabled
            className="w-full bg-gray-100 text-gray-500 py-3 px-4 rounded-lg font-medium cursor-not-allowed text-sm"
          >
            Current Plan
          </button>
        ) : plan.price === 0 ? (
          <button
            disabled
            className="w-full bg-gray-100 text-gray-500 py-3 px-4 rounded-lg font-medium cursor-not-allowed text-sm"
          >
            Always Free
          </button>
        ) : plan.displayPrice === 'Coming Soon' ? (
          <button
            onClick={() => handleUpgrade(plan.id)}
            className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white py-3 px-4 rounded-lg font-medium transition-colors text-sm touch-manipulation"
          >
            🚀 Join Early Access List
          </button>
        ) : (
          <button
            onClick={() => handleUpgrade(plan.id)}
            disabled={loading}
            className={`w-full py-3 px-4 rounded-lg font-medium transition-colors text-sm touch-manipulation ${
              plan.id === 'teacher_pro_annual'
                ? 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white shadow-lg'
                : 'bg-gray-800 hover:bg-gray-900 active:bg-black text-white'
            } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {loading ? 'Loading...' : `Get ${plan.name}`}
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      {/* Mobile Header */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-700 text-white px-4 pt-12 pb-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">
            Save 58+ Hours Per Year
          </h1>
          <p className="text-blue-100 text-sm leading-relaxed">
            Professional reports in 10 minutes instead of 45. Transform your most dreaded teaching task.
          </p>
          <div className="mt-4 inline-flex items-center px-3 py-1 bg-blue-500 bg-opacity-50 rounded-full">
            <span className="text-white font-medium text-xs">🚀 Coming Soon - Get Early Access</span>
          </div>
        </div>
      </div>

      {/* Value Stats - Mobile Optimized */}
      <div className="bg-white mx-4 -mt-6 rounded-xl shadow-lg p-4 mb-6 relative z-10">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-xl font-bold text-gray-900">58+</div>
            <div className="text-xs text-gray-600">Hours Saved</div>
          </div>
          <div>
            <div className="text-xl font-bold text-green-600">$1,740</div>
            <div className="text-xs text-gray-600">Time Value</div>
          </div>
          <div>
            <div className="text-xl font-bold text-blue-600">100%</div>
            <div className="text-xs text-gray-600">Free Testing</div>
          </div>
        </div>
      </div>

      {/* Pricing Cards - Mobile Stack */}
      <div className="space-y-4">
        {PLANS.map((plan) => (
          <MobilePlanCard
            key={plan.id}
            plan={plan}
            isCurrentPlan={currentPlan.id === plan.id}
          />
        ))}
      </div>

      {/* Mobile FAQ */}
      <div className="mx-4 mt-8">
        <h2 className="text-lg font-bold text-gray-900 mb-4 text-center">
          Common Questions
        </h2>
        
        <div className="space-y-3">
          <details className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
            <summary className="font-medium text-gray-900 cursor-pointer">
              When will pricing be announced?
            </summary>
            <p className="text-sm text-gray-600 mt-2">
              We're getting feedback from teachers to ensure fair pricing. Join early access for launch notifications.
            </p>
          </details>
          
          <details className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
            <summary className="font-medium text-gray-900 cursor-pointer">
              Will there be educational discounts?
            </summary>
            <p className="text-sm text-gray-600 mt-2">
              Absolutely! We're planning special rates for schools and districts.
            </p>
          </details>
        </div>
      </div>

      {/* Mobile Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
        <button
          onClick={() => handleUpgrade('teacher_pro_annual')}
          className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white py-3 px-4 rounded-lg font-medium transition-colors touch-manipulation"
        >
          🚀 Get Notified When We Launch
        </button>
      </div>
    </div>
  );
}
