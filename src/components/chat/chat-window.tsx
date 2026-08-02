"use client";

import { useEffect, useRef, useState } from "react";
import { Box, Flex, HStack, Text, VStack } from "@chakra-ui/react";
import { Minus, X, Send, Maximize2 } from "lucide-react";
import type { ChatMessage, ChatThread } from "@/lib/chat/types";
import {
  fetchMessages,
  sendMessage,
  subscribeMessages,
} from "@/lib/chat/chat-service";
import { sanitizeChatMessage } from "@/lib/chat/sanitize";
import { useSession } from "@/components/providers/session-context";
import { GhAvatar, GhButton, GhInput, ghToast } from "@/components/ui";
import { useChat } from "./chat-context";

export function ChatWindow({ thread }: { thread: ChatThread }) {
  const { user } = useSession();
  const { closeThread, minimizeThread, focusThread } = useChat();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  /** Scroll only the window list — avoid page jump from scrollIntoView */
  const messagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    void fetchMessages(thread.id).then((list) => {
      if (!cancelled) setMessages(list);
    });
    const unsub = subscribeMessages(thread.id, (msg) => {
      setMessages((prev) =>
        prev.some((m) => m.id === msg.id) ? prev : [...prev, msg],
      );
    });
    return () => {
      cancelled = true;
      unsub();
    };
  }, [thread.id]);

  useEffect(() => {
    if (thread.minimized) return;
    const el = messagesRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages, thread.minimized]);

  const onSend = async () => {
    if (!user || sending) return;
    const { sanitized, ok, reason } = sanitizeChatMessage(input);
    if (!ok) {
      ghToast({
        title: "Message blocked",
        description: reason || "Invalid message",
        type: "error",
      });
      return;
    }
    setSending(true);
    try {
      await sendMessage({
        threadId: thread.id,
        senderId: user.id || user.username,
        body: sanitized,
      });
      setInput("");
    } finally {
      setSending(false);
    }
  };

  if (thread.minimized) {
    return (
      <Box
        as="button"
        onClick={() => {
          minimizeThread(thread.id, false);
          focusThread(thread.id);
        }}
        w="14rem"
        h="10"
        borderRadius="xl"
        borderWidth="1px"
        borderBottomRadius="0"
        borderColor="border.brand"
        bg="bg.elevated"
        boxShadow="glow"
        px="3"
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        cursor="pointer"
        _hover={{ bg: "bg.surface" }}
      >
        <HStack gap="2" minW="0">
          <Box w="2" h="2" borderRadius="full" bg="success.solid" flexShrink={0} />
          <Text
            fontFamily="heading"
            fontSize="xs"
            fontWeight="bold"
            lineClamp={1}
          >
            {thread.title}
          </Text>
        </HStack>
        <Maximize2 size={12} />
      </Box>
    );
  }

  return (
    <Flex
      direction="column"
      w={{ base: "100%", sm: "20rem" }}
      h="22rem"
      maxH="min(22rem, 50dvh)"
      borderRadius="xl"
      borderBottomRadius={{ base: "xl", md: "0" }}
      borderWidth="1px"
      borderColor="border.brand"
      bg="bg.elevated"
      boxShadow="glow"
      overflow="hidden"
    >
      {/* Title bar */}
      <HStack
        px="3"
        py="2"
        borderBottomWidth="1px"
        borderColor="border.default"
        bg="blackAlpha.400"
        justify="space-between"
        flexShrink={0}
      >
        <HStack gap="2" minW="0">
          <GhAvatar name={thread.title} size="xs" status="online" />
          <Box minW="0">
            <Text fontFamily="heading" fontSize="xs" fontWeight="extrabold" lineClamp={1}>
              {thread.title}
            </Text>
            <Text fontSize="2xs" color="fg.subtle">
              {thread.kind === "room" ? "Chatroom" : "Direct message"}
            </Text>
          </Box>
        </HStack>
        <HStack gap="0.5">
          <Box
            as="button"
            aria-label="Minimize"
            p="1.5"
            borderRadius="md"
            color="fg.subtle"
            cursor="pointer"
            _hover={{ color: "fg.default", bg: "whiteAlpha.100" }}
            onClick={() => minimizeThread(thread.id, true)}
          >
            <Minus size={14} />
          </Box>
          <Box
            as="button"
            aria-label="Close"
            p="1.5"
            borderRadius="md"
            color="fg.subtle"
            cursor="pointer"
            _hover={{ color: "danger.solid", bg: "whiteAlpha.100" }}
            onClick={() => closeThread(thread.id)}
          >
            <X size={14} />
          </Box>
        </HStack>
      </HStack>

      {/* Messages */}
      <VStack
        ref={messagesRef}
        align="stretch"
        flex="1"
        gap="2"
        p="3"
        overflowY="auto"
        className="gh-scroll-hide"
        minH="0"
      >
        {messages.length === 0 ? (
          <Text fontSize="xs" color="fg.subtle" textAlign="center" py="6">
            No messages yet. Say hi.
          </Text>
        ) : (
          messages.map((m) => {
            const mine = m.senderId === user?.id;
            return (
              <Flex
                key={m.id}
                justify={mine ? "flex-end" : "flex-start"}
              >
                <Box
                  maxW="85%"
                  px="2.5"
                  py="1.5"
                  borderRadius="lg"
                  borderWidth="1px"
                  borderColor={mine ? "border.brand" : "border.default"}
                  bg={mine ? "brand.muted" : "blackAlpha.500"}
                >
                  {!mine ? (
                    <Text
                      fontSize="2xs"
                      color="brand.fg"
                      fontFamily="heading"
                      fontWeight="bold"
                      mb="0.5"
                    >
                      {thread.kind === "room" ? m.senderId : thread.title}
                    </Text>
                  ) : null}
                  <Text fontSize="sm" lineHeight="1.4" wordBreak="break-word">
                    {m.body}
                  </Text>
                  <Text fontSize="2xs" color="fg.subtle" mt="0.5" textAlign="right">
                    {new Date(m.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </Text>
                </Box>
              </Flex>
            );
          })
        )}
      </VStack>

      {/* Composer */}
      <HStack
        p="2"
        gap="1.5"
        borderTopWidth="1px"
        borderColor="border.default"
        flexShrink={0}
      >
        <GhInput
          h="9"
          placeholder="Message…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void onSend();
            }
          }}
          flex="1"
        />
        <GhButton
          size="sm"
          variant="primary"
          px="2.5"
          minW="9"
          onClick={() => void onSend()}
          disabled={!input.trim() || sending}
          aria-label="Send"
        >
          <Send size={14} />
        </GhButton>
      </HStack>
    </Flex>
  );
}
