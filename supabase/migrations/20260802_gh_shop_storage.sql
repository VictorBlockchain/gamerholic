-- Supabase Storage bucket for Gamerholic shop product images
-- Run in SQL editor after creating bucket "gh-shop" (public) if needed.
-- Dashboard: Storage → New bucket → id: gh-shop → Public: ON

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'gh-shop',
  'gh-shop',
  true,
  6291456, -- 6MB
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']::text[]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Public read
drop policy if exists "gh_shop_public_read" on storage.objects;
create policy "gh_shop_public_read"
  on storage.objects for select
  using (bucket_id = 'gh-shop');

-- Anon / authenticated upload (tighten later with auth)
drop policy if exists "gh_shop_anon_upload" on storage.objects;
create policy "gh_shop_anon_upload"
  on storage.objects for insert
  with check (bucket_id = 'gh-shop');

drop policy if exists "gh_shop_anon_update" on storage.objects;
create policy "gh_shop_anon_update"
  on storage.objects for update
  using (bucket_id = 'gh-shop');

drop policy if exists "gh_shop_anon_delete" on storage.objects;
create policy "gh_shop_anon_delete"
  on storage.objects for delete
  using (bucket_id = 'gh-shop');
