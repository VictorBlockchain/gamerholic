"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
  CheckCircle2,
  Eye,
  Gamepad2,
  Gavel,
  MessageCircle,
  Radio,
  Scale,
  Shield,
  ShieldOff,
  Users,
} from "lucide-react";
import { ModeHeader } from "@/components/spectacle/mode-header";
import {
  GhAvatar,
  GhBadge,
  GhButton,
  GhEmptyState,
  GhField,
  GameChipPicker,
  GhSurface,
  GhSwitch,
  SectionDivider,
  ghToast,
} from "@/components/ui";
import { useSession } from "@/components/providers/session-context";
import { useChat } from "@/components/chat/chat-context";
import { CONSOLES, type ConsoleId } from "@/lib/profile";
import type { ChatUser } from "@/lib/chat/types";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase/client";
import { GH_TABLES } from "@/lib/supabase/tables";

const PREFS_KEY = "gh_moderator_prefs_v1";

type ModeratorPrefs = {
  available: boolean;
  consoles: ConsoleId[];
  games: string[];
  note: string;
};

const DEFAULT_PREFS: ModeratorPrefs = {
  available: false,
  consoles: ["PC"],
  games: [],
  note: "",
};

type OnlineModerator = {
  id: string;
  username: string;
  principal?: string;
  status: "online" | "away";
  consoles: string[];
  games: string[];
  disputes: number;
  gamesMonitored: number;
};

function loadPrefs(): ModeratorPrefs {
  if (typeof window === "undefined") return DEFAULT_PREFS;
  try {
    const raw = sessionStorage.getItem(PREFS_KEY);
    if (!raw) return { ...DEFAULT_PREFS };
    return { ...DEFAULT_PREFS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_PREFS };
  }
}

function savePrefs(p: ModeratorPrefs) {
  try {
    sessionStorage.setItem(PREFS_KEY, JSON.stringify(p));
  } catch {
    /* ignore */
  }
}

/**
 * Moderator hub — availability, console/game coverage, online list, Gmail-style DM chat.
 */
export default function ModeratorPage() {
  const { isLoggedIn, login, profile, principal, user } = useSession();
  const { openDm } = useChat();
  const [prefs, setPrefs] = useState<ModeratorPrefs>(DEFAULT_PREFS);
  const [onlineMods, setOnlineMods] = useState<OnlineModerator[]>([]);
  const [loadingMods, setLoadingMods] = useState(true);

  useEffect(() => {
    setPrefs(loadPrefs());
  }, []);

  const patchPrefs = useCallback((partial: Partial<ModeratorPrefs>) => {
    setPrefs((prev) => {
      const next = { ...prev, ...partial };
      savePrefs(next);
      return next;
    });
  }, []);

  const toggleConsole = (c: ConsoleId) => {
    setPrefs((prev) => {
      const has = prev.consoles.includes(c);
      const consoles = has
        ? prev.consoles.filter((x) => x !== c)
        : [...prev.consoles, c];
      const next = { ...prev, consoles };
      savePrefs(next);
      return next;
    });
  };

  const setGames = (games: string[]) => {
    setPrefs((prev) => {
      const next = { ...prev, games };
      savePrefs(next);
      return next;
    });
  };

  // Online moderators — Supabase presence/monitors when available
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadingMods(true);
      try {
        const sb = isSupabaseConfigured() ? getSupabase() : null;
        if (sb) {
          // Prefer monitors table if populated
          const { data: monitors } = await sb
            .from(GH_TABLES.monitors)
            .select("*")
            .limit(40);
          if (!cancelled && monitors && monitors.length > 0) {
            setOnlineMods(
              monitors.map((m: Record<string, unknown>, i: number) => ({
                id: String(m.principal || m.id || `mod-${i}`),
                username: String(m.username || m.principal || "mod"),
                principal: m.principal ? String(m.principal) : undefined,
                status: "online" as const,
                consoles: Array.isArray(m.consoles)
                  ? (m.consoles as string[])
                  : ["PC"],
                games: Array.isArray(m.games) ? (m.games as string[]) : [],
                disputes: Number(m.disputes ?? 0),
                gamesMonitored: Number(m.games_monitored ?? m.gamesMonitored ?? 0),
              })),
            );
            return;
          }
          // Fallback: online presence tagged as moderator
          const { data: presence } = await sb
            .from(GH_TABLES.presence)
            .select("*")
            .eq("status", "online")
            .limit(40);
          if (!cancelled && presence && presence.length > 0) {
            setOnlineMods(
              presence
                .filter(
                  (row: Record<string, unknown>) =>
                    row.role === "moderator" || row.is_moderator === true,
                )
                .map((m: Record<string, unknown>, i: number) => ({
                  id: String(m.principal || m.user_id || `mod-${i}`),
                  username: String(m.username || m.principal || "mod"),
                  principal: m.principal ? String(m.principal) : undefined,
                  status: "online" as const,
                  consoles: ["Multi"],
                  games: [],
                  disputes: 0,
                  gamesMonitored: 0,
                })),
            );
            return;
          }
        }
        // Self only when available — no fake roster
        if (!cancelled) {
          if (prefs.available && isLoggedIn && (profile?.username || principal)) {
            setOnlineMods([
              {
                id: principal || "me",
                username: profile?.username || "you",
                principal: principal || undefined,
                status: "online",
                consoles: prefs.consoles,
                games: prefs.games,
                disputes: 0,
                gamesMonitored: 0,
              },
            ]);
          } else {
            setOnlineMods([]);
          }
        }
      } finally {
        if (!cancelled) setLoadingMods(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [
    isLoggedIn,
    principal,
    profile?.username,
    prefs.available,
    prefs.consoles,
    prefs.games,
  ]);

  const chatWithMod = (mod: OnlineModerator) => {
    if (!isLoggedIn) {
      void login();
      ghToast({ title: "Connect first", description: "Sign in to chat with moderators", type: "info" });
      return;
    }
    const peer: ChatUser = {
      id: mod.id,
      username: mod.username,
      principal: mod.principal,
      status: mod.status,
      games: mod.games,
      record: `${mod.gamesMonitored} monitored`,
    };
    openDm(peer);
    ghToast({
      title: `Chat · @${mod.username}`,
      description: "Gmail-style window opened — bottom right",
      type: "success",
    });
  };

  const coverageLabel = useMemo(() => {
    const c = prefs.consoles.length ? prefs.consoles.join(" · ") : "No console";
    const g = prefs.games.length ? `${prefs.games.length} games` : "No games";
    return `${c} · ${g}`;
  }, [prefs.consoles, prefs.games]);

  return (
    <VStack align="stretch" gap="0" pb="phi5">
      <ModeHeader
        mode="default"
        icon={Gavel}
        title="Moderator console"
        description="Watch heads-up and brackets, report scores, settle disputes — earn fees for fair calls."
        badge="Monitor · earn"
        action={
          isLoggedIn ? (
            <HStack gap="2">
              <GhBadge tone={prefs.available ? "live" : "muted"} pulse={prefs.available}>
                {prefs.available ? "Available" : "Offline"}
              </GhBadge>
            </HStack>
          ) : (
            <GhButton variant="primary" onClick={() => void login()}>
              Connect
            </GhButton>
          )
        }
      />

      {/* Explainer */}
      <GhSurface
        variant="elevated"
        p={{ base: "phi3", md: "phi4" }}
        mb="phi4"
        borderColor="live.solid"
        boxShadow="glow"
      >
        <HStack gap="2" mb="phi3" flexWrap="wrap">
          <Box
            w="10"
            h="10"
            borderRadius="xl"
            bg="live.muted"
            color="live.fg"
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            <Scale size={20} />
          </Box>
          <Box>
            <Text
              fontFamily="heading"
              fontWeight="extrabold"
              fontSize="md"
              letterSpacing="0.03em"
            >
              Why moderators matter
            </Text>
            <Text fontSize="xs" color="fg.subtle">
              Fair outcomes · paid for the work · Gmail-style chat with players
            </Text>
          </Box>
        </HStack>
        <Grid
          templateColumns={{ base: "1fr", md: "repeat(3, 1fr)" }}
          gap="phi3"
        >
          {[
            {
              icon: Eye,
              t: "Watch the match",
              d: "Get assigned to live heads-up or bracket games as a trusted observer.",
            },
            {
              icon: CheckCircle2,
              t: "Report & confirm",
              d: "Post scores when both players finish. Confirm or flag disputes with evidence.",
            },
            {
              icon: Radio,
              t: "Go live when ready",
              d: "Toggle availability, set consoles & games you cover, then open chat for pings.",
            },
          ].map((x) => {
            const Icon = x.icon;
            return (
              <Box
                key={x.t}
                p="phi3"
                borderRadius="xl"
                borderWidth="1px"
                borderColor="border.default"
                bg="bg.glass"
              >
                <Box color="live.fg" mb="2">
                  <Icon size={18} />
                </Box>
                <Text
                  fontFamily="heading"
                  fontWeight="bold"
                  fontSize="sm"
                  mb="1"
                >
                  {x.t}
                </Text>
                <Text fontSize="xs" color="fg.muted" lineHeight="1.5">
                  {x.d}
                </Text>
              </Box>
            );
          })}
        </Grid>
      </GhSurface>

      {/* Availability controls */}
      <SectionDivider label="Your coverage" tone="live" my="0" />

      {!isLoggedIn ? (
        <GhEmptyState
          icon={Shield}
          title="Connect to moderate"
          description="Sign in with Internet Identity to set availability, consoles, and games."
          action={
            <GhButton variant="primary" onClick={() => void login()}>
              Connect
            </GhButton>
          }
        />
      ) : (
        <GhSurface variant="glass" p="phi4" mt="phi3" mb="phi4">
          <Flex
            direction={{ base: "column", md: "row" }}
            gap="phi4"
            align={{ md: "center" }}
            justify="space-between"
            mb="phi4"
          >
            <HStack gap="phi3" align="flex-start">
              <Box
                w="12"
                h="12"
                borderRadius="xl"
                bg={prefs.available ? "live.muted" : "blackAlpha.400"}
                color={prefs.available ? "live.fg" : "fg.subtle"}
                display="flex"
                alignItems="center"
                justifyContent="center"
                borderWidth="1px"
                borderColor={prefs.available ? "live.solid" : "border.default"}
              >
                {prefs.available ? <Shield size={22} /> : <ShieldOff size={22} />}
              </Box>
              <Box>
                <Text fontFamily="heading" fontWeight="extrabold" fontSize="md">
                  Moderation {prefs.available ? "on" : "off"}
                </Text>
                <Text fontSize="xs" color="fg.muted" mt="0.5" maxW="28rem">
                  When on, players can see you in Moderators online and open a
                  Gmail-style chat. Coverage: {coverageLabel}.
                </Text>
              </Box>
            </HStack>
            <HStack gap="3">
              <Text fontSize="sm" fontWeight="bold" color="fg.muted">
                {prefs.available ? "Available" : "Away"}
              </Text>
              <GhSwitch
                checked={prefs.available}
                onCheckedChange={(on) => {
                  patchPrefs({ available: on });
                  ghToast({
                    title: on ? "You are available" : "Moderation paused",
                    description: on
                      ? "Listed for monitor assignments & chat"
                      : "Hidden from online moderators",
                    type: "info",
                  });
                }}
                tone="live"
              />
            </HStack>
          </Flex>

          <GhField label="Consoles you moderate" helperText="Players filter by platform">
            <Flex gap="2" flexWrap="wrap" mt="1">
              {CONSOLES.map((c) => {
                const on = prefs.consoles.includes(c);
                return (
                  <Box
                    key={c}
                    as="button"
                    onClick={() => toggleConsole(c)}
                    px="3"
                    py="1.5"
                    borderRadius="full"
                    borderWidth="1px"
                    borderColor={on ? "live.solid" : "border.default"}
                    bg={on ? "live.muted" : "transparent"}
                    color={on ? "live.fg" : "fg.muted"}
                    fontSize="xs"
                    fontWeight="bold"
                    fontFamily="heading"
                    cursor="pointer"
                  >
                    {c}
                  </Box>
                );
              })}
            </Flex>
          </GhField>

          <Box mt="phi4">
            <GhField
              label="Games you moderate"
              helperText="Pick titles you know well — used for matchmaking assignments. Add any game not listed."
            >
              <Box mt="1">
                <GameChipPicker
                  selected={prefs.games}
                  onChange={setGames}
                  tone="live"
                  placeholder="e.g. College Football 25…"
                  helperText="Presets include Madden, NBA 2K, Fight Night, Fortnite — or add your own."
                />
              </Box>
            </GhField>
          </Box>
        </GhSurface>
      )}

      {/* Online moderators + chat */}
      <SectionDivider label="Moderators online" tone="live" my="0" />

      <Flex
        justify="space-between"
        align="flex-end"
        gap="phi2"
        mt="phi3"
        mb="phi3"
        flexWrap="wrap"
      >
        <Box>
          <Heading
            as="h2"
            fontFamily="heading"
            fontSize="lg"
            fontWeight="extrabold"
          >
            Ready to watch
          </Heading>
          <Text fontSize="sm" color="fg.muted" mt="1">
            Chat opens a Gmail-style window (bottom-right dock) — same as room DMs.
          </Text>
        </Box>
        <GhBadge tone="live" pulse={onlineMods.length > 0}>
          {onlineMods.length} online
        </GhBadge>
      </Flex>

      {loadingMods ? (
        <Text fontSize="sm" color="fg.muted" py="phi4" textAlign="center">
          Loading moderators…
        </Text>
      ) : onlineMods.length === 0 ? (
        <GhEmptyState
          icon={Users}
          title="No moderators online"
          description={
            isLoggedIn
              ? "Turn on availability above to appear here, or check back when others are live."
              : "Connect and go available to join the monitor pool."
          }
        />
      ) : (
        <Grid
          templateColumns={{
            base: "1fr",
            sm: "repeat(2, 1fr)",
            lg: "repeat(3, 1fr)",
          }}
          gap="phi3"
          mb="phi4"
        >
          {onlineMods.map((mod) => (
            <GhSurface key={mod.id} variant="elevated" p="phi3">
              <HStack gap="phi2" mb="phi2" align="flex-start">
                <GhAvatar name={mod.username} size="md" tone="live" status="online" />
                <Box flex="1" minW="0">
                  <HStack gap="2" flexWrap="wrap">
                    <Text
                      fontFamily="heading"
                      fontWeight="extrabold"
                      fontSize="sm"
                      lineClamp={1}
                    >
                      @{mod.username}
                    </Text>
                    <GhBadge tone="live" pulse>
                      Online
                    </GhBadge>
                  </HStack>
                  <Text fontSize="2xs" color="fg.subtle" mt="0.5">
                    {mod.consoles.join(" · ") || "Multi"}
                    {mod.games.length
                      ? ` · ${mod.games.slice(0, 2).join(", ")}`
                      : ""}
                  </Text>
                </Box>
              </HStack>
              <HStack gap="3" mb="phi3" fontSize="2xs" color="fg.muted">
                <Text>
                  <strong style={{ color: "var(--gh-colors-fg-default)" }}>
                    {mod.gamesMonitored}
                  </strong>{" "}
                  monitored
                </Text>
                <Text>
                  <strong style={{ color: "var(--gh-colors-fg-default)" }}>
                    {mod.disputes}
                  </strong>{" "}
                  disputes
                </Text>
              </HStack>
              <GhButton
                size="sm"
                variant="live"
                w="full"
                leftIcon={<MessageCircle size={14} />}
                onClick={() => chatWithMod(mod)}
                disabled={Boolean(user && mod.username === user.username)}
              >
                {user && mod.username === user.username
                  ? "That’s you"
                  : "Chat with mod"}
              </GhButton>
            </GhSurface>
          ))}
        </Grid>
      )}

      <GhSurface variant="muted" p="phi3">
        <HStack gap="2" align="flex-start">
          <Gamepad2 size={16} color="var(--gh-colors-fg-subtle)" />
          <Text fontSize="xs" color="fg.muted" lineHeight="1.55">
            Dispute queues and paid monitor assignments settle on the challenge
            detail page. This hub is for availability, coverage, and player ↔
            moderator chat.
          </Text>
        </HStack>
      </GhSurface>
    </VStack>
  );
}
