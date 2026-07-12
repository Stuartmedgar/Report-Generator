const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { createClient } = require('@supabase/supabase-js');

const PRO_PLAN_CREDIT_CENTS = 400; // $4.00

function supabaseAdmin() {
  // Reuses the site's existing REACT_APP_SUPABASE_URL if a bare SUPABASE_URL
  // isn't set separately — same project, just avoids a duplicate Netlify var.
  const url = process.env.SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Stripe-Signature',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  const sig = event.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let stripeEvent;

  try {
    // Verify webhook signature
    stripeEvent = stripe.webhooks.constructEvent(event.body, sig, webhookSecret);
  } catch (err) {
    console.error(`Webhook signature verification failed:`, err.message);
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Webhook signature verification failed' }),
    };
  }

  try {
    // Handle the event
    switch (stripeEvent.type) {
      case 'checkout.session.completed': {
        const session = stripeEvent.data.object;
        const userId = session.client_reference_id || session.metadata?.user_id;
        console.log(`Payment successful for session: ${session.id}, user: ${userId}`);

        const admin = supabaseAdmin();
        if (admin && userId) {
          const { error } = await admin
            .from('users')
            .update({
              plan: 'pro',
              stripe_customer_id: session.customer,
              stripe_subscription_id: session.subscription,
              subscription_status: 'active',
              ai_credit_balance_cents: PRO_PLAN_CREDIT_CENTS,
            })
            .eq('id', userId);
          if (error) console.error('Failed to persist checkout.session.completed:', error);
        } else {
          console.error('checkout.session.completed: missing admin client or userId — could not upgrade plan');
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = stripeEvent.data.object;
        console.log(`Subscription canceled: ${subscription.id}`);

        const admin = supabaseAdmin();
        if (admin) {
          const { error } = await admin
            .from('users')
            .update({ plan: 'free', subscription_status: 'canceled' })
            .eq('stripe_subscription_id', subscription.id);
          if (error) console.error('Failed to persist customer.subscription.deleted:', error);
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = stripeEvent.data.object;
        console.log(`Payment succeeded for invoice: ${invoice.id}`);

        // Renewal top-up — reset the Pro AI credit allowance for the new billing period.
        const admin = supabaseAdmin();
        if (admin && invoice.subscription) {
          const { error } = await admin
            .from('users')
            .update({ subscription_status: 'active', ai_credit_balance_cents: PRO_PLAN_CREDIT_CENTS })
            .eq('stripe_subscription_id', invoice.subscription);
          if (error) console.error('Failed to persist invoice.payment_succeeded:', error);
        }
        break;
      }

      case 'invoice.payment_failed':
        const failedInvoice = stripeEvent.data.object;
        console.log(`Payment failed for invoice: ${failedInvoice.id}`);
        
        // Handle failed payment
        // 1. Send payment failure notification
        // 2. Provide instructions for updating payment method
        // 3. Set grace period before access restriction
        
        console.log('Payment failed:', {
          customerId: failedInvoice.customer,
          subscriptionId: failedInvoice.subscription,
          attemptCount: failedInvoice.attempt_count,
        });
        break;

      default:
        console.log(`Unhandled event type: ${stripeEvent.type}`);
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ received: true }),
    };
  } catch (error) {
    console.error('Error processing webhook:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Webhook processing failed',
        details: error.message 
      }),
    };
  }
};
