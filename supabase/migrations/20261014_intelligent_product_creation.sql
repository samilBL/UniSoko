-- Phase 4: seller product images use random object keys and are prepared for
-- marketplace display. Seller uploads are performed only by authenticated
-- server handlers with the service role; never grant a browser policy here.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('seller-product-images', 'seller-product-images', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create index if not exists product_attributes_active_scope_order_idx
  on public.product_attributes(category_id, subcategory_id, product_condition_id, display_order)
  where is_active;
create index if not exists product_attribute_options_active_order_idx
  on public.product_attribute_options(attribute_id, display_order)
  where is_active;
