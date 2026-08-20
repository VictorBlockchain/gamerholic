"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Box, HStack, Text, VStack } from "@chakra-ui/react";
import { ArrowLeft, Package } from "lucide-react";
import {
  GhBadge,
  GhButton,
  GhEmptyState,
  GhSurface,
} from "@/components/ui";
import { useSession } from "@/components/providers/session-context";
import {
  listOrders,
  listOrdersForPrincipal,
} from "@/lib/shop/store";
import {
  formatUsd,
  orderStatusLabel,
  type ShopOrder,
} from "@/lib/shop/types";

export function OrdersView() {
  const { principal, isLoggedIn, login } = useSession();
  const [orders, setOrders] = useState<ShopOrder[]>([]);

  useEffect(() => {
    if (principal) setOrders(listOrdersForPrincipal(principal));
    else setOrders([]);
  }, [principal]);

  if (!isLoggedIn) {
    return (
      <GhEmptyState
        icon={Package}
        title="Sign in to see orders"
        description="Orders are attached to your Internet Identity when you checkout logged in."
        action={
          <GhButton variant="primary" onClick={() => void login()}>
            Connect
          </GhButton>
        }
      />
    );
  }

  return (
    <VStack align="stretch" gap="phi4" pb="phi5">
      <HStack justify="space-between" flexWrap="wrap" gap="2">
        <Text fontFamily="heading" fontWeight="extrabold" fontSize="xl">
          My orders
        </Text>
        <Link href="/shop">
          <GhButton size="sm" variant="ghost" leftIcon={<ArrowLeft size={14} />}>
            Shop
          </GhButton>
        </Link>
      </HStack>

      {orders.length === 0 ? (
        <GhEmptyState
          icon={Package}
          title="No orders yet"
          description="When you place a merch order while signed in, it shows here."
          action={
            <Link href="/shop">
              <GhButton variant="prize">Browse shop</GhButton>
            </Link>
          }
        />
      ) : (
        <VStack align="stretch" gap="2">
          {orders.map((o) => (
            <GhSurface key={o.id} variant="elevated" p="phi3">
              <HStack justify="space-between" flexWrap="wrap" gap="2" mb="2">
                <Box>
                  <Text fontWeight="extrabold" fontSize="sm">
                    {o.id}
                  </Text>
                  <Text fontSize="2xs" color="fg.subtle">
                    {new Date(o.createdAt).toLocaleString()}
                  </Text>
                </Box>
                <GhBadge
                  tone={
                    o.status === "delivered"
                      ? "success"
                      : o.status === "cancelled"
                        ? "muted"
                        : o.status === "shipped"
                          ? "live"
                          : "prize"
                  }
                >
                  {orderStatusLabel(o.status)}
                </GhBadge>
              </HStack>
              <Text fontSize="xs" color="fg.muted" mb="1">
                {o.items.map((i) => `${i.name} ×${i.qty}`).join(" · ")}
              </Text>
              <Text className="gh-text-prize" fontWeight="bold">
                {formatUsd(o.totalUsd)}
              </Text>
            </GhSurface>
          ))}
        </VStack>
      )}
    </VStack>
  );
}
