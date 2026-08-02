"use client";

import { Header } from "@/components/shell/header";
import { MobileBottomNav } from "@/components/shell/mobile-bottom-nav";
import { Footer } from "@/components/shell/footer";

/**
 * Mobile-app chrome:
 * fixed header · scrollable main · desktop footer · mobile bottom tabs
 * (same structure as gamerholic AppLayout)
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="gh-app">
      <Header />
      <main className="gh-main">{children}</main>
      <Footer />
      <MobileBottomNav />
    </div>
  );
}
