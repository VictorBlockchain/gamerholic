"use client";

import { Box, HStack, Text } from "@chakra-ui/react";
import { Gamepad2, X } from "lucide-react";

export type GameFilterValue = "all" | string;

type Props = {
  games: string[];
  value: GameFilterValue;
  onChange: (v: GameFilterValue) => void;
  /** Highlight chips that match the viewer’s profile games */
  myGames?: string[];
  label?: string;
  size?: "sm" | "md";
};

/**
 * Horizontal game filter chips — for online users & chatrooms.
 * Games come from catalog + profile; filter is exact title match.
 */
export function GameFilterBar({
  games,
  value,
  onChange,
  myGames = [],
  label = "Game",
  size = "sm",
}: Props) {
  const px = size === "sm" ? "2" : "2.5";
  const py = size === "sm" ? "0.5" : "1";
  const fontSize = size === "sm" ? "2xs" : "xs";

  return (
    <Box>
      <HStack gap="1.5" mb="1.5" color="fg.subtle">
        <Gamepad2 size={12} />
        <Text
          fontFamily="heading"
          fontSize="2xs"
          fontWeight="bold"
          letterSpacing="0.1em"
          textTransform="uppercase"
        >
          {label}
        </Text>
        {value !== "all" ? (
          <Box
            as="button"
            display="inline-flex"
            alignItems="center"
            gap="0.5"
            color="brand.fg"
            fontSize="2xs"
            fontFamily="heading"
            fontWeight="bold"
            cursor="pointer"
            onClick={() => onChange("all")}
          >
            <X size={10} /> Clear
          </Box>
        ) : null}
      </HStack>
      <HStack
        gap="1.5"
        overflowX="auto"
        className="gh-scroll-hide"
        pb="0.5"
        flexWrap="nowrap"
      >
        <Chip
          active={value === "all"}
          onClick={() => onChange("all")}
          px={px}
          py={py}
          fontSize={fontSize}
        >
          All
        </Chip>
        {games.map((g) => {
          const mine = myGames.includes(g);
          return (
            <Chip
              key={g}
              active={value === g}
              mine={mine && value !== g}
              onClick={() => onChange(g)}
              px={px}
              py={py}
              fontSize={fontSize}
            >
              {g}
              {mine ? " ·" : ""}
            </Chip>
          );
        })}
      </HStack>
    </Box>
  );
}

function Chip({
  children,
  active,
  mine,
  onClick,
  px,
  py,
  fontSize,
}: {
  children: React.ReactNode;
  active?: boolean;
  mine?: boolean;
  onClick: () => void;
  px: string;
  py: string;
  fontSize: string;
}) {
  return (
    <Box
      as="button"
      onClick={onClick}
      flexShrink={0}
      px={px}
      py={py}
      borderRadius="full"
      borderWidth="1px"
      borderColor={
        active ? "border.brand" : mine ? "live.solid" : "border.default"
      }
      bg={active ? "brand.muted" : mine ? "live.muted" : "blackAlpha.400"}
      color={active ? "brand.fg" : mine ? "live.fg" : "fg.muted"}
      fontFamily="heading"
      fontSize={fontSize}
      fontWeight="bold"
      letterSpacing="0.02em"
      cursor="pointer"
      whiteSpace="nowrap"
      transition="all 0.12s"
      _hover={{ borderColor: "border.brand", color: "brand.fg" }}
    >
      {children}
    </Box>
  );
}

/** Unique games from rooms / users for filter options */
export function collectGamesFromUsers(
  users: { game?: string; games?: string[] }[],
): string[] {
  const set = new Set<string>();
  for (const u of users) {
    if (u.game) set.add(u.game);
    u.games?.forEach((g) => set.add(g));
  }
  return [...set].sort((a, b) => a.localeCompare(b));
}

export function collectGamesFromRooms(rooms: { game?: string }[]): string[] {
  const set = new Set<string>();
  for (const r of rooms) {
    if (r.game) set.add(r.game);
  }
  return [...set].sort((a, b) => a.localeCompare(b));
}

/** User matches filter if currently on that game or lists it in profile games */
export function userMatchesGame(
  user: { game?: string; games?: string[] },
  filter: GameFilterValue,
): boolean {
  if (filter === "all") return true;
  if (user.game === filter) return true;
  return Boolean(user.games?.includes(filter));
}

export function roomMatchesGame(
  room: { game?: string },
  filter: GameFilterValue,
): boolean {
  if (filter === "all") return true;
  return room.game === filter;
}

/**
 * Sort users: matching profile games first, then online before away, then name.
 */
export function sortUsersByGameFilter<
  T extends { username: string; status: string; game?: string; games?: string[] },
>(users: T[], filter: GameFilterValue, myGames: string[]): T[] {
  return [...users].sort((a, b) => {
    if (filter !== "all") {
      const aMatch = userMatchesGame(a, filter) ? 0 : 1;
      const bMatch = userMatchesGame(b, filter) ? 0 : 1;
      if (aMatch !== bMatch) return aMatch - bMatch;
    } else if (myGames.length) {
      const aPref = myGames.some((g) => userMatchesGame(a, g)) ? 0 : 1;
      const bPref = myGames.some((g) => userMatchesGame(b, g)) ? 0 : 1;
      if (aPref !== bPref) return aPref - bPref;
    }
    const statusRank = (s: string) =>
      s === "online" ? 0 : s === "away" ? 1 : 2;
    const sr = statusRank(a.status) - statusRank(b.status);
    if (sr !== 0) return sr;
    return a.username.localeCompare(b.username);
  });
}

export function sortRoomsByGameFilter<
  T extends { name: string; game?: string; live?: boolean; members?: number },
>(rooms: T[], filter: GameFilterValue, myGames: string[]): T[] {
  return [...rooms].sort((a, b) => {
    if (filter !== "all") {
      const aMatch = roomMatchesGame(a, filter) ? 0 : 1;
      const bMatch = roomMatchesGame(b, filter) ? 0 : 1;
      if (aMatch !== bMatch) return aMatch - bMatch;
    } else if (myGames.length) {
      const aPref = a.game && myGames.includes(a.game) ? 0 : 1;
      const bPref = b.game && myGames.includes(b.game) ? 0 : 1;
      if (aPref !== bPref) return aPref - bPref;
    }
    if (Boolean(a.live) !== Boolean(b.live)) return a.live ? -1 : 1;
    return (b.members ?? 0) - (a.members ?? 0);
  });
}
