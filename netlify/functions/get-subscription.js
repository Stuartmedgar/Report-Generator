const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const { customerId } = event.queryStringParameters || {};

    if (!customerId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Customer ID is required' }),
      };
    }

    // Get customer's subscriptions
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: 'active',
      limit: 10,
    });

    if (subscriptions.data.length === 0) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          hasActiveSubscription: false,
          planId: 'free',
          status: 'none',
        }),
      };
    }

    const subscription = subscriptions.data[0]; // Get the most recent active subscription
    const price = subscription.items.data[0]?.price;

    // Determine plan ID based on price
    let planId = 'free';
    if (price?.id === process.env.STRIPE_PRICE_TEACHER_PRO_MONTHLY) {
      planId = 'teacher_pro_monthly';
    } else if (price?.id === process.env.STRIPE_PRICE_TEACHER_PRO_YEARLY) {
      planId = 'teacher_pro_annual';
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        hasActiveSubscription: true,
        planId,
        status: subscription.status,
        subscriptionId: subscription.id,
        currentPeriodEnd: subscription.current_period_end,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        customerId: subscription.customer,
        priceId: price?.id,
        amount: price?.unit_amount,
        currency: price?.currency,
        interval: price?.recurring?.interval,
      }),
    };
  } catch (error) {
    console.error('Error fetching subscription:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Failed to fetch subscription',
        details: error.message,
      }),
    };
  }
};
