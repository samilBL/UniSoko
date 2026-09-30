-- UniSoko server-side persistence for trade-ins and anonymous campus demand.
-- Apply in the Supabase SQL editor. Service-role access is only used by server routes.

create table if not exists public.trade_in_requests (
  id text primary key,
  student_name text not null,
  phone text not null,
  university text not null,
  item_title text not null,
  category text not null,
  condition text not null,
  specs text not null default '',
  expected_price numeric(12, 2) not null check (expected_price > 0),
  offered_price numeric(12, 2),
  image_paths text[] not null default '{}',
  status text not null default 'Pending Review' check (status in ('Pending Review', 'Inspecting', 'Offer Made', 'Accepted', 'Rejected')),
  admin_notes text not null default '',
  submitted_at timestamptz not null default now()
);

alter table public.trade_in_requests enable row level security;

create table if not exists public.campus_votes (
  id bigint generated always as identity primary key,
  voter_id uuid not null unique,
  campus_id text not null,
  created_at timestamptz not null default now()
);

create index if not exists campus_votes_campus_id_idx on public.campus_votes (campus_id);
alter table public.campus_votes enable row level security;

create table if not exists public.store_settings (
  id integer primary key check (id = 1),
  settings jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.store_settings enable row level security;

create table if not exists public.group_buys (
  id uuid primary key,
  product_id text not null,
  product_title text not null,
  retail_price numeric(12, 2) not null,
  wholesale_price numeric(12, 2) not null,
  minimum_quantity integer not null default 3 check (minimum_quantity >= 2),
  participant_count integer not null default 1 check (participant_count >= 1),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);

create table if not exists public.group_buy_participants (
  id bigint generated always as identity primary key,
  group_id uuid not null references public.group_buys(id) on delete cascade,
  participant_token uuid not null,
  joined_at timestamptz not null default now(),
  unique (group_id, participant_token)
);

alter table public.group_buys enable row level security;
alter table public.group_buy_participants enable row level security;

create or replace function public.join_group_buy(target_group_id uuid, joining_token uuid)
returns public.group_buys
language plpgsql
security definer
set search_path = public
as $$
declare
  current_group public.group_buys;
  inserted_participant integer;
begin
  select * into current_group from public.group_buys where id = target_group_id for update;
  if not found then raise exception 'group buy not found'; end if;
  if current_group.expires_at <= now() then raise exception 'group buy expired'; end if;

  insert into public.group_buy_participants (group_id, participant_token)
  values (target_group_id, joining_token)
  on conflict (group_id, participant_token) do nothing;
  get diagnostics inserted_participant = row_count;

  if inserted_participant > 0 then
    update public.group_buys set participant_count = participant_count + 1
    where id = target_group_id returning * into current_group;
  end if;
  return current_group;
end;
$$;

revoke all on function public.join_group_buy(uuid, uuid) from public, anon, authenticated;
grant execute on function public.join_group_buy(uuid, uuid) to service_role;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('trade-in-photos', 'trade-in-photos', false, 3000000, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set public = false, file_size_limit = 3000000, allowed_mime_types = excluded.allowed_mime_types;

-- No anon/authenticated RLS policies are created: API routes use the service-role key
-- and admin API requests are protected by the signed HTTP-only admin session.
