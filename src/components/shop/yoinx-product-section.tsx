"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Box, Flex, HStack, SimpleGrid, Text, VStack } from "@chakra-ui/react";
import {
  ExternalLink,
  Gamepad2,
  Sparkles,
  Users,
  Zap,
} from "lucide-react";
import {
  GhBadge,
  GhButton,
  GhSurface,
  ghToast,
} from "@/components/ui";
import { useSession } from "@/components/providers/session-context";
import { fetchIcpUsdRate, formatIcp, usdToIcp } from "@/lib/shop/fx";
import type { ShopProduct } from "@/lib/shop/types";
import {
  absoluteProductImage,
  createYoinxItemTable,
  embedConfigured,
  entryIcpEstimate,
  entryYoinxForProduct,
  getYoinxAppBase,
  getYoinxBusinessId,
  randomMinPlayers,
} from "@/lib/yoinx/client";

/**
 * Business “Yoinx!” embed — turn this product into a multiplayer prize table.
 * Placed after shipping notices on the product page.
 */
export function YoinxProductSection({ product }: { product: ShopProduct }) {
  const { isLoggedIn, principal, login } = useSession();
  const [usdPerIcp, setUsdPerIcp] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [lastPlayUrl, setLastPlayUrl] = useState<string | null>(null);
  const [lastBiz, setLastBiz] = useState<string | null>(null);
  const [preview, setPreview] = useState<{
    minPlayers: number;
    entryYoinx: number;
    entryIcp: number;
  } | null>(null);
  const configured = embedConfigured();

  useEffect(() => {
    let cancelled = false;
    void fetchIcpUsdRate().then((r) => {
      if (!cancelled) setUsdPerIcp(r);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Fresh random min-players preview when product changes
  useEffect(() => {
    const minPlayers = randomMinPlayers(5, 25);
    const productIcp =
      usdPerIcp != null ? usdToIcp(product.priceUsd, usdPerIcp) : 0;
    setPreview({
      minPlayers,
      entryYoinx: entryYoinxForProduct(product.priceUsd, minPlayers),
      entryIcp: entryIcpEstimate(productIcp, minPlayers),
    });
  }, [product.id, product.priceUsd, usdPerIcp]);

  const story = useMemo(() => {
    const lines = product.description
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    const body = lines.slice(0, 3).join(" ");
    return (
      body ||
      `Win ${product.name} on Yoinx — play the table, take the merch.`
    );
  }, [product.description, product.name]);

  const title = useMemo(
    () => `Win ${product.name} · Gamerholic`,
    [product.name],
  );

  const onYoinx = async () => {
    let p = principal;
    if (!isLoggedIn || !p) {
      try {
        await login();
      } catch {
        ghToast({
          title: "Connect required",
          description: "Sign in with Internet Identity to create a Yoinx table.",
          type: "error",
        });
        return;
      }
      // principal may update after re-render — ask user to click again if still empty
      p = principal;
    }
    if (!p) {
      ghToast({
        title: "Almost there",
        description: "Connected — click Yoinx! again to create the table.",
        type: "info",
      });
      return;
    }

    setBusy(true);
    try {
      const minPlayers = randomMinPlayers(5, 25);
      const productIcp =
        usdPerIcp != null ? usdToIcp(product.priceUsd, usdPerIcp) : 0;
      const entryYoinx = entryYoinxForProduct(product.priceUsd, minPlayers);
      const entryIcp = entryIcpEstimate(productIcp, minPlayers);
      setPreview({ minPlayers, entryYoinx, entryIcp });

      const origin =
        typeof window !== "undefined" ? window.location.origin : undefined;
      const images = (product.images || [])
        .map((src) => absoluteProductImage(src, origin))
        .filter(Boolean)
        .slice(0, 5);

      const result = await createYoinxItemTable({
        principal: p,
        title,
        story,
        itemName: product.name,
        itemPriceUsd: product.priceUsd,
        minPlayers,
        entryYoinx,
        entryFeeIcp: entryIcp,
        images,
      });

      if (!result.ok) {
        ghToast({
          title: "Yoinx create failed",
          description: result.error,
          type: "error",
        });
        return;
      }

      setLastPlayUrl(result.playUrl);
      if (result.businessName) setLastBiz(result.businessName);
      try {
        sessionStorage.setItem(
          `gh_yoinx_table_${product.id}`,
          JSON.stringify({
            gameId: result.id,
            playUrl: result.playUrl,
            businessId: result.businessId,
            businessName: result.businessName,
            minPlayers,
            entryYoinx,
            at: new Date().toISOString(),
          }),
        );
      } catch {
        /* ignore */
      }

      ghToast({
        title: "Yoinx table created",
        description: `${result.businessName || "Business"} · ${minPlayers} min · ${entryYoinx} Yoinx entry`,
        type: "success",
      });

      // Open table in new tab so shop session stays put
      window.open(result.playUrl, "_blank", "noopener,noreferrer");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Box className="gh-home-section">
      <Box
        borderRadius="2xl"
        overflow="hidden"
        borderWidth="1px"
        borderColor="attr.solid"
        bg="bg.glass"
        backdropFilter="blur(18px)"
        className="gh-game-panel"
      >
        {/* Attr / violet holofoil rail (distinct from prize merch) */}
        <Box
          h="1.5"
          bg="linear-gradient(90deg, #8b5cf6, #a3ff3d, #22d3ee)"
        />
        <Box p={{ base: "phi4", md: "phi5" }}>
          <HStack justify="space-between" align="flex-start" flexWrap="wrap" gap="3" mb="phi3">
            <HStack gap="2" flexWrap="wrap">
              <GhBadge tone="attr">Yoinx</GhBadge>
              <GhBadge tone="brand">Business button</GhBadge>
              <GhBadge tone="live">Multiplayer prize</GhBadge>
            </HStack>
            <Text
              fontFamily="heading"
              fontSize="2xs"
              letterSpacing="0.14em"
              textTransform="uppercase"
              color="attr.fg"
              fontWeight="bold"
            >
              Cross-app
            </Text>
          </HStack>

          <Flex
            direction={{ base: "column", md: "row" }}
            gap="phi4"
            align={{ md: "center" }}
          >
            <Box flex="1" minW="0">
              <HStack gap="2" mb="2">
                <Sparkles size={20} color="#a78bfa" />
                <Text
                  fontFamily="heading"
                  fontWeight="extrabold"
                  fontSize={{ base: "xl", md: "2xl" }}
                  color="white"
                  letterSpacing="0.03em"
                >
                  Yoinx! this product
                </Text>
              </HStack>
              <Text
                fontSize="sm"
                color="white"
                opacity={0.9}
                lineHeight="1.65"
                mb="phi3"
              >
                Any Yoinx business can add this button on a product page. One
                click opens a live multiplayer table for <strong>this</strong>{" "}
                item under <strong>that</strong> business. Entry fees fund the
                game; winner claims the merch. Your II is the table creator;
                merchant identity is the publishable site key + business id
                from Yoinx Profile → Businesses → Yoinx! button.
              </Text>
              {!configured ? (
                <Text
                  fontSize="xs"
                  color="prize.fg"
                  mb="phi3"
                  fontFamily="heading"
                >
                  Embed not configured — get site key + business id from Yoinx
                  Profile → Businesses → Yoinx! button, then set
                  NEXT_PUBLIC_YOINX_SITE_KEY and NEXT_PUBLIC_YOINX_BUSINESS_ID.
                </Text>
              ) : (
                <Text fontSize="2xs" color="whiteAlpha.550" mb="phi3">
                  Business id: {getYoinxBusinessId().slice(0, 8)}…
                  {lastBiz ? ` · last table: ${lastBiz}` : ""}
                </Text>
              )}

              <SimpleGrid columns={{ base: 1, sm: 3 }} gap="phi2" mb="phi3">
                <GhSurface variant="muted" p="phi2" borderRadius="xl">
                  <HStack gap="2" mb="1">
                    <Users size={14} color="#a3ff3d" />
                    <Text
                      fontSize="2xs"
                      fontFamily="heading"
                      fontWeight="bold"
                      letterSpacing="0.1em"
                      textTransform="uppercase"
                      color="whiteAlpha.700"
                    >
                      Min players
                    </Text>
                  </HStack>
                  <Text
                    fontFamily="heading"
                    fontWeight="extrabold"
                    color="white"
                    fontSize="lg"
                  >
                    {preview?.minPlayers ?? "…"}{" "}
                    <Text as="span" fontSize="xs" color="whiteAlpha.600">
                      (5–25 roll)
                    </Text>
                  </Text>
                </GhSurface>
                <GhSurface variant="muted" p="phi2" borderRadius="xl">
                  <HStack gap="2" mb="1">
                    <Zap size={14} color="#a3ff3d" />
                    <Text
                      fontSize="2xs"
                      fontFamily="heading"
                      fontWeight="bold"
                      letterSpacing="0.1em"
                      textTransform="uppercase"
                      color="whiteAlpha.700"
                    >
                      Entry (tools)
                    </Text>
                  </HStack>
                  <Text
                    fontFamily="heading"
                    fontWeight="extrabold"
                    color="white"
                    fontSize="lg"
                  >
                    {preview?.entryYoinx ?? "…"} Yoinx
                  </Text>
                </GhSurface>
                <GhSurface variant="muted" p="phi2" borderRadius="xl">
                  <HStack gap="2" mb="1">
                    <Gamepad2 size={14} color="#a3ff3d" />
                    <Text
                      fontSize="2xs"
                      fontFamily="heading"
                      fontWeight="bold"
                      letterSpacing="0.1em"
                      textTransform="uppercase"
                      color="whiteAlpha.700"
                    >
                      ≈ Entry ICP
                    </Text>
                  </HStack>
                  <Text
                    fontFamily="heading"
                    fontWeight="extrabold"
                    color="white"
                    fontSize="lg"
                  >
                    {preview && usdPerIcp != null
                      ? formatIcp(preview.entryIcp)
                      : "…"}
                  </Text>
                </GhSurface>
              </SimpleGrid>

              <Text fontSize="xs" color="whiteAlpha.650" lineHeight="1.5" mb="phi3">
                Formula: random min players (5–25) · entry tools = ceil(item USD ÷
                $0.10 ÷ min players) so the pot covers this product · ICP line
                shows price(ICP) ÷ min players for the same split.
              </Text>

              <HStack gap="2" flexWrap="wrap">
                <GhButton
                  variant="attr"
                  size="lg"
                  leftIcon={<Sparkles size={18} />}
                  onClick={() => void onYoinx()}
                  disabled={busy || !configured}
                >
                  {busy ? "Creating table…" : "Yoinx!"}
                </GhButton>
                {lastPlayUrl ? (
                  <Link href={lastPlayUrl} target="_blank" rel="noreferrer">
                    <GhButton
                      variant="outline"
                      size="lg"
                      rightIcon={<ExternalLink size={16} />}
                    >
                      Open table
                    </GhButton>
                  </Link>
                ) : (
                  <Link
                    href={getYoinxAppBase()}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <GhButton
                      variant="ghost"
                      size="lg"
                      rightIcon={<ExternalLink size={16} />}
                    >
                      What is Yoinx?
                    </GhButton>
                  </Link>
                )}
              </HStack>
            </Box>

            <GhSurface
              variant="elevated"
              p="phi3"
              borderRadius="2xl"
              minW={{ md: "14rem" }}
              maxW={{ md: "18rem" }}
              flexShrink={0}
            >
              <Text
                fontFamily="heading"
                fontSize="2xs"
                letterSpacing="0.12em"
                textTransform="uppercase"
                color="attr.fg"
                fontWeight="bold"
                mb="2"
              >
                Table preview
              </Text>
              <Text fontWeight="extrabold" color="white" fontSize="sm" mb="1">
                {title}
              </Text>
              <Text fontSize="xs" color="whiteAlpha.750" lineHeight="1.5" mb="3">
                {story.length > 140 ? `${story.slice(0, 140)}…` : story}
              </Text>
              <Text fontSize="2xs" color="whiteAlpha.550">
                Prize: {product.name}
                <br />
                SKU: {product.sku || product.id}
              </Text>
            </GhSurface>
          </Flex>
        </Box>
      </Box>
    </Box>
  );
}
