-- Shop product RPCs: admin list / upsert / delete via security definer.
-- Storefront reads published rows with existing SELECT policy.
-- Admin writes require caller with gh_profiles.role = 'admin'.

-- ── List all products (admin; includes drafts + print fields) ──
create or replace function public.list_gh_shop_products_admin(p_caller text)
returns setof public.gh_shop_products
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  v_caller text := nullif(trim(coalesce(p_caller, '')), '');
  v_role text;
begin
  if v_caller is null then
    raise exception 'caller_required';
  end if;
  select role into v_role from public.gh_profiles where principal = v_caller;
  if coalesce(v_role, 'user') <> 'admin' then
    raise exception 'forbidden';
  end if;
  return query
    select *
    from public.gh_shop_products
    order by featured desc, name asc;
end;
$$;

grant execute on function public.list_gh_shop_products_admin(text)
  to anon, authenticated;

-- ── Upsert product ──────────────────────────────────────────
create or replace function public.upsert_gh_shop_product(
  p_caller text,
  p jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_caller text := nullif(trim(coalesce(p_caller, '')), '');
  v_role text;
  v_id text := nullif(trim(coalesce(p->>'id', '')), '');
  v_name text := nullif(trim(coalesce(p->>'name', '')), '');
  v_slug text := nullif(trim(coalesce(p->>'slug', '')), '');
  v_price numeric;
begin
  if v_caller is null then
    return jsonb_build_object('ok', false, 'error', 'caller_required');
  end if;
  select role into v_role from public.gh_profiles where principal = v_caller;
  if coalesce(v_role, 'user') <> 'admin' then
    return jsonb_build_object('ok', false, 'error', 'forbidden');
  end if;
  if v_id is null or v_name is null then
    return jsonb_build_object('ok', false, 'error', 'id_and_name_required');
  end if;
  if v_slug is null then
    v_slug := lower(regexp_replace(v_name, '[^a-zA-Z0-9]+', '-', 'g'));
    v_slug := trim(both '-' from v_slug);
  end if;
  v_price := coalesce((p->>'price_usd')::numeric, (p->>'priceUsd')::numeric, 0);
  if v_price <= 0 then
    return jsonb_build_object('ok', false, 'error', 'price_required');
  end if;

  insert into public.gh_shop_products as g (
    id, name, slug, description, category, price_usd, compare_at_usd,
    images, variants, stock, sku, supplier_url, supplier_note,
    published, featured, print_asset_url, print_font_family, print_font_url,
    print_text, print_notes, aspect, updated_at
  ) values (
    v_id,
    v_name,
    v_slug,
    coalesce(p->>'description', ''),
    coalesce(nullif(p->>'category', ''), 'apparel'),
    v_price,
    nullif(coalesce(p->>'compare_at_usd', p->>'compareAtUsd'), '')::numeric,
    coalesce(p->'images', '[]'::jsonb),
    coalesce(p->'variants', '[]'::jsonb),
    greatest(0, coalesce((p->>'stock')::int, 0)),
    nullif(p->>'sku', ''),
    nullif(coalesce(p->>'supplier_url', p->>'supplierUrl'), ''),
    nullif(coalesce(p->>'supplier_note', p->>'supplierNote'), ''),
    coalesce((p->>'published')::boolean, false),
    coalesce((p->>'featured')::boolean, false),
    nullif(coalesce(p->>'print_asset_url', p->>'printAssetUrl'), ''),
    nullif(coalesce(p->>'print_font_family', p->>'printFontFamily'), ''),
    nullif(coalesce(p->>'print_font_url', p->>'printFontUrl'), ''),
    nullif(coalesce(p->>'print_text', p->>'printText'), ''),
    nullif(coalesce(p->>'print_notes', p->>'printNotes'), ''),
    coalesce(nullif(p->>'aspect', ''), 'square'),
    now()
  )
  on conflict (id) do update set
    name = excluded.name,
    slug = excluded.slug,
    description = excluded.description,
    category = excluded.category,
    price_usd = excluded.price_usd,
    compare_at_usd = excluded.compare_at_usd,
    images = excluded.images,
    variants = excluded.variants,
    stock = excluded.stock,
    sku = excluded.sku,
    supplier_url = excluded.supplier_url,
    supplier_note = excluded.supplier_note,
    published = excluded.published,
    featured = excluded.featured,
    print_asset_url = excluded.print_asset_url,
    print_font_family = excluded.print_font_family,
    print_font_url = excluded.print_font_url,
    print_text = excluded.print_text,
    print_notes = excluded.print_notes,
    aspect = excluded.aspect,
    updated_at = now();

  return jsonb_build_object('ok', true, 'id', v_id);
end;
$$;

grant execute on function public.upsert_gh_shop_product(text, jsonb)
  to anon, authenticated;

-- ── Delete products ─────────────────────────────────────────
create or replace function public.delete_gh_shop_products(
  p_caller text,
  p_ids text[]
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_caller text := nullif(trim(coalesce(p_caller, '')), '');
  v_role text;
  v_n int;
begin
  if v_caller is null then
    return jsonb_build_object('ok', false, 'error', 'caller_required');
  end if;
  select role into v_role from public.gh_profiles where principal = v_caller;
  if coalesce(v_role, 'user') <> 'admin' then
    return jsonb_build_object('ok', false, 'error', 'forbidden');
  end if;
  if p_ids is null or array_length(p_ids, 1) is null then
    return jsonb_build_object('ok', true, 'deleted', 0);
  end if;
  delete from public.gh_shop_products where id = any (p_ids);
  get diagnostics v_n = row_count;
  return jsonb_build_object('ok', true, 'deleted', v_n);
end;
$$;

grant execute on function public.delete_gh_shop_products(text, text[])
  to anon, authenticated;

-- Allow anon to read published products (already policy); ensure drafts blocked.
-- Admin list uses security definer above.
