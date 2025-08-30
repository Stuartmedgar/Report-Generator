const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

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
      case 'checkout.session.completed':
        const session = stripeEvent.data.object;
        console.log(`Payment successful for session: ${session.id}`);
        
        // Here you would typically:
        // 1. Save subscription data to your database
        // 2. Send confirmation email to customer
        // 3. Update user's account status
        
        // For now, just log the successful payment
        console.log('Subscription created:', {
          customerId: session.customer,
          subscriptionId: session.subscription,
          customerEmail: session.customer_details?.email,
        });
        break;

      case 'customer.subscription.deleted':
        const subscription = stripeEvent.data.object;
        console.log(`Subscription canceled: ${subscription.id}`);
        
        // Handle subscription cancellation
        // 1. Update user's account status
        // 2. Send cancellation confirmation email
        // 3. Optionally send feedback survey
        
        console.log('Subscription cancelled:', {
          subscriptionId: subscription.id,
          customerId: subscription.customer,
          canceledAt: new Date(subscription.canceled_at * 1000),
        });
        break;

      case 'invoice.payment_succeeded':
        const invoice = stripeEvent.data.object;
        console.log(`Payment succeeded for invoice: ${invoice.id}`);
        
        // Handle successful payment
        // 1. Extend user's subscription
        // 2. Send payment confirmation email
        // 3. Update usage limits if applicable
        
        console.log('Payment succeeded:', {
          customerId: invoice.customer,
          subscriptionId: invoice.subscription,
          amount: invoice.amount_paid,
          currency: invoice.currency,
        });
        break;

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
