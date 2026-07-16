-- New promo grant type: "pro_year" — gives a code redeemer the same thing a
-- real paying Pro subscriber gets (Pro plan + the $4 AI credit allowance),
-- but for a full year up front rather than monthly billing. Used to hand
-- out free unlimited-style access to specific people (e.g. beta testers)
-- without needing a Stripe subscription.
--
-- Note: unlike a real subscriber, this credit is a one-time $4 grant for
-- the year, not a monthly refill (that would need a cron job to replicate
-- Stripe's invoice.payment_succeeded reset). If a promo user burns through
-- it before the year is up, top them up manually the same way — there's no
-- self-serve renewal for promo grants.

alter table public.promo_codes
  drop constraint if exists promo_codes_grant_type_check;
alter table public.promo_codes
  add constraint promo_codes_grant_type_check
  check (grant_type in ('free_pro_days', 'bonus_ai_credit_cents', 'pro_year'));

create or replace function public.redeem_promo_code(p_code text, p_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_promo public.promo_codes%rowtype;
  v_pro_year_credit_cents constant integer := 400; -- matches PRO_PLAN_CREDIT_CENTS in netlify/functions/webhook.js
begin
  if p_user_id is distinct from auth.uid() then
    raise exception 'not_authorized';
  end if;

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
    set plan = 'pro',
        pro_expires_at = greatest(coalesce(pro_expires_at, now()), now()) + make_interval(days => v_promo.value)
    where id = p_user_id;
  elsif v_promo.grant_type = 'pro_year' then
    update public.users
    set plan = 'pro',
        pro_expires_at = greatest(coalesce(pro_expires_at, now()), now()) + make_interval(days => v_promo.value),
        ai_credit_balance_cents = greatest(ai_credit_balance_cents, v_pro_year_credit_cents)
    where id = p_user_id;
  end if;

  insert into public.promo_redemptions (code_id, user_id) values (v_promo.id, p_user_id);
  update public.promo_codes set redemption_count = redemption_count + 1 where id = v_promo.id;

  return jsonb_build_object('grant_type', v_promo.grant_type, 'value', v_promo.value);
end;
$$;
