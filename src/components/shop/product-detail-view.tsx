"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
} from "react";
import Link from "next/link";
import {
  Box,
  Flex,
  Grid,
  Heading,
  HStack,
  Text,
  VStack,
} from "@chakra-ui/react";
import {
  ArrowLeft,
  Heart,
  Package,
  ShoppingCart,
  Users,
} from "lucide-react";
import {
  GhAlert,
  GhAvatar,
  GhBadge,
  GhButton,
  GhEmptyState,
  GhSurface,
  ghToast,
} from "@/components/ui";
import { useSession } from "@/components/providers/session-context";
import { addToCart } from "@/lib/shop/cart";
import {
  fetchIcpUsdRate,
  formatIcp,
  usdToIcp,
} from "@/lib/shop/fx";
import {
  countProductOrders,
  ensureProduct,
  getProduct,
  getShopSettings,
  listProductBuyers,
  type ProductBuyer,
} from "@/lib/shop/store";
import {
  isInWishlist,
  toggleWishlist,
} from "@/lib/shop/wishlist";
import {
  categoryLabel,
  formatUsd,
  type ShopProduct,
} from "@/lib/shop/types";
import { YoinxProductSection } from "@/components/shop/yoinx-product-section";

export function ProductDetailView({ productId }: { productId: string }) {
  const { principal, profile, isLoggedIn } = useSession();
  const [product, setProduct] = useState<ShopProduct | null>(null);
  const [imgIx, setImgIx] = useState(0);
  const [variantSel, setVariantSel] = useState<Record<string, string>>({});
  const [qty, setQty] = useState(1);
  const [wished, setWished] = useState(false);
  const [usdPerIcp, setUsdPerIcp] = useState<number | null>(null);
  const [orderStats, setOrderStats] = useState({ units: 0, orderCount: 0 });
  const [buyers, setBuyers] = useState<ProductBuyer[]>([]);

  const refreshSocial = useCallback(() => {
    if (!productId) return;
    setOrderStats(countProductOrders(productId));
    setBuyers(
      listProductBuyers(productId, {
        excludePrincipal: principal ?? undefined,
        limit: 16,
      }),
    );
    setWished(isInWishlist(productId, principal));
  }, [productId, principal]);

  useEffect(() => {
    let cancelled = false;
    setImgIx(0);
    setVariantSel({});
    setQty(1);
    const cached = getProduct(productId);
    if (cached) setProduct(cached);
    else setProduct(null);
    void ensureProduct(productId).then((p) => {
      if (!cancelled) setProduct(p);
    });
    return () => {
      cancelled = true;
    };
  }, [productId]);

  useEffect(() => {
    refreshSocial();
  }, [refreshSocial]);

  useEffect(() => {
    let cancelled = false;
    void fetchIcpUsdRate().then((r) => {
      if (!cancelled) setUsdPerIcp(r);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const onWish = () => setWished(isInWishlist(productId, principal));
    window.addEventListener("gh-shop-wishlist", onWish);
    return () => window.removeEventListener("gh-shop-wishlist", onWish);
  }, [productId, principal]);

  const variantLabel = useMemo(() => {
    if (!product?.variants?.length) return undefined;
    return product.variants
      .map((v) => {
        const opt = variantSel[v.name] || v.options[0];
        return `${v.name}: ${opt}`;
      })
      .join(" · ");
  }, [product, variantSel]);

  if (!product || !product.published) {
    return (
      <GhEmptyState
        icon={ShoppingCart}
        title="Product not found"
        description="This item is unavailable or unpublished."
        action={
          <Link href="/shop">
            <GhButton variant="primary" leftIcon={<ArrowLeft size={14} />}>
              Back to shop
            </GhButton>
          </Link>
        }
      />
    );
  }

  const images = product.images.length
    ? product.images
    : ["/brand/gamerholic-mark-128.jpg"];
  const main = images[Math.min(imgIx, images.length - 1)]!;
  const settings = getShopSettings();
  const icpAmt =
    usdPerIcp != null ? usdToIcp(product.priceUsd, usdPerIcp) : null;

  const descParagraphs = product.description
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const onAdd = () => {
    if (product.stock <= 0) {
      ghToast({ title: "Sold out", type: "error" });
      return;
    }
    addToCart(product.id, qty, variantLabel);
    ghToast({
      title: "Added to cart",
      description: product.name,
      type: "success",
    });
  };

  const onWish = () => {
    const nowOn = toggleWishlist(product.id, principal);
    setWished(nowOn);
    ghToast({
      title: nowOn ? "Saved to wishlist" : "Removed from wishlist",
      description: product.name,
      type: "success",
    });
  };

  const selectStyle: CSSProperties = {
    width: "100%",
    height: "2.75rem",
    borderRadius: "0.75rem",
    border: "1px solid rgba(255,255,255,0.16)",
    background: "rgba(0,0,0,0.45)",
    color: "#ffffff",
    padding: "0 0.75rem",
    fontFamily: "inherit",
    fontSize: "0.95rem",
  };

  return (
    <VStack align="stretch" gap="0" className="gh-stack-phi-lg" pb="phi5">
      {/* Top nav */}
      <Box className="gh-home-section">
        <HStack justify="space-between" flexWrap="wrap" gap="2">
          <Link href="/shop">
            <GhButton
              size="sm"
              variant="ghost"
              leftIcon={<ArrowLeft size={14} />}
            >
              Shop
            </GhButton>
          </Link>
          <HStack gap="2">
            <Link href="/shop/cart">
              <GhButton size="sm" variant="outline">
                Cart
              </GhButton>
            </Link>
            {isLoggedIn ? (
              <Text fontSize="xs" color="whiteAlpha.700">
                {profile?.username || "Connected"}
              </Text>
            ) : null}
          </HStack>
        </HStack>
      </Box>

      {/* Main product panel — visitor / game-panel language */}
      <Box
        className="gh-home-section gh-game-panel"
        borderRadius="3xl"
        overflow="hidden"
        borderWidth="1px"
        borderColor="border.default"
        bg="bg.glass"
        backdropFilter="blur(18px)"
      >
        <Box className="gh-brand-bar" h="1" />
        <Grid
          templateColumns={{ base: "1fr", lg: "1.15fr 1fr" }}
          gap="0"
          alignItems="stretch"
        >
          {/* Gallery */}
          <Box
            position="relative"
            bg="black"
            minH={{ base: "18rem", md: "28rem" }}
            borderRightWidth={{ lg: "1px" }}
            borderColor="border.default"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={main}
              alt={product.name}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: "block",
                minHeight: "18rem",
              }}
            />
            <HStack
              position="absolute"
              top="3"
              left="3"
              right="3"
              justify="space-between"
            >
              <HStack gap="1.5" flexWrap="wrap">
                <GhBadge tone="live">{categoryLabel(product.category)}</GhBadge>
                {product.featured ? (
                  <GhBadge tone="prize">Featured</GhBadge>
                ) : null}
              </HStack>
              {product.stock <= 0 ? (
                <GhBadge tone="muted">Sold out</GhBadge>
              ) : (
                <GhBadge tone="brand">{product.stock} in stock</GhBadge>
              )}
            </HStack>
            {images.length > 1 ? (
              <HStack
                position="absolute"
                bottom="3"
                left="3"
                right="3"
                gap="2"
                overflowX="auto"
                className="gh-scroll-hide"
              >
                {images.map((src, i) => (
                  <Box
                    key={src + i}
                    as="button"
                    flexShrink={0}
                    w="14"
                    h="14"
                    borderRadius="lg"
                    overflow="hidden"
                    borderWidth="2px"
                    borderColor={
                      i === imgIx ? "brand.solid" : "whiteAlpha.300"
                    }
                    onClick={() => setImgIx(i)}
                    cursor="pointer"
                    boxShadow="0 4px 16px rgba(0,0,0,0.45)"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={src}
                      alt=""
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  </Box>
                ))}
              </HStack>
            ) : null}
          </Box>

          {/* Copy + buy */}
          <VStack
            align="stretch"
            gap="phi3"
            p={{ base: "phi4", md: "phi5" }}
            justify="center"
          >
            {product.sku ? (
              <Text
                fontFamily="heading"
                fontSize="2xs"
                fontWeight="bold"
                letterSpacing="0.14em"
                textTransform="uppercase"
                color="brand.fg"
              >
                {product.sku}
              </Text>
            ) : null}

            <Heading
              as="h1"
              fontFamily="heading"
              fontSize={{ base: "2xl", md: "3xl" }}
              fontWeight="extrabold"
              color="white"
              letterSpacing="0.03em"
              lineHeight="1.15"
            >
              {product.name}
            </Heading>

            {/* Price + ICP */}
            <GhSurface variant="elevated" p="phi3">
              <HStack justify="space-between" align="flex-end" flexWrap="wrap" gap="2">
                <Box>
                  <Text
                    fontSize="2xs"
                    fontFamily="heading"
                    letterSpacing="0.12em"
                    textTransform="uppercase"
                    color="whiteAlpha.600"
                    mb="1"
                  >
                    Price
                  </Text>
                  <HStack gap="2" align="baseline">
                    <Text
                      fontFamily="heading"
                      fontSize="2xl"
                      fontWeight="extrabold"
                      className="gh-text-prize"
                    >
                      {formatUsd(product.priceUsd)}
                    </Text>
                    {product.compareAtUsd &&
                    product.compareAtUsd > product.priceUsd ? (
                      <Text
                        fontSize="sm"
                        color="whiteAlpha.500"
                        textDecoration="line-through"
                      >
                        {formatUsd(product.compareAtUsd)}
                      </Text>
                    ) : null}
                  </HStack>
                </Box>
                <Box textAlign="right">
                  <Text
                    fontSize="2xs"
                    fontFamily="heading"
                    letterSpacing="0.12em"
                    textTransform="uppercase"
                    color="whiteAlpha.600"
                    mb="1"
                  >
                    ≈ ICP
                  </Text>
                  <Text
                    fontFamily="heading"
                    fontSize="lg"
                    fontWeight="extrabold"
                    color="white"
                  >
                    {icpAmt != null ? formatIcp(icpAmt) : "…"}
                  </Text>
                  {usdPerIcp != null ? (
                    <Text fontSize="2xs" color="whiteAlpha.500" mt="0.5">
                      @ {formatUsd(usdPerIcp)}/ICP
                    </Text>
                  ) : null}
                </Box>
              </HStack>
            </GhSurface>

            {/* Social proof from real orders */}
            <HStack gap="phi3" flexWrap="wrap">
              <HStack gap="2" color="white">
                <Package size={16} color="var(--gh-colors-brand-fg, #a3ff3d)" />
                <Text fontSize="sm" fontWeight="semibold" color="white">
                  {orderStats.units > 0
                    ? `${orderStats.units} ordered`
                    : "No orders yet"}
                </Text>
                {orderStats.orderCount > 0 ? (
                  <Text fontSize="xs" color="whiteAlpha.600">
                    · {orderStats.orderCount} checkout
                    {orderStats.orderCount === 1 ? "" : "s"}
                  </Text>
                ) : null}
              </HStack>
            </HStack>

            {/* Description — high contrast white */}
            <VStack align="stretch" gap="2">
              {descParagraphs.map((para, i) => (
                <Text
                  key={i}
                  fontSize="sm"
                  color="white"
                  opacity={i === 0 ? 1 : 0.88}
                  lineHeight="1.65"
                  fontWeight={i === 0 ? "medium" : "normal"}
                >
                  {para}
                </Text>
              ))}
            </VStack>

            {product.variants?.map((v) => (
              <Box key={v.name}>
                <Text
                  fontSize="xs"
                  fontFamily="heading"
                  fontWeight="bold"
                  letterSpacing="0.08em"
                  textTransform="uppercase"
                  color="white"
                  mb="1.5"
                >
                  {v.name}
                </Text>
                <select
                  value={variantSel[v.name] || v.options[0]}
                  onChange={(e) =>
                    setVariantSel((s) => ({
                      ...s,
                      [v.name]: e.target.value,
                    }))
                  }
                  style={selectStyle}
                  aria-label={v.name}
                >
                  {v.options.map((o) => (
                    <option key={o} value={o} style={{ background: "#0d0b1a" }}>
                      {o}
                    </option>
                  ))}
                </select>
              </Box>
            ))}

            <Box>
              <Text
                fontSize="xs"
                fontFamily="heading"
                fontWeight="bold"
                letterSpacing="0.08em"
                textTransform="uppercase"
                color="white"
                mb="1.5"
              >
                Quantity
              </Text>
              <select
                value={String(qty)}
                onChange={(e) => setQty(parseInt(e.target.value, 10) || 1)}
                style={{ ...selectStyle, width: "6.5rem" }}
                aria-label="Quantity"
              >
                {[1, 2, 3, 4, 5, 6, 8, 10].map((n) => (
                  <option key={n} value={n} style={{ background: "#0d0b1a" }}>
                    {n}
                  </option>
                ))}
              </select>
            </Box>

            <HStack gap="2" flexWrap="wrap" pt="1">
              <GhButton
                variant="prize"
                size="lg"
                leftIcon={<ShoppingCart size={16} />}
                onClick={onAdd}
                disabled={product.stock <= 0}
              >
                Add to cart
              </GhButton>
              <GhButton
                variant={wished ? "primary" : "outline"}
                size="lg"
                leftIcon={
                  <Heart
                    size={16}
                    fill={wished ? "currentColor" : "none"}
                  />
                }
                onClick={onWish}
              >
                {wished ? "Wishlisted" : "Wishlist"}
              </GhButton>
              <Link href="/shop/cart">
                <GhButton variant="ghost" size="lg">
                  View cart
                </GhButton>
              </Link>
            </HStack>

            {settings.shippingBlurb ? (
              <GhAlert tone="brand" title="Shipping">
                <Text color="white" fontSize="sm">
                  {settings.shippingBlurb}
                </Text>
              </GhAlert>
            ) : null}
          </VStack>
        </Grid>
      </Box>

      {/* Yoinx business button — multiplayer prize table for this product */}
      <YoinxProductSection product={product} />

      {/* Buyers — real orders only */}
      <Box className="gh-home-section">
        <GhSurface
          variant="glass"
          p="phi4"
          borderRadius="2xl"
          className="gh-game-panel"
        >
          <HStack gap="2" mb="phi3">
            <Users size={18} color="var(--gh-colors-brand-fg, #a3ff3d)" />
            <Text
              fontFamily="heading"
              fontWeight="extrabold"
              fontSize="md"
              color="white"
              letterSpacing="0.04em"
            >
              Who ordered this
            </Text>
          </HStack>
          {buyers.length === 0 ? (
            <Text fontSize="sm" color="whiteAlpha.700" lineHeight="1.55">
              No one has checked out this item yet — real orders show up here
              after purchase. Be first.
            </Text>
          ) : (
            <VStack align="stretch" gap="2">
              {buyers.map((b) => (
                <Flex
                  key={b.orderId}
                  align="center"
                  gap="3"
                  p="phi2"
                  borderRadius="xl"
                  borderWidth="1px"
                  borderColor="border.default"
                  bg="blackAlpha.400"
                >
                  <GhAvatar name={b.label} size="sm" />
                  <Box minW="0" flex="1">
                    <Text
                      fontWeight="bold"
                      fontSize="sm"
                      color="white"
                      lineClamp={1}
                    >
                      {b.label}
                    </Text>
                    <Text fontSize="2xs" color="whiteAlpha.600">
                      {new Date(b.at).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                      {b.qty > 1 ? ` · ×${b.qty}` : ""}
                    </Text>
                  </Box>
                  <GhBadge tone="muted">Ordered</GhBadge>
                </Flex>
              ))}
            </VStack>
          )}
        </GhSurface>
      </Box>
    </VStack>
  );
}
