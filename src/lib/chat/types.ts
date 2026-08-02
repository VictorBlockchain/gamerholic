export type ChatUser = {
  id: string;
  username: string;
  avatarUrl?: string;
  principal?: string;
  status: "online" | "away" | "offline";
  /** Currently in-lobby / active title (optional) */
  game?: string;
  /**
   * Games this user plays — stored on profile.
   * Used to filter online list & match room discovery.
   */
  games?: string[];
  record?: string;
};

/** True when `u` is the signed-in viewer (exclude from Online challenge/DM lists). */
export function isSelfChatUser(
  u: Pick<ChatUser, "id" | "principal" | "username">,
  me: {
    id?: string | null;
    principal?: string | null;
    username?: string | null;
  },
): boolean {
  const mine = [me.principal, me.id]
    .map((s) => (s || "").trim().toLowerCase())
    .filter(Boolean);
  const theirs = [u.principal, u.id]
    .map((s) => (s || "").trim().toLowerCase())
    .filter(Boolean);
  if (mine.some((m) => theirs.includes(m))) return true;
  const myName = (me.username || "").trim().toLowerCase();
  const theirName = (u.username || "").trim().toLowerCase();
  if (myName && theirName && myName === theirName) return true;
  return false;
}

/** Online list without the current user */
export function excludeSelfChatUsers(
  users: ChatUser[],
  me: {
    id?: string | null;
    principal?: string | null;
    username?: string | null;
  },
): ChatUser[] {
  return users.filter((u) => !isSelfChatUser(u, me));
}

export type ChatMessage = {
  id: string;
  threadId: string;
  senderId: string;
  body: string;
  createdAt: string;
};

export type ChatThreadKind = "dm" | "room";

export type ChatThread = {
  id: string;
  kind: ChatThreadKind;
  title: string;
  peerId?: string;
  roomId?: string;
  unread?: number;
  minimized?: boolean;
};

export type ChatRoom = {
  id: string;
  name: string;
  topic: string;
  members: number;
  live: boolean;
  game?: string;
};

/** Supabase `messages` table shape (document for SQL setup) */
export type DbMessage = {
  id: string;
  thread_id: string;
  sender_id: string;
  body: string;
  created_at: string;
};
