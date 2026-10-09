import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronRight, Minus, Plus, ShoppingBag, Trash2, ArrowRight, Heart } from "lucide-react";
import { AnnouncementBar, SiteHeader, SiteFooter } from "@/components/site/chrome";
import { cart, useCart, useCartSubtotal } from "@/lib/cart-store";
import { wishlist, useIsWishlisted } from "@/lib/wishlist-store";
import { LoyaltyPanel } from "@/components/site/loyalty-panel";
import pSerum from "@/assets/product-serum.jpg";
import { resolveMediaUrl } from "@/lib/coscore-api";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      { title: "Your Bag — Lookzene" },
      { name: "description", content: "Review the items in your Lookzene bag and proceed to checkout." },
      { name: "robots", content: "noindex, follow" },
      { property: "og:title", content: "Your Bag — Lookzene" },
      { property: "og:description", content: "Review the items in your Lookzene bag and proceed to checkout." },
    ],
  }),
  component: CartPage,
});

const FREE_THRESHOLD = 1500;
const DELIVERY_FLAT = 60;

function CartPage() {
  const { items } = useCart();
  const subtotal = useCartSubtotal();
  const delivery = items.length === 0 ? 0 : subtotal >= FREE_THRESHOLD ? 0 : DELIVERY_FLAT;
  const discount = items.reduce(
    (s, it) => s + (it.compareAt && it.compareAt > it.price ? (it.compareAt - it.price) * it.qty : 0),
    0,
  );
  const total = subtotal + delivery;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AnnouncementBar />
      <SiteHeader />

      <section className="gradient-hero-bg border-b border-border">
        <div className="container-luxe py-8 md:py-12">
          <nav aria-label="Breadcrumb" className="mb-3">
            <ol className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <li className="flex items-center gap-2">
                <Link to="/" className="hover:text-burgundy transition-colors">Home</Link>
                <ChevronRight className="h-3 w-3" aria-hidden />
              </li>
              <li><span className="text-foreground font-medium">Your Bag</span></li>
            </ol>
          </nav>
          <h1 className="text-serif text-3xl md:text-5xl leading-tight">Your Bag</h1>
          <p className="mt-2 text-muted-foreground text-sm">
            {items.length === 0
              ? "No items yet — start exploring our curated beauty edits."
              : `${items.reduce((s, it) => s + it.qty, 0)} item${items.reduce((s, it) => s + it.qty, 0) === 1 ? "" : "s"} in your bag`}
          </p>
        </div>
      </section>

      <section className="container-luxe py-10 md:py-14">
        {items.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid lg:grid-cols-[1fr_380px] gap-8 lg:gap-12">
            <div>
              <ul className="divide-y divide-border border border-border rounded-2xl overflow-hidden bg-card">
                {items.map((it) => (
                  <CartRow key={it.id} it={it} />
                ))}
              </ul>
              <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
                <Link
                  to="/"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-burgundy hover:underline"
                >
                  ← Continue Shopping
                </Link>
                <button
                  onClick={() => cart.clear()}
                  className="text-xs uppercase tracking-widest text-muted-foreground hover:text-burgundy transition"
                >
                  Clear bag
                </button>
              </div>
            </div>

            <aside className="lg:sticky lg:top-32 self-start space-y-4">
              <LoyaltyPanel subtotal={subtotal} />
              <div className="border border-border rounded-2xl p-6 bg-card space-y-4">
                <h2 className="text-serif text-2xl">Order Summary</h2>
                <div className="space-y-2 text-sm">
                  <Row label="Subtotal" value={`৳${subtotal.toLocaleString()}`} />
                  <Row
                    label="Delivery"
                    value={delivery === 0 ? "FREE" : `৳${delivery.toLocaleString()}`}
                  />
                  {discount > 0 && (
                    <Row label="You save" value={`- ৳${discount.toLocaleString()}`} tone="emerald" />
                  )}
                </div>
                <div className="border-t border-border pt-3 flex items-baseline justify-between">
                  <span className="text-sm font-semibold">Total</span>
                  <span className="text-serif text-2xl">৳{total.toLocaleString()}</span>
                </div>
                {subtotal < FREE_THRESHOLD && (
                  <div className="text-xs bg-blush/30 text-burgundy rounded-lg p-3">
                    Add ৳{(FREE_THRESHOLD - subtotal).toLocaleString()} more for FREE delivery.
                  </div>
                )}
                <Link
                  to="/checkout"
                  className="w-full inline-flex items-center justify-center gap-2 bg-burgundy text-primary-foreground rounded-full py-3.5 text-sm font-semibold hover:shadow-luxury transition"
                >
                  Proceed to Checkout <ArrowRight className="h-4 w-4" />
                </Link>
                <p className="text-[11px] text-center text-muted-foreground">
                  Secure checkout · Cash on Delivery available
                </p>
              </div>
            </aside>
          </div>
        )}
      </section>

      <SiteFooter />
    </div>
  );
}

function CartRow({ it }: { it: ReturnType<typeof useCart>["items"][number] }) {
  const baseId = it.id.split("::")[0];
  const wished = useIsWishlisted(baseId);
  return (
    <li className="p-4 md:p-5 flex gap-4">
      <div className="h-24 w-24 md:h-28 md:w-28 rounded-xl overflow-hidden bg-ivory shrink-0">
        <img
          src={resolveMediaUrl(it.img) || pSerum}
          onError={(e) => {
            (e.target as HTMLImageElement).src = pSerum;
          }}
          alt={it.name}
          className="h-full w-full object-cover"
        />
      </div>
      <div className="flex-1 min-w-0 flex flex-col">
        <div className="text-[11px] uppercase tracking-widest text-muted-foreground font-semibold">
          {it.brand}
        </div>
        <div className="text-sm md:text-base font-medium line-clamp-2 mt-0.5">{it.name}</div>
        {it.variant && (
          <div className="text-xs text-muted-foreground mt-0.5">{it.variant}</div>
        )}
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-sm font-semibold">৳{it.price.toLocaleString()}</span>
          {it.compareAt && it.compareAt > it.price && (
            <span className="text-xs text-muted-foreground line-through">
              ৳{it.compareAt.toLocaleString()}
            </span>
          )}
        </div>
        <div className="mt-auto pt-3 flex flex-wrap items-center gap-3 justify-between">
          <div className="inline-flex items-center border border-border rounded-full">
            <button
              aria-label="Decrease"
              onClick={() => cart.increment(it.id, -1)}
              disabled={it.qty <= 1}
              className="h-8 w-8 grid place-items-center hover:text-burgundy disabled:opacity-40"
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
            <span className="text-sm font-semibold w-8 text-center tabular-nums">{it.qty}</span>
            <button
              aria-label="Increase"
              onClick={() => cart.increment(it.id, 1)}
              className="h-8 w-8 grid place-items-center hover:text-burgundy"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => wishlist.toggle(baseId)}
              className="text-xs text-muted-foreground hover:text-burgundy inline-flex items-center gap-1"
            >
              <Heart className={`h-3.5 w-3.5 ${wished ? "fill-burgundy text-burgundy" : ""}`} />
              {wished ? "Saved" : "Save"}
            </button>
            <button
              onClick={() => cart.remove(it.id)}
              className="text-xs text-muted-foreground hover:text-burgundy inline-flex items-center gap-1"
            >
              <Trash2 className="h-3.5 w-3.5" /> Remove
            </button>
            <span className="text-sm font-semibold">
              ৳{(it.price * it.qty).toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </li>
  );
}

function Row({ label, value, tone }: { label: string; value: string; tone?: "emerald" }) {
  return (
    <div className="flex items-baseline justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={tone === "emerald" ? "text-emerald font-semibold" : "font-medium"}>
        {value}
      </span>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-16 border border-dashed border-border rounded-3xl max-w-2xl mx-auto">
      <div className="h-20 w-20 rounded-full bg-blush/40 grid place-items-center mx-auto">
        <ShoppingBag className="h-9 w-9 text-burgundy" />
      </div>
      <h2 className="text-serif text-3xl mt-6">Your Bag is Empty</h2>
      <p className="mt-2 text-muted-foreground text-sm">
        Looks like you haven't added anything to your bag yet.
      </p>
      <Link
        to="/"
        className="mt-8 inline-flex items-center gap-2 bg-burgundy text-primary-foreground rounded-full px-8 py-3.5 text-sm font-semibold hover:shadow-luxury transition"
      >
        Continue Shopping <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}
