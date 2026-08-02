import type { Metadata, Viewport } from "next";
import { Orbitron, Rajdhani, Share_Tech_Mono } from "next/font/google";
import { GamerholicProvider } from "@/components/providers/gamerholic-provider";
import { AppShell } from "@/components/shell/app-shell";
import "./globals.css";

/**
 * Gaming-suited type stack (not Arial/system-ui):
 * - Orbitron → display / headlines / HUD labels
 * - Rajdhani → body UI (geometric, esports-common)
 * - Share Tech Mono → codes / principals / numbers
 */
const display = Orbitron({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800", "900"],
  display: "swap",
});

const body = Rajdhani({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const mono = Share_Tech_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Gamerholic — Web3 Esports",
  description:
    "Host-to-earn tournaments & rooms. High Score Arcade. Attribute XFT battles on ICP.",
  applicationName: "Gamerholic",
  icons: {
    icon: [
      { url: "/brand/gamerholic-mark-32.jpg", sizes: "32x32", type: "image/jpeg" },
      { url: "/brand/gamerholic-mark-64.jpg", sizes: "64x64", type: "image/jpeg" },
    ],
    apple: "/brand/gamerholic-mark-128.jpg",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Gamerholic",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#0d0b1a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`dark ${display.variable} ${body.variable} ${mono.variable}`}
      suppressHydrationWarning
    >
      {/* body.className applies Rajdhani as the actual computed font-family */}
      <body className={body.className}>
        <GamerholicProvider>
          <AppShell>{children}</AppShell>
        </GamerholicProvider>
      </body>
    </html>
  );
}
