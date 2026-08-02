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
