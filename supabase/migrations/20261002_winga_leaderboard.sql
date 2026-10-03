alter table public.winga_applications
  add column if not exists student_id_verified boolean not null default false;

comment on column public.winga_applications.student_id_verified is
  'Set by an authorized admin only after reviewing the applicant student ID.';
