import { createFileRoute, Link } from "@tanstack/react-router";
import { fallback, zodValidator } from "@tanstack/zod-adapter";
import { z } from "zod";
import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronRight, SearchX } from "lucide-react";

import { AnnouncementBar, SiteHeader, SiteFooter, ProductCard } from "@/components/site/chrome";
import pSerum from "@/assets/product-serum.jpg";
import { searchProducts } from "@/lib/search";
import { searchAnalytics } from "@/lib/search-analytics";
import {
  allBrands,
  allConcerns,
  allSkinTypes,
  categories,
  products,
} from "@/lib/shop-catalog";

const SITE_URL = "https://lookzene.lovable.app";

const searchSchema = z.object({
  q: fallback(z.string(), "").default(""),
  sort: fallback(z.string(), "relevance").default("relevance"),
  cats: fallback(z.string(), "").default(""),
  brands: fallback(z.string(), "").default(""),
  concerns: fallback(z.string(), "").default(""),
  skin: fallback(z.string(), "").default(""),
  min: fallback(z.number(), 0).default(0),
  max: fallback(z.number(), 5000).default(5000),
  stock: fallback(z.boolean(), false).default(false),
  rating: fallback(z.number(), 0).default(0),
});

const parseList = (v: string) => (v ? v.split(",").filter(Boolean) : []);
const toList = (a: string[]) => a.join(",");

const sortOptions = [
  { value: "relevance", label: "Recommended" },
  { value: "best", label: "Best Selling" },
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "rating", label: "Top Rated" },
  { value: "discount", label: "Biggest Discount" },
];

export const Route = createFileRoute("/search")({
  validateSearch: zodValidator(searchSchema),
  head: () => {
    const title = "Search — Lookzene";
    const description =
      "Search authentic skincare, makeup and K-beauty products at Lookzene.";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { name: "robots", content: "noindex, follow" },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { property: "og:url", content: `${SITE_URL}/search` },
        { name: "twitter:card", content: "summary" },
      ],
    };
  },
  component: SearchPage,
});

import { fetchProducts, resolveMediaUrl } from "@/lib/coscore-api";

function SearchPage() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const q = search.q?.trim() ?? "";

  const [dbProducts, setDbProducts] = useState<any[]>([]);

  useEffect(() => {
    fetchProducts({ search: q }).then((res) => {
      if (res && res.data) {
        setDbProducts(res.data);
      }
    });
  }, [q]);

  const selCats = parseList(search.cats);
  const selBrands = parseList(search.brands);
  const selConcerns = parseList(search.concerns);
  const selSkin = parseList(search.skin);

  const matched = useMemo(() => {
    if (!dbProducts || dbProducts.length === 0) return [];
    return dbProducts.map((p: any) => ({
      id: p.slug,
      name: p.title,
      brand: p.brand || "Beauty Brand",
      img: resolveMediaUrl(p.image) || pSerum,
      price: p.discount_price || p.price,
      compareAt: p.discount_price ? p.price : undefined,
      rating: 4.8,
      reviews: 35,
      category: p.category || "skincare",
      subcategory: "serums",
      concerns: ["Anti-Aging"],
      skinType: ["All"],
      inStock: p.stock_status === "In Stock"
    }));
  }, [dbProducts]);

  const filtered = useMemo(() => {
    let list: any[] = matched;
    if (selCats.length) list = list.filter((p: any) => selCats.includes(p.category));
    if (selBrands.length) list = list.filter((p: any) => selBrands.includes(p.brand));
    if (selConcerns.length)
      list = list.filter((p: any) => p.concerns.some((c: any) => selConcerns.includes(c)));
    if (selSkin.length) list = list.filter((p: any) => p.skinType.some((s: any) => selSkin.includes(s)));
    list = list.filter((p: any) => p.price >= search.min && p.price <= search.max);
    if (search.stock) list = list.filter((p: any) => p.inStock);
    if (search.rating > 0) list = list.filter((p: any) => p.rating >= search.rating);

    const sorted = [...list];
    switch (search.sort) {
      case "price-asc":
        sorted.sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        sorted.sort((a, b) => b.price - a.price);
        break;
      case "rating":
        sorted.sort((a, b) => b.rating - a.rating);
        break;
      case "best":
        sorted.sort((a, b) => b.reviews - a.reviews);
        break;
      case "newest":
        sorted.sort((a, b) => Number(!!b.isNew) - Number(!!a.isNew));
        break;
      case "discount":
        sorted.sort((a, b) => {
          const da = a.compareAt ? (a.compareAt - a.price) / a.compareAt : 0;
          const db = b.compareAt ? (b.compareAt - b.price) / b.compareAt : 0;
          return db - da;
        });
        break;
    }
    return sorted;
  }, [matched, selCats, selBrands, selConcerns, selSkin, search]);

  const update = (patch: Partial<typeof search>) => {
    if (patch.sort && patch.sort !== search.sort) {
      searchAnalytics.recordSort(String(patch.sort));
    }
    const facetMap: Record<string, string> = {
      cats: "category",
      brands: "brand",
      concerns: "concern",
      skin: "skinType",
    };
    for (const [key, facet] of Object.entries(facetMap)) {
      if (key in patch) {
        const prev = new Set(parseList((search as Record<string, unknown>)[key] as string));
        const next = parseList((patch as Record<string, unknown>)[key] as string);
        for (const v of next) if (!prev.has(v)) searchAnalytics.recordFilter(facet, v);
      }
    }
    if ("min" in patch || "max" in patch) {
      const min = patch.min ?? search.min;
      const max = patch.max ?? search.max;
      if (min !== search.min || max !== search.max) {
        searchAnalytics.recordFilter("price", `৳${min}-৳${max}`);
      }
    }
    if ("rating" in patch && patch.rating !== search.rating && (patch.rating ?? 0) > 0) {
      searchAnalytics.recordFilter("rating", `${patch.rating}★ & up`);
    }
    if ("stock" in patch && patch.stock && !search.stock) {
      searchAnalytics.recordFilter("availability", "In stock");
    }
    navigate({ search: (prev: typeof search) => ({ ...prev, ...patch }) });
  };

  // Record query + result count (debounced inside store).
  const lastRecorded = useRef<string>("");
  useEffect(() => {
    if (!q) return;
    const key = `${q}::${matched.length}`;
    if (lastRecorded.current === key) return;
    const t = window.setTimeout(() => {
      searchAnalytics.recordQuery(q, matched.length);
      lastRecorded.current = key;
    }, 600);
    return () => window.clearTimeout(t);
  }, [q, matched.length]);

  const toggleIn = (list: string[], v: string) =>
    list.includes(v) ? list.filter((x) => x !== v) : [...list, v];

  const clearAll = () =>
    update({
      cats: "",
      brands: "",
      concerns: "",
      skin: "",
      min: 0,
      max: 5000,
      stock: false,
      rating: 0,
      sort: "relevance",
    });

  // Suggested products when no results
  const recommended = useMemo(() => {
    return [...products]
      .sort((a, b) => b.reviews - a.reviews)
      .slice(0, 8);
  }, []);

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
              <li>
                <span className="text-foreground font-medium">Search</span>
              </li>
            </ol>
          </nav>
          <div className="text-[11px] tracking-[0.3em] uppercase text-burgundy font-semibold mb-2">
            Search Results
          </div>
          <h1 className="text-serif text-3xl md:text-5xl leading-tight">
            {q ? <>Results for "<span className="text-burgundy">{q}</span>"</> : "Search products"}
          </h1>
          {q && (
            <p className="mt-3 text-muted-foreground text-sm">
              {filtered.length} product{filtered.length === 1 ? "" : "s"} found
              {matched.length !== filtered.length && (
                <span className="ml-1">({matched.length} before filters)</span>
              )}
            </p>
          )}
        </div>
      </section>

      <section className="container-luxe py-10 md:py-14">
        {q && matched.length === 0 ? (
          <NoResults q={q} recommended={recommended} />
        ) : q === "" ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground">Type in the search bar above to explore Lookzene.</p>
          </div>
        ) : (
          <div className="grid lg:grid-cols-[260px_1fr] gap-10">
            <aside className="hidden lg:block sticky top-32 self-start space-y-8">
              <FiltersPanel
                selCats={selCats}
                selBrands={selBrands}
                selConcerns={selConcerns}
                selSkin={selSkin}
                search={{
                  min: search.min ?? 0,
                  max: search.max ?? 5000,
                  stock: !!search.stock,
                  rating: search.rating ?? 0,
                }}
                onUpdate={update}
                onToggle={toggleIn}
                onClear={clearAll}
              />
            </aside>

            <div>
              <div className="flex items-center justify-between gap-3 pb-6 border-b border-border">
                <div className="text-xs text-muted-foreground">
                  Showing {filtered.length} of {matched.length}
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <label className="text-muted-foreground text-xs uppercase tracking-widest">Sort</label>
                  <select
                    value={search.sort}
                    onChange={(e) => update({ sort: e.target.value })}
                    className="bg-background border border-border rounded-full px-4 py-2 text-sm focus:outline-none focus:border-burgundy"
                  >
                    {sortOptions.map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {filtered.length > 0 ? (
                <div className="mt-8 grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                  {filtered.map((p) => (
                    <ProductCard key={p.id} p={p} />
                  ))}
                </div>
              ) : (
                <div className="mt-16 text-center py-16 border border-dashed border-border rounded-3xl">
                  <div className="text-serif text-2xl">No products match your filters</div>
                  <p className="text-muted-foreground mt-2 text-sm">
                    Try clearing a filter to see more results.
                  </p>
                  <button
                    onClick={clearAll}
                    className="mt-6 inline-flex items-center gap-2 bg-burgundy text-primary-foreground rounded-full px-6 py-3 text-sm font-semibold hover:opacity-90 transition"
                  >
                    Clear filters
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </section>

      <SiteFooter />
    </div>
  );
}

function NoResults({ q, recommended }: { q: string; recommended: ReturnType<typeof searchProducts> }) {
  return (
    <div>
      <div className="text-center py-10 border border-dashed border-border rounded-3xl">
        <SearchX className="h-10 w-10 text-burgundy mx-auto" />
        <div className="text-serif text-2xl md:text-3xl mt-4">
          No products found for "{q}"
        </div>
        <p className="text-muted-foreground mt-2 text-sm">
          Try searching for another product, brand, or category.
        </p>
      </div>

      <div className="mt-12">
        <div className="text-[11px] uppercase tracking-[0.3em] text-burgundy font-semibold mb-4">
          Popular Categories
        </div>
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <Link
              key={c.slug}
              to="/shop/$category"
              params={{ category: c.slug }}
              className="text-sm px-4 py-2 rounded-full border border-border hover:border-burgundy hover:text-burgundy transition"
            >
              {c.name}
            </Link>
          ))}
        </div>
      </div>

      <div className="mt-12">
        <div className="text-[11px] uppercase tracking-[0.3em] text-burgundy font-semibold mb-4">
          You Might Like
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {recommended.map((p) => (
            <ProductCard key={p.id} p={p} />
          ))}
        </div>
      </div>
    </div>
  );
}

function FiltersPanel({
  selCats,
  selBrands,
  selConcerns,
  selSkin,
  search,
  onUpdate,
  onToggle,
  onClear,
}: {
  selCats: string[];
  selBrands: string[];
  selConcerns: string[];
  selSkin: string[];
  search: {
    min: number; max: number; stock: boolean; rating: number;
  };
  onUpdate: (patch: Record<string, unknown>) => void;
  onToggle: (list: string[], v: string) => string[];
  onClear: () => void;
}) {
  const active =
    selCats.length + selBrands.length + selConcerns.length + selSkin.length +
    (search.stock ? 1 : 0) + (search.rating > 0 ? 1 : 0) +
    (search.min > 0 || search.max < 5000 ? 1 : 0);
  return (
    <div className="space-y-7">
      <Group title="Category">
        <div className="space-y-2">
          {categories.map((c) => (
            <Row
              key={c.slug}
              label={c.name}
              checked={selCats.includes(c.slug)}
              onChange={() => onUpdate({ cats: toList(onToggle(selCats, c.slug)) })}
            />
          ))}
        </div>
      </Group>
      <Group title="Brand">
        <div className="space-y-2 max-h-56 overflow-y-auto pr-2">
          {allBrands.map((b) => (
            <Row
              key={b}
              label={b}
              checked={selBrands.includes(b)}
              onChange={() => onUpdate({ brands: toList(onToggle(selBrands, b)) })}
            />
          ))}
        </div>
      </Group>
      <Group title="Skin Concern">
        <div className="space-y-2">
          {allConcerns.map((c) => (
            <Row
              key={c}
              label={c}
              checked={selConcerns.includes(c)}
              onChange={() => onUpdate({ concerns: toList(onToggle(selConcerns, c)) })}
            />
          ))}
        </div>
      </Group>
      <Group title="Skin Type">
        <div className="flex flex-wrap gap-2">
          {allSkinTypes.map((s) => {
            const on = selSkin.includes(s);
            return (
              <button
                key={s}
                onClick={() => onUpdate({ skin: toList(onToggle(selSkin, s)) })}
                className={`text-xs px-3 py-1.5 rounded-full border transition ${on ? "bg-burgundy text-primary-foreground border-burgundy" : "bg-background border-border text-foreground/80 hover:border-burgundy"}`}
              >
                {s}
              </button>
            );
          })}
        </div>
      </Group>
      <Group title="Price (৳)">
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={search.min}
            min={0}
            onChange={(e) => onUpdate({ min: Number(e.target.value) || 0 })}
            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-burgundy"
          />
          <span className="text-muted-foreground">—</span>
          <input
            type="number"
            value={search.max}
            min={0}
            onChange={(e) => onUpdate({ max: Number(e.target.value) || 0 })}
            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-burgundy"
          />
        </div>
      </Group>
      <Group title="Rating">
        <div className="flex flex-wrap gap-2">
          {[0, 3, 4, 4.5].map((r) => (
            <button
              key={r}
              onClick={() => onUpdate({ rating: r })}
              className={`text-xs px-3 py-1.5 rounded-full border transition ${search.rating === r ? "bg-burgundy text-primary-foreground border-burgundy" : "bg-background border-border text-foreground/80 hover:border-burgundy"}`}
            >
              {r === 0 ? "Any" : `${r}★ & up`}
            </button>
          ))}
        </div>
      </Group>
      <Group title="Availability">
        <Row
          label="In stock only"
          checked={search.stock}
          onChange={() => onUpdate({ stock: !search.stock })}
        />
      </Group>

      {active > 0 && (
        <button
          onClick={onClear}
          className="text-xs uppercase tracking-widest text-burgundy font-semibold hover:underline"
        >
          Clear all filters
        </button>
      )}
    </div>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-[11px] uppercase tracking-[0.25em] font-semibold text-burgundy mb-3">
        {title}
      </h3>
      {children}
    </div>
  );
}

function Row({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return (
    <label className="flex items-center gap-2.5 cursor-pointer group">
      <span
        className={`h-4 w-4 rounded border grid place-items-center transition ${checked ? "bg-burgundy border-burgundy" : "bg-background border-border group-hover:border-burgundy"}`}
      >
        {checked && <span className="h-1.5 w-1.5 bg-primary-foreground rounded-sm" />}
      </span>
      <input type="checkbox" checked={checked} onChange={onChange} className="sr-only" />
      <span className="text-sm text-foreground/85">{label}</span>
    </label>
  );
}
