import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSubscription } from '../../contexts/SubscriptionContext';

export default function PricingPage() {
  const { currentPlan, createCheckoutSession, loading } = useSubscription();
  const [selectedPlan, setSelectedPlan] = useState<string>('teacher_pro_annual');

  const handleUpgrade = async (planId: string) => {
    if (loading) return;
    
    const plan = plans.find(p => p.id === planId);
    if (plan && plan.stripePriceId) {
      try {
        await createCheckoutSession(plan.stripePriceId);
      } catch (error) {
        console.error('Checkout error:', error);
      }
    }
  };

  const plans = [
    {
      id: 'free',
      name: 'Free Plan',
      displayPrice: 'Free Forever',
      description: 'Perfect for trying out the tool',
      features: [
        'Unlimited report generation',
        'All report templates',
        'All comment types',
        'Community support'
      ],
      buttonText: 'Current Plan',
      buttonStyle: 'disabled',
      stripePriceId: ''
    },
    {
      id: 'teacher_pro_annual',
      name: 'Teacher Pro',
      displayPrice: 'Coming Soon',
      originalPrice: '$155.88/year',
      description: 'Everything you need for professional report writing',
      popular: true,
      features: [
        'Everything in Free Plan',
        'PDF export functionality',
        'Priority customer support',
        'Remove branding options',
        'Advanced templates',
        'Bulk export features'
      ],
      buttonText: 'Join Early Access List',
      buttonStyle: 'primary',
      stripePriceId: process.env.REACT_APP_STRIPE_PRICE_TEACHER_PRO_YEARLY
    }
  ];

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#f8fafc',
      padding: '40px 20px'
    }}>
      {/* Header */}
      <div style={{ 
        textAlign: 'center', 
        marginBottom: '60px',
        maxWidth: '800px',
        margin: '0 auto 60px auto'
      }}>
        <Link 
          to="/"
          style={{
            display: 'inline-block',
            color: '#64748b',
            textDecoration: 'none',
            marginBottom: '20px',
            fontSize: '14px',
            fontWeight: '500'
          }}
        >
          ← Back to Home
        </Link>
        
        <h1 style={{ 
          fontSize: '48px', 
          fontWeight: '800', 
          color: '#1e293b',
          marginBottom: '20px',
          lineHeight: '1.2'
        }}>
          Simple, Teacher-Friendly Pricing
        </h1>
        <p style={{
          fontSize: '20px',
          color: '#64748b',
          lineHeight: '1.6',
          marginBottom: '10px'
        }}>
          Save 58+ hours per year on report writing
        </p>
        <p style={{
          fontSize: '16px',
          color: '#94a3b8'
        }}>
          Join thousands of teachers who have streamlined their reporting process
        </p>
      </div>

      {/* Pricing Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
        gap: '30px',
        maxWidth: '900px',
        margin: '0 auto',
        marginBottom: '60px'
      }}>
        {plans.map((plan) => (
          <div
            key={plan.id}
            style={{
              backgroundColor: 'white',
              borderRadius: '16px',
              padding: '40px 30px',
              boxShadow: plan.popular 
                ? '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
                : '0 4px 6px rgba(0, 0, 0, 0.1)',
              border: plan.popular ? '2px solid #3b82f6' : '1px solid #e2e8f0',
              position: 'relative',
              transform: plan.popular ? 'scale(1.05)' : 'scale(1)',
              transition: 'all 0.3s ease'
            }}
          >
            {/* Popular Badge */}
            {plan.popular && (
              <div style={{
                position: 'absolute',
                top: '-12px',
                left: '50%',
                transform: 'translateX(-50%)',
                backgroundColor: '#3b82f6',
                color: 'white',
                padding: '6px 24px',
                borderRadius: '20px',
                fontSize: '14px',
                fontWeight: '600'
              }}>
                Most Popular
              </div>
            )}

            {/* Plan Header */}
            <div style={{ textAlign: 'center', marginBottom: '30px' }}>
              <h3 style={{
                fontSize: '24px',
                fontWeight: '700',
                color: '#1e293b',
                marginBottom: '8px'
              }}>
                {plan.name}
              </h3>
              <p style={{
                color: '#64748b',
                fontSize: '16px',
                marginBottom: '20px'
              }}>
                {plan.description}
              </p>
              
              {/* Price */}
              <div style={{ marginBottom: '10px' }}>
                <span style={{
                  fontSize: '48px',
                  fontWeight: '800',
                  color: plan.id === 'free' ? '#10b981' : '#3b82f6'
                }}>
                  {plan.displayPrice}
                </span>
                {plan.originalPrice && (
                  <div style={{
                    fontSize: '14px',
                    color: '#94a3b8',
                    textDecoration: 'line-through',
                    marginTop: '5px'
                  }}>
                    {plan.originalPrice}
                  </div>
                )}
              </div>
              
              {plan.id === 'teacher_pro_annual' && (
                <p style={{
                  fontSize: '14px',
                  color: '#10b981',
                  fontWeight: '600'
                }}>
                  Save $143/year vs monthly billing
                </p>
              )}
            </div>

            {/* Features */}
            <div style={{ marginBottom: '30px' }}>
              {plan.features.map((feature, index) => (
                <div
                  key={index}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    marginBottom: '12px'
                  }}
                >
                  <div style={{
                    width: '20px',
                    height: '20px',
                    backgroundColor: '#10b981',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: '12px',
                    flexShrink: 0
                  }}>
                    <span style={{ color: 'white', fontSize: '12px', fontWeight: 'bold' }}>✓</span>
                  </div>
                  <span style={{
                    color: '#374151',
                    fontSize: '16px'
                  }}>
                    {feature}
                  </span>
                </div>
              ))}
            </div>

            {/* CTA Button */}
            <button
              onClick={() => plan.buttonStyle !== 'disabled' && handleUpgrade(plan.id)}
              disabled={loading || plan.buttonStyle === 'disabled'}
              style={{
                width: '100%',
                padding: '16px 24px',
                borderRadius: '12px',
                fontSize: '18px',
                fontWeight: '600',
                border: 'none',
                cursor: plan.buttonStyle === 'disabled' ? 'not-allowed' : 'pointer',
                backgroundColor: plan.buttonStyle === 'disabled' 
                  ? '#e2e8f0' 
                  : plan.buttonStyle === 'primary' 
                    ? '#3b82f6' 
                    : '#f1f5f9',
                color: plan.buttonStyle === 'disabled' 
                  ? '#94a3b8' 
                  : plan.buttonStyle === 'primary' 
                    ? 'white' 
                    : '#374151',
                transition: 'all 0.2s ease',
                opacity: loading ? 0.7 : 1
              }}
              onMouseEnter={(e) => {
                if (plan.buttonStyle === 'primary' && !loading) {
                  e.currentTarget.style.backgroundColor = '#2563eb';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }
              }}
              onMouseLeave={(e) => {
                if (plan.buttonStyle === 'primary' && !loading) {
                  e.currentTarget.style.backgroundColor = '#3b82f6';
                  e.currentTarget.style.transform = 'translateY(0)';
                }
              }}
            >
              {loading ? 'Processing...' : plan.buttonText}
            </button>
          </div>
        ))}
      </div>

      {/* FAQ Section */}
      <div style={{
        maxWidth: '700px',
        margin: '0 auto',
        textAlign: 'center'
      }}>
        <h2 style={{
          fontSize: '32px',
          fontWeight: '700',
          color: '#1e293b',
          marginBottom: '40px'
        }}>
          Frequently Asked Questions
        </h2>
        
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '30px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          textAlign: 'left'
        }}>
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1e293b', marginBottom: '8px' }}>
              How much time will this save me?
            </h3>
            <p style={{ color: '#64748b', lineHeight: '1.6' }}>
              Teachers report saving 58+ hours per year, reducing report writing from 45 minutes per student to just 10 minutes.
            </p>
          </div>
          
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1e293b', marginBottom: '8px' }}>
              When will pricing be announced?
            </h3>
            <p style={{ color: '#64748b', lineHeight: '1.6' }}>
              We're currently gathering feedback from teachers to ensure our pricing is fair and accessible. Join our early access list to be notified first.
            </p>
          </div>
          
          <div style={{ marginBottom: '0' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1e293b', marginBottom: '8px' }}>
              Can I cancel anytime?
            </h3>
            <p style={{ color: '#64748b', lineHeight: '1.6' }}>
              Absolutely. No long-term commitments, cancel with just a few clicks whenever you want.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}