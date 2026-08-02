"use client";

import { Box, Flex } from "@chakra-ui/react";
import { useSession } from "@/components/providers/session-context";
import { useChat } from "./chat-context";
import { ChatWindow } from "./chat-window";

/**
 * Gmail-style chat dock — fixed bottom-right stack of DM / room windows.
 */
export function ChatDock() {
  const { isLoggedIn } = useSession();
  const { openThreads } = useChat();

  if (!isLoggedIn || openThreads.length === 0) return null;

  return (
    <Box
      position="fixed"
      right={{ base: "0", md: "phi3" }}
      bottom={{ base: "calc(var(--gh-bottom-nav-h) + var(--gh-safe-bottom))", md: "0" }}
      zIndex={55}
      pointerEvents="none"
      maxW={{ base: "100%", md: "calc(100vw - 2rem)" }}
    >
      <Flex
        direction={{ base: "column-reverse", sm: "row-reverse" }}
        align="flex-end"
        gap="2"
        pointerEvents="auto"
        px={{ base: "2", md: "0" }}
        className="gh-scroll-hide"
        overflowX="auto"
      >
        {openThreads.map((t) => (
          <ChatWindow key={t.id} thread={t} />
        ))}
      </Flex>
    </Box>
  );
}
