alter table public.winga_applications
  add column if not exists student_id_card_path text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('winga-student-ids', 'winga-student-ids', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

comment on column public.winga_applications.student_id_card_path is
  'Private Supabase Storage object path for Winga KYC; never expose a public URL.';
