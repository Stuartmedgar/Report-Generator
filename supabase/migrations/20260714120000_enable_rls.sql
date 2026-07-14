-- Fix: RLS was never enabled on public.users, or on the three tables added
-- by the pricing-tiers migration (ai_usage_events, promo_codes,
-- promo_redemptions). Without RLS, any anon/authenticated client - i.e.
-- anyone with the project URL - can read and write every row in these
-- tables directly via the PostgREST API, regardless of the app's own
-- checks. Flagged by Supabase as a critical security issue on 12 Jul 2026.

-- users

alter table public.users enable row level security;

-- Used to let a real admin (public.users.role = 'admin') see/manage all
-- rows via the /admin dashboard, without recursive-policy issues - this
-- runs as SECURITY DEFINER so its own lookup bypasses RLS.
create or replace function public.is_admin(uid uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (select 1 from public.users where id = uid and role = 'admin');
$$;

drop policy if exists "users_select_own_or_admin" on public.users;
create policy "users_select_own_or_admin" on public.users
  for select
  using (auth.uid() = id or public.is_admin(auth.uid()));

-- Signup creates the row client-side (see AuthContext.tsx) - only allow it
-- for the signing-up user's own id, and only with the safe starter values.
-- Anything billing-related can only ever be set afterwards by the
-- service-role edge function / Stripe webhook / RPCs below, never by the
-- client that just created the account.
drop policy if exists "users_insert_own_defaults_only" on public.users;
create policy "users_insert_own_defaults_only" on public.users
  for insert
  with check (
    auth.uid() = id
    and role = 'teacher'
    and plan = 'free'
    and ai_credit_balance_cents = 100
    and stripe_customer_id is null
    and stripe_subscription_id is null
    and subscription_status is null
    and pro_expires_at is null
  );

drop policy if exists "users_update_own_or_admin" on public.users;
create policy "users_update_own_or_admin" on public.users
  for update
  using (auth.uid() = id or public.is_admin(auth.uid()))
  with check (auth.uid() = id or public.is_admin(auth.uid()));

drop policy if exists "users_delete_admin_only" on public.users;
create policy "users_delete_admin_only" on public.users
  for delete
  using (public.is_admin(auth.uid()));

-- Column-level lockdown on top of the row policy above: even on their own
-- row, a logged-in client can only ever touch profile fields directly.
-- plan / credit / role / Stripe fields are service-role-only from here on
-- (service_role bypasses RLS and these grants entirely, so the edge
-- function, Stripe webhook and the two RPCs below are unaffected).
revoke update on public.users from authenticated;
grant update (first_name, last_name, updated_at, is_approved) on public.users to authenticated;

-- ai_usage_events / promo_codes / promo_redemptions
-- None of these are (or should be) queried directly by the client - usage
-- events are written by the edge function's service-role client, and promo
-- codes are only ever touched via the SECURITY DEFINER redeem_promo_code
-- RPC below, which bypasses RLS on its own. Enabling RLS with no
-- anon/authenticated policies locks all three to service-role-only access.

alter table public.ai_usage_events enable row level security;
alter table public.promo_codes enable row level security;
alter table public.promo_redemptions enable row level security;
