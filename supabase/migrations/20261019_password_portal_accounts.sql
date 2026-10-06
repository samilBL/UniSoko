-- Shared password accounts for Winga and seller portals.
-- Phone lookup is server-only; application approval remains role-specific.
create table if not exists public.account_directory (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique check (char_length(email) <= 254),
  phone text not null unique,
  full_name text not null check (char_length(full_name) between 2 and 120),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Keep this migration safe to rerun after a failed SQL Editor attempt. The
-- explicit character checks accept canonical +255 numbers without relying on
-- regex escaping in the SQL Editor.
alter table public.account_directory drop constraint if exists account_directory_phone_check;
alter table public.account_directory add constraint account_directory_phone_check check (
  phone like '+255%'
  and char_length(phone) = 13
  and substr(phone, 5, 1) in ('6', '7', '8')
  and translate(substr(phone, 5), '0123456789', '') = ''
);

alter table public.account_directory enable row level security;
revoke all on public.account_directory from public, anon, authenticated;
grant all on public.account_directory to service_role;

comment on table public.account_directory is
  'Private normalized lookup for password account sign-in by email or Tanzanian phone; accessible only to trusted server routes.';

with existing_accounts as (
  select
    u.id as user_id,
    lower(u.email) as email,
    coalesce(w.phone, sp.contact_options ->> 'phone', u.raw_user_meta_data ->> 'phone') as raw_phone,
    coalesce(nullif(trim(u.raw_user_meta_data ->> 'full_name'), ''), w.full_name, sp.display_name, split_part(u.email, '@', 1)) as full_name
  from auth.users u
  left join public.winga_applications w on w.user_id = u.id
  left join public.seller_profiles sp on sp.user_id = u.id
  where u.email is not null
), normalized_accounts as (
  select user_id, email, full_name,
    case
      when length(regexp_replace(coalesce(raw_phone, ''), '[^0-9]', '', 'g')) = 9
        then '+255' || regexp_replace(raw_phone, '[^0-9]', '', 'g')
      when length(regexp_replace(coalesce(raw_phone, ''), '[^0-9]', '', 'g')) = 10
        and regexp_replace(raw_phone, '[^0-9]', '', 'g') like '0%'
        then '+255' || substr(regexp_replace(raw_phone, '[^0-9]', '', 'g'), 2)
      when length(regexp_replace(coalesce(raw_phone, ''), '[^0-9]', '', 'g')) = 12
        and regexp_replace(raw_phone, '[^0-9]', '', 'g') like '255%'
        then '+' || regexp_replace(raw_phone, '[^0-9]', '', 'g')
      else null
    end as phone
  from existing_accounts
), ranked_accounts as (
  select user_id, email, phone, full_name,
    row_number() over (partition by phone order by user_id) as phone_rank
  from normalized_accounts
  where phone like '+255%'
    and char_length(phone) = 13
    and substr(phone, 5, 1) in ('6', '7', '8')
    and translate(substr(phone, 5), '0123456789', '') = ''
    and char_length(full_name) between 2 and 120
)
insert into public.account_directory (user_id, email, phone, full_name)
select user_id, email, phone, full_name from ranked_accounts where phone_rank = 1
on conflict do nothing;

create table if not exists public.portal_auth_rate_limits (
  subject_hash text not null,
  action text not null check (action in ('register', 'login')),
  window_started_at timestamptz not null default now(),
  attempt_count integer not null default 0,
  primary key (subject_hash, action)
);

alter table public.portal_auth_rate_limits enable row level security;
revoke all on public.portal_auth_rate_limits from public, anon, authenticated;
grant all on public.portal_auth_rate_limits to service_role;

create or replace function public.consume_portal_auth_rate_limit(
  p_subject_hash text,
  p_action text,
  p_limit integer,
  p_window_seconds integer
) returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  current_count integer;
begin
  if p_action not in ('register', 'login') or p_limit < 1 or p_window_seconds < 1 then
    raise exception 'Invalid portal auth rate limit request';
  end if;
  insert into public.portal_auth_rate_limits (subject_hash, action, window_started_at, attempt_count)
  values (p_subject_hash, p_action, now(), 1)
  on conflict (subject_hash, action) do update set
    attempt_count = case
      when portal_auth_rate_limits.window_started_at <= now() - make_interval(secs => p_window_seconds) then 1
      else portal_auth_rate_limits.attempt_count + 1
    end,
    window_started_at = case
      when portal_auth_rate_limits.window_started_at <= now() - make_interval(secs => p_window_seconds) then now()
      else portal_auth_rate_limits.window_started_at
    end
  returning attempt_count into current_count;

  delete from public.portal_auth_rate_limits where window_started_at < now() - interval '1 day';
  return current_count <= p_limit;
end;
$$;

revoke all on function public.consume_portal_auth_rate_limit(text, text, integer, integer) from public, anon, authenticated;
grant execute on function public.consume_portal_auth_rate_limit(text, text, integer, integer) to service_role;
