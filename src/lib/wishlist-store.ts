import { useSyncExternalStore } from "react";

const STORAGE_KEY = "lookzene:wishlist:v1";
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

if (isBrowser) {
  window.addEventListener("storage", (e) => {
    if (e.key !== STORAGE_KEY) return;
    ids = load();
    emit();
  });
}

export const wishlist = {
  has(id: string) {
    return ids.includes(id);
  },
  toggle(id: string) {
    ids = ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id];
    persist();
    emit();
  },
  add(id: string) {
    if (ids.includes(id)) return;
    ids = [...ids, id];
    persist();
    emit();
  },
  remove(id: string) {
    ids = ids.filter((x) => x !== id);
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

const emptySnap: string[] = [];
const getServerSnap = () => emptySnap;

export function useWishlist(): string[] {
  return useSyncExternalStore(subscribe, () => ids, getServerSnap);
}

export function useIsWishlisted(id: string): boolean {
  const all = useWishlist();
  return all.includes(id);
}
