-- Phase 2: seller application lifecycle and atomic review operations.
-- Applications use the existing Supabase Auth identity; no second auth system is added.

create or replace function public.submit_seller_application(
  p_user_id uuid,
  p_display_name text,
  p_university text,
  p_campus text,
  p_description text,
  p_contact_options jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_profile_id uuid;
  v_profile_status text;
  v_application_id uuid;
begin
  if p_user_id is null
     or char_length(trim(coalesce(p_display_name, ''))) not between 2 and 120
     or char_length(trim(coalesce(p_university, ''))) not between 2 and 160
     or char_length(coalesce(p_campus, '')) > 160
     or char_length(coalesce(p_description, '')) > 2000
     or jsonb_typeof(coalesce(p_contact_options, '{}'::jsonb)) <> 'object' then
    raise exception 'Invalid seller application.' using errcode = '22023';
  end if;

  select id, status into v_profile_id, v_profile_status
  from public.seller_profiles
  where user_id = p_user_id
  for update;

  if v_profile_status in ('approved', 'suspended') then
    raise exception 'This seller account cannot submit a new application.' using errcode = '23514';
  end if;

  if v_profile_id is null then
    insert into public.seller_profiles (
      user_id, display_name, university, campus, description, contact_options, status
    ) values (
      p_user_id, trim(p_display_name), trim(p_university), nullif(trim(coalesce(p_campus, '')), ''),
      trim(coalesce(p_description, '')), coalesce(p_contact_options, '{}'::jsonb), 'pending'
    ) returning id into v_profile_id;
  else
    update public.seller_profiles
    set display_name = trim(p_display_name),
        university = trim(p_university),
        campus = nullif(trim(coalesce(p_campus, '')), ''),
        description = trim(coalesce(p_description, '')),
        contact_options = coalesce(p_contact_options, '{}'::jsonb),
        status = 'pending',
        updated_at = now()
    where id = v_profile_id;
  end if;

  insert into public.seller_applications (
    user_id, seller_profile_id, display_name, university, campus, description, contact_options
  ) values (
    p_user_id, v_profile_id, trim(p_display_name), trim(p_university),
    nullif(trim(coalesce(p_campus, '')), ''), trim(coalesce(p_description, '')),
    coalesce(p_contact_options, '{}'::jsonb)
  ) returning id into v_application_id;

  return jsonb_build_object('application_id', v_application_id, 'seller_profile_id', v_profile_id);
end;
$$;

create or replace function public.review_seller_application(
  p_application_id uuid,
  p_decision text,
  p_review_notes text,
  p_reviewed_by text
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_profile_id uuid;
  v_application_status text;
begin
  if p_decision not in ('approved', 'rejected')
     or char_length(coalesce(p_review_notes, '')) > 2000 then
    raise exception 'Invalid seller application decision.' using errcode = '22023';
  end if;

  select seller_profile_id, status into v_profile_id, v_application_status
  from public.seller_applications
  where id = p_application_id
  for update;

  if v_profile_id is null or v_application_status <> 'pending' then
    raise exception 'Seller application is no longer pending.' using errcode = 'P0002';
  end if;

  update public.seller_applications
  set status = p_decision,
      review_notes = trim(coalesce(p_review_notes, '')),
      reviewed_at = now(),
      reviewed_by = left(coalesce(p_reviewed_by, 'admin'), 160),
      updated_at = now()
  where id = p_application_id;

  update public.seller_profiles
  set status = p_decision, updated_at = now()
  where id = v_profile_id;

  if p_decision = 'approved' then
    insert into public.seller_verifications (seller_profile_id)
    values (v_profile_id)
    on conflict (seller_profile_id) do nothing;
  end if;

  return jsonb_build_object('application_id', p_application_id, 'seller_profile_id', v_profile_id, 'status', p_decision);
end;
$$;

revoke all on function public.submit_seller_application(uuid, text, text, text, text, jsonb) from public, anon, authenticated;
revoke all on function public.review_seller_application(uuid, text, text, text) from public, anon, authenticated;
grant execute on function public.submit_seller_application(uuid, text, text, text, text, jsonb) to service_role;
grant execute on function public.review_seller_application(uuid, text, text, text) to service_role;
