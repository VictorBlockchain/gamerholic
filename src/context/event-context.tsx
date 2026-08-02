"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { createEventBus, type EventBus, type GhEvent } from "@/lib/events";

type EventContextValue = {
  bus: EventBus;
  recent: GhEvent[];
  emit: EventBus["emit"];
  on: EventBus["on"];
};

const EventContext = createContext<EventContextValue | null>(null);

export function useGhEvents(): EventContextValue {
  const ctx = useContext(EventContext);
  if (!ctx) {
    // Safe fallback outside provider (demo / partial trees)
    const bus = createEventBus();
    return {
      bus,
      recent: [],
      emit: bus.emit.bind(bus),
      on: bus.on.bind(bus),
    };
  }
  return ctx;
}

/** App-wide event bus — Supabase streams + FE actions land here */
export function GhEventProvider({ children }: { children: ReactNode }) {
  const bus = useMemo(() => createEventBus(), []);
  const [recent, setRecent] = useState<GhEvent[]>([]);

  useEffect(() => {
    return bus.on(() => setRecent(bus.recent(40)));
  }, [bus]);

  // Keep emit/on identity stable so Realtime subscriptions don't re-bind
  // every time `recent` updates (that caused reload storms).
  const emit = useMemo(() => bus.emit.bind(bus), [bus]);
  const on = useMemo(() => bus.on.bind(bus), [bus]);
  const value = useMemo(
    () => ({
      bus,
      recent,
      emit,
      on,
    }),
    [bus, recent, emit, on],
  );

  return (
    <EventContext.Provider value={value}>{children}</EventContext.Provider>
  );
}
