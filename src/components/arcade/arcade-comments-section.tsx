"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Box,
  Flex,
  HStack,
  Text,
  VStack,
} from "@chakra-ui/react";
import {
  Bug,
  CheckCircle2,
  CircleDashed,
  MessageSquare,
  Star,
} from "lucide-react";
import {
  GhBadge,
  GhButton,
  GhEmptyState,
  GhField,
  GhSurface,
  GhTabs,
  GhTextarea,
  ghToast,
} from "@/components/ui";
import {
  addArcadeComment,
  getArcadeRatingSummary,
  listArcadeComments,
  setArcadeCommentResolved,
  upsertArcadeRating,
} from "@/lib/arcade/feedback";
import type {
  ArcadeComment,
  ArcadeCommentChannel,
  ArcadeCommentKind,
  ArcadeGame,
  ArcadeRatingSummary,
} from "@/lib/arcade/types";
import { shortAddr } from "@/lib/ic/moderator-service";

type Props = {
  game: ArcadeGame;
  principal: string;
  username: string;
  isLoggedIn: boolean;
  onLogin: () => void;
};

function StarsInput({
  value,
  onChange,
  disabled,
  size = 20,
}: {
  value: number;
  onChange: (n: number) => void;
  disabled?: boolean;
  size?: number;
}) {
  const [hover, setHover] = useState(0);
  const shown = hover || value;
  return (
    <HStack gap="0.5" onMouseLeave={() => setHover(0)}>
      {[1, 2, 3, 4, 5].map((n) => {
        const on = n <= shown;
        return (
          <Box
            key={n}
            as="button"
            aria-label={`${n} star${n === 1 ? "" : "s"}`}
            onMouseEnter={() => !disabled && setHover(n)}
            onClick={() => !disabled && onChange(n)}
            cursor={disabled ? "default" : "pointer"}
            color={on ? "prize.fg" : "fg.subtle"}
            p="0.5"
            lineHeight="0"
            opacity={disabled ? 0.7 : 1}
            pointerEvents={disabled ? "none" : "auto"}
          >
            <Star
              size={size}
              fill={on ? "currentColor" : "none"}
              strokeWidth={2}
            />
          </Box>
        );
      })}
    </HStack>
  );
}

function StarsDisplay({ average, count }: { average: number; count: number }) {
  const full = Math.floor(average);
  return (
    <HStack gap="2" flexWrap="wrap">
      <HStack gap="0.5">
        {[1, 2, 3, 4, 5].map((n) => (
          <Star
            key={n}
            size={14}
            color="var(--gh-colors-prize-fg)"
            fill={n <= full ? "var(--gh-colors-prize-fg)" : "none"}
          />
        ))}
      </HStack>
      <Text fontSize="xs" color="fg.muted" fontWeight="bold">
        {count > 0
          ? `${average.toFixed(1)} · ${count} rating${count === 1 ? "" : "s"}`
          : "No ratings yet"}
      </Text>
    </HStack>
  );
}

function CommentCard({
  c,
  isCreator,
  onResolve,
  busyId,
}: {
  c: ArcadeComment;
  isCreator: boolean;
  onResolve: (id: string, resolved: boolean) => void;
  busyId: string | null;
}) {
  return (
    <GhSurface variant="glass" p="phi3">
      <HStack justify="space-between" align="flex-start" gap="2" flexWrap="wrap" mb="2">
        <HStack gap="2" flexWrap="wrap">
          <GhBadge tone={c.kind === "bug" ? "danger" : "brand"}>
            {c.kind === "bug" ? (
              <HStack gap="1">
                <Bug size={12} />
                <Text as="span">Bug</Text>
              </HStack>
            ) : (
              "Feedback"
            )}
          </GhBadge>
          {c.kind === "bug" ? (
            c.resolved ? (
              <GhBadge tone="success">
                <HStack gap="1">
                  <CheckCircle2 size={12} />
                  <Text as="span">Resolved</Text>
                </HStack>
              </GhBadge>
            ) : (
              <GhBadge tone="prize">
                <HStack gap="1">
                  <CircleDashed size={12} />
                  <Text as="span">Unresolved</Text>
                </HStack>
              </GhBadge>
            )
          ) : null}
        </HStack>
        <Text fontSize="2xs" color="fg.subtle">
          {new Date(c.createdAt).toLocaleString()}
        </Text>
      </HStack>
      <Text fontSize="sm" lineHeight="1.55" whiteSpace="pre-wrap">
        {c.body}
      </Text>
      <Text fontSize="2xs" color="fg.subtle" mt="2">
        {c.authorUsername || shortAddr(c.authorPrincipal)}
        {c.resolved && c.resolvedAt
          ? ` · resolved ${new Date(c.resolvedAt).toLocaleDateString()}`
          : ""}
      </Text>
      {isCreator && c.kind === "bug" ? (
        <HStack mt="phi2" gap="2">
          {!c.resolved ? (
            <GhButton
              size="sm"
              variant="prize"
              disabled={busyId === c.id}
              onClick={() => onResolve(c.id, true)}
            >
              {busyId === c.id ? "Saving…" : "Mark resolved"}
            </GhButton>
          ) : (
            <GhButton
              size="sm"
              variant="outline"
              disabled={busyId === c.id}
              onClick={() => onResolve(c.id, false)}
            >
              {busyId === c.id ? "Saving…" : "Reopen"}
            </GhButton>
          )}
        </HStack>
      ) : null}
    </GhSurface>
  );
}

function ChannelPanel({
  channel,
  game,
  principal,
  username,
  isLoggedIn,
  onLogin,
  isCreator,
  allowRating,
  ratingSummary,
  onRated,
}: {
  channel: ArcadeCommentChannel;
  game: ArcadeGame;
  principal: string;
  username: string;
  isLoggedIn: boolean;
  onLogin: () => void;
  isCreator: boolean;
  allowRating: boolean;
  ratingSummary: ArcadeRatingSummary;
  onRated: () => void;
}) {
  const [comments, setComments] = useState<ArcadeComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [body, setBody] = useState("");
  const [kind, setKind] = useState<ArcadeCommentKind>("feedback");
  const [postBusy, setPostBusy] = useState(false);
  const [resolveBusy, setResolveBusy] = useState<string | null>(null);
  const [rateBusy, setRateBusy] = useState(false);
  const [stars, setStars] = useState(ratingSummary.mine || 0);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      setComments(await listArcadeComments(game.id, channel));
    } finally {
      setLoading(false);
    }
  }, [game.id, channel]);

  useEffect(() => {
    void reload();
  }, [reload]);

  useEffect(() => {
    setStars(ratingSummary.mine || 0);
  }, [ratingSummary.mine]);

  const post = async () => {
    if (!isLoggedIn || !principal) {
      onLogin();
      return;
    }
    setPostBusy(true);
    try {
      const r = await addArcadeComment({
        gameId: game.id,
        channel,
        kind,
        body,
        principal,
        username,
      });
      if (!r.ok) {
        ghToast({ title: "Could not post", description: r.error, type: "error" });
        return;
      }
      setBody("");
      ghToast({
        title: kind === "bug" ? "Bug filed" : "Feedback posted",
        type: "success",
      });
      await reload();
    } finally {
      setPostBusy(false);
    }
  };

  const onResolve = async (id: string, resolved: boolean) => {
    setResolveBusy(id);
    try {
      const r = await setArcadeCommentResolved({
        commentId: id,
        creatorPrincipal: principal,
        resolved,
      });
      if (!r.ok) {
        ghToast({
          title: "Update failed",
          description: r.error,
          type: "error",
        });
        return;
      }
      ghToast({
        title: resolved ? "Bug marked resolved" : "Bug reopened",
        type: "success",
      });
      await reload();
    } finally {
      setResolveBusy(null);
    }
  };

  const saveRating = async (n: number) => {
    if (!isLoggedIn || !principal) {
      onLogin();
      return;
    }
    setStars(n);
    setRateBusy(true);
    try {
      const r = await upsertArcadeRating({
        gameId: game.id,
        principal,
        username,
        stars: n,
      });
      if (!r.ok) {
        ghToast({ title: "Rating failed", description: r.error, type: "error" });
        return;
      }
      ghToast({ title: `Rated ${n}★`, type: "success" });
      onRated();
    } finally {
      setRateBusy(false);
    }
  };

  const bugsOpen = comments.filter((c) => c.kind === "bug" && !c.resolved).length;

  return (
    <VStack align="stretch" gap="phi3" pt="phi3">
      {allowRating ? (
        <GhSurface variant="elevated" p="phi3" borderColor="prize.solid">
          <HStack justify="space-between" flexWrap="wrap" gap="2" mb="2">
            <Text fontFamily="heading" fontWeight="extrabold" fontSize="sm">
              Playtest rating
            </Text>
            <StarsDisplay
              average={ratingSummary.average}
              count={ratingSummary.count}
            />
          </HStack>
          <Text fontSize="xs" color="fg.muted" mb="phi2">
            Rate this cabinet during testing (1–5 stars). Helps the creator
            polish before go-live.
          </Text>
          <HStack gap="phi3" flexWrap="wrap" align="center">
            <StarsInput
              value={stars}
              onChange={(n) => void saveRating(n)}
              disabled={rateBusy || !isLoggedIn}
            />
            {!isLoggedIn ? (
              <GhButton size="sm" variant="outline" onClick={onLogin}>
                Sign in to rate
              </GhButton>
            ) : stars > 0 ? (
              <Text fontSize="2xs" color="fg.subtle">
                Your rating: {stars}★
              </Text>
            ) : null}
          </HStack>
        </GhSurface>
      ) : ratingSummary.count > 0 ? (
        <Box>
          <Text fontSize="xs" color="fg.muted" mb="1">
            Testing-phase rating (locked after go-live)
          </Text>
          <StarsDisplay
            average={ratingSummary.average}
            count={ratingSummary.count}
          />
        </Box>
      ) : null}

      <GhSurface variant="elevated" p="phi3">
        <HStack gap="2" mb="phi2" flexWrap="wrap">
          <MessageSquare size={16} />
          <Text fontFamily="heading" fontWeight="extrabold" fontSize="sm">
            {channel === "testing" ? "Testing notes" : "Live notes"}
          </Text>
          {bugsOpen > 0 ? (
            <GhBadge tone="danger">{bugsOpen} open bug{bugsOpen === 1 ? "" : "s"}</GhBadge>
          ) : null}
        </HStack>
        <Text fontSize="xs" color="fg.muted" mb="phi3" lineHeight="1.5">
          {channel === "testing"
            ? "Report bugs and share feedback while this cabinet is in community testing."
            : "Notes about the live cabinet. Bugs stay trackable; the creator can mark them resolved."}
        </Text>

        <VStack align="stretch" gap="phi2" mb="phi3">
          <GhField label="Type">
            <HStack gap="2" flexWrap="wrap">
              <GhButton
                size="sm"
                variant={kind === "feedback" ? "prize" : "outline"}
                onClick={() => setKind("feedback")}
              >
                Feedback
              </GhButton>
              <GhButton
                size="sm"
                variant={kind === "bug" ? "prize" : "outline"}
                onClick={() => setKind("bug")}
              >
                Bug
              </GhButton>
            </HStack>
          </GhField>
          <GhField
            label={kind === "bug" ? "Bug report" : "Feedback"}
            helperText={
              kind === "bug"
                ? "Describe steps to reproduce · starts as unresolved"
                : "General notes, ideas, or praise"
            }
          >
            <GhTextarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={3}
              placeholder={
                kind === "bug"
                  ? "What broke? What did you expect?"
                  : "What should improve?"
              }
              disabled={!isLoggedIn}
            />
          </GhField>
          {isLoggedIn ? (
            <GhButton
              size="sm"
              variant="prize"
              onClick={() => void post()}
              disabled={postBusy || body.trim().length < 2}
              alignSelf="flex-start"
            >
              {postBusy ? "Posting…" : kind === "bug" ? "File bug" : "Post feedback"}
            </GhButton>
          ) : (
            <GhButton size="sm" variant="outline" onClick={onLogin} alignSelf="flex-start">
              Sign in to comment
            </GhButton>
          )}
        </VStack>

        {loading ? (
          <Text fontSize="xs" color="fg.muted">
            Loading comments…
          </Text>
        ) : comments.length === 0 ? (
          <GhEmptyState
            icon={MessageSquare}
            title="No comments yet"
            description={
              channel === "testing"
                ? "Be the first tester to leave a note or bug report."
                : "No live-channel notes yet."
            }
          />
        ) : (
          <VStack align="stretch" gap="2" maxH="28rem" overflowY="auto">
            {comments.map((c) => (
              <CommentCard
                key={c.id}
                c={c}
                isCreator={isCreator}
                onResolve={(id, resolved) => void onResolve(id, resolved)}
                busyId={resolveBusy}
              />
            ))}
          </VStack>
        )}
      </GhSurface>
    </VStack>
  );
}

/**
 * After prize rules: Live / Testing tabbed comments.
 * Default tab follows cabinet status (testing first when testing, live when live).
 */
export function ArcadeCommentsSection({
  game,
  principal,
  username,
  isLoggedIn,
  onLogin,
}: Props) {
  const isTesting = game.status === "testing";
  const defaultTab: ArcadeCommentChannel = isTesting ? "testing" : "live";
  const [tab, setTab] = useState<ArcadeCommentChannel>(defaultTab);
  const [ratingSummary, setRatingSummary] = useState<ArcadeRatingSummary>({
    average: 0,
    count: 0,
    mine: 0,
  });

  const isCreator = useMemo(() => {
    const p = (principal || "").trim();
    const c = (game.creatorPrincipal || "").trim();
    return Boolean(p && c && p === c);
  }, [principal, game.creatorPrincipal]);

  const loadRating = useCallback(async () => {
    setRatingSummary(await getArcadeRatingSummary(game.id, principal));
  }, [game.id, principal]);

  useEffect(() => {
    setTab(game.status === "testing" ? "testing" : "live");
  }, [game.id, game.status]);

  useEffect(() => {
    void loadRating();
  }, [loadRating]);

  const items = useMemo(() => {
    const testing = {
      value: "testing" as const,
      label: (
        <HStack gap="1.5">
          <Text as="span">Testing</Text>
          {isTesting ? <GhBadge tone="prize">active</GhBadge> : null}
        </HStack>
      ),
      content: (
        <ChannelPanel
          channel="testing"
          game={game}
          principal={principal}
          username={username}
          isLoggedIn={isLoggedIn}
          onLogin={onLogin}
          isCreator={isCreator}
          allowRating={isTesting}
          ratingSummary={ratingSummary}
          onRated={() => void loadRating()}
        />
      ),
    };
    const live = {
      value: "live" as const,
      label: (
        <HStack gap="1.5">
          <Text as="span">Live</Text>
          {!isTesting ? <GhBadge tone="live">active</GhBadge> : null}
        </HStack>
      ),
      content: (
        <ChannelPanel
          channel="live"
          game={game}
          principal={principal}
          username={username}
          isLoggedIn={isLoggedIn}
          onLogin={onLogin}
          isCreator={isCreator}
          allowRating={false}
          ratingSummary={ratingSummary}
          onRated={() => void loadRating()}
        />
      ),
    };
    // Order tabs: active status first
    return isTesting ? [testing, live] : [live, testing];
  }, [
    game,
    principal,
    username,
    isLoggedIn,
    onLogin,
    isCreator,
    isTesting,
    ratingSummary,
    loadRating,
  ]);

  return (
    <GhSurface variant="elevated" p="phi4" mt="0">
      <HStack gap="2" mb="phi3" flexWrap="wrap">
        <MessageSquare size={18} color="var(--gh-colors-attr-fg)" />
        <Text fontFamily="heading" fontWeight="extrabold" fontSize="sm">
          Comments &amp; testing notes
        </Text>
        <GhBadge tone="muted">
          {isTesting ? "Testing first" : "Live first"}
        </GhBadge>
      </HStack>
      <GhTabs
        items={items}
        value={tab}
        onValueChange={(v) => setTab(v as ArcadeCommentChannel)}
        tone={isTesting ? "prize" : "live"}
        size="sm"
        fitted
      />
    </GhSurface>
  );
}
