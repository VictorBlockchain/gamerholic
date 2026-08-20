"use client";

import { Header } from "@/components/shell/header";
import { MobileBottomNav } from "@/components/shell/mobile-bottom-nav";
import { Footer } from "@/components/shell/footer";
import { PullToRefresh } from "@/components/shell/pull-to-refresh";
import { SwipeBack } from "@/components/shell/swipe-back";

/**
 * Mobile-app chrome:
 * fixed header · scrollable main · desktop footer · mobile bottom tabs
 * + pull-to-refresh on mobile (window scroll top)
 * + swipe-right to go back.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="gh-app">
      <Header />
      <PullToRefresh />
      <SwipeBack />
      <main className="gh-main">{children}</main>
      <Footer />
      <MobileBottomNav />
    </div>
  );
}
