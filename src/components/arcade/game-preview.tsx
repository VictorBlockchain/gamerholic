"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Box,
  Flex,
  Grid,
  HStack,
  Text,
  VStack,
} from "@chakra-ui/react";
import {
  CheckCircle2,
  Circle,
  Play,
  RotateCcw,
  Square,
  Timer,
  XCircle,
} from "lucide-react";
import { GhButton, GhSurface } from "@/components/ui";
import {
  buildPhaserHostDocument,
  normalizeArcadePaste,
} from "@/lib/arcade/engine";
import { bindArcadeKeyboardCapture } from "@/lib/arcade/keyboard";
import { neonTapCss, neonTapGameCode } from "@/lib/arcade/demo-phaser";
import type {
  AcceptedGameAsset,
  EquippedGameAsset,
  GhGameToHost,
} from "@/lib/arcade/types";

export type PreviewIntegrationStatus = {
  /** iframe posted gamerholic:ready */
  ready: boolean;
  /** At least one score (or end with score) after start */
  scored: boolean;
  /** Game accepted stop / sent end, or host timer finished cleanly with ticks delivered */
  sessionComplete: boolean;
  /** Live score seen during this preview run */
  lastScore: number;
  /** True when ready + scored + sessionComplete */
  ok: boolean;
};

type Props = {
  title: string;
  css: string;
  gameCode: string;
  /** Mock run length — should match create form play time (seconds) */
  playTimeSec?: number;
  acceptedAssets?: AcceptedGameAsset[];
  linkedLabelId?: number;
  /** Fires whenever integration status changes (for parent publish gate) */
  onStatusChange?: (status: PreviewIntegrationStatus) => void;
};

type Phase = "idle" | "loading" | "ready" | "playing" | "ended" | "error";

function formatClock(sec: number) {
  const s = Math.max(0, Math.floor(sec));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
}

/** Build mock equips from designer hints so bridge.init assets path is exercised. */
function mockEquipsFromHints(
  accepted: AcceptedGameAsset[] | undefined,
): EquippedGameAsset[] {
  const rows = (accepted || []).filter((a) => a.tokenId > 0 && a.label.trim());
  if (rows.length === 0) {
    return [
      {
        tokenId: 45,
        label: "Mock Iron Hammer",
        role: "weapon",
        bagPowerTokens: 20,
        effectivePower: 12,
        quantity: 1,
        linkedLabelId: 1,
      },
    ];
  }
  return rows.map((a, i) => ({
    tokenId: a.tokenId,
    label: a.label,
    role: a.role || "item",
    bagPowerTokens: 10 + i * 5,
    effectivePower: 10 + i * 2,
    quantity: 1,
    linkedLabelId: 1,
  }));
}

const emptyStatus = (): PreviewIntegrationStatus => ({
  ready: false,
  scored: false,
  sessionComplete: false,
  lastScore: 0,
  ok: false,
});

/**
 * Inline mock play cabinet for Add Game — same Phaser host + bridge protocol
 * as live play, but no fees / Supabase / canister. Confirms CSS + gameCode boot.
 */
export function GamePreview({
  title,
  css,
  gameCode,
  playTimeSec = 180,
  acceptedAssets,
  linkedLabelId = 0,
  onStatusChange,
}: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const endsAtRef = useRef(0);
  const phaseRef = useRef<Phase>("idle");
  const scoreRef = useRef(0);
  const statusRef = useRef<PreviewIntegrationStatus>(emptyStatus());
  const reloadKeyRef = useRef(0);

  const [reloadKey, setReloadKey] = useState(0);
  const [phase, setPhase] = useState<Phase>("idle");
  const [liveScore, setLiveScore] = useState(0);
  const [remaining, setRemaining] = useState(playTimeSec);
  const [status, setStatus] = useState<PreviewIntegrationStatus>(emptyStatus());
  const [errorNote, setErrorNote] = useState<string | null>(null);
  const [bootLog, setBootLog] = useState<string[]>([]);

  phaseRef.current = phase;
  scoreRef.current = liveScore;
  statusRef.current = status;
  reloadKeyRef.current = reloadKey;

  /** Match create form (same bounds as live cabinets: 10s–15 min) */
  const duration = Math.max(10, Math.min(900, Math.floor(playTimeSec) || 180));

  const resolvedCss = normalizeArcadePaste(css, "css") || neonTapCss();
  const cleanedCode = normalizeArcadePaste(gameCode, "js");
  const resolvedCode =
    cleanedCode || neonTapGameCode(title.trim() || "Preview");

  // Reject full HTML the same way publish does
  const htmlBlocked = /<!DOCTYPE|<html[\s>]|<body[\s>]/i.test(cleanedCode);
  /** CSS accidentally pasted into game code field */
  const looksLikeCssOnly =
    Boolean(cleanedCode) &&
    !/GamerholicArcadeGame/.test(cleanedCode) &&
    /^[#.a-z@*]/.test(cleanedCode.trim());

  /** Remount iframe when CSS/code changes — React does not reliably re-apply srcDoc. */
  const contentKey = useMemo(() => {
    const raw = `${resolvedCss}\n//\n${resolvedCode}`;
    let h = 0;
    for (let i = 0; i < raw.length; i++) {
      h = (Math.imul(31, h) + raw.charCodeAt(i)) | 0;
    }
    return `${reloadKey}-${h}`;
  }, [resolvedCss, resolvedCode, reloadKey]);

  const srcDoc = useMemo(() => {
    if (htmlBlocked || looksLikeCssOnly) return "";
    return buildPhaserHostDocument({
      title: title.trim() || "Preview",
      css: resolvedCss,
      gameCode: resolvedCode,
    });
  }, [
    htmlBlocked,
    looksLikeCssOnly,
    title,
    resolvedCss,
    resolvedCode,
    contentKey,
  ]);

  const mockAssets = useMemo(
    () => mockEquipsFromHints(acceptedAssets),
    [acceptedAssets],
  );

  const pushLog = useCallback((line: string) => {
    setBootLog((prev) => [...prev.slice(-7), line]);
  }, []);

  const emitStatus = useCallback(
    (next: PreviewIntegrationStatus) => {
      setStatus(next);
      statusRef.current = next;
      onStatusChange?.(next);
    },
    [onStatusChange],
  );

  const clearTick = useCallback(() => {
    if (tickRef.current) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }
  }, []);

  const postToGame = useCallback((msg: object) => {
    const win = iframeRef.current?.contentWindow;
    if (!win) return;
    try {
      win.postMessage(msg, "*");
    } catch {
      /* iframe gone */
    }
  }, []);

  // Forward arrow/WASD/space into the preview iframe; block page scroll
  useEffect(() => {
    if (phase !== "playing") return;
    const unbind = bindArcadeKeyboardCapture({
      active: true,
      postToGame: (msg) => postToGame(msg),
      iframe: iframeRef.current,
    });
    postToGame({ type: "gamerholic:focus" });
    return unbind;
  }, [phase, postToGame]);

  const stopRun = useCallback(
    (reason: string) => {
      clearTick();
      postToGame({ type: "gamerholic:stop", reason });
      setPhase("ended");
      phaseRef.current = "ended";
      const cur = statusRef.current;
      const next: PreviewIntegrationStatus = {
        ready: true,
        scored: cur.scored || scoreRef.current > 0,
        sessionComplete: true,
        lastScore: scoreRef.current,
        ok: false,
      };
      next.ok = next.ready && next.scored && next.sessionComplete;
      emitStatus(next);
      pushLog(`stop (${reason}) · score ${scoreRef.current}`);
    },
    [clearTick, emitStatus, postToGame, pushLog],
  );

  const startMockRun = useCallback(() => {
    if (htmlBlocked) {
      setErrorNote("Full HTML not allowed — paste Phaser gameCode only.");
      setPhase("error");
      return;
    }
    clearTick();
    setLiveScore(0);
    scoreRef.current = 0;
    setRemaining(duration);
    setErrorNote(null);
    setPhase("playing");
    phaseRef.current = "playing";
    endsAtRef.current = Date.now() + duration * 1000;

    // Keep ready from this iframe load; reset score/session for this run
    const base = statusRef.current;
    emitStatus({
      ready: base.ready,
      scored: false,
      sessionComplete: false,
      lastScore: 0,
      ok: false,
    });

    // Nudge host to re-confirm ready before / during init
    postToGame({ type: "gamerholic:requestReady" });

    const sessionId = `preview-${Date.now()}`;
    postToGame({
      type: "gamerholic:init",
      sessionId,
      gameId: "preview",
      paid: true,
      playTimeSec: duration,
      remainingSec: duration,
      scoresCount: true,
      assets: mockAssets,
      linkedLabelId: linkedLabelId || 0,
      seed: Math.floor(Math.random() * 1e9),
      hostOwnsTimer: true,
      preview: true,
    });
    pushLog(
      `init · mock run · ${duration}s (${formatClock(duration)}) · ${mockAssets.length} asset(s)`,
    );

    window.setTimeout(() => {
      postToGame({
        type: "gamerholic:start",
        sessionId,
        remainingSec: duration,
      });
      pushLog("start sent");
    }, 120);

    tickRef.current = setInterval(() => {
      const left = Math.max(
        0,
        Math.ceil((endsAtRef.current - Date.now()) / 1000),
      );
      setRemaining(left);
      postToGame({ type: "gamerholic:tick", remainingSec: left });
      if (left <= 0 && phaseRef.current === "playing") {
        stopRun("timer");
      }
    }, 250);
  }, [
    htmlBlocked,
    clearTick,
    duration,
    emitStatus,
    postToGame,
    mockAssets,
    linkedLabelId,
    pushLog,
    stopRun,
  ]);

  const reloadIframe = useCallback(() => {
    clearTick();
    setPhase("loading");
    phaseRef.current = "loading";
    setLiveScore(0);
    setRemaining(duration);
    setErrorNote(null);
    setBootLog([]);
    emitStatus(emptyStatus());
    setReloadKey((k) => k + 1);
  }, [clearTick, duration, emitStatus]);

  // Listen for bridge messages from preview iframe
  useEffect(() => {
    const onMsg = (ev: MessageEvent) => {
      const data = ev.data as GhGameToHost | null;
      if (!data || typeof data !== "object" || typeof data.type !== "string") {
        return;
      }
      if (!data.type.startsWith("gamerholic:")) return;

      // Prefer our iframe source, but do not drop messages when ref is briefly
      // null after remount (that was wiping Boot+ready forever).
      const iframeWin = iframeRef.current?.contentWindow;
      if (iframeWin && ev.source && ev.source !== iframeWin) return;

      if (data.type === "gamerholic:ready") {
        setPhase((p) =>
          p === "loading" || p === "idle" || p === "error" ? "ready" : p,
        );
        if (phaseRef.current === "loading" || phaseRef.current === "idle") {
          phaseRef.current = "ready";
        }
        const next: PreviewIntegrationStatus = {
          ...statusRef.current,
          ready: true,
          lastScore: statusRef.current.lastScore,
          scored: statusRef.current.scored,
          sessionComplete: statusRef.current.sessionComplete,
          ok: false,
        };
        next.ok = next.ready && next.scored && next.sessionComplete;
        emitStatus(next);
        pushLog("ready ✓ bridge boot OK");
        return;
      }

      if ((data as { type: string }).type === "gamerholic:error") {
        const msg = String(
          (data as { message?: string }).message || "Game boot error",
        );
        setErrorNote(msg);
        setPhase("error");
        phaseRef.current = "error";
        // Host still posts ready after many errors — mark boot path alive
        const next: PreviewIntegrationStatus = {
          ...statusRef.current,
          ready: true,
          ok: false,
        };
        next.ok = next.ready && next.scored && next.sessionComplete;
        emitStatus(next);
        pushLog(`error · ${msg}`);
        return;
      }

      if (data.type === "gamerholic:score") {
        const s = Math.floor(Number(data.score) || 0);
        setLiveScore(s);
        scoreRef.current = s;
        // Accept scores whenever a mock run is active (or right after boot)
        if (
          phaseRef.current === "playing" ||
          phaseRef.current === "ready" ||
          phaseRef.current === "ended"
        ) {
          const next: PreviewIntegrationStatus = {
            ...statusRef.current,
            ready: true, // score implies host is up
            scored: true,
            lastScore: s,
            ok: false,
          };
          next.ok = next.ready && next.scored && next.sessionComplete;
          emitStatus(next);
        }
        return;
      }

      if (data.type === "gamerholic:end") {
        const s = Math.floor(Number(data.score) || 0);
        setLiveScore(s);
        scoreRef.current = s;
        clearTick();
        setPhase("ended");
        phaseRef.current = "ended";
        const next: PreviewIntegrationStatus = {
          ...statusRef.current,
          ready: true,
          scored: statusRef.current.scored || s > 0 || true,
          sessionComplete: true,
          lastScore: s,
          ok: false,
        };
        // end always counts as a score event for integration (even 0)
        next.scored = true;
        next.ok = next.ready && next.scored && next.sessionComplete;
        emitStatus(next);
        pushLog(`end · final score ${s}`);
        return;
      }

      if (data.type === "gamerholic:requestAssets") {
        postToGame({
          type: "gamerholic:assets",
          assets: mockAssets,
          linkedLabelId: linkedLabelId || 0,
        });
        pushLog("requestAssets → mocked assets sent");
      }
    };
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, [clearTick, emitStatus, linkedLabelId, mockAssets, postToGame, pushLog]);

  // Cleanup on unmount
  useEffect(() => () => clearTick(), [clearTick]);

  /**
   * When host document remounts (contentKey), wait for ready.
   * Do NOT depend on duration / emitStatus — those wiped ready while the
   * iframe had already fired ready once (ready never re-sent).
   */
  useEffect(() => {
    if (!srcDoc) return;
    clearTick();
    setPhase("loading");
    phaseRef.current = "loading";
    setLiveScore(0);
    scoreRef.current = 0;
    setRemaining(duration);
    setErrorNote(null);
    setBootLog([]);
    emitStatus(emptyStatus());

    const t = window.setTimeout(() => {
      if (phaseRef.current === "loading") {
        setPhase("error");
        phaseRef.current = "error";
        setErrorNote(
          "Host did not become ready (Phaser CDN / boot). Check Bridge log, then Reload.",
        );
        pushLog("timeout waiting for ready");
      }
    }, 15000);

    // Ask host to re-announce ready if it booted before we attached (race)
    const pings = [200, 600, 1500, 3000].map((ms) =>
      window.setTimeout(() => {
        postToGame({ type: "gamerholic:requestReady" });
      }, ms),
    );

    return () => {
      window.clearTimeout(t);
      pings.forEach((id) => window.clearTimeout(id));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only remount host on contentKey
  }, [contentKey, srcDoc]);

  // Keep idle remaining clock in sync without wiping integration status
  useEffect(() => {
    if (phaseRef.current === "playing") return;
    setRemaining(duration);
  }, [duration]);

  const CheckRow = ({
    ok,
    label,
    detail,
  }: {
    ok: boolean;
    label: string;
    detail?: string;
  }) => (
    <HStack gap="2" align="flex-start">
      {ok ? (
        <CheckCircle2 size={16} color="#a3ff3d" style={{ flexShrink: 0, marginTop: 2 }} />
      ) : (
        <Circle size={16} color="rgba(255,255,255,0.35)" style={{ flexShrink: 0, marginTop: 2 }} />
      )}
      <Box>
        <Text fontSize="sm" color="#ffffff" fontWeight={ok ? "bold" : "normal"}>
          {label}
        </Text>
        {detail ? (
          <Text fontSize="xs" color="rgba(255,255,255,0.65)" lineHeight="1.4">
            {detail}
          </Text>
        ) : null}
      </Box>
    </HStack>
  );

  return (
    <GhSurface
      variant="elevated"
      p="phi3"
      borderColor="attr.solid"
      bg="rgba(8,6,20,0.98)"
      color="#ffffff"
      style={{ color: "#ffffff" }}
    >
      <HStack justify="space-between" align="flex-start" mb="phi2" flexWrap="wrap" gap="2">
        <Box>
          <Text
            fontFamily="heading"
            fontWeight="extrabold"
            fontSize="md"
            color="#ffffff"
            style={{ color: "#ffffff" }}
          >
            Preview & mock play
          </Text>
          <Text fontSize="sm" color="rgba(255,255,255,0.85)" mt="1" lineHeight="1.5">
            Same Phaser host + bridge as live cabinets. No fees or chain writes.
            After Start: arrows/WASD/space are forwarded via bridge.keyDown (page
            won&apos;t scroll). Touch pads still work if the game drew them.
          </Text>
        </Box>
        {status.ok ? (
          <HStack
            gap="1.5"
            px="3"
            py="1.5"
            borderRadius="full"
            bg="rgba(163,255,61,0.15)"
            borderWidth="1px"
            borderColor="#a3ff3d"
          >
            <CheckCircle2 size={14} color="#a3ff3d" />
            <Text fontSize="xs" fontWeight="bold" color="#a3ff3d">
              Integration OK
            </Text>
          </HStack>
        ) : null}
      </HStack>

      {htmlBlocked ? (
        <HStack
          gap="2"
          p="phi2"
          mb="phi2"
          borderRadius="lg"
          bg="rgba(244,63,94,0.15)"
          borderWidth="1px"
          borderColor="danger.solid"
        >
          <XCircle size={16} color="#f43f5e" />
          <Text fontSize="sm" color="#ffffff">
            Full HTML documents are blocked. Paste Phaser gameCode only.
          </Text>
        </HStack>
      ) : null}

      {looksLikeCssOnly ? (
        <HStack
          gap="2"
          p="phi2"
          mb="phi2"
          borderRadius="lg"
          bg="rgba(244,63,94,0.15)"
          borderWidth="1px"
          borderColor="danger.solid"
        >
          <XCircle size={16} color="#f43f5e" />
          <Text fontSize="sm" color="#ffffff">
            Game code field looks like CSS. Put styles in CSS, and JS starting
            with window.GamerholicArcadeGame in Game code.
          </Text>
        </HStack>
      ) : null}

      <Grid
        templateColumns={{ base: "1fr", lg: "1fr 16rem" }}
        gap="phi3"
        alignItems="stretch"
      >
        {/* Stage */}
        <Box
          position="relative"
          w="100%"
          h={{ base: "min(58dvh, 420px)", md: "min(52vh, 480px)" }}
          bg="#070612"
          borderRadius="xl"
          overflow="hidden"
          borderWidth="1px"
          borderColor="whiteAlpha.300"
          touchAction="none"
        >
          {srcDoc ? (
            <iframe
              key={contentKey}
              ref={iframeRef}
              title="Arcade game preview"
              srcDoc={srcDoc}
              sandbox="allow-scripts"
              tabIndex={0}
              onMouseDown={() => {
                try {
                  iframeRef.current?.focus({ preventScroll: true });
                } catch {
                  /* ignore */
                }
                postToGame({ type: "gamerholic:focus" });
              }}
              style={{
                width: "100%",
                height: "100%",
                border: "none",
                display: "block",
                background: "#070612",
                touchAction: "none",
              }}
            />
          ) : (
            <Flex h="100%" align="center" justify="center" p="4">
              <Text color="rgba(255,255,255,0.7)" fontSize="sm" textAlign="center">
                Fix game code to load preview.
              </Text>
            </Flex>
          )}

          {/* Host SCORE / TIME overlay (mirrors play-view) */}
          {(phase === "playing" || phase === "ended") && (
            <Box
              position="absolute"
              top="10px"
              left="10px"
              zIndex={5}
              pointerEvents="none"
              px="3"
              py="2"
              borderRadius="xl"
              bg="rgba(7,6,18,0.75)"
              borderWidth="1px"
              borderColor="whiteAlpha.200"
              backdropFilter="blur(10px)"
              minW="6.5rem"
            >
              <Text
                fontSize="2xs"
                fontWeight="bold"
                letterSpacing="0.12em"
                color="whiteAlpha.700"
                textTransform="uppercase"
              >
                Score
              </Text>
              <Text
                fontFamily="heading"
                fontWeight="extrabold"
                fontSize="xl"
                color="#a3ff3d"
                lineHeight="1.1"
              >
                {liveScore.toLocaleString()}
              </Text>
              <HStack gap="1" mt="1">
                <Timer size={12} color="rgba(255,255,255,0.85)" />
                <Text fontFamily="mono" fontWeight="bold" fontSize="sm" color="white">
                  {formatClock(remaining)}
                </Text>
              </HStack>
              <Text
                fontSize="2xs"
                fontWeight="bold"
                color="#f43fa8"
                mt="1"
                letterSpacing="0.08em"
              >
                MOCK RUN
              </Text>
            </Box>
          )}

          {/* Compact status chip — do not cover the whole stage */}
          {(phase === "loading" || phase === "ready" || phase === "error") && (
            <Box
              position="absolute"
              bottom="10px"
              left="50%"
              transform="translateX(-50%)"
              zIndex={5}
              pointerEvents="none"
              px="3"
              py="1.5"
              borderRadius="full"
              bg="rgba(7,6,18,0.82)"
              borderWidth="1px"
              borderColor={
                phase === "error"
                  ? "rgba(244,63,94,0.6)"
                  : phase === "ready"
                    ? "rgba(163,255,61,0.45)"
                    : "whiteAlpha.300"
              }
              maxW="90%"
            >
              <Text
                fontSize="xs"
                fontWeight="bold"
                color={
                  phase === "error"
                    ? "#ff8a9a"
                    : phase === "ready"
                      ? "#a3ff3d"
                      : "white"
                }
                textAlign="center"
              >
                {phase === "loading"
                  ? "Loading Phaser host…"
                  : phase === "ready"
                    ? "Ready — press Start mock run (ship + pads should be visible)"
                    : errorNote || "Boot error — see bridge log"}
              </Text>
            </Box>
          )}
        </Box>

        {/* Checklist + controls */}
        <VStack align="stretch" gap="phi2">
          <Text
            fontSize="2xs"
            fontWeight="bold"
            letterSpacing="0.1em"
            textTransform="uppercase"
            color="rgba(255,255,255,0.75)"
          >
            Integration checks
          </Text>
          <CheckRow
            ok={status.ready}
            label="Boot + ready"
            detail="window.GamerholicArcadeGame.boot + bridge.ready()"
          />
          <CheckRow
            ok={status.scored}
            label="Score events"
            detail="bridge.score() during mock play"
          />
          <CheckRow
            ok={status.sessionComplete}
            label="Session end"
            detail="Host stop / game end after timer"
          />
          <CheckRow
            ok={status.ok}
            label="Integration successful"
            detail={
              status.ok
                ? `Last score ${status.lastScore.toLocaleString()}`
                : "Complete all checks above"
            }
          />

          <Box
            mt="1"
            p="2"
            borderRadius="lg"
            bg="blackAlpha.500"
            borderWidth="1px"
            borderColor="whiteAlpha.200"
            minH="4.5rem"
          >
            <Text
              fontSize="2xs"
              fontWeight="bold"
              color="rgba(255,255,255,0.55)"
              mb="1"
              letterSpacing="0.08em"
              textTransform="uppercase"
            >
              Bridge log
            </Text>
            {bootLog.length === 0 ? (
              <Text fontSize="xs" color="rgba(255,255,255,0.4)">
                Waiting for iframe…
              </Text>
            ) : (
              bootLog.map((line, i) => (
                <Text key={i} fontSize="xs" color="rgba(255,255,255,0.8)" fontFamily="mono">
                  · {line}
                </Text>
              ))
            )}
            {errorNote ? (
              <Text fontSize="xs" color="#f43f5e" mt="1">
                {errorNote}
              </Text>
            ) : null}
          </Box>

          <VStack align="stretch" gap="2" pt="1">
            <Text fontSize="xs" color="rgba(255,255,255,0.65)">
              Timer: {formatClock(duration)} (from play time on the form)
            </Text>
            <GhButton
              variant="primary"
              leftIcon={<Play size={16} />}
              onClick={startMockRun}
              disabled={
                htmlBlocked ||
                phase === "playing" ||
                !srcDoc
              }
            >
              {phase === "playing"
                ? "Playing…"
                : phase === "ended"
                  ? "Run again"
                  : "Start mock run"}
            </GhButton>
            <GhButton
              variant="outline"
              leftIcon={<Square size={14} />}
              onClick={() => stopRun("manual")}
              disabled={phase !== "playing"}
              color="white"
              borderColor="whiteAlpha.400"
            >
              Stop early
            </GhButton>
            <GhButton
              variant="outline"
              leftIcon={<RotateCcw size={14} />}
              onClick={reloadIframe}
              disabled={phase === "playing"}
              color="white"
              borderColor="whiteAlpha.400"
            >
              Reload code
            </GhButton>
          </VStack>

          <Text fontSize="xs" color="rgba(255,255,255,0.55)" lineHeight="1.45">
            After Start mock run, keyboard is captured even if a form field had
            focus. Games should use bridge.keyDown(&quot;left&quot;|&quot;fire&quot;) —
            pure Phaser createCursorKeys is unreliable in the iframe. Mock assets:{" "}
            {mockAssets.map((a) => `#${a.tokenId}`).join(", ")}.
          </Text>
        </VStack>
      </Grid>
    </GhSurface>
  );
}
