"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
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
  BookOpen,
  Coins,
  Crown,
  FlaskConical,
  Gamepad2,
  Hammer,
  Joystick,
  Maximize2,
  Minimize2,
  Pencil,
  Shield,
  Sparkles,
  ThumbsUp,
  Timer,
  Trophy,
  Wallet,
} from "lucide-react";
import {
  GhBadge,
  GhButton,
  GhEmptyState,
  GhSurface,
  GhTextarea,
  SectionDivider,
  ghToast,
} from "@/components/ui";
import { ModeHeader } from "@/components/spectacle/mode-header";
import { useSession } from "@/components/providers/session-context";
import {
  ARCADE_LIVE_UPVOTE_THRESHOLD,
  claimGameEarnings,
  debitPlayFee,
  formatEarningsShort,
  formatPlayFee,
  getArcadeGame,
  getArcadeGameAsync,
  getGameEscrow,
  getGameSrcDoc,
  getPlayBalances,
  getPlayerEarnings,
  listEarningsLedger,
  listLeaderboardWithEarnings,
  listLeaderboardWithEarningsAsync,
  listPayoutEvents,
  updateArcadeGameWhileTestingAsync,
  upvoteArcadeGameAsync,
  type LeaderboardPlayerRow,
} from "@/lib/arcade/store";
import { normalizeArcadePaste } from "@/lib/arcade/engine";
import { describePayoutRules } from "@/lib/arcade/prize";
import { resolvePlayerGameAssetsForGame } from "@/lib/arcade/assets";
import {
  finalizeSecureSession,
  remainingFromTEnd,
  reportSecureScore,
  retryCanisterSettle,
  startSecureSession,
  syncSessionClock,
  type SecurePlaySession,
} from "@/lib/arcade/secure-session";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { resolveArcadeCoverUrl } from "@/lib/arcade/cover";
import { bindArcadeKeyboardCapture } from "@/lib/arcade/keyboard";
import type {
  ArcadeGame,
  ArcadePayoutEvent,
  EarningsLedgerEntry,
  EquippedGameAsset,
  GameEscrowAccount,
  GhGameToHost,
  LeaderboardEntry,
  PlayerGameEarnings,
} from "@/lib/arcade/types";

type Props = { gameId: string };

function formatClock(sec: number) {
  const s = Math.max(0, Math.floor(sec));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
}

/**
 * Arcade play cabinet — insert fee, countdown, HTML5 iframe, leaderboard.
 */
export function ArcadePlayView({ gameId }: Props) {
  const { isLoggedIn, loginDemo, profile, principal, identity } = useSession();
  const [game, setGame] = useState<ArcadeGame | null>(null);
  const [board, setBoard] = useState<LeaderboardPlayerRow[]>([]);
  const [payouts, setPayouts] = useState<ArcadePayoutEvent[]>([]);
  const [escrow, setEscrow] = useState<GameEscrowAccount | null>(null);
  const [myEarnings, setMyEarnings] = useState<PlayerGameEarnings | null>(
    null,
  );
  const [ledger, setLedger] = useState<EarningsLedgerEntry[]>([]);
  const [claimBusy, setClaimBusy] = useState(false);
  const [retryBusy, setRetryBusy] = useState(false);
  const [balances, setBalances] = useState(getPlayBalances());
  const [lastSettlementNote, setLastSettlementNote] = useState<string | null>(
    null,
  );
  const [canRetryChain, setCanRetryChain] = useState(false);
  const [session, setSession] = useState<SecurePlaySession | null>(null);
  const [liveScore, setLiveScore] = useState(0);
  const [remaining, setRemaining] = useState(0);
  const [phase, setPhase] = useState<"idle" | "playing" | "ended">("idle");
  const [chainStatus, setChainStatus] = useState<string | null>(null);
  const [iframeReady, setIframeReady] = useState(false);
  /** Full-viewport cabinet (auto-on when a run starts — best for mobile) */
  const [expanded, setExpanded] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const sessionRef = useRef<SecurePlaySession | null>(null);
  const liveScoreRef = useRef(0);
  const submittedRef = useRef(false);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const scoreSeqThrottle = useRef(0);
  const phaseRef = useRef<"idle" | "playing" | "ended">("idle");
  const iframeReadyRef = useRef(false);
  /** Last sessionId we sent init/start for — avoids double-bootstrap storms */
  const bridgedSessionRef = useRef<string | null>(null);
  /** Monotonic so delayed start timeouts don't hit a superseded run */
  const runGenRef = useRef(0);

  const [equips, setEquips] = useState<EquippedGameAsset[]>([]);
  const equipsRef = useRef<EquippedGameAsset[]>([]);
  const [upvoteBusy, setUpvoteBusy] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editCss, setEditCss] = useState("");
  const [editCode, setEditCode] = useState("");
  const [editBusy, setEditBusy] = useState(false);
  /** Bump to remount iframe after creator CSS/code edit */
  const [hostKey, setHostKey] = useState(0);

  useEffect(() => {
    equipsRef.current = equips;
  }, [equips]);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  useEffect(() => {
    iframeReadyRef.current = iframeReady;
  }, [iframeReady]);

  // Host remount (CSS/code edit) — wait for ready again
  useEffect(() => {
    iframeReadyRef.current = false;
    setIframeReady(false);
    bridgedSessionRef.current = null;
  }, [hostKey]);

  // Load player's label-linked game assets (Dexsta) when cabinet has linkedLabelId
  useEffect(() => {
    if (!game) {
      setEquips([]);
      return;
    }
    let cancelled = false;
    const owner = principal || profile?.principal || "";
    void resolvePlayerGameAssetsForGame({
      game,
      ownerPrincipal: owner,
    }).then((list) => {
      if (!cancelled) setEquips(list);
    });
    return () => {
      cancelled = true;
    };
  }, [game, principal, profile?.principal]);

  const refreshEconomy = useCallback(async () => {
    const g = (await getArcadeGameAsync(gameId)) || getArcadeGame(gameId);
    setGame(g);
    if (g) {
      // Leaderboard from Supabase (paid test + live scores)
      setBoard(await listLeaderboardWithEarningsAsync(g.id));
      setPayouts(listPayoutEvents(g.id));
      setEscrow(getGameEscrow(g.id));
      const p = principal || profile?.principal || "";
      setMyEarnings(p ? getPlayerEarnings(g.id, p) : null);
      setLedger(listEarningsLedger(g.id, p || undefined, 12));
      if (!editOpen) {
        setEditCss(g.css || "");
        setEditCode(g.gameCode || "");
      }
    }
    setBalances(getPlayBalances());
  }, [gameId, principal, profile?.principal, editOpen]);

  useEffect(() => {
    void refreshEconomy();
  }, [refreshEconomy]);

  const mePrincipal = principal || profile?.principal || "";
  const isCreator =
    Boolean(game?.creatorPrincipal) &&
    Boolean(mePrincipal) &&
    game?.creatorPrincipal === mePrincipal;
  const isTesting = game?.status === "testing";
  const alreadyUpvoted =
    Boolean(mePrincipal) &&
    Boolean(game?.upvotedBy?.includes(mePrincipal));
  const upvoteCount = game?.upvotes ?? 0;

  const onUpvote = async () => {
    if (!game) return;
    if (!isLoggedIn || !mePrincipal) {
      loginDemo();
      ghToast({ title: "Sign in to upvote", type: "info" });
      return;
    }
    setUpvoteBusy(true);
    try {
      const r = await upvoteArcadeGameAsync(game.id, mePrincipal);
      if (!r.ok) {
        ghToast({
          title: r.alreadyVoted ? "Already upvoted" : "Upvote failed",
          description: r.error,
          type: r.alreadyVoted ? "info" : "error",
        });
        if (r.game) setGame(r.game);
        return;
      }
      if (r.game) setGame(r.game);
      if (r.wentLive) {
        ghToast({
          title: "Game is now live!",
          description: `${game.title} hit ${ARCADE_LIVE_UPVOTE_THRESHOLD} upvotes. Tester scores stay on the leaderboard.`,
          type: "success",
        });
      } else {
        ghToast({
          title: "Upvoted",
          description: `${r.game?.upvotes ?? 0}/${ARCADE_LIVE_UPVOTE_THRESHOLD} — keep playtesting with real inserts.`,
          type: "success",
        });
      }
    } finally {
      setUpvoteBusy(false);
    }
  };

  const onSaveCreatorEdit = async () => {
    if (!game || !mePrincipal) return;
    const styles = normalizeArcadePaste(editCss, "css");
    const code = normalizeArcadePaste(editCode, "js");
    if (
      code &&
      /<!DOCTYPE|<html[\s>]|<body[\s>]/i.test(code)
    ) {
      ghToast({
        title: "Full HTML not allowed",
        description: "Paste gameCode only (window.GamerholicArcadeGame.boot).",
        type: "error",
      });
      return;
    }
    if (
      code &&
      !/GamerholicArcadeGame/.test(code) &&
      !/window\s*\.\s*GamerholicArcadeGame/.test(code)
    ) {
      ghToast({
        title: "Invalid game code",
        description:
          "Must assign window.GamerholicArcadeGame with a boot() function.",
        type: "error",
      });
      return;
    }
    setEditBusy(true);
    try {
      const r = await updateArcadeGameWhileTestingAsync(
        game.id,
        mePrincipal,
        { css: styles, gameCode: code },
      );
      if (!r.ok) {
        ghToast({ title: "Update failed", description: r.error, type: "error" });
        return;
      }
      setGame(r.game);
      setHostKey((k) => k + 1);
      setIframeReady(false);
      ghToast({
        title: "Cabinet updated",
        description: "CSS / gameCode saved — host reloaded. Keep testing with inserts.",
        type: "success",
      });
    } finally {
      setEditBusy(false);
    }
  };

  useEffect(() => {
    sessionRef.current = session;
  }, [session]);
  useEffect(() => {
    liveScoreRef.current = liveScore;
  }, [liveScore]);

  const postToGame = useCallback((msg: object) => {
    const win = iframeRef.current?.contentWindow;
    if (!win) return;
    try {
      win.postMessage(msg, "*");
    } catch {
      /* iframe gone */
    }
  }, []);

  /**
   * Push init + start into the Phaser host for the active secure session.
   * Only marks the session "bridged" once the host has reported ready —
   * otherwise init would be lost and never retried.
   */
  const bootstrapGameBridge = useCallback(
    (opts?: { force?: boolean }) => {
      const secure = sessionRef.current;
      const g = game;
      if (!secure || !g) return;
      if (phaseRef.current !== "playing") return;
      if (submittedRef.current) return;
      if (!opts?.force && bridgedSessionRef.current === secure.sessionId) {
        postToGame({ type: "gamerholic:focus" });
        return;
      }
      const assets = equipsRef.current;
      postToGame({
        type: "gamerholic:init",
        sessionId: secure.sessionId,
        gameId: secure.gameId,
        paid: secure.paid,
        playTimeSec: secure.playTimeSec,
        remainingSec: remainingFromTEnd(secure.tEnd),
        scoresCount: secure.paid,
        assets,
        linkedLabelId: g.linkedLabelId || 0,
        seed: secure.seed,
        hostOwnsTimer: true,
      });
      const gen = runGenRef.current;
      window.setTimeout(() => {
        if (runGenRef.current !== gen) return;
        if (phaseRef.current !== "playing") return;
        if (sessionRef.current?.sessionId !== secure.sessionId) return;
        postToGame({
          type: "gamerholic:start",
          sessionId: secure.sessionId,
          remainingSec: remainingFromTEnd(secure.tEnd),
        });
        postToGame({ type: "gamerholic:focus" });
        // Mark bridged only after start, and only if host was ready
        if (iframeReadyRef.current) {
          bridgedSessionRef.current = secure.sessionId;
        }
      }, 100);
    },
    [game, postToGame],
  );

  // Capture arrow/WASD/space on the parent page so they control the game
  // instead of scrolling the document (iframe often lacks focus).
  useEffect(() => {
    if (phase !== "playing") return;
    const unbind = bindArcadeKeyboardCapture({
      active: true,
      postToGame: (msg) => postToGame(msg),
      iframe: iframeRef.current,
      stealFromForms: true,
    });
    postToGame({ type: "gamerholic:focus" });
    // Re-bind after a tick so ref is current when expand CSS settles
    const t = window.setTimeout(() => {
      postToGame({ type: "gamerholic:focus" });
      bootstrapGameBridge({ force: false });
    }, 100);
    return () => {
      unbind();
      window.clearTimeout(t);
    };
  }, [phase, postToGame, bootstrapGameBridge, expanded]);

  const finalize = useCallback(
    async (reason: LeaderboardEntry["endReason"]) => {
      const s = sessionRef.current;
      if (!s || submittedRef.current) return;
      submittedRef.current = true;
      if (tickRef.current) {
        clearInterval(tickRef.current);
        tickRef.current = null;
      }
      postToGame({ type: "gamerholic:stop", reason });
      const score = liveScoreRef.current;
      setPhase("ended");
      setChainStatus(
        s.paid
          ? isSupabaseConfigured()
            ? "Finalizing (server) → canister…"
            : "Settling (local)…"
          : null,
      );

      try {
        // Flush last score to Supabase before finalize
        if (s.paid || s.source === "supabase") {
          await reportSecureScore(s, score);
        }
        const result = await finalizeSecureSession({
          session: s,
          finalScore: score,
          endReason: reason,
        });
        refreshEconomy();
        setChainStatus(
          result.needsCanister
            ? result.ok
              ? `Canister confirmed${result.canisterTx ? ` · ${result.canisterTx.slice(0, 18)}…` : ""}`
              : `Canister/settle issue: ${result.error || "failed"} — safe to retry`
            : result.note || "Done",
        );
        setCanRetryChain(
          Boolean(
            result.needsCanister &&
              (!result.ok ||
                result.status === "finalized_pending_chain" ||
                result.error),
          ),
        );
        if (result.ok && result.status === "confirmed") setCanRetryChain(false);
        setLastSettlementNote(result.note || result.error || null);
        if (!s.paid) {
          ghToast({
            title: "Free run ended",
            description: "Practice only — not on ranked board.",
            type: "info",
          });
        } else {
          const kind = result.settlement?.kind;
          ghToast({
            title:
              kind === "new_high_score_refund"
                ? "New high score — fee refunded"
                : kind === "distributed"
                  ? "Ranked run settled · claim escrow prizes"
                  : result.ok
                    ? "Ranked run settled"
                    : "Settle issue",
            description: `${score.toLocaleString()} pts · ${result.note || reason}`,
            type: result.ok
              ? kind === "new_high_score_refund"
                ? "success"
                : "info"
              : "error",
          });
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        setChainStatus(msg);
        ghToast({ title: "Finalize failed", description: msg, type: "error" });
      }
      setGame(getArcadeGame(gameId));
    },
    [gameId, postToGame, refreshEconomy],
  );

  const onClaim = async () => {
    const p = principal || profile?.principal || "";
    if (!p || !game) return;
    setClaimBusy(true);
    try {
      const r = claimGameEarnings(game.id, p);
      setBalances(r.balances);
      if (!r.ok) {
        ghToast({ title: "Nothing to claim", description: r.error, type: "info" });
        return;
      }
      // Native ICP: arcade escrow → play subaccount on gh_backend
      if (r.claimedIcp > 0 && identity) {
        const { claimGameEarningsIcpOnChain } = await import(
          "@/lib/arcade/store"
        );
        const chain = await claimGameEarningsIcpOnChain(
          game.id,
          r.claimedIcp,
          identity,
        );
        if (!chain.ok) {
          ghToast({
            title: "Local claim ok · on-chain ICP failed",
            description: chain.error || "Deposit/escrow may be empty on ledger",
            type: "warning",
          });
        }
      }
      refreshEconomy();
      const parts = [
        r.claimedIcp > 0 ? `${r.claimedIcp} ICP` : "",
        r.claimedGamer > 0 ? `${r.claimedGamer} GAMER` : "",
      ].filter(Boolean);
      ghToast({
        title: "Claimed to play subaccount",
        description: parts.join(" · ") || "Done",
        type: "success",
      });
    } finally {
      setClaimBusy(false);
    }
  };

  /** Resubmit staged Supabase score to canister — no new fee, no score edit */
  const onRetryChain = async () => {
    const sid = sessionRef.current?.sessionId || session?.sessionId;
    if (!sid) {
      ghToast({
        title: "No session to retry",
        description: "Missing session id",
        type: "error",
      });
      return;
    }
    setRetryBusy(true);
    setChainStatus("Retrying canister settle from Supabase final_score…");
    try {
      const result = await retryCanisterSettle(sid);
      refreshEconomy();
      setLastSettlementNote(result.note || result.error || null);
      setCanRetryChain(!result.ok);
      setChainStatus(
        result.ok
          ? `Confirmed${result.canisterTx ? ` · ${result.canisterTx.slice(0, 20)}` : ""}`
          : `Still pending: ${result.error || "failed"}`,
      );
      ghToast({
        title: result.ok ? "Settle confirmed" : "Retry failed",
        description: result.note || result.error || "",
        type: result.ok ? "success" : "error",
      });
    } finally {
      setRetryBusy(false);
    }
  };

  // Listen to game iframe
  useEffect(() => {
    const onMsg = (ev: MessageEvent) => {
      const data = ev.data as GhGameToHost;
      if (!data || typeof data !== "object" || !("type" in data)) return;
      if (typeof data.type !== "string" || !data.type.startsWith("gamerholic:"))
        return;
      // Prefer our cabinet iframe; don't drop if ref briefly null after remount
      const iframeWin = iframeRef.current?.contentWindow;
      if (iframeWin && ev.source && ev.source !== iframeWin) return;

      if (data.type === "gamerholic:ready") {
        iframeReadyRef.current = true;
        setIframeReady(true);
        // Host booted (or rebooted after remount) — attach session once per host
        const sid = sessionRef.current?.sessionId;
        if (
          phaseRef.current === "playing" &&
          sid &&
          bridgedSessionRef.current !== sid
        ) {
          bootstrapGameBridge({ force: true });
        }
        return;
      }
      if (data.type === "gamerholic:score") {
        const sc = Math.max(0, Math.floor(Number(data.score) || 0));
        setLiveScore(sc);
        liveScoreRef.current = sc;
        const sess = sessionRef.current;
        if (sess && Date.now() - scoreSeqThrottle.current > 200) {
          scoreSeqThrottle.current = Date.now();
          void reportSecureScore(sess, sc);
        }
        if (data.final) void finalize("game");
        return;
      }
      if (data.type === "gamerholic:end") {
        const sc = Math.max(0, Math.floor(Number(data.score) || 0));
        setLiveScore(sc);
        liveScoreRef.current = sc;
        void finalize("game");
        return;
      }
      if (data.type === "gamerholic:requestAssets") {
        postToGame({
          type: "gamerholic:assets",
          assets: equipsRef.current,
          linkedLabelId: game?.linkedLabelId || 0,
        });
      }
    };
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, [finalize, postToGame, game?.linkedLabelId, bootstrapGameBridge]);

  // Auto-submit on tab close
  useEffect(() => {
    const onUnload = () => {
      if (sessionRef.current && !submittedRef.current && phase === "playing") {
        void finalize("unload");
      }
    };
    window.addEventListener("pagehide", onUnload);
    window.addEventListener("beforeunload", onUnload);
    return () => {
      window.removeEventListener("pagehide", onUnload);
      window.removeEventListener("beforeunload", onUnload);
    };
  }, [finalize, phase]);

  useEffect(() => {
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, []);

  /**
   * Single body scroll lock for play + fullscreen.
   * Nested prev/restore locks used to leave overflow:hidden after Exit full screen.
   */
  const lockBodyScroll = phase === "playing" || expanded;
  useEffect(() => {
    if (!lockBodyScroll) {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
      return;
    }
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    };
  }, [lockBodyScroll]);

  const beginRun = async (paid: boolean) => {
    if (!game) return;
    if (!isLoggedIn) {
      loginDemo();
      ghToast({ title: "Signed in (demo)", type: "info" });
    }
    const playerPrincipal =
      principal || profile?.principal || "anon-player";
    const username = profile?.username || "player";

    if (paid) {
      if (game.playFeeToken === "ICP" && identity && game.playFee > 0) {
        try {
          const { debitArcadePlayFee } = await import(
            "@/lib/ic/settlement-service"
          );
          const ok = await debitArcadePlayFee(
            game.id,
            game.playFee,
            identity,
          );
          if (!ok) {
            ghToast({
              title: "ICP insert failed",
              description:
                "Debit from play subaccount failed — deposit ICP to your Gamerholic play balance first",
              type: "error",
            });
            return;
          }
        } catch (e) {
          ghToast({
            title: "ICP insert failed",
            description: e instanceof Error ? e.message : String(e),
            type: "error",
          });
          return;
        }
      }
      const deb = debitPlayFee(game.playFeeToken, game.playFee);
      setBalances(deb.balances);
      if (!deb.ok && game.playFeeToken !== "ICP") {
        ghToast({
          title: "Insert failed",
          description: deb.error,
          type: "error",
        });
        return;
      }
    }

    submittedRef.current = false;
    scoreSeqThrottle.current = 0;
    setChainStatus(
      isSupabaseConfigured()
        ? "Session clock: Supabase server time"
        : "Session clock: local fallback (set Supabase for server time)",
    );

    let secure: SecurePlaySession;
    try {
      secure = await startSecureSession({
        gameId: game.id,
        playerPrincipal,
        username,
        paid,
        playFee: paid ? game.playFee : 0,
        playFeeToken: game.playFeeToken,
        playTimeSec: game.playTimeSec,
      });
    } catch (e) {
      ghToast({
        title: "Could not start session",
        description: e instanceof Error ? e.message : String(e),
        type: "error",
      });
      // Refund debit if we took fee then failed to open session
      if (paid) {
        /* fee already debited — operator can refund manually in demo */
      }
      return;
    }

    runGenRef.current += 1;
    bridgedSessionRef.current = null;
    setSession(secure);
    sessionRef.current = secure;
    setLiveScore(0);
    setRemaining(secure.remainingSec);
    phaseRef.current = "playing";
    setPhase("playing");
    // Expand via CSS only — do NOT remount the iframe tree (that was killing Phaser).
    setExpanded(true);

    // Refresh equips at run start (label-linked Dexsta game assets)
    let runEquips = equipsRef.current;
    try {
      runEquips = await resolvePlayerGameAssetsForGame({
        game,
        ownerPrincipal: playerPrincipal,
      });
      setEquips(runEquips);
      equipsRef.current = runEquips;
    } catch {
      /* keep prior */
    }

    // Bridge init/start — host owns timer; ready handler also bootstraps if needed
    const sid = secure.sessionId;
    const kick = () => {
      if (phaseRef.current !== "playing") return;
      if (sessionRef.current?.sessionId !== sid) return;
      if (bridgedSessionRef.current === sid) return;
      bootstrapGameBridge({ force: true });
    };
    if (iframeReadyRef.current) {
      kick();
    } else {
      postToGame({ type: "gamerholic:requestReady" });
    }
    // Retries if the first init was lost before Phaser ready
    window.setTimeout(kick, 200);
    window.setTimeout(kick, 600);
    window.setTimeout(kick, 1500);

    if (tickRef.current) clearInterval(tickRef.current);
    let syncCounter = 0;
    tickRef.current = setInterval(() => {
      const cur = sessionRef.current;
      if (!cur) return;
      // Smooth UI from last known t_end
      let left = remainingFromTEnd(cur.tEnd);
      setRemaining(left);
      postToGame({ type: "gamerholic:tick", remainingSec: left });

      // Re-sync server clock every ~1.5s (not every frame — lag-friendly)
      syncCounter += 1;
      if (syncCounter % 6 === 0) {
        void syncSessionClock(cur.sessionId, cur.source).then((clk) => {
          setRemaining(clk.remainingSec);
          if (clk.expired && !submittedRef.current) {
            void finalize("timer");
          }
        });
      } else if (left <= 0 && !submittedRef.current) {
        void finalize("timer");
      }
    }, 250);

    ghToast({
      title: paid ? "Insert accepted — ranked run" : "Free practice",
      description: paid
        ? `${formatPlayFee(game.playFee, game.playFeeToken)} · server timer · chain settle after end`
        : "Score not ranked",
      type: paid ? "success" : "info",
    });
  };

  if (!game) {
    return (
      <GhEmptyState
        icon={Joystick}
        title="Cabinet not found"
        description={`No game with id “${gameId}”.`}
        action={
          <Link href="/arcade">
            <GhButton variant="soft">Back to arcade</GhButton>
          </Link>
        }
      />
    );
  }

  const feeLabel = formatPlayFee(game.playFee, game.playFeeToken);
  /** Host-controlled Phaser 3 shell + creator CSS/JS only */
  const srcDoc = getGameSrcDoc(game);
  const clock =
    phase === "idle"
      ? formatClock(game.playTimeSec)
      : formatClock(remaining);
  const playing = phase === "playing";

  const gameStage = (
    <Box
      // Expand with CSS only — never remount this subtree (that destroyed Phaser)
      position={expanded ? "fixed" : "relative"}
      inset={expanded ? 0 : undefined}
      zIndex={expanded ? 80 : undefined}
      w={expanded ? "100vw" : "100%"}
      h={
        expanded
          ? "100dvh"
          : { base: "min(72dvh, 640px)", md: "min(70vh, 720px)" }
      }
      minH={expanded ? "100dvh" : undefined}
      bg="#070612"
      touchAction="none"
      overflow="hidden"
      display="flex"
      flexDirection="column"
    >
      {expanded ? (
        <HStack
          px="3"
          pt="max(8px, env(safe-area-inset-top))"
          pb="2"
          justify="space-between"
          flexShrink={0}
          bg="rgba(7,6,18,0.9)"
          borderBottomWidth="1px"
          borderColor="whiteAlpha.100"
          gap="2"
        >
          <Text
            fontFamily="heading"
            fontWeight="extrabold"
            fontSize="sm"
            color="white"
            lineClamp={1}
            flex="1"
          >
            {game.title}
          </Text>
          {phase === "idle" ? (
            <Text fontSize="xs" color="prize.fg" fontWeight="bold">
              {feeLabel}
            </Text>
          ) : null}
        </HStack>
      ) : null}
      <Box flex="1" minH="0" position="relative" w="100%">
      <iframe
        key={hostKey}
        ref={iframeRef}
        title={game.title}
        srcDoc={srcDoc}
        sandbox="allow-scripts allow-same-origin"
        allow="fullscreen"
        tabIndex={0}
        onFocus={() => postToGame({ type: "gamerholic:focus" })}
        onLoad={() => {
          // New document — clear bridge flag so ready/bootstrap can attach
          if (phaseRef.current === "playing") {
            bridgedSessionRef.current = null;
          }
          postToGame({ type: "gamerholic:requestReady" });
        }}
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
          // Improve mobile input routing
          touchAction: "none",
        }}
      />

      {/* Host SCORE + TIME overlay — top left of game screen */}
      {(playing || phase === "ended") && (
        <Box
          position="absolute"
          top={{ base: "max(10px, env(safe-area-inset-top))", md: "12px" }}
          left={{ base: "max(10px, env(safe-area-inset-left))", md: "12px" }}
          zIndex={5}
          pointerEvents="none"
          px="3"
          py="2.5"
          borderRadius="xl"
          bg="rgba(7,6,18,0.72)"
          borderWidth="1px"
          borderColor="whiteAlpha.200"
          backdropFilter="blur(10px)"
          boxShadow="0 8px 28px rgba(0,0,0,0.45)"
          minW="7.5rem"
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
            fontSize={{ base: "xl", md: "2xl" }}
            color="#a3ff3d"
            lineHeight="1.1"
            textShadow="0 0 12px rgba(163,255,61,0.35)"
          >
            {liveScore.toLocaleString()}
          </Text>
          <HStack gap="1.5" mt="1.5" align="center">
            <Timer
              size={13}
              color={
                playing && remaining <= 10 ? "#f43fa8" : "rgba(255,255,255,0.85)"
              }
            />
            <Text
              fontFamily="mono"
              fontWeight="bold"
              fontSize={{ base: "md", md: "lg" }}
              color={
                playing && remaining <= 10 ? "#f43fa8" : "white"
              }
              letterSpacing="0.04em"
            >
              {clock}
            </Text>
          </HStack>
          {session?.paid ? (
            <Text
              fontSize="2xs"
              fontWeight="bold"
              color="#f43fa8"
              mt="1"
              letterSpacing="0.08em"
            >
              RANKED
            </Text>
          ) : playing ? (
            <Text
              fontSize="2xs"
              fontWeight="bold"
              color="whiteAlpha.600"
              mt="1"
              letterSpacing="0.08em"
            >
              FREE
            </Text>
          ) : null}
        </Box>
      )}

      {/* Expand / collapse */}
      <Box
        position="absolute"
        top={{ base: "max(10px, env(safe-area-inset-top))", md: "12px" }}
        right={{ base: "max(10px, env(safe-area-inset-right))", md: "12px" }}
        zIndex={6}
      >
        <GhButton
          size="sm"
          variant="soft"
          aria-label={expanded ? "Exit full screen" : "Full screen"}
          onClick={() => setExpanded((e) => !e)}
          leftIcon={
            expanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />
          }
        >
          {expanded ? "Exit" : "Full"}
        </GhButton>
      </Box>

      {phase === "idle" ? (
        <Flex
          position="absolute"
          inset="0"
          bg="blackAlpha.700"
          backdropFilter="blur(2px)"
          align="center"
          justify="center"
          p="phi4"
          zIndex={4}
        >
          <VStack gap="phi3" maxW="22rem" textAlign="center">
            <Box
              w="14"
              h="14"
              borderRadius="2xl"
              display="flex"
              alignItems="center"
              justifyContent="center"
              bg="attr.muted"
              borderWidth="1px"
              borderColor="attr.solid"
              color="attr.fg"
              mx="auto"
            >
              <Joystick size={28} />
            </Box>
            <Text
              fontFamily="heading"
              fontWeight="extrabold"
              color="white"
              fontSize="lg"
              letterSpacing="0.03em"
            >
              Insert to rank — or practice free
            </Text>
            <Text fontSize="sm" color="white" lineHeight="1.55" opacity={0.92}>
              {isTesting
                ? "Playtest mode: insert real coins so scores register on the leaderboard. Upvote if it works cleanly."
                : "Full-screen play with SCORE and TIME overlaid top-left. Only paid runs hit the board and prize escrow."}
            </Text>
            <HStack gap="2" flexWrap="wrap" justify="center">
              <GhButton
                variant="attr"
                size="lg"
                leftIcon={<Coins size={16} />}
                onClick={() => void beginRun(true)}
              >
                Insert {feeLabel}
              </GhButton>
              <GhButton
                variant="soft"
                size="lg"
                leftIcon={<Gamepad2 size={16} />}
                onClick={() => void beginRun(false)}
              >
                Free play
              </GhButton>
            </HStack>
          </VStack>
        </Flex>
      ) : null}
      {phase === "ended" ? (
        <Flex
          position="absolute"
          inset="0"
          bg="blackAlpha.800"
          align="center"
          justify="center"
          p="phi4"
          zIndex={4}
        >
          <VStack gap="phi3" maxW="18rem" textAlign="center">
            <Crown size={32} color="var(--gh-colors-prize-fg)" />
            <Text
              fontFamily="heading"
              fontWeight="extrabold"
              fontSize="lg"
              color="white"
            >
              Run complete
            </Text>
            <Text fontSize="2xl" fontFamily="heading" color="#a3ff3d">
              {liveScore.toLocaleString()}
            </Text>
            <Text fontSize="xs" color="whiteAlpha.800">
              {session?.paid
                ? "Official score submitted"
                : "Free run — not on board"}
            </Text>
            <HStack gap="2" flexWrap="wrap" justify="center">
              <GhButton variant="attr" onClick={() => beginRun(true)}>
                Insert again
              </GhButton>
              <GhButton variant="ghost" onClick={() => beginRun(false)}>
                Practice
              </GhButton>
              {expanded ? (
                <GhButton
                  variant="soft"
                  onClick={() => setExpanded(false)}
                  leftIcon={<Minimize2 size={14} />}
                >
                  Exit full screen
                </GhButton>
              ) : null}
            </HStack>
          </VStack>
        </Flex>
      ) : null}

      {playing ? (
        <Box
          position="absolute"
          bottom={{ base: "max(12px, env(safe-area-inset-bottom))", md: "14px" }}
          left="50%"
          transform="translateX(-50%)"
          zIndex={6}
        >
          <GhButton
            size="sm"
            variant="danger"
            onClick={() => finalize("manual")}
          >
            End run
          </GhButton>
        </Box>
      ) : null}
      </Box>
    </Box>
  );

  return (
    <VStack align="stretch" gap="0" className="gh-stack-phi-lg" pb="phi5">
      <ModeHeader
        mode="arcade"
        icon={Joystick}
        title={game.title}
        description={game.description}
        badge={
          isTesting
            ? `Testing · ${upvoteCount}/${ARCADE_LIVE_UPVOTE_THRESHOLD} upvotes · insert ${feeLabel}`
            : `Live · ${Math.round(game.playTimeSec / 60)} min · insert ${feeLabel}`
        }
        action={
          <HStack gap="2" flexWrap="wrap">
            <Link href="/arcade" style={{ textDecoration: "none" }}>
              <GhButton
                variant="outline"
                size="sm"
                leftIcon={<ArrowLeft size={14} />}
              >
                All cabinets
              </GhButton>
            </Link>
            <GhButton
              size="sm"
              variant="attr"
              leftIcon={<Maximize2 size={14} />}
              onClick={() => setExpanded(true)}
            >
              Full screen
            </GhButton>
          </HStack>
        }
      />

      {/* Status strip — glass + icon tile language from visitor home */}
      {isTesting ? (
        <GhSurface variant="glass" p="phi3" mb="phi3" borderColor="prize.solid">
          <Flex
            justify="space-between"
            align={{ base: "stretch", md: "center" }}
            gap="phi3"
            flexWrap="wrap"
            direction={{ base: "column", md: "row" }}
          >
            <HStack gap="phi2" align="flex-start" flex="1" minW="12rem">
              <Box
                w="9"
                h="9"
                borderRadius="xl"
                bg="prize.muted"
                color="prize.fg"
                display="flex"
                alignItems="center"
                justifyContent="center"
                flexShrink={0}
                borderWidth="1px"
                borderColor="prize.solid"
              >
                <FlaskConical size={16} strokeWidth={2} />
              </Box>
              <Box minW="0">
                <Text
                  fontFamily="heading"
                  fontSize="2xs"
                  fontWeight="bold"
                  letterSpacing="0.16em"
                  textTransform="uppercase"
                  color="prize.fg"
                  mb="1"
                >
                  Community testing
                </Text>
                <Text
                  fontFamily="heading"
                  fontWeight="extrabold"
                  fontSize="sm"
                  letterSpacing="0.02em"
                  mb="1"
                >
                  Insert real coins · upvote to go live
                </Text>
                <Text fontSize="xs" color="fg.muted" lineHeight="1.55">
                  Ranked scores hit the leaderboard. Upvote if it works and has
                  no bugs.{" "}
                  <Text as="span" color="prize.fg" fontWeight="bold">
                    {ARCADE_LIVE_UPVOTE_THRESHOLD} upvotes
                  </Text>{" "}
                  make this live for everyone; tester scores stay. Creator can
                  edit CSS / game code until go-live.
                </Text>
              </Box>
            </HStack>
            <HStack gap="2" flexWrap="wrap">
              <GhBadge tone="prize" pulse>
                {upvoteCount}/{ARCADE_LIVE_UPVOTE_THRESHOLD} upvotes
              </GhBadge>
              <GhButton
                size="sm"
                variant="prize"
                leftIcon={<ThumbsUp size={14} />}
                onClick={() => void onUpvote()}
                disabled={upvoteBusy || alreadyUpvoted || phase === "playing"}
              >
                {alreadyUpvoted
                  ? "Upvoted"
                  : upvoteBusy
                    ? "…"
                    : "Upvote to go live"}
              </GhButton>
              {isCreator ? (
                <GhButton
                  size="sm"
                  variant="soft"
                  leftIcon={<Pencil size={14} />}
                  onClick={() => {
                    setEditCss(game.css || "");
                    setEditCode(game.gameCode || "");
                    setEditOpen((o) => !o);
                  }}
                  disabled={phase === "playing"}
                >
                  {editOpen ? "Hide editor" : "Edit CSS / code"}
                </GhButton>
              ) : null}
            </HStack>
          </Flex>
        </GhSurface>
      ) : (
        <GhSurface variant="glass" p="phi3" mb="phi3">
          <Flex
            justify="space-between"
            align={{ base: "stretch", sm: "center" }}
            gap="phi2"
            flexWrap="wrap"
          >
            <HStack gap="phi2" align="flex-start">
              <Box
                w="9"
                h="9"
                borderRadius="xl"
                bg="live.muted"
                color="live.fg"
                display="flex"
                alignItems="center"
                justifyContent="center"
                flexShrink={0}
                borderWidth="1px"
                borderColor="live.solid"
              >
                <Joystick size={16} strokeWidth={2} />
              </Box>
              <Box>
                <Text
                  fontFamily="heading"
                  fontSize="2xs"
                  fontWeight="bold"
                  letterSpacing="0.16em"
                  textTransform="uppercase"
                  color="live.fg"
                  mb="1"
                >
                  Live cabinet
                </Text>
                <Text fontSize="xs" color="fg.muted" lineHeight="1.5">
                  Community-approved · leaderboard includes testing-era scores
                </Text>
              </Box>
            </HStack>
            {upvoteCount > 0 ? (
              <GhBadge tone="muted">
                {upvoteCount} upvotes at go-live
              </GhBadge>
            ) : (
              <GhBadge tone="live">Live</GhBadge>
            )}
          </Flex>
        </GhSurface>
      )}

      {isTesting && isCreator && editOpen ? (
        <GhSurface
          variant="glass"
          p="phi4"
          mb="phi4"
          borderColor="attr.solid"
        >
          <Flex
            justify="space-between"
            align={{ base: "stretch", sm: "center" }}
            mb="phi3"
            gap="phi2"
            flexWrap="wrap"
          >
            <HStack gap="phi2" align="flex-start">
              <Box
                w="9"
                h="9"
                borderRadius="xl"
                bg="attr.muted"
                color="attr.fg"
                display="flex"
                alignItems="center"
                justifyContent="center"
                flexShrink={0}
                borderWidth="1px"
                borderColor="attr.solid"
              >
                <Pencil size={16} strokeWidth={2} />
              </Box>
              <Box>
                <Text
                  fontFamily="heading"
                  fontSize="2xs"
                  fontWeight="bold"
                  letterSpacing="0.16em"
                  textTransform="uppercase"
                  color="attr.fg"
                  mb="1"
                >
                  Creator tools
                </Text>
                <Text
                  fontFamily="heading"
                  fontWeight="extrabold"
                  fontSize="sm"
                  letterSpacing="0.02em"
                >
                  Edit CSS / code (testing only)
                </Text>
                <Text fontSize="xs" color="fg.muted" mt="1">
                  Update while testers play. Locked after go-live.
                </Text>
              </Box>
            </HStack>
            <GhButton
              size="sm"
              variant="attr"
              leftIcon={<Pencil size={14} />}
              onClick={() => void onSaveCreatorEdit()}
              disabled={editBusy || phase === "playing"}
            >
              {editBusy ? "Saving…" : "Save & reload host"}
            </GhButton>
          </Flex>
          <VStack align="stretch" gap="phi3">
            <Box>
              <Text
                fontSize="2xs"
                fontWeight="bold"
                mb="1"
                color="fg.subtle"
                letterSpacing="0.1em"
                textTransform="uppercase"
              >
                CSS
              </Text>
              <GhTextarea
                value={editCss}
                onChange={(e) => setEditCss(e.target.value)}
                rows={6}
                fontFamily="mono"
                fontSize="xs"
                placeholder="#gh-arcade-root { … }"
              />
            </Box>
            <Box>
              <Text
                fontSize="2xs"
                fontWeight="bold"
                mb="1"
                color="fg.subtle"
                letterSpacing="0.1em"
                textTransform="uppercase"
              >
                gameCode
              </Text>
              <GhTextarea
                value={editCode}
                onChange={(e) => setEditCode(e.target.value)}
                rows={10}
                fontFamily="mono"
                fontSize="xs"
                placeholder="window.GamerholicArcadeGame = { boot(Phaser, bridge, parentEl) { … } }"
              />
            </Box>
          </VStack>
        </GhSurface>
      ) : null}

      {/* Wallet strip — dashboard style */}
      <GhSurface variant="glass" p="phi3" mb="phi4">
        <Flex
          justify="space-between"
          align={{ base: "stretch", sm: "center" }}
          gap="phi3"
          direction={{ base: "column", sm: "row" }}
          flexWrap="wrap"
        >
          <HStack gap="2" flexWrap="wrap">
            <Box
              w="9"
              h="9"
              borderRadius="lg"
              display="flex"
              alignItems="center"
              justifyContent="center"
              bg="brand.muted"
              color="brand.fg"
              borderWidth="1px"
              borderColor="border.brand"
            >
              <Wallet size={16} />
            </Box>
            <Box>
              <Text
                fontSize="2xs"
                fontWeight="bold"
                letterSpacing="0.1em"
                textTransform="uppercase"
                color="fg.subtle"
              >
                Play subaccount
              </Text>
              <HStack gap="2" mt="0.5">
                <GhBadge tone="brand">{balances.icp.toFixed(4)} ICP</GhBadge>
                <GhBadge tone="attr">{balances.gamer} GAMER</GhBadge>
              </HStack>
            </Box>
          </HStack>
          <HStack gap="2" flexWrap="wrap">
            <GhBadge tone="attr">Phaser 3</GhBadge>
            {isTesting ? (
              <GhBadge tone="prize" pulse>
                Testing
              </GhBadge>
            ) : (
              <GhBadge tone="live">Live</GhBadge>
            )}
            <GhBadge tone="live">
              {Math.round(game.playTimeSec / 60)} min runs
            </GhBadge>
            <GhBadge tone="prize">Top {game.payoutTopN} payout</GhBadge>
            {session?.source === "supabase" ? (
              <GhBadge tone="live">Server clock</GhBadge>
            ) : null}
          </HStack>
        </Flex>
      </GhSurface>

      <Grid
        templateColumns={{ base: "1fr", lg: "minmax(0,1.45fr) minmax(17rem,0.95fr)" }}
        gap="phi4"
        alignItems="start"
      >
        {/* Cabinet */}
        <VStack align="stretch" gap="phi4">
          {/* Cabinet: session header + game only (cover/details live under About) */}
          <GhSurface
            variant="elevated"
            p="0"
            overflow="hidden"
            borderColor="border.brand"
            boxShadow="glow"
          >
            {phase === "idle" ? (
              <Flex
                px={{ base: "phi3", md: "phi4" }}
                py="phi3"
                borderBottomWidth="1px"
                borderColor="border.default"
                justify="space-between"
                align="center"
                gap="phi3"
                flexWrap="wrap"
                bg="bg.glass"
              >
                <HStack gap="phi3" flexWrap="wrap">
                  <Box>
                    <Text
                      fontSize="2xs"
                      fontWeight="bold"
                      letterSpacing="0.1em"
                      textTransform="uppercase"
                      color="fg.subtle"
                    >
                      Session
                    </Text>
                    <Text fontFamily="heading" fontWeight="bold" fontSize="sm">
                      {Math.round(game.playTimeSec / 60)} min · server clock
                    </Text>
                  </Box>
                  <Box>
                    <Text
                      fontSize="2xs"
                      fontWeight="bold"
                      letterSpacing="0.1em"
                      textTransform="uppercase"
                      color="fg.subtle"
                    >
                      Insert
                    </Text>
                    <Text
                      fontFamily="heading"
                      fontWeight="extrabold"
                      fontSize="sm"
                      color="prize.fg"
                    >
                      {feeLabel}
                    </Text>
                  </Box>
                  <HStack gap="2" flexWrap="wrap" alignSelf="flex-end" pb="0.5">
                    {session?.paid ? (
                      <GhBadge tone="prize" pulse>
                        Ranked
                      </GhBadge>
                    ) : (
                      <GhBadge tone="muted">Ready</GhBadge>
                    )}
                    {isTesting ? (
                      <GhBadge tone="prize" pulse>
                        Testing
                      </GhBadge>
                    ) : (
                      <GhBadge tone="live">Live</GhBadge>
                    )}
                  </HStack>
                </HStack>
                <Text fontSize="xs" color="fg.muted" maxW="16rem" lineHeight="1.45">
                  {isTesting
                    ? "Playtest with real inserts so scores hit the board, then upvote if clean."
                    : "Free practice anytime. Ranked scores need insert — then claim prizes from escrow."}
                </Text>
              </Flex>
            ) : null}

            <Box>{gameStage}</Box>
          </GhSurface>

          {/* About — cover, overview, rules (moved out of cabinet card) */}
          <SectionDivider label="About this cabinet" tone="attr" my="0" />

          <VStack align="stretch" gap="phi3" mt="phi3">
            <GhSurface variant="elevated" p="0" overflow="hidden">
              <Box
                position="relative"
                h={{ base: "9rem", md: "11rem" }}
                overflow="hidden"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={resolveArcadeCoverUrl(game.imageUrl)}
                  alt={game.title}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    filter: "brightness(0.45) saturate(1.15)",
                  }}
                />
                <Box
                  position="absolute"
                  inset="0"
                  bg="linear-gradient(180deg, rgba(7,6,18,0.15) 0%, rgba(7,6,18,0.92) 100%)"
                />
                <Box
                  position="absolute"
                  inset="0"
                  p={{ base: "phi3", md: "phi4" }}
                  display="flex"
                  flexDirection="column"
                  justifyContent="flex-end"
                >
                  <HStack gap="2" mb="2" flexWrap="wrap">
                    <GhBadge tone="attr">HTML5 cabinet</GhBadge>
                    {isTesting ? (
                      <GhBadge tone="prize" pulse>
                        Testing · {upvoteCount}/{ARCADE_LIVE_UPVOTE_THRESHOLD}
                      </GhBadge>
                    ) : (
                      <GhBadge tone="live">Live</GhBadge>
                    )}
                  </HStack>
                  <Heading
                    fontFamily="heading"
                    fontSize={{ base: "xl", md: "2xl" }}
                    fontWeight="extrabold"
                    color="white"
                    letterSpacing="0.03em"
                    textShadow="0 2px 16px rgba(0,0,0,0.65)"
                  >
                    {game.title}
                  </Heading>
                </Box>
              </Box>
            </GhSurface>

            <GhSurface variant="elevated" p="phi4">
              <HStack gap="2" mb="phi2">
                <Box
                  w="8"
                  h="8"
                  borderRadius="lg"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  bg="attr.muted"
                  color="attr.fg"
                >
                  <Sparkles size={16} />
                </Box>
                <Text
                  fontFamily="heading"
                  fontWeight="extrabold"
                  fontSize="sm"
                  letterSpacing="0.04em"
                >
                  Overview
                </Text>
              </HStack>
              <Text
                fontSize="md"
                color="fg.default"
                lineHeight="1.65"
                fontWeight="medium"
              >
                {game.description}
              </Text>
            </GhSurface>

            <GhSurface variant="elevated" p="phi4">
              <HStack gap="2" mb="phi2">
                <Box
                  w="8"
                  h="8"
                  borderRadius="lg"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  bg="live.muted"
                  color="live.fg"
                >
                  <BookOpen size={16} />
                </Box>
                <Text
                  fontFamily="heading"
                  fontWeight="extrabold"
                  fontSize="sm"
                  letterSpacing="0.04em"
                >
                  How to play
                </Text>
              </HStack>
              <Text
                fontSize="sm"
                color="fg.default"
                lineHeight="1.65"
                whiteSpace="pre-wrap"
              >
                {game.rules}
              </Text>
            </GhSurface>
          </VStack>

          <GhSurface
            variant="prize"
            p="phi4"
            mt="0"
            color="white"
          >
            <HStack gap="2" mb="phi2">
              <Shield size={18} color="#fff" />
              <Text
                fontFamily="heading"
                fontWeight="extrabold"
                fontSize="sm"
                color="white"
                letterSpacing="0.04em"
              >
                Prize rules
              </Text>
              <GhBadge tone="prize">Top {game.payoutTopN}</GhBadge>
            </HStack>
            <Text fontSize="sm" color="white" lineHeight="1.65" opacity={0.95}>
              {describePayoutRules(game.payoutTopN)}
            </Text>
            <Text fontSize="xs" color="white" mt="phi2" opacity={0.85} lineHeight="1.5">
              Timer:{" "}
              {isSupabaseConfigured()
                ? "Supabase server time"
                : "local fallback"}{" "}
              · ranked settle on-chain after the run · confirm back to Supabase
            </Text>
            {chainStatus ? (
              <Text fontSize="xs" color="white" mt="2" fontWeight="bold">
                Status: {chainStatus}
              </Text>
            ) : null}
            {lastSettlementNote ? (
              <Text fontSize="xs" color="white" mt="1" opacity={0.9}>
                Last run: {lastSettlementNote}
              </Text>
            ) : null}
            {canRetryChain && session?.sessionId ? (
              <Box mt="phi3">
                <Text fontSize="xs" color="white" mb="2" opacity={0.9}>
                  Score is already stored. Retry only re-sends that final score
                  to the canister — no new fee.
                </Text>
                <GhButton
                  size="sm"
                  variant="soft"
                  onClick={() => void onRetryChain()}
                  disabled={retryBusy}
                >
                  {retryBusy ? "Retrying…" : "Retry canister settle"}
                </GhButton>
              </Box>
            ) : null}
          </GhSurface>
        </VStack>

        {/* Side: leaderboard + assets */}
        <VStack
          align="stretch"
          gap="phi3"
          position={{ lg: "sticky" }}
          top={{ lg: "5rem" }}
          display={{ base: playing ? "none" : "flex", lg: "flex" }}
        >
          <GhSurface variant="elevated" p="phi3">
            <HStack gap="2" mb="phi3" flexWrap="wrap">
              <Trophy size={16} color="var(--gh-colors-prize-fg)" />
              <Text fontFamily="heading" fontWeight="extrabold" fontSize="sm">
                Leaderboard
              </Text>
              <GhBadge tone="muted">score + earnings</GhBadge>
            </HStack>
            {board.length === 0 ? (
              <Text fontSize="xs" color="fg.muted">
                No ranked scores yet. Insert {feeLabel} and set the board.
              </Text>
            ) : (
              <VStack align="stretch" gap="1.5">
                <Flex
                  px="2"
                  justify="space-between"
                  fontSize="2xs"
                  color="fg.subtle"
                  fontWeight="bold"
                  letterSpacing="0.06em"
                  textTransform="uppercase"
                >
                  <Text>Player</Text>
                  <HStack gap="4">
                    <Text w="4.5rem" textAlign="right">
                      Score
                    </Text>
                    <Text w="5.5rem" textAlign="right">
                      Earned
                    </Text>
                  </HStack>
                </Flex>
                {board.map((s) => (
                  <Flex
                    key={`${s.principal}-${s.rank}`}
                    justify="space-between"
                    align="center"
                    px="2"
                    py="1.5"
                    borderRadius="lg"
                    bg={s.rank === 1 ? "attr.muted" : "blackAlpha.300"}
                    borderWidth="1px"
                    borderColor={s.rank === 1 ? "attr.solid" : "transparent"}
                    gap="2"
                  >
                    <HStack gap="2" minW="0" flex="1">
                      <Text
                        fontFamily="mono"
                        fontSize="xs"
                        color="fg.subtle"
                        w="4"
                        flexShrink={0}
                      >
                        {s.rank}
                      </Text>
                      <Box minW="0">
                        <Text fontSize="sm" fontWeight="bold" lineClamp={1}>
                          {s.username}
                        </Text>
                        {(s.pendingIcp > 0 || s.pendingGamer > 0) && (
                          <Text fontSize="2xs" color="prize.fg">
                            claimable
                          </Text>
                        )}
                      </Box>
                    </HStack>
                    <HStack gap="3" flexShrink={0} align="flex-end">
                      <Text
                        fontFamily="heading"
                        fontWeight="extrabold"
                        color="brand.fg"
                        fontSize="sm"
                        w="4.5rem"
                        textAlign="right"
                      >
                        {s.bestScore.toLocaleString()}
                      </Text>
                      <Box w="5.5rem" textAlign="right">
                        <Text
                          fontFamily="heading"
                          fontWeight="bold"
                          fontSize="xs"
                          color="prize.fg"
                          lineClamp={2}
                        >
                          {formatEarningsShort(s)}
                        </Text>
                      </Box>
                    </HStack>
                  </Flex>
                ))}
              </VStack>
            )}
            {game.highScore > 0 ? (
              <Text fontSize="2xs" color="fg.subtle" mt="phi2">
                Cabinet high · {game.highScore.toLocaleString()}
                {game.highScoreBy ? ` · ${game.highScoreBy}` : ""}
              </Text>
            ) : null}
            <Text fontSize="2xs" color="fg.muted" mt="1">
              Payout top {game.payoutTopN} · creator 3% · platform 1.5% ·
              earnings = lifetime on this cabinet
            </Text>
            <Text fontSize="2xs" color="fg.subtle" mt="1" fontFamily="mono">
              Escrow · {game.escrowId}
            </Text>
            {escrow && (escrow.icp > 0 || escrow.gamer > 0) ? (
              <Text fontSize="2xs" color="prize.fg" mt="1">
                Escrow balance ·{" "}
                {escrow.icp > 0 ? `${escrow.icp} ICP` : ""}
                {escrow.icp > 0 && escrow.gamer > 0 ? " · " : ""}
                {escrow.gamer > 0 ? `${escrow.gamer} GAMER` : ""}
              </Text>
            ) : null}
          </GhSurface>

          <GhSurface variant="elevated" p="phi3">
            <HStack gap="2" mb="phi2" justify="space-between" flexWrap="wrap">
              <HStack gap="2">
                <Coins size={16} color="var(--gh-colors-brand-fg)" />
                <Text fontFamily="heading" fontWeight="extrabold" fontSize="sm">
                  Your earnings (this game)
                </Text>
              </HStack>
              <GhBadge tone="muted">claim required</GhBadge>
            </HStack>
            <Text fontSize="xs" color="fg.muted" lineHeight="1.5" mb="phi2">
              Prize wins and creator fees stay in this cabinet&apos;s escrow until
              you claim them to your play subaccount. New high-score refunds return
              immediately.
            </Text>
            {myEarnings &&
            (myEarnings.pendingIcp > 0 ||
              myEarnings.pendingGamer > 0 ||
              myEarnings.lifetimeIcp > 0 ||
              myEarnings.lifetimeGamer > 0) ? (
              <VStack align="stretch" gap="1" mb="phi2">
                <Text fontSize="sm" fontWeight="bold" color="brand.fg">
                  Pending ·{" "}
                  {myEarnings.pendingIcp > 0
                    ? `${myEarnings.pendingIcp} ICP`
                    : ""}
                  {myEarnings.pendingIcp > 0 && myEarnings.pendingGamer > 0
                    ? " · "
                    : ""}
                  {myEarnings.pendingGamer > 0
                    ? `${myEarnings.pendingGamer} GAMER`
                    : ""}
                  {myEarnings.pendingIcp <= 0 && myEarnings.pendingGamer <= 0
                    ? "0"
                    : ""}
                </Text>
                <Text fontSize="2xs" color="fg.subtle">
                  Lifetime · {myEarnings.lifetimeIcp} ICP ·{" "}
                  {myEarnings.lifetimeGamer} GAMER · claimed{" "}
                  {myEarnings.claimedIcp} ICP / {myEarnings.claimedGamer} GAMER
                </Text>
              </VStack>
            ) : (
              <Text fontSize="xs" color="fg.muted" mb="phi2">
                No pending earnings on this cabinet yet.
              </Text>
            )}
            <GhButton
              size="sm"
              variant="primary"
              onClick={onClaim}
              disabled={
                claimBusy ||
                !myEarnings ||
                (myEarnings.pendingIcp <= 0 && myEarnings.pendingGamer <= 0)
              }
            >
              {claimBusy ? "Claiming…" : "Claim to play subaccount"}
            </GhButton>
            {ledger.length > 0 ? (
              <VStack align="stretch" gap="1" mt="phi3">
                <Text
                  fontSize="2xs"
                  fontWeight="bold"
                  color="fg.subtle"
                  letterSpacing="0.08em"
                  textTransform="uppercase"
                >
                  Your ledger
                </Text>
                {ledger.slice(0, 5).map((e) => (
                  <Text key={e.id} fontSize="2xs" color="fg.muted">
                    {e.kind.replace(/_/g, " ")} · +{e.amount} {e.token} ·{" "}
                    {e.note}
                  </Text>
                ))}
              </VStack>
            ) : null}
          </GhSurface>

          {payouts.length > 0 ? (
            <GhSurface variant="elevated" p="phi3">
              <HStack gap="2" mb="phi2">
                <Coins size={16} color="var(--gh-colors-prize-fg)" />
                <Text fontFamily="heading" fontWeight="extrabold" fontSize="sm">
                  Recent settlements
                </Text>
              </HStack>
              <VStack align="stretch" gap="2">
                {payouts.slice(0, 6).map((p) => (
                  <Box
                    key={p.id}
                    p="2"
                    borderRadius="lg"
                    bg="blackAlpha.300"
                    borderWidth="1px"
                    borderColor="border.default"
                  >
                    <Text fontSize="xs" fontWeight="bold">
                      {p.playerUsername} · {p.score.toLocaleString()} pts
                    </Text>
                    <Text fontSize="2xs" color="fg.muted" lineHeight="1.45">
                      {p.kind === "new_high_score_refund"
                        ? `Refund ${p.refundAmount} ${p.token}`
                        : p.kind === "distributed"
                          ? p.lines
                              .map(
                                (l) =>
                                  `#${l.rank} ${l.username} +${l.amount} ${p.token}`,
                              )
                              .join(" · ")
                          : p.note}
                    </Text>
                  </Box>
                ))}
              </VStack>
            </GhSurface>
          ) : null}

          <GhSurface variant="elevated" p="phi3">
            <HStack gap="2" mb="phi2" flexWrap="wrap">
              <Hammer size={16} color="var(--gh-colors-attr-fg)" />
              <Text fontFamily="heading" fontWeight="extrabold" fontSize="sm">
                Game assets
              </Text>
              {game.linkedLabelId > 0 ? (
                <GhBadge tone="attr">Label #{game.linkedLabelId}</GhBadge>
              ) : (
                <GhBadge tone="muted">No label · equip off</GhBadge>
              )}
            </HStack>
            <Text fontSize="xs" color="fg.muted" lineHeight="1.5" mb="phi2">
              {game.linkedLabelId > 0
                ? "Host loads Dexsta getUserGameAssetXfts, keeps assets linked to this Lead Label, injects via bridge init/assets."
                : "No Lead Label on this cabinet — game-asset equip is skipped."}
            </Text>
            {game.acceptedGameAssets.length > 0 ? (
              <VStack align="stretch" gap="2" mb="phi2">
                <Text
                  fontSize="2xs"
                  fontWeight="bold"
                  color="fg.subtle"
                  letterSpacing="0.08em"
                  textTransform="uppercase"
                >
                  Design hints
                </Text>
                {game.acceptedGameAssets.map((a) => (
                  <Box
                    key={a.tokenId}
                    p="2"
                    borderRadius="lg"
                    borderWidth="1px"
                    borderColor="border.default"
                    bg="blackAlpha.300"
                  >
                    <HStack justify="space-between">
                      <Text fontSize="sm" fontWeight="bold">
                        #{a.tokenId} {a.label}
                      </Text>
                      <GhBadge tone="attr">{a.role}</GhBadge>
                    </HStack>
                    {a.notes ? (
                      <Text fontSize="2xs" color="fg.muted" mt="1">
                        {a.notes}
                      </Text>
                    ) : null}
                  </Box>
                ))}
              </VStack>
            ) : null}
            {equips.length > 0 ? (
              <Box>
                <Text
                  fontSize="2xs"
                  fontWeight="bold"
                  color="fg.subtle"
                  mb="1"
                  letterSpacing="0.08em"
                  textTransform="uppercase"
                >
                  Injected to game (this player)
                </Text>
                {equips.map((e) => (
                  <Text key={e.tokenId} fontSize="xs" color="fg.default" mb="1">
                    #{e.tokenId}
                    {e.wrapsTokenId ? ` wraps #${e.wrapsTokenId}` : ""} ·{" "}
                    {e.label} · PWR {Math.round(e.effectivePower)}
                    {e.bagPowerTokens
                      ? ` (bag +${e.bagPowerTokens})`
                      : ""}
                  </Text>
                ))}
              </Box>
            ) : game.linkedLabelId > 0 ? (
              <Text fontSize="xs" color="fg.muted">
                No linked game assets for this player yet (or demo principal).
              </Text>
            ) : null}
          </GhSurface>

        </VStack>
      </Grid>
    </VStack>
  );
}
