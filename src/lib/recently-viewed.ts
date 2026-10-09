import { useSyncExternalStore } from "react";

const STORAGE_KEY = "lookzene:recently-viewed:v1";
const MAX = 12;
const isBrowser = typeof window !== "undefined";

function load(): string[] {
  if (!isBrowser) return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

let ids: string[] = load();
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

function persist() {
  if (!isBrowser) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch {
    /* ignore */
  }
}

export const recentlyViewed = {
  push(id: string) {
    ids = [id, ...ids.filter((x) => x !== id)].slice(0, MAX);
    persist();
    emit();
  },
  all() {
    return ids;
  },
};

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}
const empty: string[] = [];
const getServerSnap = () => empty;

export function useRecentlyViewed(): string[] {
  return useSyncExternalStore(subscribe, () => ids, getServerSnap);
}
