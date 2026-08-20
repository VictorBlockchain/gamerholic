"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { Box, HStack, Text, VStack } from "@chakra-ui/react";
import { GhBadge } from "@/components/ui";
import {
  categoryLabel,
  formatUsd,
  type ShopProduct,
} from "@/lib/shop/types";
import { shopProductHref } from "@/lib/deep-links";

/**
 * Shop product card — battle NFT card language.
 * Masonry height auto-detects from the product image dimensions (no admin aspect).
 */
export function ProductCard({ product: p }: { product: ShopProduct }) {
  const img = p.images[0] || "/brand/gamerholic-mark-128.jpg";
  const featured = Boolean(p.featured);
  const soldOut = p.stock <= 0;
  const accent = featured ? "#f43fa8" : "#a3ff3d";
  const rail = featured
    ? "linear-gradient(90deg, #db2777, #f43fa8, #8b5cf6)"
    : "linear-gradient(90deg, #7dd41f, #a3ff3d, #22d3ee)";

  /** Exact natural ratio once the image loads. */
  const [ratioCss, setRatioCss] = useState<string | null>(null);

  const applyNaturalRatio = useCallback((el: HTMLImageElement | null) => {
    if (!el) return;
    const w = el.naturalWidth;
    const h = el.naturalHeight;
    if (w > 0 && h > 0) {
      setRatioCss(`${w} / ${h}`);
    }
  }, []);

  const onImgLoad = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      applyNaturalRatio(e.currentTarget);
    },
    [applyNaturalRatio],
  );

  const imgRef = useCallback(
    (el: HTMLImageElement | null) => {
      // Cached images may already be complete when the ref attaches
      if (el?.complete) applyNaturalRatio(el);
    },
    [applyNaturalRatio],
  );

  return (
    <Link
      href={shopProductHref(p.id)}
      style={{ textDecoration: "none", display: "block", width: "100%" }}
    >
      <Box
        position="relative"
        borderRadius="2xl"
        overflow="hidden"
        borderWidth="1px"
        borderColor={featured ? "prize.solid" : "border.brand"}
        bg="bg.elevated"
        boxShadow={featured ? "glow-prize" : "glow"}
        w="100%"
        display="flex"
        flexDirection="column"
        transition="transform 0.15s, box-shadow 0.15s, border-color 0.15s"
        _hover={{
          transform: "translateY(-3px)",
          borderColor: featured ? "prize.fg" : "brand.fg",
          boxShadow: featured ? "glow-prize" : "glow",
        }}
      >
        {/* Holofoil rail */}
        <Box h="1.5" bg={rail} flexShrink={0} />

        {/* Portrait — height from image (auto-detect masonry) */}
        <Box
          position="relative"
          w="100%"
          style={
            ratioCss
              ? { aspectRatio: ratioCss }
              : { minHeight: "12rem" }
          }
          bg="black"
          flexShrink={0}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={imgRef}
            src={img}
            alt={p.name}
            onLoad={onImgLoad}
            style={{
              width: "100%",
              height: ratioCss ? "100%" : "auto",
              objectFit: "cover",
              objectPosition: "center top",
              filter: "saturate(1.12) contrast(1.05)",
              display: "block",
            }}
          />
          <Box
            position="absolute"
            inset="0"
            bg="linear-gradient(180deg, transparent 40%, rgba(7,6,18,0.96) 100%)"
            pointerEvents="none"
          />

          {/* Corner NFT frame ticks */}
          {(
            [
              { t: "2", l: "2", bt: "2px", bl: "2px" },
              { t: "2", r: "2", bt: "2px", br: "2px" },
              { b: "2", l: "2", bb: "2px", bl: "2px" },
              { b: "2", r: "2", bb: "2px", br: "2px" },
            ] as const
          ).map((c, i) => (
            <Box
              key={i}
              position="absolute"
              top={"t" in c ? c.t : undefined}
              bottom={"b" in c ? c.b : undefined}
              left={"l" in c ? c.l : undefined}
              right={"r" in c ? c.r : undefined}
              w="5"
              h="5"
              borderTopWidth={"bt" in c ? c.bt : undefined}
              borderBottomWidth={"bb" in c ? c.bb : undefined}
              borderLeftWidth={"bl" in c ? c.bl : undefined}
              borderRightWidth={"br" in c ? c.br : undefined}
              borderColor={accent}
              opacity={0.9}
              pointerEvents="none"
            />
          ))}

          <HStack
            position="absolute"
            top="3"
            left="3"
            right="3"
            justify="space-between"
            align="flex-start"
            zIndex={1}
          >
            {featured ? (
              <GhBadge tone="prize">Featured</GhBadge>
            ) : (
              <GhBadge tone="brand">{categoryLabel(p.category)}</GhBadge>
            )}
            {soldOut ? (
              <GhBadge tone="muted">Sold out</GhBadge>
            ) : p.sku ? (
              <GhBadge tone="muted">{p.sku.split("-").slice(-1)[0]}</GhBadge>
            ) : null}
          </HStack>

          <Box position="absolute" bottom="3" left="3" right="3" zIndex={1}>
            <Text
              fontFamily="heading"
              fontWeight="extrabold"
              fontSize={{ base: "md", md: "lg" }}
              color="white"
              letterSpacing="0.04em"
              lineHeight="1.2"
              textShadow="0 2px 12px rgba(0,0,0,0.9)"
              lineClamp={2}
            >
              {p.name}
            </Text>
            <Text fontSize="xs" color="whiteAlpha.800" mt="0.5" lineClamp={1}>
              {categoryLabel(p.category)}
              {p.printText ? ` · ${p.printText}` : ""}
            </Text>
          </Box>
        </Box>

        {/* Bottom strip */}
        <Box p="phi3" bg="rgba(7,6,18,0.94)" flexShrink={0}>
          <HStack justify="space-between" align="center" gap="2">
            <VStack align="flex-start" gap="0" minW="0">
              <Text
                fontFamily="heading"
                fontSize="2xs"
                fontWeight="bold"
                letterSpacing="0.12em"
                textTransform="uppercase"
                color="fg.subtle"
              >
                Price
              </Text>
              <HStack gap="2" align="baseline">
                <Text
                  fontFamily="heading"
                  fontSize="md"
                  fontWeight="extrabold"
                  className="gh-text-prize"
                >
                  {formatUsd(p.priceUsd)}
                </Text>
                {p.compareAtUsd && p.compareAtUsd > p.priceUsd ? (
                  <Text
                    fontSize="2xs"
                    color="fg.subtle"
                    textDecoration="line-through"
                  >
                    {formatUsd(p.compareAtUsd)}
                  </Text>
                ) : null}
              </HStack>
            </VStack>
            <Box
              h="1.5"
              w="10"
              borderRadius="full"
              bg="blackAlpha.500"
              overflow="hidden"
              flexShrink={0}
            >
              <Box
                h="100%"
                w={soldOut ? "0%" : "100%"}
                bg={featured ? "#f43fa8" : "#a3ff3d"}
                opacity={0.85}
                boxShadow={
                  soldOut
                    ? undefined
                    : `0 0 8px ${featured ? "#f43fa8" : "#a3ff3d"}`
                }
              />
            </Box>
          </HStack>
        </Box>
      </Box>
    </Link>
  );
}
