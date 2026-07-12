-- Free/Paid tier system: AI credit metering, report cap, promo codes
-- See /Users/stuartedgar/.claude/plans/transient-brewing-kahn.md for full context.

-- ─── users: plan + credit + billing columns ────────────────────────────────

alter table public.users
  add column if not exists plan text not null default 'free',
  add column if not exists ai_credit_balance_cents integer not null default 100,
  add column if not exists stripe_customer_id text,
  add column if not exists stripe_subscription_id text,
  add column if not exists subscription_status text,
  add column if not exists pro_expires_at timestamptz;

alter table public.users
  drop constraint if exists users_plan_check;
alter table public.users
  add constraint users_plan_check check (plan in ('free', 'pro'));

-- ─── AI usage audit trail ───────────────────────────────────────────────────

create table if not exists public.ai_usage_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  mode text not null,
  model text not null,
  input_tokens integer not null default 0,
  output_tokens integer not null default 0,
  cost_cents numeric not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists ai_usage_events_user_id_idx on public.ai_usage_events(user_id);

-- ─── Promo codes ─────────────────────────────────────────────────────────────

create table if not exists public.promo_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  grant_type text not null check (grant_type in ('free_pro_days', 'bonus_ai_credit_cents')),
  value integer not null,
  max_redemptions integer,
  redemption_count integer not null default 0,
  expires_at timestamptz,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.promo_redemptions (
  id uuid primary key default gen_random_uuid(),
  code_id uuid not null references public.promo_codes(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  redeemed_at timestamptz not null default now(),
  unique (code_id, user_id)
);

-- ─── RPCs ────────────────────────────────────────────────────────────────────

-- Atomic decrement, floored at 0 so a race can't push the balance negative.
create or replace function public.decrement_ai_credit(p_user_id uuid, p_amount_cents integer)
returns void
language sql
security definer
set search_path = public
as $$
  update public.users
  set ai_credit_balance_cents = greatest(0, ai_credit_balance_cents - p_amount_cents)
  where id = p_user_id;
$$;

-- Validates and applies a promo code redemption atomically; raises on any
-- invalid state so the caller gets a clear Postgres error to surface.
create or replace function public.redeem_promo_code(p_code text, p_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_promo public.promo_codes%rowtype;
begin
  select * into v_promo from public.promo_codes where code = p_code for update;

  if not found then
    raise exception 'invalid_code';
  end if;
  if not v_promo.active then
    raise exception 'code_inactive';
  end if;
  if v_promo.expires_at is not null and v_promo.expires_at < now() then
    raise exception 'code_expired';
  end if;
  if v_promo.max_redemptions is not null and v_promo.redemption_count >= v_promo.max_redemptions then
    raise exception 'code_exhausted';
  end if;
  if exists (select 1 from public.promo_redemptions where code_id = v_promo.id and user_id = p_user_id) then
    raise exception 'already_redeemed';
  end if;

  if v_promo.grant_type = 'bonus_ai_credit_cents' then
    update public.users
    set ai_credit_balance_cents = ai_credit_balance_cents + v_promo.value
    where id = p_user_id;
  elsif v_promo.grant_type = 'free_pro_days' then
    update public.users
    set pro_expires_at = greatest(coalesce(pro_expires_at, now()), now()) + make_interval(days => v_promo.value)
    where id = p_user_id;
  end if;

  insert into public.promo_redemptions (code_id, user_id) values (v_promo.id, p_user_id);
  update public.promo_codes set redemption_count = redemption_count + 1 where id = v_promo.id;

  return jsonb_build_object('grant_type', v_promo.grant_type, 'value', v_promo.value);
end;
$$;
