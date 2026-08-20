-- Gamerholic official merch shop (gh_shop_*)
-- Run in Supabase SQL Editor or via migration pipeline.
-- Tables: products (+ printer pack), orders, settings.
-- ICP is not stored — convert USD via CoinGecko at runtime.

-- ── Products ────────────────────────────────────────────────
create table if not exists public.gh_shop_products (
  id text primary key,
  name text not null,
  slug text not null unique,
  description text not null default '',
  category text not null default 'apparel',
  price_usd numeric(12, 2) not null check (price_usd > 0),
  compare_at_usd numeric(12, 2),
  -- public gallery URLs: string[]
  images jsonb not null default '[]'::jsonb,
  -- [{ "name": "Size", "options": ["S","M",...] }, ...]
  variants jsonb not null default '[]'::jsonb,
  stock int not null default 0 check (stock >= 0),
  sku text,
  supplier_url text,
  supplier_note text,
  published boolean not null default false,
  featured boolean not null default false,

  -- Printer pack (admin UI only; strip from public view)
  print_asset_url text,
  print_font_family text,
  print_font_url text,
  print_text text,
  print_notes text,

  -- Masonry layout hint: tall | square | wide
  aspect text not null default 'square',

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists gh_shop_products_published_idx
  on public.gh_shop_products (published, featured desc, name);
create index if not exists gh_shop_products_category_idx
  on public.gh_shop_products (category);
create index if not exists gh_shop_products_sku_idx
  on public.gh_shop_products (sku)
  where sku is not null;

-- Public storefront shape (no printer columns)
create or replace view public.gh_shop_products_public as
select
  id,
  name,
  slug,
  description,
  category,
  price_usd,
  compare_at_usd,
  images,
  variants,
  stock,
  sku,
  published,
  featured,
  aspect,
  created_at,
  updated_at
from public.gh_shop_products
where published = true;

-- ── Orders ──────────────────────────────────────────────────
create table if not exists public.gh_shop_orders (
  id text primary key,
  user_principal text,
  username text,
  status text not null default 'pending'
    check (status in (
      'pending',
      'paid',
      'ordered',
      'shipped',
      'delivered',
      'cancelled'
    )),
  -- { name, email, line1, line2?, city, region, postal, country, phone? }
  shipping jsonb not null default '{}'::jsonb,
  -- [{ productId, name, qty, unitPriceUsd, variantLabel?, image? }]
  items jsonb not null default '[]'::jsonb,
  total_usd numeric(12, 2) not null default 0,
  -- optional FX snapshot at checkout (CoinGecko)
  total_icp_estimate numeric(18, 8),
  icp_usd_rate numeric(18, 8),
  notes text,
  admin_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists gh_shop_orders_principal_idx
  on public.gh_shop_orders (user_principal, created_at desc);
create index if not exists gh_shop_orders_status_idx
  on public.gh_shop_orders (status, created_at desc);

-- ── Settings (single-row style) ─────────────────────────────
create table if not exists public.gh_shop_settings (
  id text primary key default 'default',
  enabled boolean not null default true,
  banner_title text not null default 'Gamerholic Merch',
  banner_body text not null default
    'Official gear — apparel and gaming merch for the arena.',
  shipping_blurb text not null default
    'Orders are fulfilled after payment confirmation. Shipping times vary by region and supplier.',
  currency_label text not null default 'USD',
  updated_at timestamptz not null default now()
);

insert into public.gh_shop_settings (id)
values ('default')
on conflict (id) do nothing;

-- ── RLS ─────────────────────────────────────────────────────
alter table public.gh_shop_products enable row level security;
alter table public.gh_shop_orders enable row level security;
alter table public.gh_shop_settings enable row level security;

-- Published products readable by everyone (print columns still on table;
-- prefer gh_shop_products_public for storefront clients).
do $$ begin
  create policy gh_shop_products_select on public.gh_shop_products
    for select using (published = true);
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy gh_shop_settings_select on public.gh_shop_settings
    for select using (true);
exception when duplicate_object then null;
end $$;

-- Orders: open select for v1 local/dev; tighten before production
-- (service role / principal match).
do $$ begin
  create policy gh_shop_orders_select on public.gh_shop_orders
    for select using (true);
exception when duplicate_object then null;
end $$;

-- Writes: use service role or security-definer RPCs (not anon insert yet).

-- ── Seed: Gamer / Gamerholic apparel (33 SKUs; hoodies ≥ $49) ──
-- Generated from src/lib/shop/catalog.ts — re-run generator if catalog changes.
insert into public.gh_shop_products (
  id, name, slug, description, category, price_usd, compare_at_usd,
  images, variants, stock, sku, supplier_note, published, featured,
  print_asset_url, print_font_family, print_font_url, print_text, print_notes, aspect
) values
(
  'prod-tee-gamer-classic',
  'Gamer Classic Wordmark Tee',
  'gamer-classic-wordmark-tee',
  'The everyday identity piece. Clean GAMER wordmark, chest center — readable across a lobby or a LAN hall.

Fabric: 100% combed ring-spun cotton, ~6.1 oz (180 gsm), pre-shrunk jersey. Side-seamed, shoulder-to-shoulder tape, tear-away label. Soft hand; holds print. Wash cold, tumble low or hang dry.
Fit: retail unisex, true to size. Slightly tapered shoulder.',
  'apparel',
  34.00,
  42.00,
  '["/art/profile-covers/gamerholic-volt.jpg","/art/chibi-team-win.jpg","/brand/gamerholic-mark-256.jpg"]'::jsonb,
  '[{"name":"Size","options":["S","M","L","XL","2XL"]},{"name":"Color","options":["Black","Night Purple","Volt","White"]}]'::jsonb,
  200,
  'GH-TEE-GAMER-CLS',
  'Combed cotton blank + DTG/screen from print pack',
  true,
  true,
  '/shop/print/gamer-wordmark.svg',
  'Orbitron',
  null,
  'GAMER',
  'Chest center, max width 11–12in. White or volt ink on dark; black ink on white. Vector print pack.',
  'tall'
),
(
  'prod-tee-gamerholic-classic',
  'Gamerholic Classic Wordmark Tee',
  'gamerholic-classic-wordmark-tee',
  'Full GAMERHOLIC lockup in display type. Official brand line — the one you wear when the booth has your name on it.

Fabric: 100% combed ring-spun cotton, ~6.1 oz (180 gsm), pre-shrunk jersey. Side-seamed, shoulder-to-shoulder tape, tear-away label. Soft hand; holds print. Wash cold, tumble low or hang dry.
Fit: retail unisex. Pair with black bottoms for stage / stream cam.',
  'apparel',
  38.00,
  48.00,
  '["/art/profile-covers/gamerholic-neon.jpg","/art/chibi-team-win.jpg","/brand/gamerholic-mark-256.jpg"]'::jsonb,
  '[{"name":"Size","options":["S","M","L","XL","2XL"]},{"name":"Color","options":["Black","Night Purple","Volt","White"]}]'::jsonb,
  180,
  'GH-TEE-GH-CLS',
  'Combed cotton blank + DTG/screen from print pack',
  true,
  true,
  '/shop/print/gamerholic-wordmark.svg',
  'Orbitron',
  null,
  'GAMERHOLIC',
  'Chest center, max width 12in. Volt (#a3ff3d) preferred on black; white on night purple.',
  'tall'
),
(
  'prod-tee-power-g',
  'Power-G Mark Tee',
  'power-g-mark-tee',
  'Minimal power-G app mark only — no wordmark noise. Looks like a label, hits like a brand.

Fabric: 100% combed ring-spun cotton, ~6.1 oz (180 gsm), pre-shrunk jersey. Side-seamed, shoulder-to-shoulder tape, tear-away label. Soft hand; holds print. Wash cold, tumble low or hang dry.
Fit: true unisex. Left-chest mark placement (3in).',
  'apparel',
  32.00,
  null,
  '["/brand/gamerholic-mark-256.jpg","/art/chibi-team-win.jpg","/brand/gamerholic-mark-256.jpg"]'::jsonb,
  '[{"name":"Size","options":["S","M","L","XL","2XL"]},{"name":"Color","options":["Black","Night Purple","Arena Charcoal"]}]'::jsonb,
  220,
  'GH-TEE-MARK',
  null,
  true,
  false,
  '/shop/print/power-g-mark.svg',
  'n/a — mark only',
  null,
  '',
  'Left chest 3in mark. Single-color volt or white.',
  'square'
),
(
  'prod-tee-i-win',
  'I Win For A Living Tee',
  'i-win-for-a-living-tee',
  'House slogan in clean heading type. Classic arrogance, correctly spelled.

Fabric: 100% combed ring-spun cotton, ~6.1 oz (180 gsm), pre-shrunk jersey. Side-seamed, shoulder-to-shoulder tape, tear-away label. Soft hand; holds print. Wash cold, tumble low or hang dry.
Fit: retail unisex.',
  'apparel',
  36.00,
  null,
  '["/art/chibi-team-highfive.jpg","/art/chibi-team-win.jpg","/brand/gamerholic-mark-256.jpg"]'::jsonb,
  '[{"name":"Size","options":["S","M","L","XL","2XL"]},{"name":"Color","options":["Black","Night Purple","Volt","White"]}]'::jsonb,
  150,
  'GH-TEE-IWIN',
  null,
  true,
  true,
  '/shop/print/i-win-for-a-living.svg',
  'Orbitron',
  null,
  'I WIN FOR A LIVING',
  'Chest center stacked 3 lines or single line 12in max.',
  'tall'
),
(
  'prod-tee-prize',
  'Prize Magenta Wordmark Tee',
  'prize-magenta-wordmark-tee',
  'GAMERHOLIC in prize-magenta energy. Looks expensive on stream lights.

Fabric: 100% organic combed cotton, ~6.5 oz (200 gsm), garment-washed for broken-in feel. Side-seamed, reinforced collar, tear-away label. Wash cold, hang dry for longevity.
Fit: slightly relaxed shoulder.',
  'apparel',
  44.00,
  54.00,
  '["/art/profile-covers/gamerholic-prize.jpg","/art/chibi-team-win.jpg","/brand/gamerholic-mark-256.jpg"]'::jsonb,
  '[{"name":"Size","options":["S","M","L","XL","2XL"]},{"name":"Color","options":["Black"]}]'::jsonb,
  120,
  'GH-TEE-PRIZE',
  null,
  true,
  false,
  '/shop/print/gamerholic-wordmark-prize.svg',
  'Orbitron',
  null,
  'GAMERHOLIC',
  'Prize magenta (#f43fa8) on black only. Chest 12in.',
  'tall'
),
(
  'prod-tee-gamer-boxy',
  'Gamer Boxy Heavy Tee',
  'gamer-boxy-heavy-tee',
  'Street-cut boxy GAMER tee — drop shoulder, heavier hand, looks intentional on camera.

Fabric: 100% cotton heavyweight jersey, ~7.5 oz (220 gsm). Boxy cut, structured drape, reinforced neck. Built for thrash + still looks clean. Wash cold inside-out.
Fit: oversized boxy. Size down for closer fit.',
  'apparel',
  48.00,
  null,
  '["/art/chibi-heads-up.jpg","/art/chibi-team-win.jpg","/brand/gamerholic-mark-256.jpg"]'::jsonb,
  '[{"name":"Size","options":["S","M","L","XL","2XL"]},{"name":"Color","options":["Black","Night Purple","Arena Charcoal"]}]'::jsonb,
  100,
  'GH-TEE-GAMER-BOX',
  null,
  true,
  false,
  '/shop/print/gamer-wordmark.svg',
  'Orbitron',
  null,
  'GAMER',
  'Slightly larger chest hit OK on boxy blank (up to 13in).',
  'tall'
),
(
  'prod-tee-gh-premium',
  'Gamerholic Organic Premium Tee',
  'gamerholic-organic-premium-tee',
  'Organic cotton, garment-washed. Full wordmark with subtle volt underline.

Fabric: 100% organic combed cotton, ~6.5 oz (200 gsm), garment-washed for broken-in feel. Side-seamed, reinforced collar, tear-away label. Wash cold, hang dry for longevity.
Fit: modern retail. Soft from first wear.',
  'apparel',
  52.00,
  null,
  '["/art/hero-arena.jpg","/art/chibi-team-win.jpg","/brand/gamerholic-mark-256.jpg"]'::jsonb,
  '[{"name":"Size","options":["S","M","L","XL","2XL"]},{"name":"Color","options":["Black","Night Purple","Volt","White"]}]'::jsonb,
  90,
  'GH-TEE-GH-ORG',
  null,
  true,
  false,
  '/shop/print/gamerholic-wordmark.svg',
  'Orbitron',
  null,
  'GAMERHOLIC',
  'Soft-hand or waterbase preferred on organic blank.',
  'tall'
),
(
  'prod-tee-longline',
  'Arena Longline Gamer Tee',
  'arena-longline-gamer-tee',
  'Extended hem longline with GAMER spine print option (front wordmark + rear vertical).

Fabric: 100% cotton heavyweight jersey, ~7.5 oz (220 gsm). Boxy cut, structured drape, reinforced neck. Built for thrash + still looks clean. Wash cold inside-out.
Fit: longline unisex. Covers belt line for desk / couch sessions.',
  'apparel',
  46.00,
  null,
  '["/art/chibi-arcade-friends.jpg","/art/chibi-team-win.jpg","/brand/gamerholic-mark-256.jpg"]'::jsonb,
  '[{"name":"Size","options":["S","M","L","XL","2XL"]},{"name":"Color","options":["Black","Night Purple","Arena Charcoal"]}]'::jsonb,
  80,
  'GH-TEE-LONGLINE',
  null,
  true,
  false,
  '/shop/print/gamer-wordmark.svg',
  'Orbitron',
  null,
  'GAMER',
  'Front chest + optional rear vertical GAMER (spine, 14in tall).',
  'tall'
),
(
  'prod-tee-host-earns',
  'Host Earns Tee',
  'host-earns-tee',
  'If you know you know: operators get paid. Front small mark, back “HOST EARNS” lockup.

Fabric: 100% combed ring-spun cotton, ~6.1 oz (180 gsm), pre-shrunk jersey. Side-seamed, shoulder-to-shoulder tape, tear-away label. Soft hand; holds print. Wash cold, tumble low or hang dry.
Fit: true unisex.',
  'apparel',
  39.00,
  null,
  '["/art/host-booth.jpg","/art/chibi-team-win.jpg","/brand/gamerholic-mark-256.jpg"]'::jsonb,
  '[{"name":"Size","options":["S","M","L","XL","2XL"]},{"name":"Color","options":["Black","Night Purple","Arena Charcoal"]}]'::jsonb,
  110,
  'GH-TEE-HOST',
  null,
  true,
  true,
  '/shop/print/host-earns.svg',
  'Orbitron',
  null,
  'HOST EARNS',
  'Back print primary (12in). Front optional 3in power-G.',
  'tall'
),
(
  'prod-tee-fail-bank',
  'Fail Bank Tee',
  'fail-bank-tee',
  'Arcade coded. “FAILS PAY THE CROWN” micro-copy under a small cabinet glyph. For high-score landlords.

Fabric: 100% combed ring-spun cotton, ~6.1 oz (180 gsm), pre-shrunk jersey. Side-seamed, shoulder-to-shoulder tape, tear-away label. Soft hand; holds print. Wash cold, tumble low or hang dry.
Fit: true unisex.',
  'apparel',
  38.00,
  null,
  '["/art/arcade-cabinet.jpg","/art/chibi-team-win.jpg","/brand/gamerholic-mark-256.jpg"]'::jsonb,
  '[{"name":"Size","options":["S","M","L","XL","2XL"]},{"name":"Color","options":["Black","Night Purple","Arena Charcoal"]}]'::jsonb,
  100,
  'GH-TEE-FAIL',
  null,
  true,
  false,
  '/shop/print/fail-bank.svg',
  'Share Tech Mono',
  null,
  'FAILS PAY THE CROWN',
  'Left chest glyph + center line or back stack. Mono font intentional.',
  'square'
),
(
  'prod-tee-escrow',
  'Escrow Not Trust Tee',
  'escrow-not-trust-tee',
  'On-chain culture shirt. “ESCROW > TRUST” with subtle subaccount hash aesthetic.

Fabric: 100% combed ring-spun cotton, ~6.1 oz (180 gsm), pre-shrunk jersey. Side-seamed, shoulder-to-shoulder tape, tear-away label. Soft hand; holds print. Wash cold, tumble low or hang dry.
Fit: true unisex. Instant conversation starter with builders.',
  'apparel',
  40.00,
  null,
  '["/art/gear-icp.jpg","/art/chibi-team-win.jpg","/brand/gamerholic-mark-256.jpg"]'::jsonb,
  '[{"name":"Size","options":["S","M","L","XL","2XL"]},{"name":"Color","options":["Black","Arena Charcoal"]}]'::jsonb,
  95,
  'GH-TEE-ESCROW',
  null,
  true,
  false,
  '/shop/print/escrow-not-trust.svg',
  'Share Tech Mono',
  null,
  'ESCROW > TRUST',
  'Chest center mono. White or volt ink only.',
  'square'
),
(
  'prod-tee-noncustodial',
  'Non-Custodial Tee',
  'non-custodial-tee',
  'Wallet is the gamer ID. Clean “NON-CUSTODIAL” stack — no cartoon noise.

Fabric: 100% combed ring-spun cotton, ~6.1 oz (180 gsm), pre-shrunk jersey. Side-seamed, shoulder-to-shoulder tape, tear-away label. Soft hand; holds print. Wash cold, tumble low or hang dry.',
  'apparel',
  36.00,
  null,
  '["/brand/gamerholic-mark-128.jpg","/art/chibi-team-win.jpg","/brand/gamerholic-mark-256.jpg"]'::jsonb,
  '[{"name":"Size","options":["S","M","L","XL","2XL"]},{"name":"Color","options":["Black","Night Purple","Arena Charcoal"]}]'::jsonb,
  130,
  'GH-TEE-NC',
  null,
  true,
  false,
  '/shop/print/non-custodial.svg',
  'Orbitron',
  null,
  'NON-CUSTODIAL',
  'Chest center, wide tracking.',
  'square'
),
(
  'prod-tee-xft',
  'XFTs That Fight Tee',
  'xfts-that-fight-tee',
  'Dexsta bridge energy. “XFTS THAT FIGHT” + “NFT 2.0” sublabel — for attribute maxxers.

Fabric: 100% combed ring-spun cotton, ~6.1 oz (180 gsm), pre-shrunk jersey. Side-seamed, shoulder-to-shoulder tape, tear-away label. Soft hand; holds print. Wash cold, tumble low or hang dry.',
  'apparel',
  41.00,
  null,
  '["/art/xft-battle.jpg","/art/chibi-team-win.jpg","/brand/gamerholic-mark-256.jpg"]'::jsonb,
  '[{"name":"Size","options":["S","M","L","XL","2XL"]},{"name":"Color","options":["Black","Night Purple","Arena Charcoal"]}]'::jsonb,
  100,
  'GH-TEE-XFT',
  null,
  true,
  false,
  '/shop/print/xfts-that-fight.svg',
  'Orbitron',
  null,
  'XFTS THAT FIGHT',
  'Two-line stack; optional NFT 2.0 underline in attr violet.',
  'tall'
),
(
  'prod-tee-monitor',
  'Game Monitor Tee',
  'game-monitor-tee',
  'For the ones who watch the match and cash the call. “MONITOR” badge front, “REPORT · SETTLE” rear.

Fabric: 100% combed ring-spun cotton, ~6.1 oz (180 gsm), pre-shrunk jersey. Side-seamed, shoulder-to-shoulder tape, tear-away label. Soft hand; holds print. Wash cold, tumble low or hang dry.',
  'apparel',
  37.00,
  null,
  '["/art/chibi-heads-up.jpg","/art/chibi-team-win.jpg","/brand/gamerholic-mark-256.jpg"]'::jsonb,
  '[{"name":"Size","options":["S","M","L","XL","2XL"]},{"name":"Color","options":["Black","Night Purple","Arena Charcoal"]}]'::jsonb,
  90,
  'GH-TEE-MON',
  null,
  true,
  false,
  '/shop/print/game-monitor.svg',
  'Orbitron',
  null,
  'MONITOR',
  'Front badge + back REPORT · SETTLE.',
  'square'
),
(
  'prod-tee-ggwp',
  'GG WP Micro Tee',
  'gg-wp-micro-tee',
  'Understated. Tiny “GG WP” left chest — if you know, you already nodded.

Fabric: 100% organic combed cotton, ~6.5 oz (200 gsm), garment-washed for broken-in feel. Side-seamed, reinforced collar, tear-away label. Wash cold, hang dry for longevity.',
  'apparel',
  35.00,
  null,
  '["/art/chibi-team-highfive.jpg","/art/chibi-team-win.jpg","/brand/gamerholic-mark-256.jpg"]'::jsonb,
  '[{"name":"Size","options":["S","M","L","XL","2XL"]},{"name":"Color","options":["Black","Night Purple","Volt","White"]}]'::jsonb,
  160,
  'GH-TEE-GGWP',
  null,
  true,
  false,
  '/shop/print/gg-wp.svg',
  'Share Tech Mono',
  null,
  'GG WP',
  'Left chest 2.5in max. Single color.',
  'square'
),
(
  'prod-tee-bps',
  'Host BPS Tee',
  'host-bps-tee',
  'Nerdy flex: “HOST FEE IN BPS” with a faint basis-points grid. For people who set the cut.

Fabric: 100% combed ring-spun cotton, ~6.1 oz (180 gsm), pre-shrunk jersey. Side-seamed, shoulder-to-shoulder tape, tear-away label. Soft hand; holds print. Wash cold, tumble low or hang dry.',
  'apparel',
  39.00,
  null,
  '["/art/host-booth.jpg","/art/chibi-team-win.jpg","/brand/gamerholic-mark-256.jpg"]'::jsonb,
  '[{"name":"Size","options":["S","M","L","XL","2XL"]},{"name":"Color","options":["Black","Night Purple"]}]'::jsonb,
  85,
  'GH-TEE-BPS',
  null,
  true,
  false,
  '/shop/print/host-bps.svg',
  'Share Tech Mono',
  null,
  'HOST FEE IN BPS',
  'Chest center mono + optional back grid watermark low opacity.',
  'tall'
),
(
  'prod-tee-stack',
  'Stack Quietly Tee',
  'stack-quietly-tee',
  'No logo scream. Rear “STACK QUIETLY” only — front blank except optional 1in power-G.

Fabric: 100% organic combed cotton, ~6.5 oz (200 gsm), garment-washed for broken-in feel. Side-seamed, reinforced collar, tear-away label. Wash cold, hang dry for longevity.',
  'apparel',
  42.00,
  null,
  '["/art/gear-icp.jpg","/art/chibi-team-win.jpg","/brand/gamerholic-mark-256.jpg"]'::jsonb,
  '[{"name":"Size","options":["S","M","L","XL","2XL"]},{"name":"Color","options":["Black","Night Purple","Arena Charcoal"]}]'::jsonb,
  75,
  'GH-TEE-STACK',
  null,
  true,
  false,
  '/shop/print/stack-quietly.svg',
  'Orbitron',
  null,
  'STACK QUIETLY',
  'Back primary. Front optional micro mark.',
  'tall'
),
(
  'prod-tee-18',
  '18+ Arena Tee',
  '18-arena-tee',
  'Compliance chic. Bold “18+” badge + “SKILLED GAMING WHERE LEGAL” line. Matches the footer energy.

Fabric: 100% combed ring-spun cotton, ~6.1 oz (180 gsm), pre-shrunk jersey. Side-seamed, shoulder-to-shoulder tape, tear-away label. Soft hand; holds print. Wash cold, tumble low or hang dry.',
  'apparel',
  33.00,
  null,
  '["/brand/gamerholic-mark-64.jpg","/art/chibi-team-win.jpg","/brand/gamerholic-mark-256.jpg"]'::jsonb,
  '[{"name":"Size","options":["S","M","L","XL","2XL"]},{"name":"Color","options":["Black"]}]'::jsonb,
  140,
  'GH-TEE-18',
  null,
  true,
  false,
  '/shop/print/eighteen-plus.svg',
  'Orbitron',
  null,
  '18+',
  'Large 18+ chest; legal line smaller under.',
  'square'
),
(
  'prod-hood-gamer-classic',
  'Gamer Classic Hoodie',
  'gamer-classic-hoodie',
  'Midweight GAMER wordmark hoodie — daily driver for cold arenas and AC lobbies.

Fabric: 80/20 cotton-poly midweight fleece, ~8.5 oz (280 gsm), brushed interior. Double-lined hood, metal eyelets, kangaroo pocket, rib cuffs & hem. Pill-resistant face for clean prints.
Fit: unisex standard. Kangaroo pocket. Drawcord hood.',
  'apparel',
  58.00,
  72.00,
  '["/art/profile-covers/gamerholic-volt.jpg","/art/host-booth.jpg","/brand/gamerholic-mark-256.jpg"]'::jsonb,
  '[{"name":"Size","options":["S","M","L","XL","2XL"]},{"name":"Color","options":["Black","Night Purple","Arena Charcoal"]}]'::jsonb,
  120,
  'GH-HOOD-GAMER',
  null,
  true,
  true,
  '/shop/print/gamer-wordmark.svg',
  'Orbitron',
  null,
  'GAMER',
  'Chest center on fleece face. Soft-hand or puff optional.',
  'tall'
),
(
  'prod-hood-gh-classic',
  'Gamerholic Classic Hoodie',
  'gamerholic-classic-hoodie',
  'Full GAMERHOLIC wordmark on midweight fleece. The booth standard.

Fabric: 80/20 cotton-poly midweight fleece, ~8.5 oz (280 gsm), brushed interior. Double-lined hood, metal eyelets, kangaroo pocket, rib cuffs & hem. Pill-resistant face for clean prints.
Fit: unisex standard.',
  'apparel',
  62.00,
  78.00,
  '["/art/profile-covers/gamerholic-neon.jpg","/art/host-booth.jpg","/brand/gamerholic-mark-256.jpg"]'::jsonb,
  '[{"name":"Size","options":["S","M","L","XL","2XL"]},{"name":"Color","options":["Black","Night Purple","Arena Charcoal"]}]'::jsonb,
  110,
  'GH-HOOD-GH',
  null,
  true,
  true,
  '/shop/print/gamerholic-wordmark.svg',
  'Orbitron',
  null,
  'GAMERHOLIC',
  'Chest 11in max on hoodie blank.',
  'tall'
),
(
  'prod-hood-prize',
  'Prize Magenta Hoodie',
  'prize-magenta-hoodie',
  'Prize-magenta GAMERHOLIC hit on black fleece. Looks lethal under neon.

Fabric: 80/20 cotton-poly midweight fleece, ~8.5 oz (280 gsm), brushed interior. Double-lined hood, metal eyelets, kangaroo pocket, rib cuffs & hem. Pill-resistant face for clean prints.',
  'apparel',
  64.00,
  null,
  '["/art/profile-covers/gamerholic-prize.jpg","/art/host-booth.jpg","/brand/gamerholic-mark-256.jpg"]'::jsonb,
  '[{"name":"Size","options":["S","M","L","XL","2XL"]},{"name":"Color","options":["Black"]}]'::jsonb,
  90,
  'GH-HOOD-PRIZE',
  null,
  true,
  true,
  '/shop/print/gamerholic-wordmark-prize.svg',
  'Orbitron',
  null,
  'GAMERHOLIC',
  'Prize magenta ink on black only.',
  'tall'
),
(
  'prod-hood-i-win',
  'I Win For A Living Hoodie',
  'i-win-for-a-living-hoodie',
  'Slogan hoodie. Front small power-G, back full “I WIN FOR A LIVING”.

Fabric: 80/20 cotton-poly midweight fleece, ~8.5 oz (280 gsm), brushed interior. Double-lined hood, metal eyelets, kangaroo pocket, rib cuffs & hem. Pill-resistant face for clean prints.',
  'apparel',
  66.00,
  null,
  '["/art/chibi-team-win.jpg","/art/host-booth.jpg","/brand/gamerholic-mark-256.jpg"]'::jsonb,
  '[{"name":"Size","options":["S","M","L","XL","2XL"]},{"name":"Color","options":["Black","Night Purple","Arena Charcoal"]}]'::jsonb,
  100,
  'GH-HOOD-IWIN',
  null,
  true,
  false,
  '/shop/print/i-win-for-a-living.svg',
  'Orbitron',
  null,
  'I WIN FOR A LIVING',
  'Back print hero; front micro mark.',
  'tall'
),
(
  'prod-hood-heavy-gamer',
  'Gamer Heavyweight Hoodie',
  'gamer-heavyweight-hoodie',
  'Dense 12–14 oz fleece. GAMER mark holds structure — travel hoodie that still looks sharp day three of a lan.

Fabric: 80/20 cotton-poly heavy fleece, ~12–14 oz (350–400 gsm), dense brush. Double-lined hood with matching drawcords, pouch pocket, rib trim. Tournament-night warmth.
Fit: slightly roomy for layers.',
  'apparel',
  79.00,
  96.00,
  '["/art/chibi-heads-up.jpg","/art/host-booth.jpg","/brand/gamerholic-mark-256.jpg"]'::jsonb,
  '[{"name":"Size","options":["S","M","L","XL","2XL"]},{"name":"Color","options":["Black","Night Purple","Arena Charcoal"]}]'::jsonb,
  70,
  'GH-HOOD-HVY-GAMER',
  null,
  true,
  true,
  '/shop/print/gamer-wordmark.svg',
  'Orbitron',
  null,
  'GAMER',
  'Heavy fleece — prefer plastisol or thick soft-hand.',
  'tall'
),
(
  'prod-hood-heavy-gh',
  'Gamerholic Heavyweight Hoodie',
  'gamerholic-heavyweight-hoodie',
  'Same heavy fleece chassis with full Gamerholic wordmark. Winter circuit kit.

Fabric: 80/20 cotton-poly heavy fleece, ~12–14 oz (350–400 gsm), dense brush. Double-lined hood with matching drawcords, pouch pocket, rib trim. Tournament-night warmth.',
  'apparel',
  84.00,
  null,
  '["/art/hero-arena.jpg","/art/host-booth.jpg","/brand/gamerholic-mark-256.jpg"]'::jsonb,
  '[{"name":"Size","options":["S","M","L","XL","2XL"]},{"name":"Color","options":["Black","Night Purple","Arena Charcoal"]}]'::jsonb,
  65,
  'GH-HOOD-HVY-GH',
  null,
  true,
  false,
  '/shop/print/gamerholic-wordmark.svg',
  'Orbitron',
  null,
  'GAMERHOLIC',
  'Chest center; volt ink recommended on black.',
  'tall'
),
(
  'prod-hood-zip-gh',
  'Gamerholic Full-Zip Hoodie',
  'gamerholic-full-zip-hoodie',
  'Full-zip for booth-to-street transitions. Left-chest mark + sleeve hit optional.

Fabric: 80/20 cotton-poly fleece, ~9 oz (300 gsm), full YKK-style zip, brushed lining, dual pouch or welt pockets, rib cuffs. Durable face fabric for chest + sleeve hits.
Fit: athletic unisex.',
  'apparel',
  89.00,
  null,
  '["/art/host-booth.jpg","/art/host-booth.jpg","/brand/gamerholic-mark-256.jpg"]'::jsonb,
  '[{"name":"Size","options":["S","M","L","XL","2XL"]},{"name":"Color","options":["Black","Night Purple","Arena Charcoal"]}]'::jsonb,
  80,
  'GH-HOOD-ZIP-GH',
  null,
  true,
  false,
  '/shop/print/power-g-mark.svg',
  'n/a — mark only',
  null,
  '',
  'Left chest 3.5in mark; optional right sleeve GAMERHOLIC vertical.',
  'tall'
),
(
  'prod-hood-host',
  'Host Cut Zip Hoodie',
  'host-cut-zip-hoodie',
  'IYKYK operator piece. “HOST CUT” back print, power-G front. For people who take bps.

Fabric: 80/20 cotton-poly fleece, ~9 oz (300 gsm), full YKK-style zip, brushed lining, dual pouch or welt pockets, rib cuffs. Durable face fabric for chest + sleeve hits.',
  'apparel',
  94.00,
  null,
  '["/art/host-booth.jpg","/art/host-booth.jpg","/brand/gamerholic-mark-256.jpg"]'::jsonb,
  '[{"name":"Size","options":["S","M","L","XL","2XL"]},{"name":"Color","options":["Black","Night Purple"]}]'::jsonb,
  60,
  'GH-HOOD-HOST',
  null,
  true,
  true,
  '/shop/print/host-earns.svg',
  'Orbitron',
  null,
  'HOST CUT',
  'Back HOST CUT; front micro power-G.',
  'tall'
),
(
  'prod-hood-french',
  'Gamerholic French Terry Hoodie',
  'gamerholic-french-terry-hoodie',
  'Premium 100% cotton French terry — loopback luxury, clean face for the wordmark. Not a gym hoodie; a statement layer.

Fabric: 100% cotton French terry, ~10 oz (320 gsm), loopback interior, smooth face. Unbrushed luxury hand, structured drape, metal eyelets. Premium soft-hand print surface.
Fit: tailored-relaxed. Minimal shrink if washed cold.',
  'apparel',
  120.00,
  145.00,
  '["/art/chibi-team-highfive.jpg","/art/host-booth.jpg","/brand/gamerholic-mark-256.jpg"]'::jsonb,
  '[{"name":"Size","options":["S","M","L","XL","2XL"]},{"name":"Color","options":["Black","Arena Charcoal"]}]'::jsonb,
  45,
  'GH-HOOD-FRENCH',
  null,
  true,
  true,
  '/shop/print/gamerholic-wordmark.svg',
  'Orbitron',
  null,
  'GAMERHOLIC',
  'Waterbase / soft-hand only on French terry.',
  'tall'
),
(
  'prod-hood-oversized',
  'Arena Oversized Hoodie',
  'arena-oversized-hoodie',
  'Drop-shoulder oversized with rear GAMERHOLIC and front micro mark. Fashion cut, arena soul.

Fabric: 80/20 cotton-poly heavy fleece, ~12–14 oz (350–400 gsm), dense brush. Double-lined hood with matching drawcords, pouch pocket, rib trim. Tournament-night warmth.
Fit: oversized — size down for regular.',
  'apparel',
  88.00,
  null,
  '["/art/chibi-arcade-friends.jpg","/art/host-booth.jpg","/brand/gamerholic-mark-256.jpg"]'::jsonb,
  '[{"name":"Size","options":["S","M","L","XL","2XL"]},{"name":"Color","options":["Black","Night Purple","Arena Charcoal"]}]'::jsonb,
  70,
  'GH-HOOD-OVER',
  null,
  true,
  false,
  '/shop/print/gamerholic-wordmark.svg',
  'Orbitron',
  null,
  'GAMERHOLIC',
  'Back oversized print up to 14in; front micro.',
  'tall'
),
(
  'prod-hood-fail-bank',
  'Fail Bank Hoodie',
  'fail-bank-hoodie',
  'Arcade landlords only. “FAIL BANK” chest + crown glyph. Warm while the queue fee stacks.

Fabric: 80/20 cotton-poly midweight fleece, ~8.5 oz (280 gsm), brushed interior. Double-lined hood, metal eyelets, kangaroo pocket, rib cuffs & hem. Pill-resistant face for clean prints.',
  'apparel',
  68.00,
  null,
  '["/art/arcade-cabinet.jpg","/art/host-booth.jpg","/brand/gamerholic-mark-256.jpg"]'::jsonb,
  '[{"name":"Size","options":["S","M","L","XL","2XL"]},{"name":"Color","options":["Black","Night Purple","Arena Charcoal"]}]'::jsonb,
  75,
  'GH-HOOD-FAIL',
  null,
  true,
  false,
  '/shop/print/fail-bank.svg',
  'Share Tech Mono',
  null,
  'FAIL BANK',
  'Chest mono lockup.',
  'square'
),
(
  'prod-hood-escrow',
  'Escrow Hoodie',
  'escrow-hoodie',
  '“FUNDS IN ESCROW” subtle chest line. Builder merch that still passes as fashion.

Fabric: 80/20 cotton-poly midweight fleece, ~8.5 oz (280 gsm), brushed interior. Double-lined hood, metal eyelets, kangaroo pocket, rib cuffs & hem. Pill-resistant face for clean prints.',
  'apparel',
  69.00,
  null,
  '["/art/gear-icp.jpg","/art/host-booth.jpg","/brand/gamerholic-mark-256.jpg"]'::jsonb,
  '[{"name":"Size","options":["S","M","L","XL","2XL"]},{"name":"Color","options":["Black"]}]'::jsonb,
  70,
  'GH-HOOD-ESCROW',
  null,
  true,
  false,
  '/shop/print/escrow-not-trust.svg',
  'Share Tech Mono',
  null,
  'FUNDS IN ESCROW',
  'Low-key chest mono, white ink.',
  'square'
),
(
  'prod-hood-blackout',
  'Blackout Tourney Hoodie',
  'blackout-tourney-hoodie',
  'Near-black tonal Gamerholic print — if you know you know under stage lights. Heavy fleece, no loud logos from ten feet.

Fabric: 80/20 cotton-poly heavy fleece, ~12–14 oz (350–400 gsm), dense brush. Double-lined hood with matching drawcords, pouch pocket, rib trim. Tournament-night warmth.
Fit: standard unisex.',
  'apparel',
  98.00,
  null,
  '["/brand/gamerholic-mark-256.jpg","/art/host-booth.jpg","/brand/gamerholic-mark-256.jpg"]'::jsonb,
  '[{"name":"Size","options":["S","M","L","XL","2XL"]},{"name":"Color","options":["Black"]}]'::jsonb,
  50,
  'GH-HOOD-BLKOUT',
  null,
  true,
  false,
  '/shop/print/gamerholic-wordmark.svg',
  'Orbitron',
  null,
  'GAMERHOLIC',
  'Tonal dark-gray on black (not pure white). Specialty ink.',
  'tall'
),
(
  'prod-hood-volt-zip',
  'Volt Trim Zip Hoodie',
  'volt-trim-zip-hoodie',
  'Full-zip with volt-accent drawcords energy and GAMER chest. High-visibility without looking like a jersey.

Fabric: 80/20 cotton-poly fleece, ~9 oz (300 gsm), full YKK-style zip, brushed lining, dual pouch or welt pockets, rib cuffs. Durable face fabric for chest + sleeve hits.',
  'apparel',
  92.00,
  null,
  '["/art/profile-covers/gamerholic-volt.jpg","/art/host-booth.jpg","/brand/gamerholic-mark-256.jpg"]'::jsonb,
  '[{"name":"Size","options":["S","M","L","XL","2XL"]},{"name":"Color","options":["Black","Night Purple"]}]'::jsonb,
  55,
  'GH-HOOD-VOLT-ZIP',
  null,
  true,
  false,
  '/shop/print/gamer-wordmark.svg',
  'Orbitron',
  null,
  'GAMER',
  'Volt ink chest; contrast cord if blank allows.',
  'tall'
),
(
  'prod-hood-limited',
  'Gamerholic Limited Circuit Hoodie',
  'gamerholic-limited-circuit-hoodie',
  'Top-tier limited drop: French terry face feel, heavy structure, dual print (chest mark + numbered-style rear line). Priced for collectors and hosts who already made the cut.

Fabric: 100% cotton French terry, ~10 oz (320 gsm), loopback interior, smooth face. Unbrushed luxury hand, structured drape, metal eyelets. Premium soft-hand print surface.
Fit: modern oversized-leaning. Run small if between sizes → size up.',
  'apparel',
  168.00,
  198.00,
  '["/art/xft-battle.jpg","/art/hero-arena.jpg","/art/host-booth.jpg","/brand/gamerholic-mark-256.jpg"]'::jsonb,
  '[{"name":"Size","options":["S","M","L","XL","2XL"]},{"name":"Color","options":["Black","Night Purple"]}]'::jsonb,
  30,
  'GH-HOOD-LTD',
  null,
  true,
  true,
  '/shop/print/gamerholic-wordmark.svg',
  'Orbitron',
  null,
  'GAMERHOLIC',
  'Premium placement: chest 10in + rear “CIRCUIT” line. Soft-hand only. Low qty intentional.',
  'tall'
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
