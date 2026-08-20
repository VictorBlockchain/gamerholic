"use client";

/**
 * Connect Betable — required for host create / join when event is betable.
 * Stores Betable principal + display name/avatar under GH primary principal.
 */

import { useCallback, useEffect, useState } from "react";
import { Box, Button, HStack, Text, VStack } from "@chakra-ui/react";
import {
  clearStoredBetableLink,
  connectBetablePrincipal,
  loadStoredBetableLink,
  type BetableLink,
} from "@/lib/connect-betable";
import { getCanonicalGhPrincipal } from "@/lib/device-sync";
import { createBackendActor } from "@/lib/ic/canisters";
import type { Identity } from "@dfinity/agent";

type Props = {
  /** Session GH principal (may be alias) */
  sessionPrincipal: string | null | undefined;
  identity?: Identity | null;
  /** Called after successful connect with link + resolved primary */
  onLinked?: (link: BetableLink, ghPrimary: string) => void;
  /** Compact chip style for join banners */
  compact?: boolean;
  label?: string;
};

export function ConnectBetableButton({
  sessionPrincipal,
  identity,
  onLinked,
  compact,
  label = "Connect Betable",
}: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [link, setLink] = useState<BetableLink | null>(null);
  const [ghPrimary, setGhPrimary] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!sessionPrincipal) {
        setLink(null);
        return;
      }
      const primary = await getCanonicalGhPrincipal(
        sessionPrincipal,
        identity ?? null,
      );
      if (cancelled) return;
      setGhPrimary(primary);
      setLink(loadStoredBetableLink(primary));
    })();
    return () => {
      cancelled = true;
    };
  }, [sessionPrincipal, identity]);

  const onConnect = useCallback(async () => {
    if (!sessionPrincipal) {
      setError("Connect Gamerholic first");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const primary =
        ghPrimary ||
        (await getCanonicalGhPrincipal(sessionPrincipal, identity ?? null));
      setGhPrimary(primary);
      const res = await connectBetablePrincipal(primary);
      if (!res.ok) {
        if (!res.cancelled) setError(res.error);
        return;
      }
      setLink(res.link);
      // Best-effort on-chain under primary
      try {
        const actor = await createBackendActor(identity);
        if (actor && typeof (actor as any).set_linked_betable_principal === "function") {
          await (actor as any).set_linked_betable_principal(res.link.principal);
        }
      } catch {
        /* optional */
      }
      onLinked?.(res.link, primary);
    } finally {
      setBusy(false);
    }
  }, [sessionPrincipal, identity, ghPrimary, onLinked]);

  const onDisconnect = useCallback(async () => {
    const primary =
      ghPrimary ||
      (sessionPrincipal
        ? await getCanonicalGhPrincipal(sessionPrincipal, identity ?? null)
        : "");
    if (primary) clearStoredBetableLink(primary);
    setLink(null);
    try {
      const actor = await createBackendActor(identity);
      if (actor && typeof (actor as any).clear_linked_betable_principal === "function") {
        await (actor as any).clear_linked_betable_principal();
      }
    } catch {
      /* */
    }
  }, [ghPrimary, sessionPrincipal, identity]);

  if (link?.principal) {
    return (
      <VStack align="stretch" gap={1}>
        <HStack
          gap={2}
          flexWrap="wrap"
          p={compact ? 2 : 3}
          borderRadius="md"
          borderWidth="1px"
          borderColor="prize.solid"
          bg="prize.muted"
        >
          <Text fontSize="sm" color="fg" fontWeight="semibold">
            Betable: @{link.username || link.principal.slice(0, 8)}
          </Text>
          <Button size="xs" variant="ghost" onClick={() => void onDisconnect()}>
            Disconnect
          </Button>
        </HStack>
        {!compact && (
          <Text fontSize="xs" color="fg.muted">
            Esports markets use this Betable name & avatar (not your Gamerholic
            profile).
          </Text>
        )}
      </VStack>
    );
  }

  return (
    <Box>
      <Button
        size={compact ? "sm" : "md"}
        colorPalette="orange"
        loading={busy}
        onClick={() => void onConnect()}
      >
        {label}
      </Button>
      {error && (
        <Text fontSize="xs" color="red.400" mt={1}>
          {error}
        </Text>
      )}
    </Box>
  );
}

/** Banner: block join until Connect Betable */
export function BetableMemberGate({
  sessionPrincipal,
  identity,
  required,
  children,
}: {
  sessionPrincipal: string | null | undefined;
  identity?: Identity | null;
  required: boolean;
  children: React.ReactNode;
}) {
  const [hasLink, setHasLink] = useState(false);

  useEffect(() => {
    let c = false;
    (async () => {
      if (!sessionPrincipal || !required) {
        setHasLink(true);
        return;
      }
      const primary = await getCanonicalGhPrincipal(
        sessionPrincipal,
        identity ?? null,
      );
      if (c) return;
      setHasLink(Boolean(loadStoredBetableLink(primary)?.principal));
    })();
    return () => {
      c = true;
    };
  }, [sessionPrincipal, identity, required]);

  if (!required) return <>{children}</>;
  if (hasLink) return <>{children}</>;

  return (
    <VStack align="stretch" gap={3} p={4} borderRadius="lg" bg="blackAlpha.400">
      <Text fontSize="sm" color="fg">
        This event has a Betable Esports market. Connect Betable to join — you
        will appear on Betable with your Betable username and avatar.
      </Text>
      <ConnectBetableButton
        sessionPrincipal={sessionPrincipal}
        identity={identity}
        onLinked={() => setHasLink(true)}
      />
    </VStack>
  );
}
