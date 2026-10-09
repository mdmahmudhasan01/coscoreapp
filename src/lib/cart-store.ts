import { useSyncExternalStore } from "react";
import type { Product } from "./shop-catalog";
import { trackMetaAddToCart } from "./meta-tracker";

export type CartItem = {
  id: string;
  name: string;
  brand: string;
  img: string;
  price: number;
  compareAt?: number;
  variant?: string;
  qty: number;
};

type CartState = {
  items: CartItem[];
  /** Bumped whenever an item is added — subscribers can play "pulse" animations. */
  addPulse: number;
  /** Whether the cart drawer is open. */
  drawerOpen: boolean;
};

const STORAGE_KEY = "lookzene:cart:v1";
const isBrowser = typeof window !== "undefined";

function loadInitial(): CartItem[] {
  if (!isBrowser) return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((x) => x && typeof x.id === "string" && typeof x.price === "number")
      .map((x) => ({ ...x, qty: Math.max(1, Number(x.qty) || 1) }));
  } catch {
    return [];
  }
}

let state: CartState = {
  items: loadInitial(),
  addPulse: 0,
  drawerOpen: false,
};

const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

function persist(items: CartItem[]) {
  if (!isBrowser) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    /* ignore quota / privacy errors */
  }
}

function setState(patch: Partial<CartState>) {
  state = { ...state, ...patch };
  emit();
}

/** Cross-tab sync */
if (isBrowser) {
  window.addEventListener("storage", (e) => {
    if (e.key !== STORAGE_KEY) return;
    setState({ items: loadInitial() });
  });
}

/* ───────── mutations ───────── */
export const cart = {
  add(
    p: Pick<Product, "id" | "name" | "brand" | "img" | "price" | "compareAt">,
    qty = 1,
    variant?: string,
  ) {
    const key = variant ? `${p.id}::${variant}` : p.id;
    const existing = state.items.find((it) => it.id === key);
    const nextItems = existing
      ? state.items.map((it) =>
          it.id === key ? { ...it, qty: Math.min(99, it.qty + qty) } : it,
        )
      : [
          ...state.items,
          {
            id: key,
            name: p.name,
            brand: p.brand,
            img: p.img,
            price: p.price,
            compareAt: p.compareAt,
            variant,
            qty: Math.min(99, qty),
          },
        ];
    persist(nextItems);
    setState({ items: nextItems, addPulse: state.addPulse + 1, drawerOpen: true });
    try {
      trackMetaAddToCart({ id: p.id, name: p.name, price: p.price, qty });
    } catch (_) {}
  },
  setQty(id: string, qty: number) {
    const clamped = Math.max(1, Math.min(99, Math.floor(qty)));
    const nextItems = state.items.map((it) =>
      it.id === id ? { ...it, qty: clamped } : it,
    );
    persist(nextItems);
    setState({ items: nextItems });
  },
  increment(id: string, delta: number) {
    const item = state.items.find((it) => it.id === id);
    if (!item) return;
    cart.setQty(id, item.qty + delta);
  },
  remove(id: string) {
    const nextItems = state.items.filter((it) => it.id !== id);
    persist(nextItems);
    setState({ items: nextItems });
  },
  clear() {
    persist([]);
    setState({ items: [] });
  },
  openDrawer() {
    setState({ drawerOpen: true });
  },
  closeDrawer() {
    setState({ drawerOpen: false });
  },
};

/* ───────── React bindings ───────── */
function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

const emptyItems: CartItem[] = [];
const emptySnapshot: CartState = {
  items: emptyItems,
  addPulse: 0,
  drawerOpen: false,
};
const getServerSnapshot = () => emptySnapshot;

export function useCart(): CartState {
  return useSyncExternalStore(subscribe, () => state, getServerSnapshot);
}

export function useCartCount(): number {
  const { items } = useCart();
  return items.reduce((s, it) => s + it.qty, 0);
}

export function useCartSubtotal(): number {
  const { items } = useCart();
  return items.reduce((s, it) => s + it.price * it.qty, 0);
}
