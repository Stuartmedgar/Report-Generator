-- Follow-up to 20260714120000_enable_rls.sql, based on findings from
-- `supabase db advisors` run immediately after that migration:
--
-- 1. A pre-existing policy "Allow insert during signup" on public.users had
--    WITH CHECK (true) - unrestricted. Postgres OR's multiple policies for
--    the same operation together, so this silently undid the strict insert
--    policy just added. Not present in any tracked migration - was created
--    directly in the dashboard at some point. Dropping it.
--
-- 2. public.decrement_ai_credit was callable by anon/authenticated directly
--    via /rest/v1/rpc/decrement_ai_credit. It does balance - amount with no
--    ownership check, so calling it with a negative amount increases any
--    user's balance for free. It's only ever meant to be called from the
--    edge function's service-role client. Revoking public execute entirely.
--
-- 3. public.is_admin and public.redeem_promo_code were also callable by the
--    anon (fully unauthenticated) role via RPC. is_admin needs to stay
--    callable by `authenticated` (the users RLS policies depend on it), and
--    redeem_promo_code needs to stay callable by `authenticated` (the real
--    client call in PricingPage.tsx), but neither needs anon access.
--    redeem_promo_code also didn't check that the caller was redeeming for
--    themselves - adding that check too.

drop policy if exists "Allow insert during signup" on public.users;

revoke execute on function public.decrement_ai_credit(uuid, integer) from public, anon, authenticated;

revoke execute on function public.is_admin(uuid) from anon;
revoke execute on function public.redeem_promo_code(text, uuid) from anon;

create or replace function public.redeem_promo_code(p_code text, p_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_promo public.promo_codes%rowtype;
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
    set pro_expires_at = greatest(coalesce(pro_expires_at, now()), now()) + make_interval(days => v_promo.value)
    where id = p_user_id;
  end if;

  insert into public.promo_redemptions (code_id, user_id) values (v_promo.id, p_user_id);
  update public.promo_codes set redemption_count = redemption_count + 1 where id = v_promo.id;

  return jsonb_build_object('grant_type', v_promo.grant_type, 'value', v_promo.value);
end;
$$;
