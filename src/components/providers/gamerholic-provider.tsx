"use client";

import { ChakraProvider } from "@chakra-ui/react";
import { ThemeProvider } from "next-themes";
import { gamerholicSystem } from "@/theme/gamerholic-system";
import { GhToaster } from "@/components/ui/gh-toast";
import { SessionProvider } from "@/components/providers/session-context";
import { ChatProvider } from "@/components/chat/chat-context";
import { ChatDock } from "@/components/chat/chat-dock";
import { GhEventProvider } from "@/context/event-context";

export function GamerholicProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <ChakraProvider value={gamerholicSystem}>
        <SessionProvider>
          <GhEventProvider>
            <ChatProvider>
              {children}
              <ChatDock />
              <GhToaster />
            </ChatProvider>
          </GhEventProvider>
        </SessionProvider>
      </ChakraProvider>
    </ThemeProvider>
  );
}
