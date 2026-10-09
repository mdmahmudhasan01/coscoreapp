import { Link, useNavigate } from "@tanstack/react-router";
import { Search, X, TrendingUp } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { getSuggestions, popularSearches } from "@/lib/search";

type Props = {
  placeholder?: string;
  compact?: boolean;
};

import pSerum from "@/assets/product-serum.jpg";
import { fetchProducts, resolveMediaUrl } from "@/lib/coscore-api";

export function SearchBox({
  placeholder = "Search skincare, makeup, brands...",
  compact = false,
}: Props) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const [dbProducts, setDbProducts] = useState<any[]>([]);

  useEffect(() => {
    if (!q.trim()) {
      setDbProducts([]);
      return;
    }
    const t = window.setTimeout(() => {
      fetchProducts({ search: q }).then((res) => {
        if (res && res.data) {
          setDbProducts(res.data);
        }
      });
    }, 200);
    return () => window.clearTimeout(t);
  }, [q]);

  const liveProducts = useMemo(() => {
    return dbProducts.map((p: any) => ({
      id: p.slug,
      name: p.title,
      brand: p.brand || "Beauty Brand",
      img: resolveMediaUrl(p.image) || pSerum,
      price: p.discount_price || p.price,
    }));
  }, [dbProducts]);

  const suggestions = useMemo(() => getSuggestions(q), [q]);
  const flatItems: { type: "product" | "brand" | "category" | "concern"; label: string; href?: () => void }[] =
    useMemo(() => {
      const items: {
        type: "product" | "brand" | "category" | "concern";
        label: string;
        href?: () => void;
      }[] = [];
      liveProducts.forEach((p) =>
        items.push({ type: "product", label: p.name, href: () => submit(p.name) }),
      );
      suggestions.brands.forEach((b) =>
        items.push({ type: "brand", label: b, href: () => submit(b) }),
      );
      suggestions.categories.forEach((c) =>
        items.push({
          type: "category",
          label: c.label,
          href: () =>
            navigate({
              to: "/shop/$category",
              params: { category: c.category },
              search: c.sub ? { sub: c.sub } : {},
            }),
        }),
      );
      suggestions.concerns.forEach((c) =>
        items.push({ type: "concern", label: c, href: () => submit(c) }),
      );
      return items;
    }, [liveProducts, suggestions.brands, suggestions.categories, suggestions.concerns, navigate]);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  useEffect(() => setActive(-1), [q]);

  const submit = (term: string) => {
    const value = term.trim();
    if (!value) return;
    setOpen(false);
    inputRef.current?.blur();
    navigate({ to: "/search", search: { q: value } });
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (active >= 0 && flatItems[active]) flatItems[active].href?.();
      else submit(q);
      return;
    }
    if (!open) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(flatItems.length - 1, a + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(-1, a - 1));
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  const hasQuery = q.trim().length > 0;
  const hasResults =
    suggestions.products.length +
      suggestions.brands.length +
      suggestions.categories.length +
      suggestions.concerns.length >
    0;

  return (
    <div ref={wrapRef} className="relative w-full">
      <div className="relative">
        <button
          type="button"
          aria-label="Search"
          onClick={() => (hasQuery ? submit(q) : inputRef.current?.focus())}
          className="absolute left-3 top-1/2 -translate-y-1/2 h-7 w-7 grid place-items-center rounded-full text-muted-foreground hover:text-burgundy transition"
        >
          <Search className="h-4 w-4" />
        </button>
        <input
          ref={inputRef}
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          aria-label="Search products"
          className={`w-full bg-ivory/60 border border-border rounded-full pl-11 pr-10 ${
            compact ? "py-2.5" : "py-3"
          } text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-burgundy/30 focus:border-burgundy/40 transition`}
        />
        {hasQuery && (
          <button
            type="button"
            aria-label="Clear search"
            onClick={() => {
              setQ("");
              inputRef.current?.focus();
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 h-7 w-7 grid place-items-center rounded-full hover:bg-muted text-muted-foreground transition"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {open && (
        <div className="absolute left-0 right-0 top-full mt-2 z-50 bg-background border border-border rounded-2xl shadow-luxury overflow-hidden max-h-[70vh] overflow-y-auto">
          {!hasQuery && (
            <div className="p-4">
              <div className="text-[11px] uppercase tracking-[0.25em] text-burgundy font-semibold mb-3 flex items-center gap-1.5">
                <TrendingUp className="h-3 w-3" /> Popular searches
              </div>
              <div className="flex flex-wrap gap-2">
                {popularSearches.map((s) => (
                  <button
                    key={s}
                    onClick={() => submit(s)}
                    className="text-xs px-3 py-1.5 rounded-full border border-border hover:border-burgundy hover:text-burgundy transition"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {hasQuery && !hasResults && (
            <div className="p-6 text-center">
              <div className="text-sm text-foreground">
                No matches for <span className="font-semibold">"{q}"</span>
              </div>
              <button
                onClick={() => submit(q)}
                className="mt-3 text-xs uppercase tracking-widest text-burgundy font-semibold hover:underline"
              >
                See full search results →
              </button>
            </div>
          )}

          {hasQuery && hasResults && (
            <div className="divide-y divide-border">
              {liveProducts.length > 0 && (
                <Section title="Products">
                  {liveProducts.map((p, i) => {
                    const idx = i;
                    return (
                      <button
                        key={p.id}
                        onMouseEnter={() => setActive(idx)}
                        onClick={() => submit(p.name)}
                        className={`w-full flex items-center gap-3 p-2.5 rounded-lg text-left transition ${
                          active === idx ? "bg-ivory" : "hover:bg-ivory/60"
                        }`}
                      >
                        <img
                          src={p.img}
                          alt=""
                          className="h-11 w-11 rounded-md object-cover bg-muted"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                            {p.brand}
                          </div>
                          <div className="text-sm text-foreground truncate">{p.name}</div>
                        </div>
                        <div className="text-sm font-semibold text-burgundy tabular-nums">
                          BDT {p.price.toLocaleString()}
                        </div>
                      </button>
                    );
                  })}
                </Section>
              )}

              {suggestions.brands.length > 0 && (
                <Section title="Brands">
                  {suggestions.brands.map((b, i) => {
                    const idx = suggestions.products.length + i;
                    return (
                      <button
                        key={b}
                        onMouseEnter={() => setActive(idx)}
                        onClick={() => submit(b)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition ${
                          active === idx ? "bg-ivory text-burgundy" : "hover:bg-ivory/60"
                        }`}
                      >
                        {b}
                      </button>
                    );
                  })}
                </Section>
              )}

              {suggestions.categories.length > 0 && (
                <Section title="Categories">
                  {suggestions.categories.map((c, i) => {
                    const idx =
                      suggestions.products.length + suggestions.brands.length + i;
                    return (
                      <Link
                        key={`${c.category}-${c.sub ?? ""}`}
                        to="/shop/$category"
                        params={{ category: c.category }}
                        search={c.sub ? { sub: c.sub } : {}}
                        onMouseEnter={() => setActive(idx)}
                        onClick={() => setOpen(false)}
                        className={`block px-3 py-2 rounded-lg text-sm transition ${
                          active === idx ? "bg-ivory text-burgundy" : "hover:bg-ivory/60"
                        }`}
                      >
                        {c.label}
                      </Link>
                    );
                  })}
                </Section>
              )}

              {suggestions.concerns.length > 0 && (
                <Section title="Concerns">
                  {suggestions.concerns.map((c, i) => {
                    const idx =
                      suggestions.products.length +
                      suggestions.brands.length +
                      suggestions.categories.length +
                      i;
                    return (
                      <button
                        key={c}
                        onMouseEnter={() => setActive(idx)}
                        onClick={() => submit(c)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition ${
                          active === idx ? "bg-ivory text-burgundy" : "hover:bg-ivory/60"
                        }`}
                      >
                        {c}
                      </button>
                    );
                  })}
                </Section>
              )}

              <div className="p-3 bg-ivory/40">
                <button
                  onClick={() => submit(q)}
                  className="w-full text-center text-xs uppercase tracking-widest text-burgundy font-semibold hover:underline"
                >
                  See all results for "{q}" →
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="p-3">
      <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground font-semibold px-1 mb-1.5">
        {title}
      </div>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}
