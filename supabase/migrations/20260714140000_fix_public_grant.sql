-- Follow-up to 20260714130000_lock_down_rpcs.sql: revoking EXECUTE from
-- `anon` directly wasn't enough for is_admin/redeem_promo_code, because
-- Postgres grants EXECUTE to the PUBLIC pseudo-role by default on function
-- creation, and every role (anon included) implicitly inherits PUBLIC's
-- privileges. Revoking from PUBLIC and re-granting to authenticated only
-- (both functions are called by logged-in users - is_admin from the users
-- RLS policies, redeem_promo_code directly from PricingPage.tsx).

revoke execute on function public.is_admin(uuid) from public;
grant execute on function public.is_admin(uuid) to authenticated;

revoke execute on function public.redeem_promo_code(text, uuid) from public;
grant execute on function public.redeem_promo_code(text, uuid) to authenticated;
