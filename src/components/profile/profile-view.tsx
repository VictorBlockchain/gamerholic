"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Box,
  Flex,
  Grid,
  Heading,
  HStack,
  SimpleGrid,
  Text,
  VStack,
} from "@chakra-ui/react";
import {
  ChartCandlestick,
  Check,
  Coins,
  Eye,
  Flame,
  Gamepad2,
  ImageIcon,
  KeyRound,
  Loader2,
  Monitor,
  Music,
  Pencil,
  Plus,
  RefreshCw,
  Snowflake,
  Swords,
  Trophy,
  Unlink,
  Upload,
  User,
  Wallet,
  X,
} from "lucide-react";
import {
  GhAvatar,
  GhBadge,
  GhButton,
  GhEmptyState,
  GhField,
  GhInput,
  GameChipPicker,
  GhSurface,
  GhSwitch,
  GhTabs,
  GhTextarea,
  ghToast,
} from "@/components/ui";
import { MatchCard } from "@/components/cards/match-card";
import { useSession } from "@/components/providers/session-context";
import {
  loadArenaStats,
  overallRecord,
  upsertGamerProfile,
  type ArenaStats,
} from "@/lib/ic/gamer-service";
import {
  filterGamerholicAvatarXfts,
  GAMERHOLIC_AVATAR_LABEL_ID,
  isDexstaXftConfigured,
  loadProfileMediaPortfolio,
  type DexstaOwnedXft,
  type ProfileMediaPortfolio,
} from "@/lib/ic/dexsta-xft-service";
import {
  AFTA_APP_URL,
  clearStoredAftaPrincipal,
  connectAftaPrincipal,
  loadStoredAftaPrincipal,
  persistAftaPrincipal,
  portfolioOwnerPrincipal,
} from "@/lib/connect-afta";
import { ConnectBetableButton } from "@/components/betable/connect-betable-button";
import {
  clearStoredBetableLink,
  loadStoredBetableLink,
  type BetableLink,
} from "@/lib/connect-betable";
import { getCanonicalGhPrincipal } from "@/lib/device-sync";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { fetchProfileByUsername } from "@/lib/supabase/profile";
import {
  AVATAR_OPTIONS,
  CONSOLES,
  COVER_OPTIONS,
  DEFAULT_PROFILE,
  DEMO_EARNINGS_SUMMARY,
  PROFILE_AVATAR_SIZE,
  PROFILE_COVER_SIZE,
  USERNAME_MAX_LENGTH,
  emptyProfileForPrincipal,
  formatWhen,
  getProfileCompleteness,
  normalizeUsername,
  resolveProfileAvatarUrl,
  shortPrincipal,
  type BetableHistoryItem,
  type ConsoleId,
  type GamerProfile,
  type HeadsUpHistoryItem,
  type ProfileMissingField,
  type TournamentHistoryItem,
} from "@/lib/profile";
import { fileToProfileAvatarDataUrl } from "@/lib/profile-avatar";

const PROFILE_FIELD_ERRORS: Record<ProfileMissingField, string> = {
  username: "Enter a username (max 13 characters, not your principal)",
  gamertag: "Enter a gamertag",
  game: "Pick at least one game",
  console: "Select your console",
  avatar: "Upload or choose an avatar",
};

export type ProfileViewProps = {
  /**
   * Public profile username (or principal). Omit for own profile (`/profile`).
   * Other users can be viewed while logged out.
   */
  viewUsername?: string;
};

/**
 * Full esports profile — cover, identity, stats, live history, XFTs.
 * Own card: edit when session matches. Public: read-only for any viewer.
 */
export function ProfileView({ viewUsername }: ProfileViewProps = {}) {
  const { isLoggedIn, login, profile, updateProfile, principal, identity } =
    useSession();

  // Public slug: username (short) or full principal — never truncate principals
  const rawView = String(viewUsername || "").trim();
  const isPrincipalKey =
    rawView.includes("-") && rawView.length > 20;
  const viewKey = isPrincipalKey
    ? rawView
    : normalizeUsername(rawView);

  const ownUsername = normalizeUsername(profile?.username || "");
  // Own card: no slug, or slug matches our username/principal
  const isOwn =
    !viewKey ||
    (isLoggedIn &&
      ((ownUsername &&
        ownUsername.toLowerCase() === viewKey.toLowerCase()) ||
        (principal &&
          (principal === viewKey || principal === rawView))));

  const [remote, setRemote] = useState<GamerProfile | null>(null);
  const [remoteLoading, setRemoteLoading] = useState(false);
  const [remoteError, setRemoteError] = useState<string | null>(null);

  const p =
    isOwn
      ? profile ?? DEFAULT_PROFILE
      : remote ?? emptyProfileForPrincipal("");
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<GamerProfile>(p);
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<ProfileMissingField, string>>
  >({});
  const [stats, setStats] = useState<ArenaStats>({
    subaccountIcp: 0,
    headsUp: { wins: 0, losses: 0 },
    tournament: { wins: 0, losses: 0 },
    winStreak: 0,
    lossStreak: 0,
    bestWinStreak: 0,
  });
  const [portfolio, setPortfolio] = useState<ProfileMediaPortfolio>({
    gameAssets: [],
    mediaXfts: [],
    all: [],
    source: "empty",
  });
  const [assetsBusy, setAssetsBusy] = useState(false);
  const [settingAvatarId, setSettingAvatarId] = useState<string | null>(null);
  const [aftaBusy, setAftaBusy] = useState(false);

  /** Avatar picker: only XFTs linked to Afta Lead label #5. */
  const avatarEligible = useMemo(
    () => filterGamerholicAvatarXfts(portfolio.all),
    [portfolio.all],
  );
  const avatarEligibleGame = useMemo(
    () => avatarEligible.filter((x) => x.gameAsset),
    [avatarEligible],
  );
  const avatarEligibleMedia = useMemo(
    () => avatarEligible.filter((x) => !x.gameAsset),
    [avatarEligible],
  );

  // Load public profile by username (only when viewing someone else)
  useEffect(() => {
    if (isOwn || !viewKey) {
      setRemote(null);
      setRemoteLoading(false);
      setRemoteError(null);
      return;
    }
    let cancelled = false;
    setRemoteLoading(true);
    setRemoteError(null);
    void fetchProfileByUsername(viewKey)
      .then((loaded) => {
        if (cancelled) return;
        // Accept profile if principal is set (username may still be empty shell)
        if (!loaded?.principal) {
          setRemote(null);
          setRemoteError("Player not found");
        } else {
          setRemote(loaded);
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setRemote(null);
          setRemoteError(
            e instanceof Error ? e.message : "Failed to load profile",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setRemoteLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [viewKey, isOwn]);

  // Sync draft when own profile loads / changes while not editing
  useEffect(() => {
    if (!isOwn) return;
    if (!editing && profile) {
      // Merge localStorage afta link if profile metadata empty
      const linked =
        profile.aftaPrincipal?.trim() ||
        loadStoredAftaPrincipal(principal) ||
        "";
      setDraft({
        ...profile,
        aftaPrincipal: linked || profile.aftaPrincipal || "",
      });
    }
  }, [profile, editing, isOwn, principal]);

  // Stats: principal (own session or public card)
  useEffect(() => {
    const addr = (
      isOwn ? principal || p.principal : p.principal || ""
    ).trim();
    if (!addr) return;
    let cancelled = false;
    void loadArenaStats(addr, isOwn ? identity : null)
      .then((s) => {
        if (!cancelled) setStats(s);
      })
      .catch(() => {
        /* keep zeros */
      });
    return () => {
      cancelled = true;
    };
  }, [principal, p.principal, isOwn, identity]);

  const loadAssets = useCallback(async () => {
    // Prefer linked Afta principal for portfolio (XFT ownership lives there)
    const afta = (
      isOwn
        ? draft.aftaPrincipal ||
          profile?.aftaPrincipal ||
          loadStoredAftaPrincipal(principal) ||
          ""
        : p.aftaPrincipal || ""
    ).trim();
    const appOwner = (
      isOwn ? principal || p.principal : p.principal
    ).trim();
    const owner = portfolioOwnerPrincipal(appOwner, afta);
    if (!owner || owner.includes("demo")) {
      setPortfolio({
        gameAssets: [],
        mediaXfts: [],
        all: [],
        source: "empty",
      });
      return;
    }
    // Skip Dexsta when not configured — avoids long hangs on missing canisters
    if (!isDexstaXftConfigured()) {
      setPortfolio({
        gameAssets: [],
        mediaXfts: [],
        all: [],
        source: "empty",
      });
      return;
    }
    setAssetsBusy(true);
    try {
      // Query portfolio by Afta owner principal (anonymous query — no GH identity)
      const pack = await Promise.race([
        loadProfileMediaPortfolio(owner, null),
        new Promise<null>((resolve) => {
          window.setTimeout(() => resolve(null), 6000);
        }),
      ]);
      setPortfolio(
        pack ?? {
          gameAssets: [],
          mediaXfts: [],
          all: [],
          source: "empty",
        },
      );
    } catch {
      setPortfolio({
        gameAssets: [],
        mediaXfts: [],
        all: [],
        source: "empty",
      });
    } finally {
      setAssetsBusy(false);
    }
  }, [
    principal,
    p.principal,
    p.aftaPrincipal,
    draft.aftaPrincipal,
    profile?.aftaPrincipal,
    isOwn,
  ]);

  const onConnectAfta = async () => {
    if (!isOwn || !principal) {
      ghToast({
        title: "Sign in first",
        description: "Connect Gamerholic Internet Identity, then link Afta.",
        type: "error",
      });
      return;
    }
    setAftaBusy(true);
    try {
      const r = await connectAftaPrincipal();
      if (!r.ok) {
        if (!r.cancelled) {
          ghToast({
            title: "Afta connect failed",
            description: r.error,
            type: "error",
          });
        }
        return;
      }
      persistAftaPrincipal(principal, r.principal);
      const patch: Partial<GamerProfile> = { aftaPrincipal: r.principal };
      if (editing) {
        setDraft((d) => ({ ...d, ...patch }));
      } else {
        try {
          await updateProfile(patch);
        } catch (e) {
          // Still keep local link even if save fails
          setDraft((d) => ({ ...d, aftaPrincipal: r.principal }));
          ghToast({
            title: "Linked locally",
            description:
              e instanceof Error
                ? `${e.message} — Afta principal kept in this browser`
                : "Afta principal saved in this browser",
            type: "info",
          });
          void loadAssets();
          return;
        }
      }
      ghToast({
        title: "Afta Cash linked",
        description: `Principal ${shortPrincipal(r.principal)} — loading XFTs`,
        type: "success",
      });
      void loadAssets();
    } finally {
      setAftaBusy(false);
    }
  };

  const onDisconnectAfta = async () => {
    if (!principal) return;
    clearStoredAftaPrincipal(principal);
    const patch: Partial<GamerProfile> = { aftaPrincipal: "" };
    if (editing) setDraft((d) => ({ ...d, ...patch }));
    else {
      try {
        await updateProfile(patch);
      } catch {
        setDraft((d) => ({ ...d, aftaPrincipal: "" }));
      }
    }
    setPortfolio({
      gameAssets: [],
      mediaXfts: [],
      all: [],
      source: "empty",
    });
    ghToast({ title: "Afta unlinked", type: "info" });
  };

  // Defer XFT portfolio until user opens History → XFTs (don't block first paint)
  const [xftsTabTouched, setXftsTabTouched] = useState(false);
  useEffect(() => {
    if (!xftsTabTouched) return;
    if (isOwn && !isLoggedIn) return;
    void loadAssets();
  }, [isLoggedIn, isOwn, xftsTabTouched, loadAssets]);

  const overall = overallRecord(stats);
  const display = isOwn && editing ? draft : p;
  const avatarSrc = resolveProfileAvatarUrl(display);

  const startEdit = () => {
    if (!isOwn) return;
    setDraft(p);
    setFieldErrors({});
    setEditing(true);
  };

  const cancelEdit = () => {
    setDraft(p);
    setFieldErrors({});
    setEditing(false);
  };

  const clearFieldError = (key: ProfileMissingField) => {
    setFieldErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const needsAgeTerms =
    !p.acceptedOver18AndTerms && !draft.acceptedOver18AndTerms;

  const save = async () => {
    const username = normalizeUsername(draft.username);
    const justAccepted =
      Boolean(draft.acceptedOver18AndTerms) && !p.acceptedOver18AndTerms;
    const next: GamerProfile = {
      ...draft,
      username,
      gamertag: draft.gamertag.trim() || username,
      bio: draft.bio.trim(),
      dexstaXftId: draft.dexstaXftId.trim(),
      dexstaXftContract: draft.dexstaXftContract.trim(),
      aftaPrincipal: draft.aftaPrincipal.trim(),
      avatarUrl: draft.avatarUrl.trim(),
      acceptedOver18AndTerms:
        Boolean(draft.acceptedOver18AndTerms) || Boolean(p.acceptedOver18AndTerms),
      termsAcceptedAt:
        justAccepted
          ? new Date().toISOString()
          : p.termsAcceptedAt || draft.termsAcceptedAt,
    };
    if (!next.acceptedOver18AndTerms) {
      ghToast({
        title: "Confirm age & terms",
        description:
          "Toggle that you are 18+ and accept the platform terms to save.",
        type: "error",
      });
      setEditing(true);
      requestAnimationFrame(() => {
        document
          .getElementById("profile-field-terms")
          ?.scrollIntoView({ behavior: "smooth", block: "center" });
      });
      return;
    }
    if (draft.username.trim().length > USERNAME_MAX_LENGTH) {
      setFieldErrors((prev) => ({
        ...prev,
        username: `Max ${USERNAME_MAX_LENGTH} characters`,
      }));
      ghToast({
        title: "Username too long",
        description: `Keep it to ${USERNAME_MAX_LENGTH} characters or fewer.`,
        type: "error",
      });
      setEditing(true);
      return;
    }
    const complete = getProfileCompleteness(next);
    if (!complete.ok) {
      const errs: Partial<Record<ProfileMissingField, string>> = {};
      for (const m of complete.missing) {
        errs[m] =
          m === "username" && username.length > USERNAME_MAX_LENGTH
            ? `Max ${USERNAME_MAX_LENGTH} characters`
            : PROFILE_FIELD_ERRORS[m];
      }
      setFieldErrors(errs);
      ghToast({
        title: "Profile incomplete",
        description: complete.message,
        type: "error",
      });
      // Keep edit panel open and scroll to the first invalid field
      setEditing(true);
      const first = complete.missing[0];
      if (first) {
        requestAnimationFrame(() => {
          document
            .getElementById(`profile-field-${first}`)
            ?.scrollIntoView({ behavior: "smooth", block: "center" });
        });
      }
      return;
    }
    setFieldErrors({});
    try {
      await updateProfile(next);
    } catch (e) {
      ghToast({
        title: "Profile not saved",
        description:
          e instanceof Error
            ? e.message
            : "Supabase write failed — check connection and try again.",
        type: "error",
      });
      setEditing(true);
      return;
    }
    setEditing(false);
    const addr = next.principal || principal;
    void upsertGamerProfile(
      addr,
      next.username,
      resolveProfileAvatarUrl(next) || "",
      identity,
    );
    ghToast({
      title: "Profile saved",
      description: isSupabaseConfigured()
        ? "Saved to Supabase · gamer card ready."
        : "Saved in session · configure Supabase for shared profiles.",
      type: "success",
    });
  };

  const onAvatarUpload = async (file?: File | null) => {
    if (!file) return;
    try {
      const dataUrl = await fileToProfileAvatarDataUrl(file);
      setDraft((d) => ({
        ...d,
        avatarUrl: dataUrl,
        dexstaXftId: "",
        dexstaXftContract: "",
        avatarIsGameAsset: false,
      }));
      clearFieldError("avatar");
      ghToast({
        title: "Avatar ready",
        description: `${PROFILE_AVATAR_SIZE.label} · saved when you hit Save profile`,
        type: "success",
      });
    } catch (e) {
      ghToast({
        title: "Avatar upload failed",
        description: e instanceof Error ? e.message : "Could not process image",
        type: "error",
      });
    }
  };

  const selectPresetAvatar = (url: string) => {
    setDraft((d) => ({
      ...d,
      avatarUrl: url,
      dexstaXftId: "",
      dexstaXftContract: "",
      avatarIsGameAsset: false,
    }));
    clearFieldError("avatar");
  };

  const setAvatarFromXft = async (x: DexstaOwnedXft) => {
    if (x.linkedLabelId !== GAMERHOLIC_AVATAR_LABEL_ID) {
      ghToast({
        title: "Avatar not allowed",
        description: `Only Afta XFTs linked to label #${GAMERHOLIC_AVATAR_LABEL_ID} can be your profile picture (linkedTo=${x.linkedLabelId || 0}).`,
        type: "error",
      });
      return;
    }
    if (!x.imageUrl) {
      ghToast({
        title: "No image",
        description: "This XFT has no displayable cover art.",
        type: "error",
      });
      return;
    }
    const key = `${x.contract}:${x.tokenId}`;
    setSettingAvatarId(key);
    try {
      const image =
        x.imageUrl ||
        resolveProfileAvatarUrl({
          dexstaXftId: String(x.tokenId),
        }) ||
        "";
      const patch: Partial<GamerProfile> = {
        dexstaXftId: String(x.tokenId),
        dexstaXftContract: x.contract,
        avatarUrl: image,
        avatarIsGameAsset: x.gameAsset,
      };
      if (editing) {
        setDraft((d) => ({ ...d, ...patch }));
        clearFieldError("avatar");
      } else {
        try {
          await updateProfile(patch);
        } catch (e) {
          ghToast({
            title: "Avatar not saved",
            description:
              e instanceof Error ? e.message : "Supabase write failed",
            type: "error",
          });
          return;
        }
        const addr = p.principal || principal;
        void upsertGamerProfile(addr, p.username, image, identity);
      }
      ghToast({
        title: "Profile picture updated",
        description: x.gameAsset
          ? `Game asset #${x.tokenId} set as avatar`
          : `Media XFT #${x.tokenId} set as avatar`,
        type: "success",
      });
    } finally {
      setSettingAvatarId(null);
    }
  };

  const clearAvatar = () => {
    const patch: Partial<GamerProfile> = {
      dexstaXftId: "",
      dexstaXftContract: "",
      avatarUrl: "",
      avatarIsGameAsset: false,
    };
    if (editing) setDraft((d) => ({ ...d, ...patch }));
    else {
      void updateProfile(patch)
        .then(() => {
          void upsertGamerProfile(
            p.principal || principal,
            p.username,
            "",
            identity,
          );
          ghToast({ title: "Avatar cleared", type: "info" });
        })
        .catch((e) => {
          ghToast({
            title: "Clear failed",
            description:
              e instanceof Error ? e.message : "Supabase write failed",
            type: "error",
          });
        });
      return;
    }
    ghToast({ title: "Avatar cleared", type: "info" });
  };

  const patch = <K extends keyof GamerProfile>(key: K, value: GamerProfile[K]) => {
    setDraft((d) => ({ ...d, [key]: value }));
    if (key === "username") clearFieldError("username");
    if (key === "gamertag") clearFieldError("gamertag");
    if (key === "console") clearFieldError("console");
    if (key === "games") clearFieldError("game");
    if (key === "avatarUrl" || key === "dexstaXftId") clearFieldError("avatar");
  };

  const selectedKey =
    display.dexstaXftId && display.dexstaXftContract
      ? `${display.dexstaXftContract}:${display.dexstaXftId}`
      : display.dexstaXftId
        ? `:${display.dexstaXftId}`
        : "";

  // Own profile requires II; public profiles are viewable by anyone
  if (isOwn && !isLoggedIn) {
    return (
      <VStack align="stretch" gap="phi4" pb="phi4">
        <GhSurface variant="glass" p="phi5">
          <VStack align="flex-start" gap="phi3" maxW="28rem">
            <GhBadge tone="brand">Profile</GhBadge>
            <Heading fontFamily="heading" fontSize="2xl" fontWeight="extrabold">
              Your esports identity
            </Heading>
            <Text color="fg.muted" fontSize="sm" lineHeight="1.6">
              Sign in with Internet Identity to edit username, set cover & games,
              and view match history. Dexsta XFTs load under History → XFTs.
            </Text>
            <GhButton variant="primary" onClick={() => void login()}>
              Sign in with Internet Identity
            </GhButton>
          </VStack>
        </GhSurface>
      </VStack>
    );
  }

  if (!isOwn && remoteLoading) {
    return (
      <VStack py="phi6" gap="phi3" align="center">
        <Loader2 className="gh-spin" size={28} />
        <Text color="fg.muted" fontSize="sm">
          Loading @{viewKey}…
        </Text>
      </VStack>
    );
  }

  if (!isOwn && (remoteError || !remote?.principal)) {
    return (
      <VStack align="stretch" gap="phi4" pb="phi4">
        <GhEmptyState
          icon={User}
          title="Player not found"
          description={
            remoteError ||
            `No profile for “${viewKey}”. Usernames are set on each gamer’s profile.`
          }
          action={
            <Link href="/">
              <GhButton variant="outline">Back home</GhButton>
            </Link>
          }
        />
      </VStack>
    );
  }

  return (
    <VStack align="stretch" gap={{ base: "phi4", md: "phi5" }} pb="phi4">
      {/* ── Cover + identity ── */}
      <Box
        position="relative"
        borderRadius="3xl"
        borderWidth="1px"
        borderColor="border.brand"
        overflow="hidden"
        boxShadow="glow"
      >
        {/* Cover */}
        <Box position="relative" h={{ base: "9rem", md: "12rem" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={editing ? draft.coverUrl : p.coverUrl}
            alt=""
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              filter: "brightness(0.55) saturate(1.1)",
            }}
          />
          <Box
            position="absolute"
            inset="0"
            bg="linear-gradient(180deg, transparent 20%, rgba(7,6,18,0.92) 100%)"
          />
          {isOwn ? (
            <HStack
              position="absolute"
              top="phi3"
              right="phi3"
              gap="2"
              flexWrap="wrap"
            >
              {editing ? (
                <>
                  <GhButton size="sm" variant="outline" onClick={cancelEdit} leftIcon={<X size={14} />}>
                    Cancel
                  </GhButton>
                  <GhButton size="sm" variant="primary" onClick={save} leftIcon={<Check size={14} />}>
                    Save profile
                  </GhButton>
                </>
              ) : (
                <GhButton
                  size="sm"
                  variant="soft"
                  leftIcon={<Pencil size={14} />}
                  onClick={startEdit}
                >
                  Edit profile
                </GhButton>
              )}
            </HStack>
          ) : (
            <Box position="absolute" top="phi3" right="phi3">
              <GhBadge tone="live">Public profile</GhBadge>
            </Box>
          )}
        </Box>

        {/* Avatar + name strip */}
        <Box px={{ base: "phi3", md: "phi5" }} pb="phi4" mt="-3.5rem" position="relative">
          <Flex
            direction={{ base: "column", sm: "row" }}
            gap="phi3"
            align={{ sm: "flex-end" }}
          >
            <Box
              w={{ base: "5.5rem", md: "6.5rem" }}
              h={{ base: "5.5rem", md: "6.5rem" }}
              borderRadius="2xl"
              borderWidth="3px"
              borderColor="border.brand"
              overflow="hidden"
              bg="bg.elevated"
              boxShadow="glow"
              flexShrink={0}
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              {avatarSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatarSrc}
                  alt=""
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                <GhAvatar
                  name={editing ? draft.username : p.username}
                  size="xl"
                  tone="brand"
                  status="online"
                />
              )}
            </Box>
            <Box flex="1" minW="0" pb={{ sm: "1" }}>
              <HStack gap="2" mb="1" flexWrap="wrap">
                <GhBadge tone="brand" pulse>
                  You
                </GhBadge>
                <GhBadge tone="muted">Lv {(editing ? draft : p).level}</GhBadge>
                {display.dexstaXftId ? (
                  <GhBadge tone="attr">
                    {display.avatarIsGameAsset
                      ? "Game asset avatar"
                      : "Media XFT avatar"}
                  </GhBadge>
                ) : null}
                <GhBadge tone="live">
                  {(editing ? draft : p).console}
                </GhBadge>
              </HStack>
              <Heading
                as="h1"
                fontFamily="heading"
                fontSize={{ base: "xl", md: "2xl" }}
                fontWeight="extrabold"
                letterSpacing="0.03em"
                color="#ffffff"
                style={{ color: "#ffffff" }}
                textShadow="0 2px 16px rgba(0,0,0,0.85)"
              >
                {(editing ? draft : p).username || "Gamer"}
              </Heading>
              <Text
                fontSize="sm"
                color="whiteAlpha.900"
                mt="0.5"
                style={{ color: "rgba(255,255,255,0.92)" }}
              >
                {(editing ? draft : p).gamertag || "—"}
              </Text>
              <Text
                fontFamily="mono"
                fontSize="2xs"
                color="whiteAlpha.700"
                mt="1"
                style={{ color: "rgba(255,255,255,0.7)" }}
                title={(editing ? draft : p).principal || undefined}
              >
                {shortPrincipal((editing ? draft : p).principal)}
              </Text>
              {!editing && p.bio ? (
                <Text
                  fontSize="sm"
                  color="whiteAlpha.900"
                  mt="phi2"
                  maxW="32rem"
                  lineHeight="1.55"
                  style={{ color: "rgba(255,255,255,0.9)" }}
                >
                  {p.bio}
                </Text>
              ) : null}
              <Box
                mt="phi2"
                h="1.5"
                maxW="16rem"
                bg="blackAlpha.500"
                borderRadius="full"
                overflow="hidden"
              >
                <Box
                  h="100%"
                  w={`${(editing ? draft : p).xpProgress}%`}
                  bg="linear-gradient(90deg, #a3ff3d, #8b5cf6)"
                />
              </Box>
              <Text
                fontSize="2xs"
                color="whiteAlpha.700"
                mt="1"
                style={{ color: "rgba(255,255,255,0.7)" }}
              >
                Season XP {(editing ? draft : p).xpProgress}%
              </Text>
            </Box>
          </Flex>
        </Box>
      </Box>

      {/* Incomplete profile banner */}
      {isOwn && !editing && isLoggedIn && !getProfileCompleteness(p).ok ? (
        <GhSurface variant="prize" p="phi4" borderColor="prize.solid">
          <HStack gap="phi3" align="flex-start" flexWrap="wrap">
            <Box flex="1" minW="12rem">
              <Text
                fontFamily="heading"
                fontWeight="extrabold"
                fontSize="md"
                mb="1"
              >
                Finish your gamer card
              </Text>
              <Text fontSize="sm" color="fg.muted" lineHeight="1.55">
                {getProfileCompleteness(p).message} You cannot send or accept
                challenges until username, gamertag, game, console, and avatar
                are set.
              </Text>
            </Box>
            <GhButton
              variant="prize"
              leftIcon={<Pencil size={14} />}
              onClick={startEdit}
            >
              Complete profile
            </GhButton>
          </HStack>
        </GhSurface>
      ) : null}

      {/* ── Edit panel (show/hide) ── */}
      {editing ? (
        <GhSurface variant="brand" p="phi4">
          <Text
            fontFamily="heading"
            fontWeight="extrabold"
            fontSize="sm"
            mb="phi3"
            letterSpacing="0.04em"
          >
            Edit identity
          </Text>
          <VStack align="stretch" gap="phi3">
            {Object.keys(fieldErrors).length > 0 ? (
              <Box
                px="phi3"
                py="phi2"
                borderRadius="xl"
                borderWidth="1px"
                borderColor="danger.solid"
                bg="rgba(248,113,113,0.12)"
              >
                <Text fontSize="sm" color="danger.solid" fontWeight="bold">
                  Fix highlighted fields to save
                </Text>
                <Text fontSize="xs" color="rgba(255,255,255,0.8)" mt="1">
                  {Object.values(fieldErrors).join(" · ")}
                </Text>
              </Box>
            ) : null}

            <HStack gap="phi2" flexWrap="wrap" align="flex-start">
              <Box flex="1" minW="10rem" id="profile-field-username">
                <GhField
                  label="Username"
                  required
                  tone="onDark"
                  helperText={
                    fieldErrors.username
                      ? undefined
                      : `Max ${USERNAME_MAX_LENGTH} characters`
                  }
                  invalid={Boolean(fieldErrors.username)}
                  errorText={fieldErrors.username}
                >
                  <GhInput
                    value={draft.username}
                    onChange={(e) =>
                      patch(
                        "username",
                        e.target.value.slice(0, USERNAME_MAX_LENGTH),
                      )
                    }
                    onFocus={() => {
                      if (!draft.username.trim()) patch("username", "");
                    }}
                    placeholder="gamer"
                    maxLength={USERNAME_MAX_LENGTH}
                    color="#fff"
                    aria-invalid={Boolean(fieldErrors.username)}
                    style={{ color: "#fff", WebkitTextFillColor: "#fff" }}
                  />
                </GhField>
              </Box>
              <Box flex="1" minW="10rem" id="profile-field-gamertag">
                <GhField
                  label="Gamertag"
                  helperText={
                    fieldErrors.gamertag ? undefined : "Display / invite tag"
                  }
                  required
                  tone="onDark"
                  invalid={Boolean(fieldErrors.gamertag)}
                  errorText={fieldErrors.gamertag}
                >
                  <GhInput
                    value={draft.gamertag}
                    onChange={(e) => patch("gamertag", e.target.value)}
                    onFocus={() => {
                      if (!draft.gamertag.trim()) patch("gamertag", "");
                    }}
                    placeholder="Gamer#0001"
                    color="#fff"
                    aria-invalid={Boolean(fieldErrors.gamertag)}
                    style={{ color: "#fff", WebkitTextFillColor: "#fff" }}
                  />
                </GhField>
              </Box>
              <Box flex="1" minW="8rem" id="profile-field-console">
                <GhField
                  label="Console"
                  required
                  invalid={Boolean(fieldErrors.console)}
                  errorText={fieldErrors.console}
                >
                  <select
                    value={draft.console}
                    onChange={(e) =>
                      patch("console", e.target.value as ConsoleId)
                    }
                    aria-invalid={Boolean(fieldErrors.console)}
                    style={{
                      ...selectStyle,
                      ...(fieldErrors.console
                        ? {
                            border: "1px solid var(--gh-colors-danger-solid, #f87171)",
                            boxShadow:
                              "0 0 0 1px var(--gh-colors-danger-solid, #f87171)",
                          }
                        : null),
                    }}
                  >
                    {CONSOLES.map((c) => (
                      <option key={c} value={c} style={{ background: "#16132a" }}>
                        {c}
                      </option>
                    ))}
                  </select>
                </GhField>
              </Box>
            </HStack>

            <GhField label="Bio" tone="onDark">
              <GhTextarea
                value={draft.bio}
                onChange={(e) => patch("bio", e.target.value)}
                onFocus={() => {
                  if (!draft.bio.trim()) patch("bio", "");
                }}
                placeholder="Your esports story…"
                color="#fff"
                style={{ color: "#fff", WebkitTextFillColor: "#fff" }}
              />
            </GhField>

            {/* Avatar presets + upload */}
            <Box
              id="profile-field-avatar"
              p={fieldErrors.avatar ? "phi3" : "0"}
              borderRadius="xl"
              borderWidth={fieldErrors.avatar ? "1px" : "0"}
              borderColor={fieldErrors.avatar ? "danger.solid" : undefined}
              bg={fieldErrors.avatar ? "rgba(248,113,113,0.08)" : undefined}
            >
              <HStack gap="2" mb="phi2">
                <User size={14} color="var(--gh-colors-brand-fg)" />
                <Text
                  fontFamily="heading"
                  fontSize="2xs"
                  fontWeight="bold"
                  letterSpacing="0.1em"
                  textTransform="uppercase"
                  color={fieldErrors.avatar ? "danger.solid" : "fg.subtle"}
                >
                  Gamer card avatar
                </Text>
                <GhBadge tone="brand">{PROFILE_AVATAR_SIZE.label}</GhBadge>
                <GhBadge tone="muted">Required</GhBadge>
              </HStack>
              {fieldErrors.avatar ? (
                <Text fontSize="xs" color="danger.solid" mb="phi2" fontWeight="bold">
                  {fieldErrors.avatar}
                </Text>
              ) : (
                <Text fontSize="xs" color="rgba(255,255,255,0.75)" mb="phi2">
                  Pick a preset or upload your own square portrait. Required to
                  challenge others.
                </Text>
              )}
              <HStack gap="phi3" align="flex-start" flexWrap="wrap" mb="phi2">
                <Box
                  w="5.5rem"
                  h="5.5rem"
                  borderRadius="2xl"
                  overflow="hidden"
                  borderWidth="2px"
                  borderColor={
                    fieldErrors.avatar ? "danger.solid" : "border.brand"
                  }
                  bg="blackAlpha.600"
                  flexShrink={0}
                >
                  {resolveProfileAvatarUrl(draft) ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={resolveProfileAvatarUrl(draft)}
                      alt=""
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  ) : (
                    <Flex
                      w="100%"
                      h="100%"
                      align="center"
                      justify="center"
                      color="fg.subtle"
                    >
                      <User size={28} />
                    </Flex>
                  )}
                </Box>
                <VStack align="flex-start" gap="2">
                  <Box as="label" cursor="pointer">
                    <Box
                      as="span"
                      display="inline-flex"
                      alignItems="center"
                      gap="1.5"
                      px="3"
                      py="1.5"
                      borderRadius="full"
                      bg="brand.solid"
                      color="black"
                      fontSize="sm"
                      fontWeight="bold"
                    >
                      <Upload size={14} /> Upload avatar
                    </Box>
                    <input
                      type="file"
                      accept="image/*"
                      hidden
                      onChange={(e) => void onAvatarUpload(e.target.files?.[0])}
                    />
                  </Box>
                  {draft.avatarUrl ? (
                    <GhButton
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        setDraft((d) => ({
                          ...d,
                          avatarUrl: "",
                          dexstaXftId: "",
                          dexstaXftContract: "",
                          avatarIsGameAsset: false,
                        }))
                      }
                    >
                      Clear avatar
                    </GhButton>
                  ) : null}
                </VStack>
              </HStack>
              <Grid
                templateColumns="repeat(auto-fill, minmax(4.25rem, 1fr))"
                gap="2"
              >
                {AVATAR_OPTIONS.map((a) => {
                  const on = draft.avatarUrl === a.url;
                  return (
                    <Box
                      key={a.id}
                      as="button"
                      onClick={() => selectPresetAvatar(a.url)}
                      borderRadius="xl"
                      overflow="hidden"
                      borderWidth="2px"
                      borderColor={on ? "border.brand" : "border.default"}
                      position="relative"
                      aspectRatio="1"
                      cursor="pointer"
                      opacity={on ? 1 : 0.8}
                      _hover={{ opacity: 1, borderColor: "border.brand" }}
                      title={a.label}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={a.url}
                        alt={a.label}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                      {on ? (
                        <Box
                          position="absolute"
                          inset="0"
                          bg="rgba(163,255,61,0.22)"
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                        >
                          <Check size={16} color="#a3ff3d" />
                        </Box>
                      ) : null}
                    </Box>
                  );
                })}
              </Grid>
            </Box>

            <Box>
              <HStack gap="2" mb="phi2">
                <ImageIcon size={14} color="var(--gh-colors-prize-fg)" />
                <Text
                  fontFamily="heading"
                  fontSize="2xs"
                  fontWeight="bold"
                  letterSpacing="0.1em"
                  textTransform="uppercase"
                  color="fg.subtle"
                >
                  Profile cover
                </Text>
                <GhBadge tone="muted">{PROFILE_COVER_SIZE.label}</GhBadge>
              </HStack>
              <Text fontSize="xs" color="rgba(255,255,255,0.75)" mb="phi2">
                Recommended {PROFILE_COVER_SIZE.label} · octopus mascot presets include Gamer / Gamerholic art
              </Text>
              <Grid templateColumns="repeat(auto-fill, minmax(5.5rem, 1fr))" gap="2">
                {COVER_OPTIONS.map((c) => {
                  const on = draft.coverUrl === c.url;
                  return (
                    <Box
                      key={c.id}
                      as="button"
                      onClick={() => patch("coverUrl", c.url)}
                      borderRadius="xl"
                      overflow="hidden"
                      borderWidth="2px"
                      borderColor={on ? "border.brand" : "border.default"}
                      position="relative"
                      aspectRatio="16/10"
                      cursor="pointer"
                      opacity={on ? 1 : 0.75}
                      _hover={{ opacity: 1, borderColor: "border.brand" }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={c.url}
                        alt={c.label}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                      {on ? (
                        <Box
                          position="absolute"
                          inset="0"
                          bg="rgba(163,255,61,0.2)"
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                        >
                          <Check size={16} color="#a3ff3d" />
                        </Box>
                      ) : null}
                    </Box>
                  );
                })}
              </Grid>
            </Box>

            <Box
              id="profile-field-game"
              p={fieldErrors.game ? "phi3" : "0"}
              borderRadius="xl"
              borderWidth={fieldErrors.game ? "1px" : "0"}
              borderColor={fieldErrors.game ? "danger.solid" : undefined}
              bg={fieldErrors.game ? "rgba(248,113,113,0.08)" : undefined}
            >
              <HStack gap="2" mb="phi2">
                <Gamepad2 size={14} color="var(--gh-colors-live-fg)" />
                <Text
                  fontFamily="heading"
                  fontSize="2xs"
                  fontWeight="bold"
                  letterSpacing="0.1em"
                  textTransform="uppercase"
                  color={fieldErrors.game ? "danger.solid" : "fg.subtle"}
                >
                  Games you play
                </Text>
                <GhBadge tone="live">Filters online / rooms</GhBadge>
              </HStack>
              {fieldErrors.game ? (
                <Text fontSize="xs" color="danger.solid" mb="phi2" fontWeight="bold">
                  {fieldErrors.game}
                </Text>
              ) : null}
              <GameChipPicker
                selected={draft.games}
                onChange={(games) => patch("games", games)}
                tone="brand"
                placeholder="e.g. MLB The Show, FC 25…"
                helperText="Pick from the list or add any title that isn’t listed yet."
                invalid={Boolean(fieldErrors.game)}
              />
            </Box>

            {/* Age 18+ & platform terms — required once */}
            <Box
              id="profile-field-terms"
              p="phi3"
              borderRadius="xl"
              borderWidth="1px"
              borderColor={
                needsAgeTerms && !draft.acceptedOver18AndTerms
                  ? "danger.solid"
                  : draft.acceptedOver18AndTerms || p.acceptedOver18AndTerms
                    ? "border.brand"
                    : "border.default"
              }
              bg={
                draft.acceptedOver18AndTerms || p.acceptedOver18AndTerms
                  ? "brand.muted"
                  : "blackAlpha.400"
              }
            >
              {p.acceptedOver18AndTerms ? (
                <HStack gap="2" flexWrap="wrap">
                  <GhBadge tone="success">Confirmed</GhBadge>
                  <Text fontSize="sm" color="fg.muted" lineHeight="1.45">
                    18+ and platform terms accepted
                    {p.termsAcceptedAt
                      ? ` · ${new Date(p.termsAcceptedAt).toLocaleDateString()}`
                      : ""}
                  </Text>
                </HStack>
              ) : (
                <>
                  <HStack justify="space-between" gap="phi2" flexWrap="wrap" mb="1">
                    <Box minW="0" flex="1">
                      <Text
                        fontFamily="heading"
                        fontSize="sm"
                        fontWeight="bold"
                        mb="0.5"
                      >
                        Age &amp; terms
                      </Text>
                      <Text fontSize="xs" color="fg.muted" lineHeight="1.45">
                        I confirm I am at least 18 years old and accept the
                        Gamerholic platform terms of use.
                      </Text>
                    </Box>
                    <GhSwitch
                      checked={Boolean(draft.acceptedOver18AndTerms)}
                      onCheckedChange={(on) =>
                        patch("acceptedOver18AndTerms", on)
                      }
                      tone="brand"
                    />
                  </HStack>
                  {!draft.acceptedOver18AndTerms ? (
                    <Text fontSize="2xs" color="danger.solid" fontWeight="bold" mt="2">
                      Required to create or save your profile
                    </Text>
                  ) : null}
                </>
              )}
            </Box>

            <HStack gap="phi2">
              <GhButton
                variant="primary"
                onClick={() => void save()}
                leftIcon={<Check size={16} />}
                disabled={
                  !p.acceptedOver18AndTerms && !draft.acceptedOver18AndTerms
                }
              >
                Save profile
              </GhButton>
              <GhButton variant="ghost" onClick={cancelEdit}>
                Cancel
              </GhButton>
            </HStack>
          </VStack>
        </GhSurface>
      ) : null}

      {/* Games chips (view mode) */}
      {!editing && p.games.length > 0 ? (
        <Flex gap="2" flexWrap="wrap">
          {p.games.map((g) => (
            <GhBadge key={g} tone="live">
              {g}
            </GhBadge>
          ))}
        </Flex>
      ) : null}

      {/* ── Stats HUD (like You card) ── */}
      <Box
        borderRadius="3xl"
        borderWidth="1px"
        borderColor="border.brand"
        overflow="hidden"
        bg="bg.glass"
        backdropFilter="blur(12px)"
      >
        <Box h="1" bg="linear-gradient(90deg, #a3ff3d, #8b5cf6, #f43fa8)" />
        <Box p={{ base: "phi3", md: "phi4" }}>
          <HStack gap="2" mb="phi3">
            <User size={14} color="var(--gh-colors-brand-fg)" />
            <Text
              fontFamily="heading"
              fontSize="2xs"
              fontWeight="bold"
              letterSpacing="0.14em"
              textTransform="uppercase"
              color="brand.fg"
            >
              Competitive record
            </Text>
          </HStack>
          <Grid
            templateColumns={{
              base: "1fr 1fr",
              sm: "repeat(2, 1fr)",
              lg: "repeat(4, 1fr)",
            }}
            gap="phi2"
            mb="phi3"
          >
            <StatTile
              label="Overall W–L"
              value={overall.label}
              hint="Heads-up + tournament"
              tone="brand"
            />
            <StatTile
              label="Heads-up"
              value={`${stats.headsUp.wins}–${stats.headsUp.losses}`}
              hint="1v1 escrow"
              tone="live"
              icon={<Swords size={14} />}
            />
            <StatTile
              label="Tournament"
              value={`${stats.tournament.wins}–${stats.tournament.losses}`}
              hint="Brackets"
              tone="prize"
              icon={<Trophy size={14} />}
            />
            <Box
              p="phi3"
              borderRadius="xl"
              borderWidth="1px"
              borderColor={
                stats.winStreak > 0
                  ? "border.brand"
                  : stats.lossStreak > 0
                    ? "danger.solid"
                    : "border.default"
              }
              bg={
                stats.winStreak > 0
                  ? "brand.muted"
                  : stats.lossStreak > 0
                    ? "rgba(244,63,94,0.12)"
                    : "blackAlpha.400"
              }
            >
              <HStack
                gap="1"
                mb="1"
                color={stats.lossStreak > 0 && !stats.winStreak ? "danger.solid" : "brand.fg"}
              >
                {stats.winStreak > 0 ? <Flame size={14} /> : <Snowflake size={14} />}
                <Text
                  fontFamily="heading"
                  fontSize="2xs"
                  fontWeight="bold"
                  letterSpacing="0.1em"
                  textTransform="uppercase"
                >
                  {stats.winStreak > 0
                    ? "Win streak"
                    : stats.lossStreak > 0
                      ? "Loss streak"
                      : "Streak"}
                </Text>
              </HStack>
              <Text
                fontFamily="heading"
                fontWeight="extrabold"
                fontSize="xl"
                color={
                  stats.winStreak > 0
                    ? "brand.fg"
                    : stats.lossStreak > 0
                      ? "danger.solid"
                      : "fg.default"
                }
              >
                {stats.winStreak > 0
                  ? `${stats.winStreak}W`
                  : stats.lossStreak > 0
                    ? `${stats.lossStreak}L`
                    : "—"}
              </Text>
              <Text fontSize="2xs" color="fg.subtle" mt="1">
                Best {stats.bestWinStreak}W · loss streak {stats.lossStreak}
              </Text>
            </Box>
          </Grid>

          {/* Earnings strip */}
          <SimpleGrid columns={{ base: 2, md: 4 }} gap="phi2">
            <EarnStat
              label="Lifetime earn"
              value={DEMO_EARNINGS_SUMMARY.total}
              tone="prize"
            />
            <EarnStat
              label="Host fees"
              value={DEMO_EARNINGS_SUMMARY.host}
              tone="prize"
            />
            <EarnStat
              label="Challenges"
              value={DEMO_EARNINGS_SUMMARY.challenge}
              tone="brand"
            />
            <EarnStat
              label="Subaccount"
              value={`${stats.subaccountIcp.toFixed(2)} ICP`}
              tone="live"
            />
          </SimpleGrid>
        </Box>
      </Box>

      {/* ── History ── */}
      <Box>
        <Text
          fontFamily="heading"
          fontSize="2xs"
          fontWeight="bold"
          letterSpacing="0.14em"
          textTransform="uppercase"
          color="fg.subtle"
          mb="phi2"
        >
          History & ledger
        </Text>
        <GhTabs
          tone="brand"
          size="sm"
          defaultValue="headsup"
          onValueChange={(v) => {
            if (v === "xfts") setXftsTabTouched(true);
          }}
          items={[
            {
              value: "headsup",
              label: "Heads-up",
              icon: <Swords size={13} />,
              content: (
                <MatchHistoryGrid empty="No heads-up matches yet. Challenges you create or accept will land here.">
                  {[]}
                </MatchHistoryGrid>
              ),
            },
            {
              value: "tournament",
              label: "Tournaments",
              icon: <Trophy size={13} />,
              content: (
                <MatchHistoryGrid empty="No tournament history yet.">
                  {[]}
                </MatchHistoryGrid>
              ),
            },
            {
              value: "betable",
              label: "Betable",
              icon: <ChartCandlestick size={13} />,
              content: (
                <MatchHistoryGrid empty="No market history yet.">
                  {[]}
                </MatchHistoryGrid>
              ),
            },
            {
              value: "monitor",
              label: "Monitor",
              icon: <Eye size={13} />,
              content: (
                <HistoryList empty="No monitor assignments yet.">
                  {[]}
                </HistoryList>
              ),
            },
            {
              value: "earnings",
              label: "Earnings",
              icon: <Coins size={13} />,
              content: (
                <VStack align="stretch" gap="phi3">
                  <SimpleGrid columns={{ base: 2, sm: 3 }} gap="phi2">
                    <EarnStat label="Challenge" value={DEMO_EARNINGS_SUMMARY.challenge} tone="brand" />
                    <EarnStat label="Host" value={DEMO_EARNINGS_SUMMARY.host} tone="prize" />
                    <EarnStat label="Betable" value={DEMO_EARNINGS_SUMMARY.betable} tone="prize" />
                    <EarnStat label="Monitor" value={DEMO_EARNINGS_SUMMARY.monitor} tone="attr" />
                    <EarnStat label="Arcade" value={DEMO_EARNINGS_SUMMARY.arcade} tone="live" />
                    <EarnStat label="Lifetime" value={DEMO_EARNINGS_SUMMARY.total} tone="brand" />
                  </SimpleGrid>
                  <HistoryList empty="Earnings ledger coming from canister settles — no mock rows.">
                    {[]}
                  </HistoryList>
                </VStack>
              ),
            },
            {
              value: "xfts",
              label: `XFTs (${portfolio.all.length})`,
              icon: <ImageIcon size={13} />,
              content: (
                <VStack align="stretch" gap="phi3">
                  <Flex
                    align={{ base: "stretch", sm: "center" }}
                    justify="space-between"
                    gap="phi2"
                    direction={{ base: "column", sm: "row" }}
                  >
                    <Box>
                      <Text fontFamily="heading" fontWeight="extrabold" fontSize="sm" mb="1">
                        Afta Cash XFTs
                      </Text>
                      <Text fontSize="xs" color="fg.muted" maxW="36rem">
                        Connect Afta Cash to load XFTs from your afta.cash wallet
                        (does not replace Gamerholic login). Profile avatars must
                        be linked to Afta Lead label #
                        {GAMERHOLIC_AVATAR_LABEL_ID} (
                        <Text as="span" fontFamily="mono">
                          linkedTo={GAMERHOLIC_AVATAR_LABEL_ID}
                        </Text>
                        ). For Esports markets, also Connect Betable below.
                      </Text>
                      {display.aftaPrincipal ? (
                        <Text
                          mt="1.5"
                          fontSize="2xs"
                          fontFamily="mono"
                          color="fg.subtle"
                          title={display.aftaPrincipal}
                        >
                          Linked · {shortPrincipal(display.aftaPrincipal)}
                        </Text>
                      ) : null}
                    </Box>
                    <HStack gap="2" flexWrap="wrap">
                      {isOwn && display.aftaPrincipal ? (
                        <GhButton
                          size="sm"
                          variant="ghost"
                          leftIcon={<Unlink size={14} />}
                          onClick={() => void onDisconnectAfta()}
                          disabled={aftaBusy}
                        >
                          Unlink
                        </GhButton>
                      ) : null}
                      {isOwn ? (
                        <GhButton
                          size="sm"
                          variant="primary"
                          leftIcon={
                            aftaBusy ? (
                              <Loader2 size={14} className="gh-spin" />
                            ) : (
                              <KeyRound size={14} />
                            )
                          }
                          onClick={() => void onConnectAfta()}
                          disabled={aftaBusy || !principal}
                        >
                          {aftaBusy
                            ? "Connecting…"
                            : display.aftaPrincipal
                              ? "Reconnect Afta"
                              : "Connect Afta Cash"}
                        </GhButton>
                      ) : null}
                      <GhButton
                        size="sm"
                        variant="soft"
                        leftIcon={
                          assetsBusy ? (
                            <Loader2 size={14} className="gh-spin" />
                          ) : (
                            <RefreshCw size={14} />
                          )
                        }
                        onClick={() => void loadAssets()}
                        disabled={assetsBusy}
                      >
                        Refresh
                      </GhButton>
                    </HStack>
                  </Flex>
                  <Text fontSize="2xs" color="fg.subtle">
                    Mint on{" "}
                    <Box
                      as="a"
                      // @ts-expect-error anchor props
                      href={AFTA_APP_URL}
                      target="_blank"
                      rel="noreferrer"
                      color="brand.fg"
                      textDecoration="underline"
                    >
                      afta.cash
                    </Box>
                  </Text>
                  {isOwn ? (
                    <Box
                      mt="phi3"
                      pt="phi3"
                      borderTopWidth="1px"
                      borderColor="border.default"
                    >
                      <Text
                        fontFamily="heading"
                        fontWeight="extrabold"
                        fontSize="sm"
                        mb="1"
                      >
                        Betable (Esports markets)
                      </Text>
                      <Text fontSize="xs" color="fg.muted" mb="phi2" maxW="36rem">
                        Link your betable.fun identity to host or join tournaments
                        with markets. Esports shows your Betable name & avatar;
                        Gamerholic profile is linked back on Betable.
                      </Text>
                      <ConnectBetableButton
                        sessionPrincipal={principal}
                        identity={identity}
                        onLinked={async (link) => {
                          const patch: Partial<GamerProfile> = {
                            betablePrincipal: link.principal,
                            betableUsername: link.username,
                            betableAvatarUrl: link.avatarUrl,
                          };
                          setDraft((d) => ({ ...d, ...patch }));
                          try {
                            await updateProfile(patch);
                          } catch {
                            /* localStorage still has link */
                          }
                          ghToast({
                            title: "Betable linked",
                            description: `@${link.username || link.principal.slice(0, 8)}`,
                            type: "success",
                          });
                        }}
                      />
                    </Box>
                  ) : null}
                  {!isDexstaXftConfigured() && portfolio.all.length === 0 ? (
                    <GhEmptyState
                      title="Afta XFT not configured"
                      description="Set NEXT_PUBLIC_DEXSTA_XFT_CANISTER_ID (and optional MEDIA) or NEXT_PUBLIC_DEXSTA_API_URL, then refresh."
                    />
                  ) : !principal ? (
                    <GhEmptyState
                      title="Sign in required"
                      description="Gamerholic Internet Identity is required before you can link Afta."
                    />
                  ) : isOwn && !display.aftaPrincipal ? (
                    <GhEmptyState
                      title="Connect Afta Cash"
                      description="Your GH login principal is not the same as afta.cash. Connect Afta to load XFTs for avatars."
                    />
                  ) : assetsBusy && portfolio.all.length === 0 ? (
                    <HStack gap="2" py="phi4" justify="center" color="fg.muted">
                      <Loader2 size={16} className="gh-spin" />
                      <Text fontSize="sm">Loading owned XFTs…</Text>
                    </HStack>
                  ) : portfolio.all.length === 0 ? (
                    <GhEmptyState
                      title="No XFTs yet"
                      description="Mint type-8 media or game assets under a Lead on afta.cash — they appear here for the linked Afta principal."
                    />
                  ) : avatarEligible.length === 0 ? (
                    <GhEmptyState
                      title={`No label #${GAMERHOLIC_AVATAR_LABEL_ID} XFTs`}
                      description={`You have ${portfolio.all.length} owned XFT(s), but none with linkedTo=${GAMERHOLIC_AVATAR_LABEL_ID}. Mint or buy a media/game asset linked to that Lead on afta.cash, then refresh.`}
                    />
                  ) : (
                    <VStack align="stretch" gap="phi4">
                      <Text fontSize="2xs" color="fg.subtle">
                        Showing {avatarEligible.length} avatar-eligible XFT
                        {avatarEligible.length === 1 ? "" : "s"} (label #
                        {GAMERHOLIC_AVATAR_LABEL_ID})
                        {portfolio.all.length > avatarEligible.length
                          ? ` · ${portfolio.all.length - avatarEligible.length} other owned XFT(s) hidden`
                          : ""}
                      </Text>
                      {avatarEligibleGame.length > 0 ? (
                        <Box>
                          <HStack gap="2" mb="phi2">
                            <Gamepad2 size={14} color="var(--gh-colors-brand-fg)" />
                            <Text
                              fontFamily="heading"
                              fontSize="2xs"
                              fontWeight="bold"
                              letterSpacing="0.1em"
                              textTransform="uppercase"
                              color="fg.subtle"
                            >
                              Game assets · label #{GAMERHOLIC_AVATAR_LABEL_ID}
                            </Text>
                          </HStack>
                          <Grid
                            templateColumns="repeat(auto-fill, minmax(9.5rem, 1fr))"
                            gap="3"
                          >
                            {avatarEligibleGame.map((x) => (
                              <XftAssetCard
                                key={`g-${x.contract}-${x.tokenId}`}
                                x={x}
                                selected={
                                  selectedKey === `${x.contract}:${x.tokenId}` ||
                                  selectedKey === `:${x.tokenId}`
                                }
                                busy={settingAvatarId === `${x.contract}:${x.tokenId}`}
                                onSet={() => void setAvatarFromXft(x)}
                              />
                            ))}
                          </Grid>
                        </Box>
                      ) : null}
                      {avatarEligibleMedia.length > 0 ? (
                        <Box>
                          <HStack gap="2" mb="phi2">
                            <Music size={14} color="var(--gh-colors-prize-fg)" />
                            <Text
                              fontFamily="heading"
                              fontSize="2xs"
                              fontWeight="bold"
                              letterSpacing="0.1em"
                              textTransform="uppercase"
                              color="fg.subtle"
                            >
                              Media XFTs · label #{GAMERHOLIC_AVATAR_LABEL_ID}
                            </Text>
                          </HStack>
                          <Grid
                            templateColumns="repeat(auto-fill, minmax(9.5rem, 1fr))"
                            gap="3"
                          >
                            {avatarEligibleMedia.map((x) => (
                              <XftAssetCard
                                key={`m-${x.contract}-${x.tokenId}`}
                                x={x}
                                selected={
                                  selectedKey === `${x.contract}:${x.tokenId}` ||
                                  selectedKey === `:${x.tokenId}`
                                }
                                busy={settingAvatarId === `${x.contract}:${x.tokenId}`}
                                onSet={() => void setAvatarFromXft(x)}
                              />
                            ))}
                          </Grid>
                        </Box>
                      ) : null}
                      {display.dexstaXftId ? (
                        <HStack gap="2" flexWrap="wrap">
                          <Text fontSize="xs" color="fg.muted">
                            Avatar: XFT #{display.dexstaXftId}
                            {display.avatarIsGameAsset ? " · game asset" : " · media"}
                          </Text>
                          <GhButton size="sm" variant="ghost" onClick={clearAvatar}>
                            Clear avatar
                          </GhButton>
                        </HStack>
                      ) : null}
                    </VStack>
                  )}
                </VStack>
              ),
            },
          ]}
        />
      </Box>

      {/* Quick links */}
      <SimpleGrid columns={{ base: 2, md: 4 }} gap="phi2">
        <LinkCard href="/dashboard" label="Dashboard" icon={Monitor} />
        <LinkCard href="/wallet" label="Wallet" icon={Wallet} />
        <LinkCard href="/markets" label="Markets" icon={ChartCandlestick} />
        <LinkCard href="/teams" label="Teams" icon={User} />
      </SimpleGrid>
    </VStack>
  );
}

const selectStyle: React.CSSProperties = {
  width: "100%",
  height: "2.75rem",
  paddingInline: "0.875rem",
  borderRadius: "0.75rem",
  border: "1px solid rgba(255,255,255,0.1)",
  background: "rgba(0,0,0,0.35)",
  color: "#f4f2ff",
  fontSize: "0.875rem",
};

function StatTile({
  label,
  value,
  hint,
  tone,
  icon,
}: {
  label: string;
  value: string;
  hint?: string;
  tone: "brand" | "prize" | "live" | "attr";
  icon?: React.ReactNode;
}) {
  const color =
    tone === "prize"
      ? "prize.fg"
      : tone === "live"
        ? "live.fg"
        : tone === "attr"
          ? "attr.fg"
          : "brand.fg";
  const border =
    tone === "prize"
      ? "prize.solid"
      : tone === "live"
        ? "live.solid"
        : tone === "attr"
          ? "attr.solid"
          : "border.brand";
  const bg =
    tone === "prize"
      ? "prize.muted"
      : tone === "live"
        ? "live.muted"
        : tone === "attr"
          ? "attr.muted"
          : "brand.muted";

  return (
    <Box p="phi3" borderRadius="xl" borderWidth="1px" borderColor={border} bg={bg}>
      <HStack gap="1" mb="1" color={color}>
        {icon}
        <Text
          fontFamily="heading"
          fontSize="2xs"
          fontWeight="bold"
          letterSpacing="0.1em"
          textTransform="uppercase"
        >
          {label}
        </Text>
      </HStack>
      <Text
        fontFamily="heading"
        fontWeight="extrabold"
        fontSize="xl"
        color={color}
        fontVariantNumeric="tabular-nums"
      >
        {value}
      </Text>
      {hint ? (
        <Text fontSize="2xs" color="fg.subtle" mt="1">
          {hint}
        </Text>
      ) : null}
    </Box>
  );
}

function EarnStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "brand" | "prize" | "live" | "attr";
}) {
  const color =
    tone === "prize"
      ? "prize.fg"
      : tone === "live"
        ? "live.fg"
        : tone === "attr"
          ? "attr.fg"
          : "brand.fg";
  return (
    <Box
      p="phi2"
      borderRadius="xl"
      borderWidth="1px"
      borderColor="border.default"
      bg="blackAlpha.400"
    >
      <Text
        fontSize="2xs"
        color="fg.subtle"
        fontFamily="heading"
        letterSpacing="0.08em"
        textTransform="uppercase"
        mb="0.5"
      >
        {label}
      </Text>
      <Text
        fontFamily="heading"
        fontWeight="extrabold"
        fontSize="sm"
        color={color}
        fontVariantNumeric="tabular-nums"
      >
        {value}
      </Text>
    </Box>
  );
}

function MatchHistoryGrid({
  children,
  empty,
}: {
  children: React.ReactNode;
  empty: string;
}) {
  const count = Array.isArray(children)
    ? children.length
    : children
      ? 1
      : 0;
  if (!count) {
    return <GhEmptyState title={empty} />;
  }
  return (
    <Grid
      templateColumns={{ base: "1fr", md: "1fr 1fr" }}
      gap="phi3"
      pt="1"
      pr="1"
      alignItems="stretch"
    >
      {children}
    </Grid>
  );
}

function HistoryList({
  children,
  empty,
}: {
  children: React.ReactNode;
  empty: string;
}) {
  const items = Array.isArray(children) ? children : [children];
  if (!items.length) {
    return <GhEmptyState title={empty} />;
  }
  return (
    <VStack align="stretch" gap="phi2">
      {children}
    </VStack>
  );
}

function headsUpToCard(h: HeadsUpHistoryItem, me: string) {
  const settled = h.result === "W" || h.result === "L" || h.result === "D";
  const status = settled ? ("settled" as const) : ("open" as const);
  const host =
    h.role === "host"
      ? { username: me, record: "—" }
      : {
          username: h.opponent,
          record: h.opponentRecord ?? "—",
        };
  const challenger =
    h.role === "host"
      ? {
          username: h.opponent,
          record: h.opponentRecord ?? "—",
        }
      : { username: me, record: "—" };

  return {
    kind: "challenge" as const,
    title: h.title,
    game: h.game,
    console: h.console ?? "PC",
    entryFee: h.stake,
    prizePot: h.pot,
    status,
    players: "2/2",
    meta: `${h.result === "W" ? "Win" : h.result === "L" ? "Loss" : h.result} · ${formatWhen(h.at)} · ${h.role}`,
    username: host.username,
    record: host.record,
    recordLabel: "Match W–L",
    seats: 2,
    challengers: [host, challenger],
    hostEarn:
      h.role === "host" && h.result === "W"
        ? `Won pot ${h.pot}`
        : h.result === "W"
          ? `You won ${h.pot}`
          : h.result === "L"
            ? "Loss"
            : undefined,
    betable: h.betable,
    market: h.betable && h.marketId
      ? {
          id: h.marketId,
          category: "esports" as const,
          label: "Moneyline",
        }
      : undefined,
  };
}

function tournamentToCard(t: TournamentHistoryItem, me: string) {
  return {
    kind: "tournament" as const,
    title: t.title,
    game: t.game,
    console: t.console ?? "PC",
    entryFee: t.entryFee ?? "—",
    prizePot: t.prize,
    status: "settled" as const,
    players: t.players ?? "—",
    meta: `${t.placement} · ${formatWhen(t.at)}`,
    username: t.host ?? me,
    record: "—",
    recordLabel: "Host W–L",
    seats: 2,
    challengers: [
      { username: t.host ?? me, record: "—" },
      {
        username: t.role === "player" ? me : "Field",
        record: t.placement,
      },
    ],
    hostEarn:
      t.role === "host"
        ? t.prize
        : t.placement === "Champion"
          ? `Prize ${t.prize}`
          : `Finish ${t.placement}`,
    betable: t.betable,
    market: t.betable && t.marketId
      ? {
          id: t.marketId,
          category: "esports" as const,
          label: "Outright",
        }
      : undefined,
  };
}

function betableToCard(b: BetableHistoryItem, me: string) {
  const status =
    b.result === "open"
      ? ("open" as const)
      : b.result === "won" || b.result === "lost" || b.result === "push"
        ? ("settled" as const)
        : ("open" as const);

  const kind =
    b.kind === "tournament"
      ? ("tournament" as const)
      : b.kind === "room"
        ? ("room" as const)
        : ("challenge" as const);

  return {
    kind,
    title: b.eventTitle,
    game: b.game,
    console: b.console ?? "PC",
    entryFee: b.stake,
    prizePot: b.pnl === "open" ? b.volume ?? b.stake : b.pnl,
    status,
    players: b.kind === "tournament" ? "Market" : "1v1 market",
    meta: `${b.result.toUpperCase()} · side ${b.side}${b.odds ? ` ${b.odds}` : ""} · ${formatWhen(b.at)}`,
    username: b.sideA ?? me,
    record: b.odds ?? "—",
    recordLabel: "Odds",
    seats: 2,
    challengers: [
      { username: b.sideA ?? "Side A", record: b.odds ?? "—" },
      {
        username: b.side === (b.sideB ?? "Field") ? me : b.sideB ?? "Field",
        record: b.side,
      },
    ],
    hostEarn:
      b.result === "won"
        ? `PnL ${b.pnl}`
        : b.result === "lost"
          ? `PnL ${b.pnl}`
          : b.result === "open"
            ? `Open · stake ${b.stake}`
            : undefined,
    betable: true,
    market: {
      id: b.id,
      category: "esports" as const,
      label: b.marketTitle.includes("Moneyline")
        ? "Moneyline"
        : b.marketTitle.includes("Outright")
          ? "Outright"
          : "Market",
    },
  };
}

function HistoryRow({
  badge,
  badgeTone,
  title,
  meta,
  right,
  href,
}: {
  badge: string;
  badgeTone: "brand" | "prize" | "live" | "attr" | "danger" | "muted" | "success";
  title: string;
  meta: string;
  right?: string;
  href?: string;
}) {
  const inner = (
    <Box
      p="phi3"
      borderRadius="xl"
      borderWidth="1px"
      borderColor="border.default"
      bg="blackAlpha.400"
      transition="border-color 0.15s"
      _hover={href ? { borderColor: "border.brand" } : undefined}
    >
      <Flex justify="space-between" align="center" gap="phi2">
        <Box minW="0" flex="1">
          <HStack gap="2" mb="0.5" flexWrap="wrap">
            <GhBadge tone={badgeTone}>{badge}</GhBadge>
            <Text
              fontFamily="heading"
              fontWeight="bold"
              fontSize="sm"
              lineClamp={1}
            >
              {title}
            </Text>
          </HStack>
          <Text fontSize="xs" color="fg.muted" lineClamp={1}>
            {meta}
          </Text>
        </Box>
        {right ? (
          <Text
            fontFamily="heading"
            fontWeight="extrabold"
            fontSize="sm"
            color={
              right.startsWith("+")
                ? "brand.fg"
                : right.startsWith("-")
                  ? "danger.solid"
                  : "prize.fg"
            }
            flexShrink={0}
          >
            {right}
          </Text>
        ) : null}
      </Flex>
    </Box>
  );
  if (href) {
    return (
      <Link href={href} style={{ textDecoration: "none" }}>
        {inner}
      </Link>
    );
  }
  return inner;
}

function LinkCard({
  href,
  label,
  icon: Icon,
}: {
  href: string;
  label: string;
  icon: typeof User;
}) {
  return (
    <Link href={href} style={{ textDecoration: "none" }}>
      <GhSurface
        variant="muted"
        p="phi3"
        _hover={{ borderColor: "border.brand" }}
        transition="border-color 0.15s"
      >
        <HStack gap="2">
          <Icon size={16} color="var(--gh-colors-brand-fg)" />
          <Text fontFamily="heading" fontWeight="bold" fontSize="sm">
            {label}
          </Text>
        </HStack>
      </GhSurface>
    </Link>
  );
}

function XftAssetCard({
  x,
  selected,
  busy,
  onSet,
}: {
  x: DexstaOwnedXft;
  selected: boolean;
  busy: boolean;
  onSet: () => void;
}) {
  return (
    <Box
      borderRadius="2xl"
      borderWidth="2px"
      borderColor={selected ? "border.brand" : "border.default"}
      overflow="hidden"
      bg="bg.elevated"
      boxShadow={selected ? "glow" : undefined}
    >
      <Box position="relative" aspectRatio="1" bg="blackAlpha.500">
        {x.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={x.imageUrl}
            alt={x.name}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <Flex h="100%" align="center" justify="center" color="fg.subtle">
            <ImageIcon size={28} />
          </Flex>
        )}
        {selected ? (
          <Box
            position="absolute"
            top="2"
            right="2"
            bg="brand.solid"
            color="black"
            borderRadius="full"
            p="1"
            display="flex"
          >
            <Check size={12} />
          </Box>
        ) : null}
        <HStack position="absolute" bottom="2" left="2" gap="1" flexWrap="wrap">
          {x.gameAsset ? (
            <GhBadge tone="brand">Game</GhBadge>
          ) : (
            <GhBadge tone="muted">Media</GhBadge>
          )}
          {x.hasAudio ? <GhBadge tone="attr">Audio</GhBadge> : null}
          {x.quantity === 1 ? (
            <GhBadge tone="prize">1/1</GhBadge>
          ) : (
            <GhBadge tone="muted">×{x.quantity}</GhBadge>
          )}
        </HStack>
      </Box>
      <VStack align="stretch" gap="1" p="2.5">
        <Text
          fontFamily="heading"
          fontWeight="bold"
          fontSize="xs"
          lineClamp={1}
          title={x.name}
        >
          {x.name}
        </Text>
        <Text fontFamily="mono" fontSize="2xs" color="fg.subtle">
          #{x.tokenId}
        </Text>
        <GhButton
          size="sm"
          variant={selected ? "primary" : "soft"}
          onClick={onSet}
          disabled={busy || selected}
          leftIcon={
            busy ? (
              <Loader2 size={12} style={{ animation: "gh-spin 0.7s linear infinite" }} />
            ) : selected ? (
              <Check size={12} />
            ) : undefined
          }
        >
          {selected ? "Profile pic" : busy ? "Setting…" : "Set as profile pic"}
        </GhButton>
      </VStack>
    </Box>
  );
}
