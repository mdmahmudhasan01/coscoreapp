import { Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  Search,
  Heart,
  ShoppingBag,
  User,
  Menu,
  Sparkles,
  Instagram,
  Facebook,
  Youtube,
  ChevronDown,
  X,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  Plus,
  Minus,
  Star,
  Eye,
  Truck,
  ShieldCheck,
  RotateCcw,
  Check,
} from "lucide-react";
import { categories, type Product } from "@/lib/shop-catalog";
import { cart, useCart, useCartCount, useCartSubtotal } from "@/lib/cart-store";
import { useAuth } from "@/hooks/use-auth";

import { wishlist, useIsWishlisted } from "@/lib/wishlist-store";
import { SearchBox } from "@/components/site/search-box";
import { fetchHeaderMenu, resolveMediaUrl } from "@/lib/coscore-api";
import pSerum from "@/assets/product-serum.jpg";

/* ───────── Announcement ───────── */
const messages = [
  "Free Delivery on Orders Over ৳2,000",
  "100% Authentic Beauty Products",
  "Easy & Secure Shopping",
];

const mobileMainLinks = [
  { label: "Home", to: "/" as const },
  { label: "Search", to: "/search" as const },
  { label: "My Bag", to: "/cart" as const },
  { label: "Checkout", to: "/checkout" as const },
];

export function AnnouncementBar() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((v) => (v + 1) % messages.length), 3500);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="bg-burgundy text-primary-foreground text-xs sm:text-[13px] py-2.5 text-center tracking-wide font-medium">
      <span className="inline-block" key={i}>
        ✦ {messages[i]} ✦
      </span>
    </div>
  );
}

/* ───────── Mega Menu ───────── */
function MegaPanel({ slug, onClose }: { slug: string; onClose: () => void }) {
  const cat = categories.find((c) => c.slug === slug);
  if (!cat) return null;
  return (
    <div
      className="absolute left-0 right-0 top-full bg-background border-t border-border shadow-luxury z-50"
      onMouseLeave={onClose}
    >
      <div className="container-luxe grid grid-cols-12 gap-8 py-10">
        <div className="col-span-8 grid grid-cols-3 gap-8">
          {cat.columns.map((col) => (
            <div key={col.title}>
              <h4 className="text-[11px] uppercase tracking-[0.25em] font-semibold text-burgundy mb-4">
                {col.title}
              </h4>
              <ul className="space-y-2.5">
                {col.items.map((it) => (
                  <li key={it.slug}>
                    <Link
                      to="/shop/$category"
                      params={{ category: cat.slug }}
                      search={{ sub: it.slug }}
                      onClick={onClose}
                      className="text-sm text-foreground/80 hover:text-burgundy transition"
                    >
                      {it.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="col-span-4">
          <Link
            to="/shop/$category"
            params={{ category: cat.slug }}
            onClick={onClose}
            className="group relative block overflow-hidden rounded-2xl aspect-[4/3] bg-blush/40"
          >
            <img
              src={cat.hero}
              alt={cat.name}
              className="absolute inset-0 h-full w-full object-cover mix-blend-multiply opacity-80 group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/70 to-transparent" />
            <div className="absolute bottom-0 p-5">
              <div className="text-[10px] uppercase tracking-[0.3em] text-burgundy font-semibold">
                Featured
              </div>
              <div className="text-serif text-2xl text-foreground mt-1">Explore {cat.name}</div>
              <div className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-burgundy">
                Shop all <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>
          <div className="mt-4">
            <div className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground mb-2">
              Featured Brands
            </div>
            <div className="flex flex-wrap gap-2">
              {cat.featuredBrands.map((b) => (
                <span
                  key={b}
                  className="text-[11px] px-2.5 py-1 rounded-full bg-ivory border border-border text-foreground/80"
                >
                  {b}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function IconBtn({
  children,
  label,
  to,
  onClick,
}: {
  children: React.ReactNode;
  label: string;
  to?: string;
  onClick?: () => void;
}) {
  const className =
    "hidden sm:grid place-items-center h-10 w-10 rounded-full hover:bg-ivory transition";
  if (to) {
    return (
      <Link to={to} aria-label={label} className={className}>
        {children}
      </Link>
    );
  }
  return (
    <button type="button" aria-label={label} onClick={onClick} className={className}>
      {children}
    </button>
  );
}


export function SiteHeader() {
  const [openSlug, setOpenSlug] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileExpanded, setMobileExpanded] = useState<string | null>(null);
  const [mobileMounted, setMobileMounted] = useState(false);
  useEffect(() => setMobileMounted(true), []);
  const closeTimer = useRef<number | null>(null);
  const toggleMobileCategory = (slug: string) => {
    setMobileExpanded((prev) => (prev === slug ? null : slug));
  };
  const count = useCartCount();
  const { user } = useAuth();

  const { addPulse } = useCart();
  const [pulse, setPulse] = useState(false);
  useEffect(() => {
    if (addPulse === 0) return;
    setPulse(true);
    const t = window.setTimeout(() => setPulse(false), 550);
    return () => window.clearTimeout(t);
  }, [addPulse]);

  const [headerNavItems, setHeaderNavItems] = useState<Array<{ name: string; slug: string }>>(() => {
    return categories.map((c) => ({ name: c.name, slug: c.slug }));
  });

  useEffect(() => {
    fetchHeaderMenu().then((items) => {
      if (items && items.length > 0) {
        setHeaderNavItems(
          items.map((it) => ({
            name: it.label || it.name || it.slug,
            slug: it.slug,
          }))
        );
      }
    });
  }, []);

  const openMenu = (slug: string) => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
    setOpenSlug(slug);
  };
  const scheduleClose = () => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(() => setOpenSlug(null), 120);
  };

  return (
    <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-lg border-b border-border">
      <div className="relative">
        <div className="container-luxe">
          <div className="flex items-center justify-between gap-6 py-4 md:py-5">
            <button
              className="lg:hidden -ml-2 p-2"
              aria-label="Menu"
              onClick={() => {
                setMobileExpanded(null);
                setMobileOpen(true);
              }}
            >
              <Menu className="h-5 w-5" />
            </button>
            <Link to="/" className="flex-shrink-0 block group">
              <img
                src="/logo.png"
                alt="Lookzene — Timeless Beauty"
                className="h-10 sm:h-11 md:h-12 w-auto object-contain transition-transform group-hover:scale-[1.02]"
              />
            </Link>

            <div className="hidden md:flex flex-1 max-w-xl mx-auto">
              <SearchBox />
            </div>

            <div className="flex items-center gap-1.5 sm:gap-3">
              <IconBtn label="Account" to={user ? "/account/rewards" : "/auth"}><User className="h-5 w-5" /></IconBtn>
              <IconBtn label="Wishlist" to="/account/rewards"><Heart className="h-5 w-5" /></IconBtn>

              <button
                type="button"
                onClick={() => cart.openDrawer()}
                aria-label={`Open bag, ${count} item${count === 1 ? "" : "s"}`}
                className={`relative flex items-center gap-2 bg-burgundy text-primary-foreground rounded-full pl-3 pr-4 py-2.5 hover:opacity-90 transition ${
                  pulse ? "animate-[cart-pop_0.55s_ease-out]" : ""
                }`}
              >
                <ShoppingBag className="h-4 w-4" />
                <span className="text-xs font-semibold hidden sm:inline">Bag</span>
                <span
                  key={count}
                  className={`text-[10px] bg-background text-burgundy rounded-full min-w-4 h-4 px-1 grid place-items-center font-bold tabular-nums ${
                    pulse ? "animate-[cart-badge_0.55s_ease-out]" : ""
                  }`}
                >
                  {count}
                </span>
              </button>
            </div>
          </div>

          <div className="md:hidden pb-3">
            <SearchBox compact placeholder="Search beauty..." />
          </div>

          <nav className="hidden lg:flex items-center gap-7 py-3 text-[13px] font-medium tracking-wide">
            {headerNavItems.map((c) => {
              const staticCat = categories.find((cat) => cat.slug === c.slug);
              const hasMega = Boolean(staticCat && staticCat.columns && staticCat.columns.length > 0);

              return (
                <div
                  key={c.slug}
                  onMouseEnter={() => hasMega && openMenu(c.slug)}
                  onMouseLeave={scheduleClose}
                >
                  <Link
                    to="/shop/$category"
                    params={{ category: c.slug }}
                    className="whitespace-nowrap text-foreground/80 hover:text-burgundy transition inline-flex items-center gap-1 py-1"
                    activeProps={{ className: "text-burgundy" }}
                  >
                    {c.name}
                    {hasMega && <ChevronDown className="h-3 w-3 opacity-60" />}
                  </Link>
                </div>
              );
            })}
            <Link
              to="/shop/$category"
              params={{ category: "skincare" }}
              search={{ sort: "newest" }}
              className="ml-auto text-burgundy font-semibold uppercase text-[11px] tracking-[0.2em]"
            >
              New Arrivals →
            </Link>
          </nav>
        </div>

        {openSlug && (
          <div onMouseEnter={() => openMenu(openSlug)}>
            <MegaPanel slug={openSlug} onClose={() => setOpenSlug(null)} />
          </div>
        )}
      </div>

      {/* Mobile drawer */}
      {mobileOpen && mobileMounted &&
        createPortal(
          <div className="fixed inset-0 z-50 h-[100dvh] overflow-hidden lg:hidden">
            <div
              className="absolute inset-0 bg-foreground/40"
              onClick={() => setMobileOpen(false)}
            />
            <div className="absolute inset-y-0 left-0 flex h-[100dvh] w-[min(92vw,24rem)] max-w-full flex-col overflow-hidden bg-background shadow-luxury pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
              <div className="grid shrink-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-4 border-b border-border p-5">
                <Link to="/" onClick={() => setMobileOpen(false)} className="min-w-0 block">
                  <img
                    src="/logo.png"
                    alt="Lookzene"
                    className="h-8 sm:h-9 w-auto object-contain"
                  />
                </Link>
                <button aria-label="Close" onClick={() => setMobileOpen(false)} className="shrink-0 p-2">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-5">
                <nav aria-label="Mobile main navigation" className="space-y-6">
                  <div className="grid grid-cols-2 gap-2 border-b border-border/70 pb-5">
                    {mobileMainLinks.map((link) => (
                      <Link
                        key={link.to}
                        to={link.to}
                        onClick={() => setMobileOpen(false)}
                        className="min-w-0 rounded-lg bg-ivory px-3 py-3 text-sm font-semibold text-foreground transition hover:text-burgundy"
                      >
                        <span className="block truncate">{link.label}</span>
                      </Link>
                    ))}
                  </div>

                  <div>
                    <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                      Shop Categories
                    </div>
                    {headerNavItems.map((c) => {
                      const staticCat = categories.find((cat) => cat.slug === c.slug);
                      const subItems = staticCat ? staticCat.columns.flatMap((col) => col.items) : [];
                      const hasSubs = subItems.length > 0;
                      const isExpanded = mobileExpanded === c.slug;
                      return (
                        <div key={c.slug} className="border-b border-border/60 last:border-0">
                          <div className="grid grid-cols-[minmax(0,auto)_auto] items-center justify-start gap-2 py-3.5">
                            <Link
                              to="/shop/$category"
                              params={{ category: c.slug }}
                              onClick={() => setMobileOpen(false)}
                              className="min-w-0 text-serif text-lg text-foreground transition hover:text-burgundy"
                            >
                              <span className="block truncate">{c.name}</span>
                            </Link>
                            {hasSubs && (
                              <button
                                type="button"
                                aria-label={isExpanded ? `Collapse ${c.name}` : `Expand ${c.name}`}
                                aria-expanded={isExpanded}
                                onClick={() => toggleMobileCategory(c.slug)}
                                className="-m-1 grid h-8 w-8 shrink-0 place-items-center text-foreground/70 transition hover:text-burgundy"
                              >
                                {isExpanded ? (
                                  <Minus className="h-4 w-4" />
                                ) : (
                                  <Plus className="h-4 w-4" />
                                )}
                              </button>
                            )}
                          </div>
                          {isExpanded && hasSubs && (
                            <ul className="ml-1.5 space-y-2.5 border-l border-border pb-4 pl-4">
                              {subItems.map((it) => (
                                <li key={it.slug}>
                                  <Link
                                    to="/shop/$category"
                                    params={{ category: c.slug }}
                                    search={{ sub: it.slug }}
                                    onClick={() => setMobileOpen(false)}
                                    className="block min-w-0 text-sm text-muted-foreground transition hover:text-burgundy"
                                  >
                                    <span className="block truncate">{it.label}</span>
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div className="space-y-1 border-t border-border/70 pt-4">
                  <Link
                    to="/shop/$category"
                    params={{ category: "skincare" }}
                    search={{ sort: "newest" }}
                    onClick={() => setMobileOpen(false)}
                      className="block min-w-0 py-3 text-serif text-lg font-semibold text-burgundy"
                  >
                      <span className="block truncate">New Arrivals</span>
                  </Link>
                  <Link
                    to="/shop/$category"
                    params={{ category: "skincare" }}
                    search={{ sort: "price-asc" }}
                    onClick={() => setMobileOpen(false)}
                      className="block min-w-0 py-3 text-serif text-lg text-foreground transition hover:text-burgundy"
                  >
                      <span className="block truncate">Sale</span>
                    </Link>
                  </div>
                </nav>
              </div>
            </div>
          </div>,
          document.body
        )
      }

      <CartDrawer />
    </header>
  );
}

/* ───────── Product Card ───────── */
export function ProductCard({ p }: { p: Product }) {
  const [quickOpen, setQuickOpen] = useState(false);
  const wished = useIsWishlisted(p.id);

  const badgeTone = {
    burgundy: "bg-burgundy text-primary-foreground",
    emerald: "bg-emerald text-white",
    gold: "bg-gold text-foreground",
    blush: "bg-blush text-foreground",
  }[p.badge?.tone ?? "burgundy"];

  const discount =
    p.compareAt && p.compareAt > p.price
      ? Math.round(((p.compareAt - p.price) / p.compareAt) * 100)
      : 0;

  return (
    <>
      <div className="group bg-card rounded-2xl border border-border overflow-hidden hover:shadow-card transition-all duration-300 flex flex-col">
        <div className="relative aspect-square overflow-hidden bg-ivory">
          {p.badge && (
            <span className={`absolute top-3 left-3 z-10 text-[10px] uppercase tracking-widest font-bold px-2.5 py-1 rounded-full ${badgeTone}`}>
              {p.badge.label}
            </span>
          )}
          <div className="absolute top-3 right-3 z-10 flex flex-col gap-2">
            <button
              aria-label={wished ? "Remove from wishlist" : "Add to wishlist"}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                wishlist.toggle(p.id);
              }}
              className="h-9 w-9 grid place-items-center rounded-full bg-background/90 backdrop-blur hover:bg-burgundy hover:text-primary-foreground transition"
            >
              <Heart className={`h-4 w-4 ${wished ? "fill-burgundy text-burgundy" : ""}`} />
            </button>
          </div>
          <Link
            to="/product/$id"
            params={{ id: p.id }}
            className="absolute inset-0 z-0"
            aria-label={`View ${p.name}`}
          >
            <img
              src={resolveMediaUrl(p.img) || pSerum}
              onError={(e) => {
                (e.target as HTMLImageElement).src = pSerum;
              }}
              alt={p.name}
              loading="lazy"
              className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          </Link>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setQuickOpen(true);
            }}
            className="absolute bottom-0 left-0 right-0 z-10 bg-burgundy text-primary-foreground text-xs font-semibold py-3 translate-y-full group-hover:translate-y-0 transition-all flex items-center justify-center gap-2"
          >
            <Eye className="h-3.5 w-3.5" /> Quick View
          </button>

        </div>

        <div className="p-4 flex flex-col flex-1">
          <div className="text-[11px] uppercase tracking-widest text-muted-foreground font-semibold">
            {p.brand}
          </div>
          <Link
            to="/product/$id"
            params={{ id: p.id }}
            className="mt-1 text-left text-sm font-medium text-foreground line-clamp-2 min-h-[2.5rem] hover:text-burgundy transition"
          >
            {p.name}
          </Link>
          <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground">
            <div className="flex text-gold">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`h-3 w-3 ${i < Math.round(p.rating) ? "fill-current" : ""}`}
                />
              ))}
            </div>
            <span>{p.rating.toFixed(1)}</span>
            <span>({p.reviews.toLocaleString()})</span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-base font-semibold text-foreground">
              <span className="text-xs font-bold text-burgundy mr-0.5">BDT </span>
              {p.price.toLocaleString()}
            </span>
            {p.compareAt && (
              <>
                <span className="text-xs text-muted-foreground line-through">
                  BDT {p.compareAt.toLocaleString()}
                </span>
                {discount > 0 && (
                  <span className="text-xs font-bold text-burgundy">-{discount}%</span>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {quickOpen && (
        <QuickViewModal p={p} discount={discount} onClose={() => setQuickOpen(false)} />
      )}
    </>
  );
}

/* ───────── Quick View Modal ───────── */
function QuickViewModal({
  p,
  discount,
  onClose,
}: {
  p: Product;
  discount: number;
  onClose: () => void;
}) {
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const handleAdd = () => {
    cart.add(p, qty);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1600);
  };


  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center">
      <div
        className="absolute inset-0 bg-foreground/50 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-label={`Quick view: ${p.name}`}
        className="relative w-full sm:w-[92%] sm:max-w-4xl max-h-[92vh] bg-background rounded-t-3xl sm:rounded-3xl shadow-luxury overflow-hidden flex flex-col sm:flex-row animate-in slide-in-from-bottom-8 sm:zoom-in-95 duration-300"
      >
        <button
          onClick={onClose}
          aria-label="Close quick view"
          className="absolute top-4 right-4 z-20 h-10 w-10 grid place-items-center rounded-full bg-background/90 backdrop-blur border border-border hover:bg-burgundy hover:text-primary-foreground transition"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Image gallery */}
        <div className="relative sm:w-1/2 shrink-0">
          <QuickViewGallery p={p} />
        </div>


        {/* Details */}
        <div className="flex-1 min-h-0 overflow-y-auto p-6 sm:p-8">
          <div className="text-[11px] uppercase tracking-[0.25em] text-burgundy font-semibold">
            {p.brand}
          </div>
          <h2 className="text-serif text-2xl md:text-3xl mt-2 leading-tight text-foreground">
            {p.name}
          </h2>

          <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
            <div className="flex text-gold">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`h-3.5 w-3.5 ${i < Math.round(p.rating) ? "fill-current" : ""}`}
                />
              ))}
            </div>
            <span className="font-semibold text-foreground">{p.rating.toFixed(1)}</span>
            <span>({p.reviews.toLocaleString()} reviews)</span>
          </div>

          <div className="mt-5 flex items-baseline gap-3">
            <span className="text-serif text-3xl font-semibold text-foreground">
              ৳{p.price.toLocaleString()}
            </span>
            {p.compareAt && (
              <>
                <span className="text-sm text-muted-foreground line-through">
                  ৳{p.compareAt.toLocaleString()}
                </span>
                {discount > 0 && (
                  <span className="text-xs font-bold text-primary-foreground bg-burgundy rounded-full px-2 py-0.5">
                    -{discount}%
                  </span>
                )}
              </>
            )}
          </div>

          <p className="mt-5 text-sm text-muted-foreground leading-relaxed">
            A premium {p.subcategory.replace(/-/g, " ")} from {p.brand}. Formulated for{" "}
            {p.skinType.join(", ").toLowerCase()} skin and crafted to help with{" "}
            {p.concerns.slice(0, 3).join(", ").toLowerCase()}. 100% authentic — sourced directly
            from authorised distributors.
          </p>

          {/* Attributes */}
          <div className="mt-5 grid grid-cols-2 gap-3 text-xs">
            <AttrRow label="Skin Type" values={p.skinType} />
            <AttrRow label="Concerns" values={p.concerns.slice(0, 4)} />
          </div>

          {/* Stock */}
          <div className="mt-5 flex items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1.5 text-emerald font-semibold">
              <span className="h-2 w-2 rounded-full bg-emerald" /> In Stock — Ships in 24h
            </span>
          </div>


          {/* Qty + CTA */}
          <div className="mt-6 flex items-stretch gap-3">
            <div className="inline-flex items-center border border-border rounded-full">
              <button
                aria-label="Decrease quantity"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="h-11 w-11 grid place-items-center hover:text-burgundy transition"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-8 text-center text-sm font-semibold">{qty}</span>
              <button
                aria-label="Increase quantity"
                onClick={() => setQty((q) => q + 1)}
                className="h-11 w-11 grid place-items-center hover:text-burgundy transition"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <button
              onClick={handleAdd}
              className="flex-1 inline-flex items-center justify-center gap-2 bg-burgundy text-primary-foreground rounded-full px-6 text-sm font-semibold hover:opacity-90 transition"
            >

              {added ? (
                <>
                  <Check className="h-4 w-4" /> Added to Bag
                </>
              ) : (
                <>
                  <ShoppingBag className="h-4 w-4" /> Add to Bag · ৳
                  {(p.price * qty).toLocaleString()}
                </>
              )}
            </button>
            <button
              aria-label="Wishlist"
              className="h-11 w-11 grid place-items-center rounded-full border border-border hover:border-burgundy hover:text-burgundy transition"
            >
              <Heart className="h-4 w-4" />
            </button>
          </div>

          {/* Trust rows */}
          <ul className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3 text-[11px] text-muted-foreground">
            <li className="flex items-center gap-2">
              <Truck className="h-4 w-4 text-burgundy" /> Free delivery over ৳2,000
            </li>
            <li className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-burgundy" /> 100% authentic
            </li>
            <li className="flex items-center gap-2">
              <RotateCcw className="h-4 w-4 text-burgundy" /> Easy returns
            </li>
          </ul>

          <div className="mt-6 pt-5 border-t border-border">
            <button
              onClick={onClose}
              className="text-xs uppercase tracking-[0.25em] font-semibold text-burgundy hover:underline inline-flex items-center gap-1"
            >
              View full details <ArrowRight className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function AttrRow({ label, values }: { label: string; values: string[] }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground font-semibold mb-1.5">
        {label}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {values.map((v) => (
          <span
            key={v}
            className="text-[11px] px-2 py-0.5 rounded-full bg-ivory border border-border text-foreground/80 capitalize"
          >
            {v}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ───────── Footer ───────── */
export function SiteFooter() {
  const cols = [
    {
      title: "Shop",
      items: categories.map((c) => ({ label: c.name, slug: c.slug })),
    },
  ];
  return (
    <footer className="bg-foreground text-background pt-16 md:pt-20 pb-8">
      <div className="container-luxe">
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-10 mb-14">
          <div className="lg:col-span-2 max-w-sm">
            <Link to="/" className="block max-w-[220px]">
              <img
                src="/logo.png"
                alt="Lookzene — Timeless Beauty"
                className="h-12 md:h-14 w-auto object-contain brightness-0 invert opacity-95"
              />
            </Link>
            <p className="mt-5 text-sm text-background/70 leading-relaxed">
              A premium online beauty destination in Bangladesh — curated Korean
              skincare, international beauty and grooming essentials for your
              everyday ritual.
            </p>
            <div className="mt-5 space-y-1.5 text-xs text-background/80">
              <p>📍 <strong>Address:</strong> Dhaka Cantonment, Dhaka, Bangladesh</p>
              <p>📞 <strong>Phone:</strong> <a href="tel:+8801915930000" className="hover:text-blush transition">+880 1915-930000</a></p>
              <p>✉️ <strong>Email:</strong> <a href="mailto:support@lookzene.com" className="hover:text-blush transition">support@lookzene.com</a></p>
            </div>
            <div className="mt-6 flex gap-3">
              {[Instagram, Facebook, Youtube].map((Icon, i) => (
                <a key={i} href="#" className="h-10 w-10 grid place-items-center rounded-full border border-background/20 hover:bg-burgundy hover:border-burgundy transition">
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>
          {cols.map((c) => (
            <div key={c.title}>
              <h4 className="text-[11px] uppercase tracking-[0.25em] font-semibold text-background/60 mb-4">
                {c.title}
              </h4>
              <ul className="space-y-2.5">
                {c.items.map((i) => (
                  <li key={i.slug}>
                    <Link
                      to="/shop/$category"
                      params={{ category: i.slug }}
                      className="text-sm text-background/85 hover:text-blush transition"
                    >
                      {i.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <div>
            <h4 className="text-[11px] uppercase tracking-[0.25em] font-semibold text-background/60 mb-4">
              Customer Care
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link to="/contact" className="text-background/85 hover:text-blush transition">Contact Us</Link></li>
              <li><Link to="/shipping-policy" className="text-background/85 hover:text-blush transition">Shipping & Delivery</Link></li>
              <li><Link to="/return-policy" className="text-background/85 hover:text-blush transition">Return & Refund</Link></li>
              <li><Link to="/privacy-policy" className="text-background/85 hover:text-blush transition">Privacy Policy</Link></li>
              <li><Link to="/faq" className="text-background/85 hover:text-blush transition">FAQ</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-[11px] uppercase tracking-[0.25em] font-semibold text-background/60 mb-4">
              About
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link to="/about" className="text-background/85 hover:text-blush transition">Our Story</Link></li>
              <li><Link to="/authenticity" className="text-background/85 hover:text-blush transition">Authenticity</Link></li>
              <li><Link to="/terms" className="text-background/85 hover:text-blush transition">Terms & Conditions</Link></li>
              <li><Link to="/careers" className="text-background/85 hover:text-blush transition">Careers</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-background/10 pt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-background/60">
          <div>© {new Date().getFullYear()} Lookzene. All Rights Reserved.</div>
          <div className="flex gap-2 text-[10px] tracking-widest uppercase">
            <span>Visa</span>·<span>Mastercard</span>·<span>bKash</span>·<span>Nagad</span>·<span>COD</span>
          </div>
        </div>
      </div>
      <div className="h-16 md:hidden" />
      <MobileBottomNav />
    </footer>
  );
}

export function MobileBottomNav() {
  const count = useCartCount();
  const items: {
    icon: typeof Sparkles;
    label: string;
    to?: "/" | "/shop/$category";
    params?: { category: string };
    action?: () => void;
    badge?: number;
  }[] = [
    { icon: Sparkles, label: "Home", to: "/" },
    { icon: Menu, label: "Shop", to: "/shop/$category", params: { category: "skincare" } },
    { icon: Search, label: "Search" },
    { icon: Heart, label: "Saved" },
    { icon: ShoppingBag, label: "Bag", action: () => cart.openDrawer(), badge: count },
  ];
  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 md:hidden bg-background/95 backdrop-blur border-t border-border">
      <div className="grid grid-cols-5">
        {items.map(({ icon: Icon, label, to, params, action, badge }) =>
          to ? (
            <Link
              key={label}
              to={to}
              params={params as never}
              className="flex flex-col items-center gap-1 py-2.5 text-[10px] text-muted-foreground hover:text-burgundy transition"
            >
              <Icon className="h-5 w-5" />
              {label}
            </Link>
          ) : (
            <button
              key={label}
              type="button"
              onClick={action}
              className="relative flex flex-col items-center gap-1 py-2.5 text-[10px] text-muted-foreground hover:text-burgundy transition"
            >
              <span className="relative">
                <Icon className="h-5 w-5" />
                {badge && badge > 0 ? (
                  <span className="absolute -top-1.5 -right-2 min-w-4 h-4 px-1 grid place-items-center rounded-full bg-burgundy text-primary-foreground text-[9px] font-bold tabular-nums">
                    {badge}
                  </span>
                ) : null}
              </span>
              {label}
            </button>
          )
        )}
      </div>
    </nav>
  );
}

/* ───────── Quick View Gallery ───────── */
function QuickViewGallery({ p }: { p: Product }) {
  // Build a multi-view gallery from the single product image using different
  // framings so navigation and thumbnails feel real without extra assets.
  const views = [
    { src: p.img, pos: "center" },
    { src: p.img, pos: "top" },
    { src: p.img, pos: "bottom" },
    { src: p.img, pos: "left" },
  ];
  const [idx, setIdx] = useState(0);
  const [loaded, setLoaded] = useState<Record<number, boolean>>({});
  const [zoom, setZoom] = useState(false);
  const [origin, setOrigin] = useState({ x: 50, y: 50 });
  const frameRef = useRef<HTMLDivElement>(null);

  const go = (n: number) => setIdx((n + views.length) % views.length);
  const isLoaded = !!loaded[idx];

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") go(idx + 1);
      if (e.key === "ArrowLeft") go(idx - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [idx]);

  const onMove = (e: React.MouseEvent) => {
    if (!zoom || !frameRef.current) return;
    const r = frameRef.current.getBoundingClientRect();
    setOrigin({
      x: ((e.clientX - r.left) / r.width) * 100,
      y: ((e.clientY - r.top) / r.height) * 100,
    });
  };

  return (
    <div className="flex flex-col">
      <div
        ref={frameRef}
        onMouseEnter={() => setZoom(true)}
        onMouseLeave={() => setZoom(false)}
        onMouseMove={onMove}
        onClick={() => setZoom((z) => !z)}
        className="relative aspect-square sm:aspect-[4/5] bg-ivory overflow-hidden cursor-zoom-in group select-none"
      >
        {p.badge && (
          <span
            className={`absolute top-4 left-4 z-20 text-[10px] uppercase tracking-widest font-bold px-2.5 py-1 rounded-full ${
              {
                burgundy: "bg-burgundy text-primary-foreground",
                emerald: "bg-emerald text-white",
                gold: "bg-gold text-foreground",
                blush: "bg-blush text-foreground",
              }[p.badge.tone]
            }`}
          >
            {p.badge.label}
          </span>
        )}

        {/* Skeleton */}
        {!isLoaded && (
          <div className="absolute inset-0 z-10 bg-gradient-to-r from-ivory via-blush/30 to-ivory bg-[length:200%_100%] animate-[shimmer_1.4s_ease-in-out_infinite]" />
        )}

        {/* Slides */}
        {views.map((v, i) => (
          <img
            key={i}
            src={v.src}
            alt={`${p.name} — view ${i + 1}`}
            onLoad={() => setLoaded((s) => ({ ...s, [i]: true }))}
            style={
              i === idx && zoom
                ? {
                    transform: "scale(1.8)",
                    transformOrigin: `${origin.x}% ${origin.y}%`,
                    objectPosition: v.pos,
                  }
                : { objectPosition: v.pos }
            }
            className={`absolute inset-0 h-full w-full object-cover transition-[opacity,transform] duration-500 ease-out ${
              i === idx ? "opacity-100" : "opacity-0 pointer-events-none"
            } ${i === idx && !zoom ? "group-hover:scale-[1.03]" : ""}`}
            draggable={false}
          />
        ))}

        {/* Zoom hint */}
        <div className="absolute bottom-4 right-4 z-20 h-9 w-9 grid place-items-center rounded-full bg-background/85 backdrop-blur border border-border text-foreground/80 opacity-0 group-hover:opacity-100 transition">
          <ZoomIn className="h-4 w-4" />
        </div>

        {/* Prev / Next */}
        <button
          type="button"
          aria-label="Previous image"
          onClick={(e) => {
            e.stopPropagation();
            go(idx - 1);
          }}
          className="absolute left-3 top-1/2 -translate-y-1/2 z-20 h-10 w-10 grid place-items-center rounded-full bg-background/85 backdrop-blur border border-border hover:bg-burgundy hover:text-primary-foreground transition opacity-0 group-hover:opacity-100"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button
          type="button"
          aria-label="Next image"
          onClick={(e) => {
            e.stopPropagation();
            go(idx + 1);
          }}
          className="absolute right-3 top-1/2 -translate-y-1/2 z-20 h-10 w-10 grid place-items-center rounded-full bg-background/85 backdrop-blur border border-border hover:bg-burgundy hover:text-primary-foreground transition opacity-0 group-hover:opacity-100"
        >
          <ChevronRight className="h-4 w-4" />
        </button>

        {/* Counter + dots */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-background/85 backdrop-blur border border-border rounded-full px-3 py-1.5">
            {views.map((_, i) => (
              <button
                key={i}
                aria-label={`Go to image ${i + 1}`}
                onClick={(e) => {
                  e.stopPropagation();
                  go(i);
                }}
                className={`h-1.5 rounded-full transition-all ${
                  i === idx ? "w-5 bg-burgundy" : "w-1.5 bg-foreground/25 hover:bg-foreground/50"
                }`}
              />
            ))}
            <span className="ml-1 text-[10px] font-semibold text-foreground/70 tabular-nums">
              {idx + 1}/{views.length}
            </span>
          </div>
        </div>
      </div>

      {/* Thumbnails */}
      <div className="flex gap-2 p-3 sm:p-4 bg-background border-t border-border">
        {views.map((v, i) => (
          <button
            key={i}
            onClick={() => go(i)}
            aria-label={`Show image ${i + 1}`}
            aria-current={i === idx}
            className={`relative h-16 w-16 rounded-xl overflow-hidden border-2 transition ${
              i === idx ? "border-burgundy shadow-sm" : "border-transparent hover:border-border"
            }`}
          >
            <img
              src={v.src}
              alt=""
              style={{ objectPosition: v.pos }}
              className="h-full w-full object-cover"
            />
          </button>
        ))}
      </div>
    </div>
  );
}


/* ───────── Cart Drawer ───────── */
export function CartDrawer() {
  const { items, drawerOpen } = useCart();
  const subtotal = useCartSubtotal();
  const count = items.reduce((s, it) => s + it.qty, 0);
  const FREE_THRESHOLD = 1500;
  const missingForFree = Math.max(0, FREE_THRESHOLD - subtotal);
  const progress = Math.min(100, (subtotal / FREE_THRESHOLD) * 100);

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!drawerOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && cart.closeDrawer();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [drawerOpen]);

  if (!mounted) return null;

  return createPortal(
    <div
      className={`fixed inset-0 z-[70] overflow-hidden ${drawerOpen ? "" : "pointer-events-none"}`}
      aria-hidden={!drawerOpen}
    >
      <div
        onClick={() => cart.closeDrawer()}
        className={`absolute inset-0 bg-foreground/50 backdrop-blur-sm transition-opacity duration-300 ${
          drawerOpen ? "opacity-100" : "opacity-0"
        }`}
      />
      <aside
        role="dialog"
        aria-label="Shopping bag"
        className={`absolute right-0 top-0 h-full w-full sm:w-[440px] bg-background shadow-luxury flex flex-col transition-transform duration-300 ease-[cubic-bezier(0.22,0.61,0.36,1)] ${
          drawerOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-burgundy" />
            <h2 className="text-serif text-xl">Your Bag</h2>
            <span className="text-xs text-muted-foreground">
              ({count} item{count === 1 ? "" : "s"})
            </span>
          </div>
          <button
            aria-label="Close bag"
            onClick={() => cart.closeDrawer()}
            className="h-9 w-9 grid place-items-center rounded-full hover:bg-ivory transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Free shipping progress */}
        {items.length > 0 && (
          <div className="px-5 py-3 bg-blush/25 border-b border-blush/60">
            <div className="text-xs font-semibold text-burgundy">
              {missingForFree > 0
                ? `Add ৳${missingForFree.toLocaleString()} more for FREE delivery`
                : "You've unlocked FREE delivery ✨"}
            </div>
            <div className="mt-1.5 h-1 rounded-full bg-background overflow-hidden">
              <div
                className="h-full bg-burgundy transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Items */}
        <div className="flex-1 overflow-y-auto">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center px-6 py-12">
              <div className="h-16 w-16 rounded-full bg-ivory grid place-items-center mb-4">
                <ShoppingBag className="h-7 w-7 text-burgundy" />
              </div>
              <h3 className="text-serif text-2xl">Your bag is empty</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Discover our best-selling skincare and beauty edits.
              </p>
              <button
                onClick={() => cart.closeDrawer()}
                className="mt-6 inline-flex items-center gap-2 bg-burgundy text-primary-foreground rounded-full px-6 py-3 text-sm font-semibold hover:shadow-luxury transition-all"
              >
                Continue Shopping
              </button>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {items.map((it) => (
                <li key={it.id} className="p-4 flex gap-3">
                  <div className="h-20 w-20 rounded-lg overflow-hidden bg-ivory shrink-0">
                    <img
                      src={resolveMediaUrl(it.img) || pSerum}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = pSerum;
                      }}
                      alt={it.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
                      {it.brand}
                    </div>
                    <div className="text-sm font-medium line-clamp-2 pr-2">
                      {it.name}
                    </div>
                    {it.variant && (
                      <div className="text-[11px] text-muted-foreground mt-0.5">
                        {it.variant}
                      </div>
                    )}
                    <div className="mt-2 flex items-center justify-between">
                      <div className="inline-flex items-center border border-border rounded-full">
                        <button
                          type="button"
                          aria-label="Decrease"
                          onClick={() => cart.increment(it.id, -1)}
                          disabled={it.qty <= 1}
                          className="h-7 w-7 grid place-items-center hover:text-burgundy disabled:opacity-40"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="text-xs font-semibold w-7 text-center tabular-nums">
                          {it.qty}
                        </span>
                        <button
                          type="button"
                          aria-label="Increase"
                          onClick={() => cart.increment(it.id, 1)}
                          className="h-7 w-7 grid place-items-center hover:text-burgundy"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                      <div className="text-sm font-semibold">
                        ৳{(it.price * it.qty).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    aria-label={`Remove ${it.name}`}
                    onClick={() => cart.remove(it.id)}
                    className="text-muted-foreground hover:text-burgundy self-start"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-border p-5 space-y-3 bg-background">
            <div className="flex items-baseline justify-between">
              <span className="text-sm text-muted-foreground">Subtotal</span>
              <span className="text-serif text-2xl">
                ৳{subtotal.toLocaleString()}
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Shipping and taxes calculated at checkout.
            </p>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <Link
                to="/cart"
                onClick={() => cart.closeDrawer()}
                className="rounded-full border border-border py-3 text-xs font-semibold hover:border-burgundy hover:text-burgundy transition text-center"
              >
                View Bag
              </Link>

              <Link
                to="/checkout"
                onClick={() => cart.closeDrawer()}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-burgundy text-primary-foreground py-3 text-xs font-semibold hover:shadow-luxury transition-all"
              >
                Checkout <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        )}
      </aside>
    </div>,
    document.body,
  );
}
