import {
  Gamepad2,
  Swords,
  User,
  Wallet,
  LayoutDashboard,
  Joystick,
  LifeBuoy,
  Trophy,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
  description?: string;
  /** Only show when session is connected */
  requiresAuth?: boolean;
  desktop?: boolean;
  mobile?: boolean;
};

/**
 * Primary app nav — header + mobile bar.
 * Dashboard · Challenge (auth) · Host · Arcade · Rooms
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
    id: "rooms",
    label: "Rooms",
    href: "/rooms",
    icon: Gamepad2,
    description: "Group lobbies",
    desktop: true,
    mobile: true,
  },
];

/** @deprecated Use PRIMARY_NAV */
export const DESKTOP_NAV = PRIMARY_NAV;

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
  {
    href: "mailto:support@gamerholic.fun",
    label: "Support",
    icon: LifeBuoy,
    external: true,
  },
] as const;

/**
 * Mobile Create FAB options (host tournament / room).
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
    tone: "prize" as const,
  },
] as const;

export function tabFromPath(pathname: string): string {
  if (pathname.startsWith("/dashboard")) return "dashboard";
  if (pathname.startsWith("/rooms")) return "rooms";
  if (pathname.startsWith("/arcade")) return "arcade";
  if (pathname.startsWith("/profile")) return "profile";
  if (pathname.startsWith("/wallet")) return "wallet";
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

/** Visible primary nav for the current session */
export function primaryNavForSession(isLoggedIn: boolean): NavItem[] {
  return PRIMARY_NAV.filter((item) => !item.requiresAuth || isLoggedIn);
}

/** Legacy secondary links (no longer in main nav) */
export const EXTRA_LINKS = [
  { href: "/wallet", label: "Wallet", icon: Wallet },
  { href: "/profile", label: "Profile", icon: User },
] as const;
