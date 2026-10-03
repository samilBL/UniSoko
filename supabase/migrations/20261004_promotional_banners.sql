create table if not exists public.promo_banners (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('Promotion', 'Sponsor', 'Flash Deal')),
  title text not null check (char_length(title) between 2 and 120),
  body text not null default '' check (char_length(body) <= 500),
  cta_label text not null default '' check (char_length(cta_label) <= 40),
  cta_url text not null default '' check (char_length(cta_url) <= 500),
  image_path text not null default '',
  status text not null default 'Draft' check (status in ('Draft', 'Active', 'Paused')),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint promo_banner_valid_schedule check (ends_at > starts_at)
);

create index if not exists promo_banners_active_schedule_idx
  on public.promo_banners (starts_at, ends_at)
  where status = 'Active';

alter table public.promo_banners enable row level security;
revoke all on public.promo_banners from anon, authenticated;
grant all on public.promo_banners to service_role;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('promo-banner-images', 'promo-banner-images', true, 5000000, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set public = true, file_size_limit = 5000000, allowed_mime_types = excluded.allowed_mime_types;
