import {
  Gamepad2,
  Swords,
  User,
  Wallet,
  LayoutDashboard,
  Joystick,
  LifeBuoy,
  Trophy,
  Users,
  ShoppingBag,
  Shield,
  type LucideIcon,
} from "lucide-react";
import { normalizeUsername } from "@/lib/profile";

export type NavItem = {
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
  description?: string;
  /** Only show when session is connected */
  requiresAuth?: boolean;
  /** Only show for platform / on-chain admin */
  requiresAdmin?: boolean;
  desktop?: boolean;
  mobile?: boolean;
};

/**
 * App home by session:
 * - logged in → dashboard (arena home)
 * - visitor → marketing `/`
 */
export function homeHref(isLoggedIn: boolean): string {
  return isLoggedIn ? "/dashboard" : "/";
}

/**
 * Profile URLs (static-export safe).
 *
 * - Own card (edit): always `/profile/` — never dynamic slug (avoids IC rewrite + "not found")
 * - Public card: `/profile/view/?u={username}` (always-built shell; IC also rewrites /profile/{user})
 */
export function profileHref(
  username?: string | null,
  _principal?: string | null,
  opts?: { self?: boolean },
): string {
  if (opts?.self) return "/profile/";
  const u = normalizeUsername(username || "");
  if (u) return `/profile/view/?u=${encodeURIComponent(u)}`;
  // No public slug yet — own edit page
  return "/profile/";
}

/**
 * Primary app nav — header + mobile bar.
 * Desktop: Dashboard · Challenge · Host · Arcade · Community
 * Mobile (auth): Profile · Challenge · Create · Arcade · Community
 */
export const PRIMARY_NAV: NavItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    description: "Your arena",
    requiresAuth: true,
    desktop: true,
    /** Mobile uses profile tab instead — see mobileNavForSession */
    mobile: false,
  },
  {
    id: "profile",
    label: "Profile",
    href: "/profile",
    icon: User,
    description: "Your public card",
    requiresAuth: true,
    desktop: false,
    mobile: true,
  },
  {
    id: "challenge",
    label: "Challenge",
    href: "/challenges",
    icon: Swords,
    description: "1v1 heads-up",
    requiresAuth: true,
    desktop: true,
    mobile: true,
  },
  {
    id: "host",
    label: "Host",
    href: "/host",
    icon: Trophy,
    description: "Tournaments & booth",
    desktop: true,
    mobile: true,
  },
  {
    id: "arcade",
    label: "Arcade",
    href: "/arcade",
    icon: Joystick,
    description: "High Score cabinets",
    desktop: true,
    mobile: true,
  },
  {
    id: "shop",
    label: "Shop",
    href: "/shop",
    icon: ShoppingBag,
    description: "Gamerholic merch",
    desktop: true,
    mobile: false,
  },
  {
    id: "community",
    label: "Community",
    href: "/community",
    icon: Users,
    description: "Global chat & channels",
    desktop: true,
    mobile: true,
  },
  {
    id: "rooms",
    label: "Rooms",
    href: "/rooms",
    icon: Gamepad2,
    description: "Match lobbies",
    desktop: true,
    mobile: false,
  },
  {
    id: "admin",
    label: "Admin",
    href: "/admin",
    icon: Shield,
    description: "Moderator console · fees · roles",
    requiresAuth: true,
    requiresAdmin: true,
    desktop: true,
    /** Bottom tabs stay lean — admin appears in header / account / hamburger */
    mobile: false,
  },
];

/** @deprecated Use PRIMARY_NAV */
export const DESKTOP_NAV = PRIMARY_NAV;

/** Account dropdown item for admins (in addition to ACCOUNT_MENU). */
export const ADMIN_ACCOUNT_ITEM = {
  href: "/moderator/console/",
  label: "Admin console",
  icon: Shield,
} as const;

/** Moderator availability (open to mods; admins also get console above). */
export const MODERATOR_ACCOUNT_ITEM = {
  href: "/moderator/",
  label: "Moderator",
  icon: Shield,
} as const;

/**
 * Mobile bottom tabs — same IA as header (no Host / Play rename).
 */
export const MOBILE_TABS: NavItem[] = PRIMARY_NAV.map((n) => ({
  ...n,
  mobile: true,
}));

/** Account menu links (profile dropdown) */
export const ACCOUNT_MENU = [
  { href: "/profile", label: "Profile", icon: User },
  { href: "/wallet", label: "Wallet", icon: Wallet },
  { href: "/security", label: "Security tips", icon: Shield },
  {
    href: "mailto:support@gamerholic.fun",
    label: "Support",
    icon: LifeBuoy,
    external: true,
  },
] as const;

/**
 * Mobile Create FAB options (host tournament / room / community).
 */
export const CREATE_OPTIONS = [
  {
    id: "tournament",
    title: "Host tournament",
    subtitle: "Earn host fee",
    description:
      "Set entry pot · your host bps · rake splits — you get paid when it completes.",
    href: "/create?type=tournament",
    icon: LayoutDashboard,
    tone: "prize" as const,
  },
  {
    id: "room",
    title: "Host game room",
    subtitle: "Group pot",
    description:
      "Lobby rules · entry stakes · you take a host cut when the room settles.",
    href: "/create?type=room",
    icon: Gamepad2,
    tone: "live" as const,
  },
  {
    id: "community",
    title: "Community chatroom",
    subtitle: "Free talk",
    description:
      "Create a named channel on Community — unique names, game tags optional.",
    href: "/community",
    icon: Users,
    tone: "brand" as const,
  },
  {
    id: "challenge",
    title: "Heads-up challenge",
    subtitle: "1v1",
    description: "Open the challenge board to create a direct match.",
    href: "/challenges",
    icon: Swords,
    tone: "attr" as const,
  },
] as const;

export function tabFromPath(pathname: string): string {
  if (pathname.startsWith("/dashboard")) return "dashboard";
  if (pathname.startsWith("/community")) return "community";
  if (pathname.startsWith("/rooms")) return "rooms";
  if (pathname.startsWith("/arcade")) return "arcade";
  if (pathname.startsWith("/profile")) return "profile";
  if (pathname.startsWith("/wallet")) return "wallet";
  if (pathname.startsWith("/admin") || pathname.startsWith("/moderator"))
    return "admin";
  if (pathname.startsWith("/host") || pathname.startsWith("/tournaments"))
    return "host";
  if (
    pathname.startsWith("/challenges") ||
    pathname.startsWith("/play") ||
    pathname === "/"
  )
    return pathname === "/" ? "" : "challenge";
  return "";
}

export type NavSessionOpts = {
  /** Platform Supabase admin and/or on-chain setAdmin */
  isAdmin?: boolean;
};

/** Visible primary nav for the current session (header / footer) */
export function primaryNavForSession(
  isLoggedIn: boolean,
  opts?: NavSessionOpts,
): NavItem[] {
  const isAdmin = Boolean(opts?.isAdmin);
  return PRIMARY_NAV.filter(
    (item) =>
      (!item.requiresAuth || isLoggedIn) &&
      (!item.requiresAdmin || isAdmin) &&
      item.desktop !== false,
  );
}

/**
 * Mobile bottom tabs — Profile (not Dashboard) when logged in.
 * Own profile always opens `/profile/` (edit shell), not a public lookup.
 * Admin is not a bottom tab (header / account menu only).
 */
export function mobileNavForSession(
  isLoggedIn: boolean,
  _opts?: { username?: string | null; principal?: string | null } & NavSessionOpts,
): NavItem[] {
  return PRIMARY_NAV.filter(
    (item) =>
      (!item.requiresAuth || isLoggedIn) &&
      item.mobile !== false &&
      item.id !== "host" &&
      !item.requiresAdmin,
  ).map((item) => {
    if (item.id === "profile") {
      return {
        ...item,
        href: profileHref(null, null, { self: true }),
      };
    }
    return item;
  });
}

/**
 * Account dropdown links.
 * Injects Admin console (and optional Moderator availability) when admin/mod.
 */
export function accountMenuForSession(opts?: {
  isAdmin?: boolean;
  isModerator?: boolean;
}) {
  const isAdmin = Boolean(opts?.isAdmin);
  const isModerator = Boolean(opts?.isModerator) || isAdmin;
  const [profile, ...rest] = ACCOUNT_MENU;
  const extra: Array<
    | typeof ADMIN_ACCOUNT_ITEM
    | typeof MODERATOR_ACCOUNT_ITEM
    | (typeof ACCOUNT_MENU)[number]
  > = [];
  if (isAdmin) extra.push(ADMIN_ACCOUNT_ITEM);
  if (isModerator && !isAdmin) {
    // Non-admin mods: availability page only
    extra.push(MODERATOR_ACCOUNT_ITEM);
  } else if (isAdmin) {
    extra.push(MODERATOR_ACCOUNT_ITEM);
  }
  if (!extra.length) return [...ACCOUNT_MENU];
  return [profile, ...extra, ...rest];
}

/** Legacy secondary links (no longer in main nav) */
export const EXTRA_LINKS = [
  { href: "/wallet", label: "Wallet", icon: Wallet },
  { href: "/profile", label: "Profile", icon: User },
] as const;
