"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Box, Flex, HStack, Text, VStack } from "@chakra-ui/react";
import { MessageCircle, Users, X } from "lucide-react";
import { useSession } from "@/components/providers/session-context";
import { listDiscoveryUsers } from "@/lib/ic/gamer-service";
import { excludeSelfChatUsers, type ChatUser } from "@/lib/chat/types";
import { GhAvatar, GhBadge } from "@/components/ui";
import { useChat } from "./chat-context";
import { ChatWindow } from "./chat-window";

/**
 * Gmail-style chat dock — fixed bottom-right on every logged-in page.
 * - Open DM / room windows stack here
 * - Launcher opens a mini tray (online DMs + Community) without leaving the page
 */
export function ChatDock() {
  const { isLoggedIn, user, principal, profile } = useSession();
  const { openThreads, openDm } = useChat();
  const [trayOpen, setTrayOpen] = useState(false);
  const [online, setOnline] = useState<ChatUser[]>([]);

  useEffect(() => {
    if (!isLoggedIn || !trayOpen) return;
    let cancelled = false;
    void listDiscoveryUsers().then((rows) => {
      if (cancelled) return;
      setOnline(
        excludeSelfChatUsers(rows, {
          id: user?.id,
          principal: principal || user?.principal,
          username: profile?.username || user?.username,
        }).slice(0, 12),
      );
    });
    return () => {
      cancelled = true;
    };
  }, [
    isLoggedIn,
    trayOpen,
    user?.id,
    user?.principal,
    user?.username,
    principal,
    profile?.username,
  ]);

  if (!isLoggedIn) return null;

  return (
    <Box
      position="fixed"
      right={{ base: "2", md: "phi3" }}
      bottom={{
        base: "calc(var(--gh-bottom-nav-h) + var(--gh-safe-bottom) + 0.5rem)",
        md: "phi3",
      }}
      zIndex={55}
      pointerEvents="none"
      maxW={{ base: "100%", md: "calc(100vw - 2rem)" }}
    >
      <Flex
        direction={{ base: "column-reverse", sm: "row-reverse" }}
        align="flex-end"
        gap="2"
        pointerEvents="auto"
        className="gh-scroll-hide"
        overflowX="auto"
      >
        {openThreads.map((t) => (
          <ChatWindow key={t.id} thread={t} />
        ))}

        {trayOpen ? (
          <Box
            w={{ base: "min(18.5rem, calc(100vw - 1.5rem))", sm: "18.5rem" }}
            maxH="min(22rem, 55dvh)"
            borderRadius="2xl"
            borderWidth="1px"
            borderColor="border.brand"
            bg="bg.elevated"
            boxShadow="glow"
            overflow="hidden"
            display="flex"
            flexDirection="column"
          >
            <Flex
              align="center"
              justify="space-between"
              px="3"
              py="2.5"
              borderBottomWidth="1px"
              borderColor="border.default"
              bg="whiteAlpha.50"
            >
              <HStack gap="2">
                <MessageCircle size={14} color="var(--gh-colors-brand-fg)" />
                <Text
                  fontFamily="heading"
                  fontSize="xs"
                  fontWeight="extrabold"
                  letterSpacing="0.04em"
                >
                  Chat
                </Text>
                <GhBadge tone="live" pulse={online.length > 0}>
                  {online.length}
                </GhBadge>
              </HStack>
              <Box
                as="button"
                aria-label="Close chat tray"
                onClick={() => setTrayOpen(false)}
                p="1"
                borderRadius="md"
                color="fg.muted"
                cursor="pointer"
                _hover={{ color: "fg.default", bg: "whiteAlpha.100" }}
              >
                <X size={14} />
              </Box>
            </Flex>

            <Link
              href="/community"
              onClick={() => setTrayOpen(false)}
              style={{ textDecoration: "none", color: "inherit" }}
            >
              <HStack
                px="3"
                py="2.5"
                gap="2"
                borderBottomWidth="1px"
                borderColor="border.default"
                _hover={{ bg: "brand.muted" }}
              >
                <Box
                  w="8"
                  h="8"
                  borderRadius="lg"
                  bg="brand.muted"
                  color="brand.fg"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  flexShrink={0}
                >
                  <Users size={14} />
                </Box>
                <Box minW="0">
                  <Text fontFamily="heading" fontWeight="bold" fontSize="xs">
                    Community chatroom
                  </Text>
                  <Text fontSize="2xs" color="fg.subtle">
                    Global lounge · channels · LFG
                  </Text>
                </Box>
              </HStack>
            </Link>

            <Box
              flex="1"
              overflowY="auto"
              className="gh-scroll-hide"
              maxH="14rem"
            >
              {online.length === 0 ? (
                <Box p="3">
                  <Text fontSize="xs" color="fg.muted" lineHeight="1.5">
                    No one else online right now. Open Community or wait for
                    presence heartbeats.
                  </Text>
                </Box>
              ) : (
                <VStack align="stretch" gap="0">
                  {online.map((u, i) => (
                    <HStack
                      key={u.id}
                      as="button"
                      px="3"
                      py="2"
                      gap="2"
                      borderTopWidth={i === 0 ? 0 : "1px"}
                      borderColor="border.default"
                      cursor="pointer"
                      textAlign="left"
                      w="100%"
                      _hover={{ bg: "brand.muted" }}
                      onClick={() => {
                        openDm(u);
                        setTrayOpen(false);
                      }}
                    >
                      <Box position="relative" flexShrink={0}>
                        <GhAvatar
                          name={u.username}
                          size="xs"
                          src={u.avatarUrl}
                        />
                        <Box
                          position="absolute"
                          bottom="0"
                          right="0"
                          w="1.5"
                          h="1.5"
                          borderRadius="full"
                          bg={
                            u.status === "online" ? "success.solid" : "fg.subtle"
                          }
                          borderWidth="1px"
                          borderColor="bg.elevated"
                        />
                      </Box>
                      <Box minW="0" flex="1">
                        <Text
                          fontFamily="heading"
                          fontWeight="bold"
                          fontSize="xs"
                          lineClamp={1}
                        >
                          @{u.username}
                        </Text>
                        <Text fontSize="2xs" color="fg.subtle" lineClamp={1}>
                          {u.game || "Online"}
                        </Text>
                      </Box>
                      <MessageCircle
                        size={12}
                        style={{ opacity: 0.55, flexShrink: 0 }}
                      />
                    </HStack>
                  ))}
                </VStack>
              )}
            </Box>
          </Box>
        ) : null}

        {/* Always-visible launcher — Gmail-style entry on every page */}
        {!trayOpen ? (
          <Flex
            as="button"
            align="center"
            gap="2"
            h="11"
            px="4"
            borderRadius="full"
            borderWidth="1px"
            borderColor="border.brand"
            bg="bg.elevated"
            boxShadow="glow"
            cursor="pointer"
            onClick={() => setTrayOpen(true)}
            _hover={{ bg: "brand.muted" }}
            aria-label="Open chat"
          >
            <MessageCircle size={16} color="var(--gh-colors-brand-fg)" />
            <Text
              fontFamily="heading"
              fontSize="xs"
              fontWeight="extrabold"
              color="brand.fg"
            >
              Chat
            </Text>
            {openThreads.length > 0 ? (
              <GhBadge tone="brand">{openThreads.length}</GhBadge>
            ) : null}
          </Flex>
        ) : null}
      </Flex>
    </Box>
  );
}
