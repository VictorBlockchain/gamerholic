"use client";

import { useState, type CSSProperties } from "react";
import {
  Box,
  Grid,
  HStack,
  Text,
  VStack,
} from "@chakra-ui/react";
import { Check, Eye, Upload, X } from "lucide-react";
import {
  GhButton,
  GhField,
  GhInput,
  GhSurface,
  GhTextarea,
  ghToast,
} from "@/components/ui";
import { useSession } from "@/components/providers/session-context";
import { saveArcadeGameAsync, type ArcadeGame } from "@/lib/arcade/store";
import type { PlayFeeToken } from "@/lib/arcade/types";
import { neonTapCss, neonTapGameCode } from "@/lib/arcade/demo-phaser";
import { normalizeArcadePaste, PHASER_ENGINE } from "@/lib/arcade/engine";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import {
  clampPayoutTopN,
  describePayoutRules,
  payoutWeights,
  PAYOUT_TOP_N_MAX,
  PAYOUT_TOP_N_MIN,
  type PayoutTopN,
} from "@/lib/arcade/prize";
import {
  ARCADE_COVER_DEFAULT,
  ARCADE_COVER_PRESETS,
  ARCADE_COVER_SIZE,
} from "@/lib/art";
import {
  GamePreview,
  type PreviewIntegrationStatus,
} from "@/components/arcade/game-preview";



type Props = {
  open: boolean;
  onClose: () => void;
  onSaved: (g: ArcadeGame, storedOn?: "supabase" | "local") => void;
};

function isPresetCover(url: string) {
  return ARCADE_COVER_PRESETS.some((p) => p.src === url);
}

const selectStyle: CSSProperties = {
  width: "100%",
  height: "2.75rem",
  borderRadius: "1rem",
  border: "1px solid rgba(255,255,255,0.35)",
  background: "rgba(0,0,0,0.55)",
  color: "#ffffff",
  padding: "0 0.75rem",
};

const DEFAULT_RULES =
  "Tap / click to score. Ranked scores only after insert fee.";

/**
 * Inline show/hide form to submit a Phaser 3 cabinet for community testing
 * (not immediately live — 10 upvotes after real-coin playtests).
 */
export function AddGamePanel({ open, onClose, onSaved }: Props) {
  const { profile, principal } = useSession();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [rules, setRules] = useState(DEFAULT_RULES);
  const [imageUrl, setImageUrl] = useState<string>(ARCADE_COVER_DEFAULT);
  const [playFee, setPlayFee] = useState("0.003");
  const [playFeeToken, setPlayFeeToken] = useState<PlayFeeToken>("ICP");
  const [payoutTopN, setPayoutTopN] = useState<PayoutTopN>(3);
  const [playTimeMin, setPlayTimeMin] = useState("3");
  const [css, setCss] = useState("");
  const [gameCode, setGameCode] = useState("");
  const [busy, setBusy] = useState(false);
  /** Show inline Phaser mock cabinet */
  const [showPreview, setShowPreview] = useState(true);
  const [previewStatus, setPreviewStatus] =
    useState<PreviewIntegrationStatus | null>(null);
  /** Second click confirms publish without verified mock play */
  const [forcePublish, setForcePublish] = useState(false);

  if (!open) return null;

  const onImage = async (file?: File | null) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") setImageUrl(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const submit = async () => {
    if (!title.trim()) {
      ghToast({ title: "Title required", type: "error" });
      return;
    }
    const fee = parseFloat(playFee);
    if (!Number.isFinite(fee) || fee < 0) {
      ghToast({ title: "Invalid play fee", type: "error" });
      return;
    }
    const mins = parseFloat(playTimeMin);
    if (!Number.isFinite(mins) || mins <= 0) {
      ghToast({ title: "Play time must be > 0 minutes", type: "error" });
      return;
    }

    // Reject accidental full HTML pastes
    const rawCode = normalizeArcadePaste(gameCode, "js");
    if (
      rawCode &&
      /<!DOCTYPE|<html[\s>]|<body[\s>]/i.test(rawCode)
    ) {
      ghToast({
        title: "Full HTML not allowed",
        description:
          "Paste Phaser gameCode only (window.GamerholicArcadeGame.boot). No <html> documents.",
        type: "error",
      });
      return;
    }
    if (
      rawCode &&
      !/GamerholicArcadeGame/.test(rawCode) &&
      !/window\s*\.\s*GamerholicArcadeGame/.test(rawCode)
    ) {
      ghToast({
        title: "Invalid game code",
        description:
          "Game code must assign window.GamerholicArcadeGame with a boot() function. CSS goes in the CSS field only.",
        type: "error",
      });
      return;
    }

    // Soft gate: prefer verified mock play before submit for testing
    if (!previewStatus?.ok && !forcePublish) {
      setShowPreview(true);
      setForcePublish(true);
      ghToast({
        title: "Preview first",
        description:
          "Run a mock play until Integration OK (ready + score + end). Click Submit again to ship without verification — community still playtests with real coins.",
        type: "warning",
      });
      return;
    }

    const t = title.trim() || "Untitled Arcade Game";
    const code = rawCode || neonTapGameCode(t);
    const styles = normalizeArcadePaste(css, "css") || neonTapCss();

    setBusy(true);
    try {
      if (!isSupabaseConfigured()) {
        ghToast({
          title: "Supabase required",
          description:
            "Arcade cabinets (including game code) save to Supabase only — not localStorage.",
          type: "error",
        });
        return;
      }
      const result = await saveArcadeGameAsync({
        title: t,
        description: description.trim() || "Phaser 3 arcade game",
        rules: rules.trim(),
        imageUrl: imageUrl || ARCADE_COVER_DEFAULT,
        css: styles,
        gameCode: code,
        playFee: fee,
        playFeeToken,
        payoutTopN,
        playTimeSec: Math.round(mins * 60),
        creator: profile?.username || "player",
        creatorPrincipal: principal || profile?.principal || "",
        // Dexsta integration muted for now — re-enable with SHOW_DEXSTA_FIELDS
        linkedLabelId: 0,
        acceptedGameAssets: [],
      });
      if (!result.game || result.storedOn !== "supabase") {
        ghToast({
          title: "Save failed",
          description:
            ("error" in result && result.error) ||
            "Could not write cabinet to Supabase.",
          type: "error",
        });
        return;
      }
      onSaved(result.game, "supabase");
      setTitle("");
      setDescription("");
      setCss("");
      setGameCode("");
      setPreviewStatus(null);
      setForcePublish(false);
      ghToast({
        title: "Saved to Supabase",
        description: "Title, cover, CSS, and gameCode stored in gh_arcade_games.",
        type: "success",
      });
      if (!previewStatus?.ok) {
        ghToast({
          title: "Submitted without verified preview",
          description:
            "Cabinet is in testing — insert real coins on the play page and fix bugs before upvotes.",
          type: "info",
        });
      }
    } finally {
      setBusy(false);
    }
  };

  /** Force readable white text on dark panel (Chakra tokens can lose contrast). */
  const inputWhite = {
    color: "#ffffff",
    borderColor: "rgba(255,255,255,0.4)",
    bg: "rgba(0,0,0,0.55)",
    _placeholder: { color: "rgba(255,255,255,0.5)" },
    _hover: { borderColor: "rgba(255,255,255,0.6)" },
    _focusVisible: {
      borderColor: "rgba(163,255,61,0.85)",
      boxShadow: "0 0 0 1px rgba(163,255,61,0.55)",
      outline: "none",
      color: "#ffffff",
    },
    style: {
      color: "#ffffff",
      WebkitTextFillColor: "#ffffff",
      caretColor: "#ffffff",
    },
    css: {
      color: "#ffffff !important",
      WebkitTextFillColor: "#ffffff",
      caretColor: "#ffffff",
      "&::placeholder": {
        color: "rgba(255,255,255,0.5) !important",
        opacity: 1,
      },
    },
  } as const;

  return (
    <GhSurface
      id="add-arcade-game"
      variant="elevated"
      p={{ base: "phi3", md: "phi4" }}
      mb="phi4"
      borderColor="attr.solid"
      boxShadow="glow"
      bg="rgba(12, 10, 28, 0.98)"
      color="#ffffff"
      style={{ color: "#ffffff" }}
      css={{
        color: "#ffffff",
        "& label, & [data-part=label], & [data-part='label']": {
          color: "#ffffff !important",
        },
        "& [data-part=helper-text], & [data-part='helper-text']": {
          color: "rgba(255,255,255,0.85) !important",
        },
        "& input, & textarea, & select": {
          color: "#ffffff !important",
          WebkitTextFillColor: "#ffffff",
          caretColor: "#ffffff",
        },
        "& input::placeholder, & textarea::placeholder": {
          color: "rgba(255,255,255,0.5) !important",
          WebkitTextFillColor: "rgba(255,255,255,0.5)",
          opacity: "1 !important",
        },
        /* Chrome autofill paints black text on dark fields */
        "& input:-webkit-autofill, & input:-webkit-autofill:hover, & input:-webkit-autofill:focus, & textarea:-webkit-autofill":
          {
            WebkitTextFillColor: "#ffffff !important",
            caretColor: "#ffffff",
            transition: "background-color 99999s ease-in-out 0s",
            boxShadow: "0 0 0 1000px rgba(0,0,0,0.55) inset !important",
          },
      }}
    >
      <HStack
        justify="space-between"
        align="flex-start"
        gap="phi3"
        mb="phi3"
        flexWrap="wrap"
      >
        <Box flex="1" minW="12rem">
          <Text
            fontFamily="heading"
            fontWeight="extrabold"
            fontSize={{ base: "lg", md: "xl" }}
            letterSpacing="0.03em"
            color="#ffffff"
            mb="1"
            style={{ color: "#ffffff" }}
          >
            Submit Arcade Game for Testing
          </Text>
          <Text
            fontSize="sm"
            color="#ffffff"
            lineHeight="1.55"
            opacity={0.95}
            style={{ color: "#ffffff" }}
          >
            Cabinets start in <strong>testing</strong> — players insert real
            coins so scores hit the leaderboard. <strong>10 upvotes</strong>{" "}
            promotes the game to live (tester scores stay). You can edit CSS /
            gameCode while testing. Engine: {PHASER_ENGINE.name}{" "}
            {PHASER_ENGINE.version}. CSS + gameCode only (no full HTML). Stored{" "}
            {isSupabaseConfigured()
              ? "on Supabase (off-chain)"
              : "in this browser until Supabase is configured"}{" "}
            — not on the ICP canister.
          </Text>
        </Box>
        <GhButton
          variant="outline"
          size="sm"
          leftIcon={<X size={16} />}
          onClick={onClose}
          color="white"
          borderColor="whiteAlpha.400"
          _hover={{ bg: "whiteAlpha.100", borderColor: "white" }}
        >
          Hide
        </GhButton>
      </HStack>

      <VStack align="stretch" gap="phi3" color="#ffffff" style={{ color: "#ffffff" }}>
        <Box
          p="phi3"
          borderRadius="xl"
          borderWidth="1px"
          borderColor="whiteAlpha.350"
          bg="blackAlpha.500"
          fontSize="sm"
          color="#ffffff"
          lineHeight="1.55"
          style={{ color: "#ffffff" }}
        >
          <strong style={{ color: "#fff" }}>Standard engine:</strong>{" "}
          {PHASER_ENGINE.name} {PHASER_ENGINE.version}. Host loads Phaser once;
          your AI game must only export{" "}
          <code style={{ color: "#a3ff3d" }}>
            window.GamerholicArcadeGame.boot(Phaser, bridge, parentEl)
          </code>
          . Full HTML pages are blocked (they break the app shell).
        </Box>

        <GhField label="Title" required tone="onDark">
          <GhInput
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Neon Tap Attack"
            {...inputWhite}
          />
        </GhField>

        <GhField
          label="Cover image"
          tone="onDark"
          helperText={`Recommended ${ARCADE_COVER_SIZE.label} · catalog crops ~16:11 · JPEG/PNG under 1.5 MB`}
        >
          <VStack align="stretch" gap="phi2">
            {/* Live preview at catalog-ish ratio */}
            <Box
              w="100%"
              maxW="22rem"
              borderRadius="xl"
              overflow="hidden"
              borderWidth="1px"
              borderColor="whiteAlpha.400"
              aspectRatio="16/9"
              bg="blackAlpha.600"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageUrl || ARCADE_COVER_DEFAULT}
                alt="Cover preview"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  display: "block",
                }}
              />
            </Box>

            <Text
              fontSize="2xs"
              fontWeight="bold"
              letterSpacing="0.12em"
              textTransform="uppercase"
              color="rgba(255,255,255,0.7)"
              style={{ color: "rgba(255,255,255,0.7)" }}
            >
              Pick a preset · octopus mascot · {ARCADE_COVER_SIZE.width}×
              {ARCADE_COVER_SIZE.height}
            </Text>

            <Grid
              templateColumns={{
                base: "repeat(2, 1fr)",
                sm: "repeat(3, 1fr)",
                md: "repeat(5, 1fr)",
              }}
              gap="2"
            >
              {ARCADE_COVER_PRESETS.map((preset) => {
                const selected = imageUrl === preset.src;
                return (
                  <Box
                    key={preset.id}
                    role="button"
                    tabIndex={0}
                    aria-pressed={selected}
                    aria-label={`Use cover ${preset.label}`}
                    onClick={() => setImageUrl(preset.src)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setImageUrl(preset.src);
                      }
                    }}
                    borderRadius="lg"
                    overflow="hidden"
                    borderWidth="2px"
                    borderColor={selected ? "brand.solid" : "whiteAlpha.300"}
                    boxShadow={
                      selected
                        ? "0 0 0 1px var(--gh-colors-brand-solid)"
                        : "none"
                    }
                    position="relative"
                    cursor="pointer"
                    transition="border-color 0.15s, transform 0.15s"
                    _hover={{
                      borderColor: "brand.fg",
                      transform: "translateY(-1px)",
                    }}
                    p="0"
                    bg="transparent"
                    textAlign="left"
                  >
                    <Box aspectRatio="16/9" w="100%" overflow="hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={preset.src}
                        alt={preset.label}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          display: "block",
                        }}
                      />
                    </Box>
                    {selected ? (
                      <Box
                        position="absolute"
                        top="1"
                        right="1"
                        w="5"
                        h="5"
                        borderRadius="full"
                        bg="brand.solid"
                        color="black"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                      >
                        <Check size={12} strokeWidth={3} />
                      </Box>
                    ) : null}
                    <Text
                      fontSize="2xs"
                      fontWeight="bold"
                      px="1.5"
                      py="1"
                      color="#fff"
                      bg="blackAlpha.700"
                      lineClamp={1}
                      style={{ color: "#fff" }}
                    >
                      {preset.label}
                    </Text>
                  </Box>
                );
              })}
            </Grid>

            <HStack gap="phi2" align="center" flexWrap="wrap">
              <Box as="label" cursor="pointer">
                <Box
                  as="span"
                  display="inline-flex"
                  alignItems="center"
                  gap="1"
                  px="3"
                  py="1.5"
                  borderRadius="full"
                  bg="brand.solid"
                  color="black"
                  fontSize="sm"
                  fontWeight="bold"
                >
                  <Upload size={14} /> Upload custom
                </Box>
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={(e) => void onImage(e.target.files?.[0])}
                />
              </Box>
              {!isPresetCover(imageUrl) && imageUrl ? (
                <Text fontSize="xs" color="rgba(255,255,255,0.75)">
                  Custom upload selected
                  {imageUrl.startsWith("data:") ? " (this browser)" : ""}
                </Text>
              ) : (
                <Text fontSize="xs" color="rgba(255,255,255,0.55)">
                  Or upload your own · best at {ARCADE_COVER_SIZE.label}
                </Text>
              )}
              {!isPresetCover(imageUrl) ? (
                <GhButton
                  size="sm"
                  variant="outline"
                  color="white"
                  borderColor="whiteAlpha.400"
                  onClick={() => setImageUrl(ARCADE_COVER_DEFAULT)}
                >
                  Reset to preset
                </GhButton>
              ) : null}
            </HStack>
          </VStack>
        </GhField>

        <GhField label="Description" tone="onDark">
          <GhTextarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onFocus={() => {
              // Clear only if user has not typed anything yet
              if (!description.trim()) setDescription("");
            }}
            placeholder="What makes this cabinet fun?"
            rows={2}
            {...inputWhite}
          />
        </GhField>

        <GhField label="Rules / controls" tone="onDark">
          <GhTextarea
            value={rules}
            onChange={(e) => setRules(e.target.value)}
            onFocus={() => {
              // Clear starter text if user has not customized it
              if (!rules.trim() || rules.trim() === DEFAULT_RULES) {
                setRules("");
              }
            }}
            onBlur={() => {
              if (!rules.trim()) setRules(DEFAULT_RULES);
            }}
            placeholder={DEFAULT_RULES}
            rows={2}
            {...inputWhite}
          />
        </GhField>

        <Grid templateColumns={{ base: "1fr", sm: "1fr 1fr" }} gap="phi2">
          <GhField label="Play fee" tone="onDark">
            <GhInput
              value={playFee}
              onChange={(e) => setPlayFee(e.target.value)}
              onFocus={() => setPlayFee("")}
              onBlur={() => {
                if (!playFee.trim()) setPlayFee("0.003");
              }}
              inputMode="decimal"
              placeholder="0.003"
              {...inputWhite}
            />
          </GhField>
          <GhField label="Fee token" tone="onDark">
            <select
              value={playFeeToken}
              onChange={(e) =>
                setPlayFeeToken(e.target.value as PlayFeeToken)
              }
              style={selectStyle}
            >
              <option value="ICP" style={{ background: "#12101f", color: "#fff" }}>
                ICP
              </option>
              <option value="GAMER" style={{ background: "#12101f", color: "#fff" }}>
                GAMER (DAB)
              </option>
            </select>
          </GhField>
          <GhField label="Play time (minutes)" tone="onDark">
            <GhInput
              value={playTimeMin}
              onChange={(e) => setPlayTimeMin(e.target.value)}
              onFocus={() => setPlayTimeMin("")}
              onBlur={() => {
                if (!playTimeMin.trim()) setPlayTimeMin("3");
              }}
              inputMode="decimal"
              placeholder="3"
              {...inputWhite}
            />
          </GhField>
          <GhField
            label="Top payout"
            helperText={`How many defenders above a run share the prize (${PAYOUT_TOP_N_MIN}–${PAYOUT_TOP_N_MAX})`}
            tone="onDark"
          >
            <select
              value={payoutTopN}
              onChange={(e) =>
                setPayoutTopN(clampPayoutTopN(e.target.value))
              }
              style={selectStyle}
            >
              {Array.from(
                { length: PAYOUT_TOP_N_MAX - PAYOUT_TOP_N_MIN + 1 },
                (_, i) => (PAYOUT_TOP_N_MIN + i) as PayoutTopN,
              ).map((n) => (
                <option
                  key={n}
                  value={n}
                  style={{ background: "#12101f", color: "#fff" }}
                >
                  Top {n} · weights {payoutWeights(n).join("/")}
                </option>
              ))}
            </select>
          </GhField>
        </Grid>

        <Box
          p="phi3"
          borderRadius="xl"
          borderWidth="1px"
          borderColor="prize.solid"
          bg="blackAlpha.600"
          fontSize="sm"
          color="#ffffff"
          lineHeight="1.6"
          style={{ color: "#ffffff" }}
        >
          <Text fontWeight="bold" color="#f43fa8" mb="1" style={{ color: "#f43fa8" }}>
            Prize rules
          </Text>
          <Text color="#ffffff" style={{ color: "#ffffff" }}>
            {describePayoutRules(payoutTopN)}
          </Text>
          <Text mt="2" color="#ffffff" opacity={0.92} style={{ color: "#ffffff" }}>
            Example: 900 HS → fee refunded. Next 870 → only #1 paid. New 1000 HS
            → fee refunded. Then 400 → top {payoutTopN} above that score split
            the prize (lion share to #1).
          </Text>
        </Box>

        {/* Dexsta Lead Label id + accepted game assets hidden until Dexsta integration */}

        <GhField
          label="CSS (optional)"
          helperText="Styles only — no html tags. Scope under #gh-arcade-root when possible."
          tone="onDark"
        >
          <GhTextarea
            value={css}
            onChange={(e) => {
              setCss(e.target.value);
              setForcePublish(false);
              setPreviewStatus(null);
            }}
            onBlur={() => setCss((v) => normalizeArcadePaste(v, "css"))}
            placeholder={"#gh-arcade-root { /* ... */ }"}
            rows={4}
            fontFamily="mono"
            fontSize="xs"
            {...inputWhite}
          />
        </GhField>

        <GhField
          label="Game code (Phaser 3 JS only)"
          helperText="Must start with window.GamerholicArcadeGame = { boot(...) }. Do NOT paste CSS or full HTML here. Leave empty for Neon Tap starter."
          tone="onDark"
        >
          <GhTextarea
            value={gameCode}
            onChange={(e) => {
              setGameCode(e.target.value);
              setForcePublish(false);
              setPreviewStatus(null);
            }}
            onBlur={() => setGameCode((v) => normalizeArcadePaste(v, "js"))}
            placeholder={`window.GamerholicArcadeGame = {\n  boot: function (Phaser, bridge, parentEl) {\n    return new Phaser.Game({ /* ... */ });\n  }\n};`}
            rows={10}
            fontFamily="mono"
            fontSize="xs"
            {...inputWhite}
          />
        </GhField>

        {/* Preview / mock play — same host bridge as live cabinets */}
        <Box
          pt="phi2"
          borderTopWidth="1px"
          borderColor="whiteAlpha.250"
        >
          <HStack justify="space-between" mb="phi2" flexWrap="wrap" gap="2">
            <Box>
              <Text
                fontFamily="heading"
                fontSize="2xs"
                fontWeight="bold"
                letterSpacing="0.1em"
                textTransform="uppercase"
                color="#ffffff"
                style={{ color: "#ffffff" }}
              >
                Test before publish
              </Text>
              <Text
                fontSize="sm"
                color="rgba(255,255,255,0.85)"
                mt="1"
                lineHeight="1.45"
                style={{ color: "rgba(255,255,255,0.85)" }}
              >
                Start a mock run on the real Phaser host using the play time
                above. Integration OK = ready + score events + session end.
              </Text>
            </Box>
            <GhButton
              size="sm"
              variant="outline"
              leftIcon={<Eye size={14} />}
              onClick={() => setShowPreview((v) => !v)}
              color="white"
              borderColor="whiteAlpha.400"
            >
              {showPreview ? "Hide preview" : "Show preview"}
            </GhButton>
          </HStack>

          {showPreview ? (
            <GamePreview
              title={title || "Untitled Arcade Game"}
              css={css}
              gameCode={gameCode}
              playTimeSec={Math.max(
                10,
                Math.min(
                  900,
                  Math.round((parseFloat(playTimeMin) || 3) * 60),
                ),
              )}
              acceptedAssets={[]}
              linkedLabelId={0}
              onStatusChange={setPreviewStatus}
            />
          ) : null}

          {previewStatus?.ok ? (
            <Text fontSize="sm" color="#a3ff3d" mt="phi2" fontWeight="bold">
              Integration verified — safe to submit for community testing.
            </Text>
          ) : forcePublish ? (
            <Text fontSize="sm" color="#f43fa8" mt="phi2">
              Preview not verified. Click Submit again to open testing anyway
              (real-coin playtests still required before go-live).
            </Text>
          ) : (
            <Text
              fontSize="sm"
              color="rgba(255,255,255,0.7)"
              mt="phi2"
              style={{ color: "rgba(255,255,255,0.7)" }}
            >
              Recommended: Start mock run, score at least once, wait for timer
              end (or Stop early after scoring). Then community playtests with
              real inserts + upvotes.
            </Text>
          )}
        </Box>

        <HStack
          justify="flex-end"
          gap="phi2"
          pt="phi3"
          flexWrap="wrap"
          borderTopWidth="1px"
          borderColor="whiteAlpha.300"
        >
          <GhButton
            variant="outline"
            onClick={onClose}
            disabled={busy}
            color="white"
            borderColor="whiteAlpha.400"
          >
            Cancel
          </GhButton>
          <GhButton
            variant="primary"
            leftIcon={<Check size={16} />}
            onClick={() => void submit()}
            disabled={busy}
          >
            {busy
              ? "Submitting…"
              : previewStatus?.ok
                ? "Submit for testing"
                : forcePublish
                  ? "Submit without preview"
                  : "Submit for testing"}
          </GhButton>
        </HStack>
      </VStack>
    </GhSurface>
  );
}
