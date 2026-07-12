// Shared transport for the generate-template edge function — attaches the
// caller's auth token (needed for server-side AI credit metering) and turns
// an insufficient-credit response into a typed error the UI can catch.
import { supabase } from '../lib/supabase';

const GENERATE_TEMPLATE_URL = 'https://wozbrojwuzktwrzngllh.supabase.co/functions/v1/generate-template';

export class InsufficientCreditError extends Error {
  constructor() {
    super("You've used all of your AI credit for building templates. Upgrade to Pro for more.");
    this.name = 'InsufficientCreditError';
  }
}

export class AuthRequiredError extends Error {
  constructor() {
    super('Sign up free to use AI-assisted building.');
    this.name = 'AuthRequiredError';
  }
}

export async function callGenerateTemplate(body: Record<string, any>): Promise<any> {
  const { data: { session } } = await supabase.auth.getSession();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`;
  }

  const response = await fetch(GENERATE_TEMPLATE_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  let data: any = null;
  try {
    data = await response.json();
  } catch {
    // no JSON body — handled by the !response.ok check below
  }

  if (response.status === 402 || data?.error === 'insufficient_credit') {
    throw new InsufficientCreditError();
  }
  if (response.status === 401) {
    throw new AuthRequiredError();
  }
  if (!response.ok) {
    throw new Error(data?.error || 'API call failed');
  }
  return data;
}
