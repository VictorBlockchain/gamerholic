"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { ChatThread, ChatUser } from "@/lib/chat/types";
import { dmThreadId, roomThreadId } from "@/lib/chat/chat-service";

type ChatContextValue = {
  openThreads: ChatThread[];
  openDm: (user: ChatUser) => void;
  openRoom: (room: { id: string; name: string }) => void;
  closeThread: (threadId: string) => void;
  minimizeThread: (threadId: string, minimized?: boolean) => void;
  focusThread: (threadId: string) => void;
};

const ChatContext = createContext<ChatContextValue | null>(null);

const MAX_OPEN = 3;

/**
 * Gmail-style multi-window chat dock state.
 */
export function ChatProvider({ children }: { children: ReactNode }) {
  const [openThreads, setOpenThreads] = useState<ChatThread[]>([]);

  const openDm = useCallback((user: ChatUser) => {
    const id = dmThreadId(user.id);
    setOpenThreads((prev) => {
      const existing = prev.find((t) => t.id === id);
      if (existing) {
        return prev.map((t) =>
          t.id === id ? { ...t, minimized: false } : t,
        );
      }
      const next: ChatThread = {
        id,
        kind: "dm",
        title: user.username,
        peerId: user.id,
        minimized: false,
        unread: 0,
      };
      const without = prev.filter((t) => t.id !== id);
      const stacked = [next, ...without];
      return stacked.slice(0, MAX_OPEN);
    });
  }, []);

  const openRoom = useCallback((room: { id: string; name: string }) => {
    const id = roomThreadId(room.id);
    setOpenThreads((prev) => {
      const existing = prev.find((t) => t.id === id);
      if (existing) {
        return prev.map((t) =>
          t.id === id ? { ...t, minimized: false } : t,
        );
      }
      const next: ChatThread = {
        id,
        kind: "room",
        title: room.name,
        roomId: room.id,
        minimized: false,
        unread: 0,
      };
      return [next, ...prev.filter((t) => t.id !== id)].slice(0, MAX_OPEN);
    });
  }, []);

  const closeThread = useCallback((threadId: string) => {
    setOpenThreads((prev) => prev.filter((t) => t.id !== threadId));
  }, []);

  const minimizeThread = useCallback((threadId: string, minimized = true) => {
    setOpenThreads((prev) =>
      prev.map((t) => (t.id === threadId ? { ...t, minimized } : t)),
    );
  }, []);

  const focusThread = useCallback((threadId: string) => {
    setOpenThreads((prev) => {
      const t = prev.find((x) => x.id === threadId);
      if (!t) return prev;
      return [{ ...t, minimized: false }, ...prev.filter((x) => x.id !== threadId)];
    });
  }, []);

  const value = useMemo(
    () => ({
      openThreads,
      openDm,
      openRoom,
      closeThread,
      minimizeThread,
      focusThread,
    }),
    [openThreads, openDm, openRoom, closeThread, minimizeThread, focusThread],
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat(): ChatContextValue {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChat must be used within ChatProvider");
  return ctx;
}
