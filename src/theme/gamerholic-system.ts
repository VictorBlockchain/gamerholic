/**
 * Gamerholic · Chakra UI v3
 * Fun web3 esports — electric lime · prize magenta · attribute violet.
 * (Restored pre-masculine palette.)
 * Spacing scale ≈ golden ratio (φ) from 8px base.
 */

"use client";

import { createSystem, defaultConfig, defineConfig } from "@chakra-ui/react";

export const PHI = 1.618;
export const SPACE = {
  1: "0.5rem",
  2: "0.8125rem",
  3: "1.3125rem",
  4: "2.125rem",
  5: "3.4375rem",
  6: "5.5625rem",
} as const;

const config = defineConfig({
  preflight: true,
  cssVarsPrefix: "gh",
  globalCss: {
    "html, body": {
      margin: 0,
      padding: 0,
      minHeight: "100%",
      background: "bg.canvas",
      color: "fg.default",
      fontFamily: "body",
      letterSpacing: "0.02em",
    },
    "*, *::before, *::after": {
      boxSizing: "border-box",
    },
    // Force gaming display face on all headings / HUD labels
    "h1, h2, h3, h4, h5, h6": {
      fontFamily: "heading",
      letterSpacing: "0.04em",
      fontWeight: "700",
    },
    button: {
      fontFamily: "heading",
      letterSpacing: "0.06em",
    },
    "::selection": {
      bg: "rgba(163, 255, 61, 0.35)",
      color: "#07070c",
    },
  },
  theme: {
    tokens: {
      fonts: {
        // Orbitron via --font-display (next/font)
        heading: {
          value:
            'var(--font-display), "Orbitron", "Rajdhani", sans-serif',
        },
        // Rajdhani via --font-body (next/font) — geometric gaming UI, not Arial
        body: {
          value: 'var(--font-body), "Rajdhani", "Segoe UI", sans-serif',
        },
        mono: {
          value:
            'var(--font-mono), "Share Tech Mono", ui-monospace, monospace',
        },
      },
      fontSizes: {
        "2xs": { value: "0.6875rem" },
        xs: { value: "0.75rem" },
        sm: { value: "0.875rem" },
        md: { value: "1rem" },
        lg: { value: "1.125rem" },
        xl: { value: "1.3125rem" },
        "2xl": { value: "1.75rem" },
        "3xl": { value: "2.25rem" },
        "4xl": { value: "2.875rem" },
      },
      spacing: {
        phi1: { value: "0.5rem" },
        phi2: { value: "0.8125rem" },
        phi3: { value: "1.3125rem" },
        phi4: { value: "2.125rem" },
        phi5: { value: "3.4375rem" },
        phi6: { value: "5.5625rem" },
      },
      radii: {
        sm: { value: "0.5rem" },
        md: { value: "0.75rem" },
        lg: { value: "1rem" },
        xl: { value: "1.25rem" },
        "2xl": { value: "1.5rem" },
        "3xl": { value: "1.75rem" },
        full: { value: "9999px" },
      },
      shadows: {
        card: {
          value: "0 16px 48px -20px rgba(0, 0, 0, 0.55)",
        },
        glow: {
          value:
            "0 0 0 1px rgba(163, 255, 61, 0.35), 0 14px 44px -14px rgba(163, 255, 61, 0.4)",
        },
        "glow-prize": {
          value:
            "0 0 0 1px rgba(244, 63, 168, 0.35), 0 14px 44px -14px rgba(244, 63, 168, 0.4)",
        },
        "glow-attr": {
          value:
            "0 0 0 1px rgba(139, 92, 246, 0.4), 0 14px 44px -14px rgba(139, 92, 246, 0.45)",
        },
        "glow-live": {
          value:
            "0 0 0 1px rgba(34, 211, 238, 0.35), 0 12px 40px -12px rgba(34, 211, 238, 0.4)",
        },
        "nav-fab": {
          value:
            "0 8px 32px rgba(163, 255, 61, 0.45), 0 0 0 2px rgba(190, 255, 120, 0.3)",
        },
      },
      colors: {
        volt: {
          300: { value: "#c8ff7a" },
          400: { value: "#b4ff4a" },
          500: { value: "#a3ff3d" },
          600: { value: "#7dd41f" },
          700: { value: "#5a9e12" },
        },
        prize: {
          300: { value: "#f9a8d4" },
          400: { value: "#f472b6" },
          500: { value: "#f43fa8" },
          600: { value: "#db2777" },
          700: { value: "#be185d" },
        },
        attr: {
          300: { value: "#c4b5fd" },
          400: { value: "#a78bfa" },
          500: { value: "#8b5cf6" },
          600: { value: "#7c3aed" },
          700: { value: "#6d28d9" },
        },
        live: {
          400: { value: "#22d3ee" },
          500: { value: "#06b6d4" },
          600: { value: "#0891b2" },
        },
        night: {
          50: { value: "#f1f0f7" },
          100: { value: "#d8d6e5" },
          200: { value: "#a8a4bf" },
          300: { value: "#7b7699" },
          400: { value: "#5a5578" },
          700: { value: "#242038" },
          800: { value: "#16132a" },
          900: { value: "#0d0b1a" },
          950: { value: "#070612" },
        },
        danger: {
          400: { value: "#fb7185" },
          500: { value: "#f43f5e" },
        },
        success: {
          400: { value: "#4ade80" },
          500: { value: "#22c55e" },
        },
      },
    },
    semanticTokens: {
      colors: {
        "bg.canvas": {
          value: { base: "{colors.night.900}", _dark: "{colors.night.950}" },
        },
        "bg.surface": {
          value: { base: "{colors.night.800}", _dark: "#121022" },
        },
        "bg.elevated": {
          value: { base: "#1a1730", _dark: "#18152c" },
        },
        "bg.muted": {
          value: { base: "{colors.night.700}", _dark: "#221e3a" },
        },
        "bg.glass": {
          value: {
            base: "rgba(13, 11, 26, 0.55)",
            _dark: "rgba(7, 6, 18, 0.6)",
          },
        },
        "bg.glass-strong": {
          value: {
            base: "rgba(22, 19, 42, 0.72)",
            _dark: "rgba(18, 16, 34, 0.78)",
          },
        },
        "fg.default": {
          value: { base: "#f4f2ff", _dark: "#faf8ff" },
        },
        "fg.muted": {
          value: { base: "{colors.night.200}", _dark: "#a8a4bf" },
        },
        "fg.subtle": {
          value: { base: "{colors.night.300}", _dark: "#7b7699" },
        },
        "border.default": {
          value: {
            base: "rgba(255, 255, 255, 0.1)",
            _dark: "rgba(255, 255, 255, 0.08)",
          },
        },
        "border.strong": {
          value: {
            base: "rgba(255, 255, 255, 0.16)",
            _dark: "rgba(255, 255, 255, 0.14)",
          },
        },
        "border.brand": {
          value: {
            base: "rgba(163, 255, 61, 0.45)",
            _dark: "rgba(180, 255, 74, 0.4)",
          },
        },
        "brand.solid": {
          value: { base: "{colors.volt.500}", _dark: "{colors.volt.400}" },
        },
        "brand.fg": {
          value: { base: "{colors.volt.400}", _dark: "{colors.volt.300}" },
        },
        "brand.muted": {
          value: {
            base: "rgba(163, 255, 61, 0.12)",
            _dark: "rgba(180, 255, 74, 0.1)",
          },
        },
        "brand.contrast": {
          value: { base: "#0a0c08", _dark: "#07080a" },
        },
        "prize.solid": {
          value: { base: "{colors.prize.500}", _dark: "{colors.prize.400}" },
        },
        "prize.fg": {
          value: { base: "{colors.prize.400}", _dark: "{colors.prize.300}" },
        },
        "prize.muted": {
          value: {
            base: "rgba(244, 63, 168, 0.14)",
            _dark: "rgba(244, 114, 182, 0.12)",
          },
        },
        "attr.solid": {
          value: { base: "{colors.attr.500}", _dark: "{colors.attr.400}" },
        },
        "attr.fg": {
          value: { base: "{colors.attr.400}", _dark: "{colors.attr.300}" },
        },
        "attr.muted": {
          value: {
            base: "rgba(139, 92, 246, 0.16)",
            _dark: "rgba(167, 139, 250, 0.12)",
          },
        },
        "live.solid": {
          value: { base: "{colors.live.500}", _dark: "{colors.live.400}" },
        },
        "live.fg": {
          value: { base: "{colors.live.400}", _dark: "{colors.live.400}" },
        },
        "live.muted": {
          value: {
            base: "rgba(6, 182, 212, 0.14)",
            _dark: "rgba(34, 211, 238, 0.12)",
          },
        },
        "danger.solid": {
          value: { base: "{colors.danger.500}", _dark: "{colors.danger.400}" },
        },
        "success.solid": {
          value: {
            base: "{colors.success.500}",
            _dark: "{colors.success.400}",
          },
        },
      },
    },
  },
});

export const gamerholicSystem = createSystem(defaultConfig, config);

export const GH_CHROME = {
  headerH: 56,
  bottomNavH: 72,
  fabSize: 56,
  /** Wider than 72rem, not full-bleed */
  contentMax: "84rem",
  /**
   * Content gap under fixed header (see globals.css --gh-content-gap).
   * Pages should not add extra padding-top for header clearance.
   */
  contentGap: "2.125rem",
  contentGapMd: "3.4375rem",
} as const;
