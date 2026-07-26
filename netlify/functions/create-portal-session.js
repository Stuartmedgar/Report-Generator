const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { createClient } = require('@supabase/supabase-js');

function supabaseAdmin() {
  const url = process.env.SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const { userId, returnUrl } = JSON.parse(event.body);

    if (!userId) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'userId is required' }) };
    }

    const admin = supabaseAdmin();
    if (!admin) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'Server misconfigured' }) };
    }

    const { data: userRow, error: userError } = await admin
      .from('users')
      .select('stripe_customer_id')
      .eq('id', userId)
      .single();

    if (userError || !userRow?.stripe_customer_id) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'No Stripe customer found for this account' }),
      };
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: userRow.stripe_customer_id,
      return_url: returnUrl || process.env.URL || '/',
    });

    return { statusCode: 200, headers, body: JSON.stringify({ url: session.url }) };
  } catch (error) {
    console.error('Error creating portal session:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to create portal session', details: error.message }),
    };
  }
};
