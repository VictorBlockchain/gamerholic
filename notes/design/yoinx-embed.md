# Yoinx product embed — multi-business

**Updated:** 2026-08-02  
**Any Yoinx user with a business** can generate a site key and put a **Yoinx!** button on product pages (Gamerholic, Shopify, custom).

## Model

| Role | Who |
|------|-----|
| **Business** | Merchant that owns the product (`businesses` + `business_embed_keys`) |
| **Creator** | Player who clicks the button (II principal) |
| **Site key** | Publishable `yx_pk_…` (one active per business) |
| **Origins** | Optional allowlist of shop Origins for CORS + validation |

## Merchant setup (Yoinx UI)

1. Profile → **Businesses** → add business (if needed).
2. Click **Yoinx! button** on that business.
3. Copy **business id** + **site key**.
4. Set **allowed origins** (e.g. `https://your-shop.com`, `http://localhost:3020`) → Save.
5. Copy **env snippet** into the merchant site.

Apply SQL once:

```bash
# Supabase SQL editor
\i supabase/patch_business_embed_keys.sql
```

## Merchant site env (e.g. Gamerholic or any shop)

```bash
NEXT_PUBLIC_YOINX_API_URL=https://yoinx.fun   # or http://localhost:3030
NEXT_PUBLIC_YOINX_APP_URL=https://yoinx.fun
NEXT_PUBLIC_YOINX_SITE_KEY=yx_pk_...          # from Profile → Yoinx! button
NEXT_PUBLIC_YOINX_BUSINESS_ID=<business-uuid>
```

Gamerholic is just one merchant: use **its** business key, not a special case.

## API

`POST /api/create/embed`

- Header: `X-Yoinx-Site-Key: yx_pk_…`
- Body: `principal`, `businessId`, product title/story/images, `minPlayers`, `entryYoinx`, …
- Resolves key via `business_embed_keys` (DB), then env fallback
- Sets `games.business_id` + `creator_principal`

`GET/POST /api/profile/business/embed` — owner manages key + origins.

## Economics (unchanged)

- Random min players **5–25**
- `entryYoinx = ceil(priceUsd / 0.10 / minPlayers)`
- Display ICP ≈ productIcp / minPlayers
