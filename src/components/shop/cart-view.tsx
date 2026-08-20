"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Box, Flex, HStack, Text, VStack } from "@chakra-ui/react";
import {
  ArrowLeft,
  ShoppingCart,
  Trash2,
  Truck,
} from "lucide-react";
import {
  GhBadge,
  GhButton,
  GhEmptyState,
  GhSurface,
  ghToast,
} from "@/components/ui";
import {
  cartSubtotalUsd,
  getCart,
  updateCartQty,
} from "@/lib/shop/cart";
import {
  ensureProduct,
  getProduct,
  loadPublishedCatalog,
} from "@/lib/shop/store";
import { fetchIcpUsdRate, formatIcp, usdToIcp } from "@/lib/shop/fx";
import { formatUsd, type CartLine } from "@/lib/shop/types";
import { shopProductHref } from "@/lib/deep-links";

export function CartView() {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [usdPerIcp, setUsdPerIcp] = useState<number | null>(null);
  const [ready, setReady] = useState(false);

  const refresh = () => setLines(getCart());

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      await loadPublishedCatalog();
      const cart = getCart();
      await Promise.all(cart.map((l) => ensureProduct(l.productId)));
      if (cancelled) return;
      refresh();
      setReady(true);
    })();
    const onCart = () => refresh();
    window.addEventListener("gh-shop-cart", onCart);
    return () => {
      cancelled = true;
      window.removeEventListener("gh-shop-cart", onCart);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    void fetchIcpUsdRate().then((r) => {
      if (!cancelled) setUsdPerIcp(r);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!ready) {
    return (
      <VStack py="phi8" gap="2">
        <Text fontSize="sm" color="fg.muted">
          Loading cart…
        </Text>
      </VStack>
    );
  }

  if (!lines.length) {
    return (
      <VStack align="stretch" gap="phi4" pb="phi4" className="gh-stack-phi-lg">
        <Link href="/shop">
          <GhButton size="sm" variant="ghost" leftIcon={<ArrowLeft size={14} />}>
            Continue shopping
          </GhButton>
        </Link>
        <GhEmptyState
          icon={ShoppingCart}
          title="Cart is empty"
          description="Browse Gamerholic merch and add items."
          action={
            <Link href="/shop">
              <GhButton variant="prize">Browse shop</GhButton>
            </Link>
          }
        />
      </VStack>
    );
  }

  const sub = cartSubtotalUsd();
  const icp = usdPerIcp != null ? usdToIcp(sub, usdPerIcp) : null;

  return (
    <VStack align="stretch" gap="phi4" pb="phi5" className="gh-stack-phi-lg">
      <HStack justify="space-between" flexWrap="wrap" gap="2">
        <Text
          fontFamily="heading"
          fontWeight="extrabold"
          fontSize="xl"
          color="white"
        >
          Cart
        </Text>
        <Link href="/shop">
          <GhButton size="sm" variant="ghost" leftIcon={<ArrowLeft size={14} />}>
            Continue shopping
          </GhButton>
        </Link>
      </HStack>

      {/* Shipping notice */}
      <GhSurface
        variant="glass"
        p="phi4"
        borderRadius="2xl"
        className="gh-game-panel"
        borderColor="border.brand"
      >
        <Box className="gh-brand-bar" h="1" mb="phi3" borderRadius="full" />
        <HStack align="flex-start" gap="phi3">
          <Box
            w="10"
            h="10"
            borderRadius="xl"
            bg="brand.muted"
            color="brand.fg"
            display="flex"
            alignItems="center"
            justifyContent="center"
            flexShrink={0}
          >
            <Truck size={20} />
          </Box>
          <Box>
            <HStack gap="2" flexWrap="wrap" mb="1">
              <GhBadge tone="brand">Free shipping</GhBadge>
              <GhBadge tone="live">USA only</GhBadge>
            </HStack>
            <Text
              fontFamily="heading"
              fontWeight="extrabold"
              fontSize="md"
              color="white"
              mb="1"
            >
              Ships free across the United States
            </Text>
            <Text fontSize="sm" color="whiteAlpha.850" lineHeight="1.55">
              Allow up to <strong>14 business days</strong> for shipping after
              payment confirmation. USA only for now — more markets coming
              soon.
            </Text>
          </Box>
        </HStack>
      </GhSurface>

      <VStack align="stretch" gap="2">
        {lines.map((l) => {
          const p = getProduct(l.productId);
          if (!p) return null;
          const img = p.images[0] || "/brand/gamerholic-mark-128.jpg";
          const lineUsd = p.priceUsd * l.qty;
          const lineIcp =
            usdPerIcp != null ? usdToIcp(lineUsd, usdPerIcp) : null;
          const href = shopProductHref(p.id);
          return (
            <GhSurface
              key={`${l.productId}-${l.variantLabel || ""}`}
              variant="elevated"
              p="phi3"
              borderRadius="2xl"
            >
              <Flex gap="phi3" align="center" flexWrap="wrap">
                <Link href={href} style={{ flexShrink: 0 }}>
                  <Box
                    w="16"
                    h="16"
                    borderRadius="lg"
                    overflow="hidden"
                    borderWidth="1px"
                    borderColor="border.brand"
                    transition="transform 0.15s"
                    _hover={{ transform: "scale(1.03)" }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={img}
                      alt={p.name}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  </Box>
                </Link>
                <Box flex="1" minW="8rem">
                  <Link href={href} style={{ textDecoration: "none" }}>
                    <Text
                      fontWeight="extrabold"
                      fontSize="sm"
                      color="white"
                      fontFamily="heading"
                      _hover={{ color: "brand.fg" }}
                      transition="color 0.15s"
                    >
                      {p.name}
                    </Text>
                  </Link>
                  {l.variantLabel ? (
                    <Text fontSize="2xs" color="whiteAlpha.600">
                      {l.variantLabel}
                    </Text>
                  ) : null}
                  <HStack gap="2" mt="1" align="baseline">
                    <Text
                      className="gh-text-prize"
                      fontWeight="bold"
                      fontSize="sm"
                      fontFamily="heading"
                    >
                      {formatUsd(p.priceUsd)}
                    </Text>
                    {lineIcp != null ? (
                      <Text fontSize="2xs" color="whiteAlpha.600">
                        ≈ {formatIcp(usdToIcp(p.priceUsd, usdPerIcp!))} ea
                      </Text>
                    ) : null}
                  </HStack>
                  <Text fontSize="2xs" color="whiteAlpha.500" mt="0.5">
                    Line {formatUsd(lineUsd)}
                    {lineIcp != null ? ` · ≈ ${formatIcp(lineIcp)}` : ""}
                  </Text>
                </Box>
                <HStack gap="2">
                  <select
                    value={String(l.qty)}
                    onChange={(e) => {
                      updateCartQty(
                        l.productId,
                        parseInt(e.target.value, 10) || 1,
                        l.variantLabel,
                      );
                      refresh();
                    }}
                    style={{
                      height: "2.25rem",
                      borderRadius: "0.5rem",
                      border: "1px solid rgba(255,255,255,0.16)",
                      background: "rgba(0,0,0,0.45)",
                      color: "#ffffff",
                      padding: "0 0.5rem",
                    }}
                    aria-label={`Quantity for ${p.name}`}
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                      <option
                        key={n}
                        value={n}
                        style={{ background: "#0d0b1a" }}
                      >
                        {n}
                      </option>
                    ))}
                  </select>
                  <GhButton
                    size="sm"
                    variant="ghost"
                    aria-label="Remove"
                    onClick={() => {
                      updateCartQty(l.productId, 0, l.variantLabel);
                      refresh();
                      ghToast({ title: "Removed", type: "info" });
                    }}
                  >
                    <Trash2 size={14} />
                  </GhButton>
                </HStack>
              </Flex>
            </GhSurface>
          );
        })}
      </VStack>

      <GhSurface variant="prize" p="phi4" borderRadius="2xl">
        <HStack justify="space-between" mb="1">
          <Text fontWeight="bold" color="white">
            Subtotal
          </Text>
          <Text
            fontFamily="heading"
            fontWeight="extrabold"
            className="gh-text-prize"
            fontSize="xl"
          >
            {formatUsd(sub)}
          </Text>
        </HStack>
        <HStack justify="space-between" mb="phi3">
          <Text fontSize="sm" color="whiteAlpha.700">
            ≈ ICP
          </Text>
          <Text fontFamily="heading" fontWeight="bold" color="white">
            {icp != null ? formatIcp(icp) : "…"}
          </Text>
        </HStack>
        <Text fontSize="2xs" color="whiteAlpha.600" mb="phi3">
          Free USA shipping · up to 14 business days after payment
        </Text>
        <Link href="/shop/checkout">
          <GhButton variant="prize" w="100%">
            Checkout
          </GhButton>
        </Link>
      </GhSurface>
    </VStack>
  );
}
