-- Fix: new signups were failing with "new row violates row-level security
-- policy for table users". Root cause: AuthContext.tsx's signUp() inserts
-- the public.users profile row immediately after calling
-- supabase.auth.signUp() — but because email confirmation is required,
-- there's no authenticated session yet at that point, so the client-side
-- insert runs as anon. The strict users_insert_own_defaults_only policy
-- (auth.uid() = id) added on 2026-07-14 correctly blocks that, since
-- auth.uid() is null for an unauthenticated request. Before that policy,
-- an old permissive "Allow insert during signup" policy (WITH CHECK (true))
-- let it through unconditionally, masking this timing issue entirely.
--
-- Fix: create the profile row server-side via a trigger on auth.users,
-- which runs as part of the same transaction as the signup itself and is
-- SECURITY DEFINER, so it bypasses RLS — no client-side insert or session
-- timing dependency at all. This is Supabase's own documented pattern for
-- this exact problem.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email, first_name, last_name, role, plan, ai_credit_balance_cents)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'first_name',
    new.raw_user_meta_data->>'last_name',
    'teacher',
    'free',
    100
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
