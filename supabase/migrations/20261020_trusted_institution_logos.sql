insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('trusted-institution-logos', 'trusted-institution-logos', true, 3000000, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set
  public = true,
  file_size_limit = 3000000,
  allowed_mime_types = excluded.allowed_mime_types;
