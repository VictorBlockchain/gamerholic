"use client";

import { getSupabase, isSupabaseConfigured } from "@/lib/supabase/client";
import { GH_TABLES } from "@/lib/supabase/tables";
import type { ChatMessage, DbMessage } from "./types";

type MessageHandler = (msg: ChatMessage) => void;
type Unsub = () => void;

const MSG_TABLE = GH_TABLES.messages;

function mapDb(row: DbMessage): ChatMessage {
  return {
    id: row.id,
    threadId: row.thread_id,
    senderId: row.sender_id,
    body: row.body,
    createdAt: row.created_at,
  };
}

/** In-memory bus when Supabase env is missing (UI demo) */
const localThreads = new Map<string, ChatMessage[]>();
const localListeners = new Map<string, Set<MessageHandler>>();

function localEmit(threadId: string, msg: ChatMessage) {
  const set = localListeners.get(threadId);
  set?.forEach((fn) => fn(msg));
}

/**
 * Load recent messages for a DM or room thread.
 * Table: `gh_messages`
 */
export async function fetchMessages(
  threadId: string,
  limit = 50,
): Promise<ChatMessage[]> {
  const sb = getSupabase();
  if (sb) {
    const { data, error } = await sb
      .from(MSG_TABLE)
      .select("id,thread_id,sender_id,body,created_at")
      .eq("thread_id", threadId)
      .order("created_at", { ascending: true })
      .limit(limit);
    if (error) {
      console.warn("[chat] fetchMessages", error.message);
      return localThreads.get(threadId) ?? [];
    }
    return (data as DbMessage[]).map(mapDb);
  }
  return [...(localThreads.get(threadId) ?? [])];
}

/**
 * Send a message — Supabase insert on `gh_messages` or local emit.
 */
export async function sendMessage(opts: {
  threadId: string;
  senderId: string;
  body: string;
}): Promise<ChatMessage | null> {
  const body = opts.body.trim().slice(0, 500);
  if (!body) return null;

  const sb = getSupabase();
  if (sb) {
    const { data, error } = await sb
      .from(MSG_TABLE)
      .insert({
        thread_id: opts.threadId,
        sender_id: opts.senderId,
        body,
      })
      .select("id,thread_id,sender_id,body,created_at")
      .single();
    if (error) {
      console.warn("[chat] sendMessage", error.message);
    } else if (data) {
      return mapDb(data as DbMessage);
    }
  }

  const msg: ChatMessage = {
    id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    threadId: opts.threadId,
    senderId: opts.senderId,
    body,
    createdAt: new Date().toISOString(),
  };
  const list = localThreads.get(opts.threadId) ?? [];
  list.push(msg);
  localThreads.set(opts.threadId, list);
  localEmit(opts.threadId, msg);

  if (opts.threadId.startsWith("dm:") && opts.senderId === "me") {
    window.setTimeout(() => {
      const reply: ChatMessage = {
        id: `local-reply-${Date.now()}`,
        threadId: opts.threadId,
        senderId: opts.threadId.replace("dm:", ""),
        body: "gg — I'm online. Challenge me when you're ready ⚔️",
        createdAt: new Date().toISOString(),
      };
      const next = localThreads.get(opts.threadId) ?? [];
      next.push(reply);
      localThreads.set(opts.threadId, next);
      localEmit(opts.threadId, reply);
    }, 900 + Math.random() * 800);
  }

  return msg;
}

/**
 * Subscribe to new messages on a thread (`gh_messages` Realtime).
 */
export function subscribeMessages(
  threadId: string,
  onMessage: MessageHandler,
): Unsub {
  const sb = getSupabase();
  if (sb) {
    const channel = sb
      .channel(`gh_messages:${threadId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: MSG_TABLE,
          filter: `thread_id=eq.${threadId}`,
        },
        (payload) => {
          onMessage(mapDb(payload.new as DbMessage));
        },
      )
      .subscribe();
    return () => {
      void sb.removeChannel(channel);
    };
  }

  let set = localListeners.get(threadId);
  if (!set) {
    set = new Set();
    localListeners.set(threadId, set);
  }
  set.add(onMessage);
  return () => {
    set?.delete(onMessage);
  };
}

export function chatBackendLabel(): string {
  return isSupabaseConfigured()
    ? `Supabase · ${MSG_TABLE}`
    : "Demo local bus";
}

export function dmThreadId(peerUserId: string): string {
  return `dm:${peerUserId}`;
}

export function roomThreadId(roomId: string): string {
  return `room:${roomId}`;
}
