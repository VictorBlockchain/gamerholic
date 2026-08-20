# Gamerholic shop assets

## Printer packs (`print/`)

Vector SVG artwork for production screen/DTG. Exact strings + recommended font family.

| File | Text / mark | Font (install for production) |
|------|-------------|-------------------------------|
| `print/*.svg` | See `printText` on product | Orbitron or Share Tech Mono |

Admin: download `print_asset_url` per product; use `print_font_family` / notes for placement.

## Product photos (`products/`)

Ecommerce mockups composited from blank garment bases + print SVGs.

```
products/bases/          # blank tee / hoodie (no art)
products/tees/{design}-front|back|side.jpg
products/hoodies/{design}-front|back|zip-front.jpg
```

Regenerate mockups after changing print SVGs:

```bash
node scripts/compose-shop-products.mjs
```

Then bump `CATALOG_GENERATION` in `src/lib/shop/store.ts` so browsers reseed.
