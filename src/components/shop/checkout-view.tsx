"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Box, Flex, Grid, HStack, Text, VStack } from "@chakra-ui/react";
import {
  ArrowLeft,
  Check,
  Clock,
  Globe2,
  MapPin,
  Truck,
} from "lucide-react";
import {
  GhAlert,
  GhBadge,
  GhButton,
  GhEmptyState,
  GhField,
  GhInput,
  GhSurface,
  GhTextarea,
  ghToast,
} from "@/components/ui";
import { useSession } from "@/components/providers/session-context";
import {
  cartSubtotalUsd,
  clearCart,
  getCart,
} from "@/lib/shop/cart";
import {
  createOrder,
  ensureProduct,
  getProduct,
  loadPublishedCatalog,
  patchOrder,
} from "@/lib/shop/store";
import { fetchIcpUsdRate, formatIcp, usdToIcp } from "@/lib/shop/fx";
import {
  formatUsd,
  type CartLine,
  type ShopShipping,
} from "@/lib/shop/types";
import { shopProductHref } from "@/lib/deep-links";
import {
  getUserPlayIcpBalance,
  ICP_TRANSFER_FEE,
} from "@/lib/ic/gamer-service";
import { debitShopMerch } from "@/lib/ic/settlement-service";
import { isCanisterConfigured } from "@/lib/ic/canisters";

export function CheckoutView() {
  const router = useRouter();
  const { profile, principal, isLoggedIn, identity, login } = useSession();
  const [busy, setBusy] = useState(false);
  const [lines, setLines] = useState<CartLine[]>([]);
  const [sub, setSub] = useState(0);
  const [usdPerIcp, setUsdPerIcp] = useState<number | null>(null);
  const [playBal, setPlayBal] = useState<number | null>(null);
  const [ship, setShip] = useState<ShopShipping>({
    name: "",
    email: "",
    line1: "",
    line2: "",
    city: "",
    region: "",
    postal: "",
    country: "US",
    phone: "",
  });
  const [notes, setNotes] = useState("");

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      await loadPublishedCatalog();
      const cart = getCart();
      await Promise.all(cart.map((l) => ensureProduct(l.productId)));
      if (cancelled) return;
      setLines(cart);
      setSub(cartSubtotalUsd());
    })();
    if (profile?.username) {
      setShip((s) => ({
        ...s,
        name: s.name || profile.username || "",
      }));
    }
    return () => {
      cancelled = true;
    };
  }, [profile?.username]);

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
    if (!principal || !isLoggedIn) {
      setPlayBal(null);
      return;
    }
    let cancelled = false;
    void getUserPlayIcpBalance(principal, identity).then((b) => {
      if (!cancelled) setPlayBal(b);
    });
    return () => {
      cancelled = true;
    };
  }, [principal, isLoggedIn, identity]);

  const icpTotal = useMemo(
    () => (usdPerIcp != null ? usdToIcp(sub, usdPerIcp) : null),
    [sub, usdPerIcp],
  );

  const icpNeeded =
    icpTotal != null ? icpTotal + ICP_TRANSFER_FEE : null;

  const patch = (k: keyof ShopShipping, v: string) =>
    setShip((s) => ({ ...s, [k]: v }));

  const place = async () => {
    const cart = getCart();
    if (!cart.length) {
      ghToast({ title: "Cart empty", type: "error" });
      return;
    }
    if (
      !ship.name.trim() ||
      !ship.email.trim() ||
      !ship.line1.trim() ||
      !ship.city.trim() ||
      !ship.postal.trim()
    ) {
      ghToast({
        title: "Shipping incomplete",
        description: "Name, email, address, city, and postal code required.",
        type: "error",
      });
      return;
    }
    if (ship.country.trim().toUpperCase() !== "US") {
      ghToast({
        title: "USA only for now",
        description: "We currently ship only within the United States.",
        type: "error",
      });
      return;
    }
    if (!isLoggedIn || !principal) {
      try {
        await login();
      } catch {
        /* ignore */
      }
      ghToast({
        title: "Connect required",
        description:
          "Sign in with Internet Identity — merch is paid from your play subaccount.",
        type: "error",
      });
      return;
    }
    if (!isCanisterConfigured()) {
      ghToast({
        title: "Canister not configured",
        description: "Cannot debit play subaccount offline.",
        type: "error",
      });
      return;
    }
    if (usdPerIcp == null || icpTotal == null || icpTotal <= 0) {
      ghToast({
        title: "ICP price unavailable",
        description: "Wait for the CoinGecko rate, then try again.",
        type: "error",
      });
      return;
    }

    setBusy(true);
    try {
      const bal = await getUserPlayIcpBalance(principal, identity);
      setPlayBal(bal);
      const need = icpTotal + ICP_TRANSFER_FEE;
      if (bal == null) {
        ghToast({
          title: "Could not read play balance",
          description: "Try again or check wallet connection.",
          type: "error",
        });
        return;
      }
      if (bal < need) {
        ghToast({
          title: "Insufficient play subaccount ICP",
          description: `Need ~${formatIcp(need)} (order + fee). You have ${formatIcp(bal)}. Deposit via Wallet.`,
          type: "error",
        });
        return;
      }

      const items = cart
        .map((l) => {
          const p = getProduct(l.productId);
          if (!p) return null;
          return {
            productId: p.id,
            name: p.name,
            qty: l.qty,
            unitPriceUsd: p.priceUsd,
            variantLabel: l.variantLabel,
            image: p.images[0],
          };
        })
        .filter(Boolean) as {
        productId: string;
        name: string;
        qty: number;
        unitPriceUsd: number;
        variantLabel?: string;
        image?: string;
      }[];

      const totalUsd = cartSubtotalUsd();
      // Create order first so memo/orderId can reconcile the debit
      const order = createOrder({
        userPrincipal: principal,
        username: profile?.username,
        shipping: {
          ...ship,
          name: ship.name.trim(),
          email: ship.email.trim(),
          country: "US",
        },
        items,
        totalUsd,
        totalIcpEstimate: icpTotal,
        icpUsdRate: usdPerIcp,
        notes: notes.trim() || undefined,
        status: "pending",
      });

      const debit = await debitShopMerch(order.id, icpTotal, identity);
      if (!debit.ok) {
        patchOrder(order.id, {
          status: "pending",
          paidFromPlaySub: false,
          paymentNote: debit.err || "Debit failed",
        });
        ghToast({
          title: "Payment failed",
          description:
            debit.err ||
            "Could not debit play subaccount. Order saved as pending — fund wallet and contact support.",
          type: "error",
        });
        // Keep cart so user can retry after funding
        return;
      }

      patchOrder(order.id, {
        status: "paid",
        paidFromPlaySub: true,
        paymentNote: `Debited ${formatIcp(icpTotal)} from play sub → platform`,
      });
      clearCart();
      setPlayBal(await getUserPlayIcpBalance(principal, identity));
      ghToast({
        title: "Paid from play subaccount",
        description: `${order.id} · ${formatUsd(order.totalUsd)} · ${formatIcp(icpTotal)} · free USA shipping`,
        type: "success",
      });
      router.push("/shop/orders");
    } finally {
      setBusy(false);
    }
  };

  if (!lines.length) {
    return (
      <GhEmptyState
        icon={Check}
        title="Nothing to checkout"
        description="Your cart is empty."
        action={
          <Link href="/shop">
            <GhButton variant="prize">Browse shop</GhButton>
          </Link>
        }
      />
    );
  }

  return (
    <VStack align="stretch" gap="phi4" pb="phi5" className="gh-stack-phi-lg">
      <HStack justify="space-between" flexWrap="wrap" gap="2">
        <Link href="/shop/cart">
          <GhButton
            size="sm"
            variant="ghost"
            leftIcon={<ArrowLeft size={14} />}
          >
            Back to cart
          </GhButton>
        </Link>
        <Text
          fontFamily="heading"
          fontWeight="extrabold"
          fontSize="xl"
          color="white"
        >
          Checkout
        </Text>
      </HStack>

      {/* Shipping policy notice */}
      <Box
        borderRadius="2xl"
        overflow="hidden"
        borderWidth="1px"
        borderColor="border.brand"
        bg="bg.glass"
        backdropFilter="blur(16px)"
        className="gh-game-panel"
      >
        <Box className="gh-brand-bar" h="1" />
        <Box p="phi4">
          <HStack gap="2" mb="phi3" flexWrap="wrap">
            <GhBadge tone="brand">Free shipping</GhBadge>
            <GhBadge tone="live">USA only</GhBadge>
            <GhBadge tone="muted">14 business days</GhBadge>
          </HStack>
          <Text
            fontFamily="heading"
            fontWeight="extrabold"
            fontSize="lg"
            color="white"
            mb="phi2"
          >
            Delivery policy
          </Text>
          <Grid
            templateColumns={{ base: "1fr", sm: "1fr 1fr 1fr" }}
            gap="phi3"
          >
            <HStack align="flex-start" gap="2">
              <Truck size={18} color="#a3ff3d" style={{ flexShrink: 0 }} />
              <Box>
                <Text fontWeight="bold" fontSize="sm" color="white">
                  Free shipping
                </Text>
                <Text fontSize="xs" color="whiteAlpha.750" lineHeight="1.45">
                  No shipping charge on merch orders to the USA.
                </Text>
              </Box>
            </HStack>
            <HStack align="flex-start" gap="2">
              <Clock size={18} color="#a3ff3d" style={{ flexShrink: 0 }} />
              <Box>
                <Text fontWeight="bold" fontSize="sm" color="white">
                  Up to 14 business days
                </Text>
                <Text fontSize="xs" color="whiteAlpha.750" lineHeight="1.45">
                  After payment confirmation — print + fulfill + transit.
                </Text>
              </Box>
            </HStack>
            <HStack align="flex-start" gap="2">
              <Globe2 size={18} color="#a3ff3d" style={{ flexShrink: 0 }} />
              <Box>
                <Text fontWeight="bold" fontSize="sm" color="white">
                  USA only · more soon
                </Text>
                <Text fontSize="xs" color="whiteAlpha.750" lineHeight="1.45">
                  United States shipping for now. More markets coming soon.
                </Text>
              </Box>
            </HStack>
          </Grid>
        </Box>
      </Box>

      <GhAlert tone="brand" title="Pay from play subaccount">
        <Text color="white" fontSize="sm">
          Checkout debits ≈ ICP (USD × CoinGecko rate) from your Gamerholic{" "}
          <strong>play subaccount</strong> to the platform wallet, plus a
          0.0001 ICP ledger fee. Connect Internet Identity and deposit ICP via
          Wallet first. Shipping remains free in the USA (up to 14 business
          days after payment).
        </Text>
      </GhAlert>

      <Grid templateColumns={{ base: "1fr", lg: "1.1fr 0.9fr" }} gap="phi4">
        {/* Shipping form */}
        <GhSurface
          variant="elevated"
          p="phi4"
          borderRadius="2xl"
          className="gh-game-panel"
        >
          <HStack gap="2" mb="phi3">
            <MapPin size={16} color="#a3ff3d" />
            <Text
              fontFamily="heading"
              fontWeight="extrabold"
              color="white"
              fontSize="md"
            >
              Shipping address
            </Text>
          </HStack>
          <VStack align="stretch" gap="phi2">
            <GhField label="Full name" required>
              <GhInput
                value={ship.name}
                onChange={(e) => patch("name", e.target.value)}
              />
            </GhField>
            <GhField label="Email" required>
              <GhInput
                type="email"
                value={ship.email}
                onChange={(e) => patch("email", e.target.value)}
              />
            </GhField>
            <GhField label="Address line 1" required>
              <GhInput
                value={ship.line1}
                onChange={(e) => patch("line1", e.target.value)}
              />
            </GhField>
            <GhField label="Address line 2">
              <GhInput
                value={ship.line2 || ""}
                onChange={(e) => patch("line2", e.target.value)}
              />
            </GhField>
            <HStack gap="2" align="flex-start">
              <Box flex="1">
                <GhField label="City" required>
                  <GhInput
                    value={ship.city}
                    onChange={(e) => patch("city", e.target.value)}
                  />
                </GhField>
              </Box>
              <Box flex="1">
                <GhField label="State">
                  <GhInput
                    value={ship.region}
                    onChange={(e) => patch("region", e.target.value)}
                    placeholder="e.g. CA"
                  />
                </GhField>
              </Box>
            </HStack>
            <HStack gap="2" align="flex-start">
              <Box flex="1">
                <GhField label="ZIP / postal" required>
                  <GhInput
                    value={ship.postal}
                    onChange={(e) => patch("postal", e.target.value)}
                  />
                </GhField>
              </Box>
              <Box flex="1">
                <GhField label="Country">
                  <GhInput value="United States" readOnly opacity={0.85} />
                </GhField>
              </Box>
            </HStack>
            <GhField label="Phone">
              <GhInput
                value={ship.phone || ""}
                onChange={(e) => patch("phone", e.target.value)}
              />
            </GhField>
            <GhField label="Order notes">
              <GhTextarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Gift note, delivery hints…"
              />
            </GhField>
          </VStack>
        </GhSurface>

        {/* Order summary + items */}
        <VStack align="stretch" gap="phi3">
          <GhSurface
            variant="elevated"
            p="phi4"
            borderRadius="2xl"
            className="gh-game-panel"
          >
            <Text
              fontFamily="heading"
              fontWeight="extrabold"
              color="white"
              mb="phi3"
              fontSize="md"
            >
              Your items
            </Text>
            <VStack align="stretch" gap="2">
              {lines.map((l) => {
                const p = getProduct(l.productId);
                if (!p) return null;
                const img = p.images[0] || "/brand/gamerholic-mark-128.jpg";
                const lineUsd = p.priceUsd * l.qty;
                const lineIcp =
                  usdPerIcp != null ? usdToIcp(lineUsd, usdPerIcp) : null;
                return (
                  <Flex
                    key={`${l.productId}-${l.variantLabel || ""}`}
                    gap="3"
                    align="center"
                    p="2"
                    borderRadius="xl"
                    borderWidth="1px"
                    borderColor="border.default"
                    bg="blackAlpha.400"
                  >
                    <Link
                      href={shopProductHref(p.id)}
                      style={{ flexShrink: 0 }}
                    >
                      <Box
                        w="12"
                        h="12"
                        borderRadius="md"
                        overflow="hidden"
                        borderWidth="1px"
                        borderColor="border.brand"
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
                    <Box flex="1" minW="0">
                      <Link
                        href={shopProductHref(p.id)}
                        style={{ textDecoration: "none" }}
                      >
                        <Text
                          fontSize="sm"
                          fontWeight="bold"
                          color="white"
                          lineClamp={1}
                          _hover={{ color: "brand.fg" }}
                        >
                          {p.name}
                        </Text>
                      </Link>
                      <Text fontSize="2xs" color="whiteAlpha.600">
                        ×{l.qty}
                        {l.variantLabel ? ` · ${l.variantLabel}` : ""}
                      </Text>
                    </Box>
                    <Box textAlign="right" flexShrink={0}>
                      <Text
                        fontSize="sm"
                        fontWeight="extrabold"
                        className="gh-text-prize"
                        fontFamily="heading"
                      >
                        {formatUsd(lineUsd)}
                      </Text>
                      {lineIcp != null ? (
                        <Text fontSize="2xs" color="whiteAlpha.550">
                          ≈ {formatIcp(lineIcp)}
                        </Text>
                      ) : null}
                    </Box>
                  </Flex>
                );
              })}
            </VStack>
          </GhSurface>

          <GhSurface variant="prize" p="phi4" borderRadius="2xl">
            <Text
              fontFamily="heading"
              fontWeight="extrabold"
              mb="phi3"
              color="white"
            >
              Summary
            </Text>
            <HStack justify="space-between" mb="1">
              <Text fontSize="sm" color="whiteAlpha.800">
                Subtotal
              </Text>
              <Text fontWeight="bold" color="white">
                {formatUsd(sub)}
              </Text>
            </HStack>
            <HStack justify="space-between" mb="1">
              <Text fontSize="sm" color="whiteAlpha.800">
                Shipping (USA)
              </Text>
              <Text fontWeight="bold" color="brand.fg">
                Free
              </Text>
            </HStack>
            <HStack justify="space-between" mb="1">
              <Text fontSize="sm" color="whiteAlpha.800">
                Pay (ICP)
              </Text>
              <Text fontFamily="heading" fontWeight="bold" color="white">
                {icpTotal != null ? formatIcp(icpTotal) : "…"}
              </Text>
            </HStack>
            <HStack justify="space-between" mb="1">
              <Text fontSize="sm" color="whiteAlpha.800">
                Ledger fee
              </Text>
              <Text fontSize="sm" color="whiteAlpha.800">
                {formatIcp(ICP_TRANSFER_FEE)}
              </Text>
            </HStack>
            <HStack justify="space-between" mb="phi2">
              <Text fontSize="sm" color="whiteAlpha.800">
                Play balance
              </Text>
              <Text
                fontSize="sm"
                fontWeight="bold"
                color={
                  playBal != null &&
                  icpNeeded != null &&
                  playBal < icpNeeded
                    ? "prize.fg"
                    : "brand.fg"
                }
              >
                {isLoggedIn
                  ? playBal != null
                    ? formatIcp(playBal)
                    : "…"
                  : "Connect"}
              </Text>
            </HStack>
            {usdPerIcp != null ? (
              <Text fontSize="2xs" color="whiteAlpha.500" mb="phi3">
                Rate @ {formatUsd(usdPerIcp)} / ICP · debited from play sub
              </Text>
            ) : null}
            <HStack
              justify="space-between"
              mb="phi3"
              pt="phi2"
              borderTopWidth="1px"
              borderColor="whiteAlpha.200"
            >
              <Text fontWeight="extrabold" color="white">
                Total
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
            {!isLoggedIn ? (
              <Text fontSize="xs" color="whiteAlpha.700" mb="phi3">
                Connect Internet Identity to pay from your play subaccount.
              </Text>
            ) : null}
            <GhButton
              variant="prize"
              w="100%"
              leftIcon={<Check size={16} />}
              onClick={() => void place()}
              disabled={busy}
            >
              {busy
                ? "Paying…"
                : isLoggedIn
                  ? "Pay with play subaccount"
                  : "Connect & pay"}
            </GhButton>
          </GhSurface>
        </VStack>
      </Grid>
    </VStack>
  );
}
