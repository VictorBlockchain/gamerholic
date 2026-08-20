"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Box, HStack, Text, VStack } from "@chakra-ui/react";
import { ShoppingBag, ShoppingCart } from "lucide-react";
import { ModeHeader } from "@/components/spectacle/mode-header";
import {
  GhButton,
  GhEmptyState,
  GhSpinner,
  GhSurface,
} from "@/components/ui";
import { ProductCard } from "@/components/shop/product-card";
import { cartCount } from "@/lib/shop/cart";
import {
  loadPublishedCatalog,
  loadShopSettings,
} from "@/lib/shop/store";
import {
  SHOP_CATEGORIES,
  type ShopCategory,
  type ShopProduct,
  type ShopSettings,
} from "@/lib/shop/types";

export function ShopView() {
  const [products, setProducts] = useState<ShopProduct[]>([]);
  const [settings, setSettings] = useState<ShopSettings | null>(null);
  const [cat, setCat] = useState<ShopCategory | "all">("all");
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void (async () => {
      const [list, s] = await Promise.all([
        loadPublishedCatalog(),
        loadShopSettings(),
      ]);
      if (cancelled) return;
      setProducts(list);
      setSettings(s);
      setCount(cartCount());
      setLoading(false);
    })();
    const onCart = () => setCount(cartCount());
    window.addEventListener("gh-shop-cart", onCart);
    return () => {
      cancelled = true;
      window.removeEventListener("gh-shop-cart", onCart);
    };
  }, []);

  const filtered = useMemo(() => {
    if (cat === "all") return products;
    return products.filter((p) => p.category === cat);
  }, [products, cat]);

  if (settings && !settings.enabled) {
    return (
      <VStack align="stretch" gap="phi4" pb="phi4">
        <ModeHeader
          mode="default"
          icon={ShoppingBag}
          title="Gamerholic Shop"
          description="Merch store is temporarily closed."
          badge="Shop"
        />
        <GhEmptyState
          icon={ShoppingBag}
          title="Shop closed"
          description="Check back soon for official Gamerholic gear."
        />
      </VStack>
    );
  }

  if (loading) {
    return (
      <VStack align="stretch" gap="phi4" pb="phi4" py="phi8">
        <ModeHeader
          mode="default"
          icon={ShoppingBag}
          title="Gamerholic Merch"
          description="Loading catalog…"
          badge="Shop"
        />
        <VStack py="phi6" gap="2">
          <GhSpinner />
          <Text fontSize="sm" color="fg.muted">
            Loading products from database…
          </Text>
        </VStack>
      </VStack>
    );
  }

  return (
    <VStack align="stretch" gap="0" pb="phi5">
      <ModeHeader
        mode="default"
        icon={ShoppingBag}
        title={settings?.bannerTitle || "Gamerholic Merch"}
        description={
          settings?.bannerBody ||
          "Official apparel, controllers, electronics, and desk gear."
        }
        badge="Shop"
        action={
          <HStack gap="2">
            <Link href="/shop/cart">
              <GhButton
                size="sm"
                variant="prize"
                leftIcon={<ShoppingCart size={14} />}
              >
                Cart{count > 0 ? ` (${count})` : ""}
              </GhButton>
            </Link>
            <Link href="/shop/orders">
              <GhButton size="sm" variant="outline">
                My orders
              </GhButton>
            </Link>
          </HStack>
        }
      />

      <GhSurface variant="glass" p="phi3" mb="phi4" mt="phi3">
        <HStack gap="2" flexWrap="wrap">
          <GhButton
            size="sm"
            variant={cat === "all" ? "primary" : "ghost"}
            onClick={() => setCat("all")}
          >
            All
          </GhButton>
          {SHOP_CATEGORIES.map((c) => (
            <GhButton
              key={c.id}
              size="sm"
              variant={cat === c.id ? "live" : "ghost"}
              onClick={() => setCat(c.id)}
            >
              {c.label}
            </GhButton>
          ))}
        </HStack>
      </GhSurface>

      {filtered.length === 0 ? (
        <GhEmptyState
          icon={ShoppingBag}
          title="No products"
          description="Nothing published yet. Admins add products in the moderator console Shop tab (Supabase gh_shop_products)."
        />
      ) : (
        <Box className="gh-shop-masonry" mt="phi2">
          {filtered.map((p) => (
            <Box key={p.id} className="gh-shop-masonry-item">
              <ProductCard product={p} />
            </Box>
          ))}
        </Box>
      )}

      {settings?.shippingBlurb ? (
        <Text fontSize="xs" color="fg.subtle" mt="phi5" lineHeight="1.5">
          {settings.shippingBlurb}
        </Text>
      ) : null}
    </VStack>
  );
}
