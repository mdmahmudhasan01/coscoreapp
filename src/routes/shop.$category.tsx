import { createFileRoute, Link } from "@tanstack/react-router";
import { fallback, zodValidator } from "@tanstack/zod-adapter";
import { z } from "zod";
import { useEffect, useMemo, useState } from "react";
import { ChevronRight, SlidersHorizontal, X, Check } from "lucide-react";

import { AnnouncementBar, SiteHeader, SiteFooter, ProductCard } from "@/components/site/chrome";
import {
  allBrands,
  allConcerns,
  allSkinTypes,
  categories,
  getCategory,
  products,
} from "@/lib/shop-catalog";
import { fetchProducts, resolveMediaUrl } from "@/lib/coscore-api";
import pSerum from "@/assets/product-serum.jpg";



const searchSchema = z.object({
  sub: fallback(z.string(), "").default(""),
  sort: fallback(z.string(), "featured").default("featured"),
  brands: fallback(z.string(), "").default(""),
  concerns: fallback(z.string(), "").default(""),
  skin: fallback(z.string(), "").default(""),
  min: fallback(z.number(), 0).default(0),
  max: fallback(z.number(), 5000).default(5000),
  stock: fallback(z.boolean(), false).default(false),
  page: fallback(z.number().int(), 1).default(1),
});

const PAGE_SIZE = 12;

function hasActiveFilters(s: {
  sub: string;
  brands: string;
  concerns: string;
  skin: string;
  min: number;
  max: number;
  stock: boolean;
  sort: string;
}) {
  return Boolean(
    s.sub ||
      s.brands ||
      s.concerns ||
      s.skin ||
      s.stock ||
      s.min > 0 ||
      s.max < 5000 ||
      (s.sort && s.sort !== "featured"),
  );
}

type CategorySeo = {
  title: string;
  description: string;
  ogTitle: string;
  ogDescription: string;
  keywords: string;
};

const SITE_URL = "https://lookzene.com";

const categorySeo: Record<string, CategorySeo> = {
  skincare: {
    title: "Authentic Skincare Products in Bangladesh — Serums & Moisturizers | Lookzene",
    description:
      "Shop 100% authentic skincare products in Bangladesh. Cleansers, toners, serums, moisturizers & masks from top Korean & global brands. Cash on Delivery BD.",
    ogTitle: "Authentic Skincare Products in Bangladesh — Lookzene",
    ogDescription:
      "From gentle cleansers to hero serums, discover authentic skincare that makes glass-skin routines work in Bangladesh.",
    keywords: "authentic skincare Bangladesh, skincare products Dhaka, buy serums BD, Korean moisturizer Bangladesh, Lookzene",
  },
  "sun-protection": {
    title: "Sunscreen & SPF Price in Bangladesh — Face & Body Sunblock | Lookzene",
    description:
      "Shop top-rated face & body sunscreen in Bangladesh. No white cast, lightweight SPF 50+ sunblocks from Beauty of Joseon, Anua & Innisfree.",
    ogTitle: "Best Sunscreens in Bangladesh — Lookzene SPF Store",
    ogDescription:
      "Lightweight, no-white-cast sunscreens dermatologists recommend. Face, body and tinted SPF delivered fast across Bangladesh.",
    keywords: "sunscreen price in Bangladesh, SPF 50 sunblock BD, face sunscreen Dhaka, Beauty of Joseon sunscreen BD",
  },
  makeup: {
    title: "Authentic Cosmetics & Makeup Products in Bangladesh — Lookzene",
    description:
      "Buy 100% original cosmetics & makeup in Bangladesh — foundations, lipsticks, mascaras, eyeshadows & concealers. Fast home delivery across Dhaka & BD.",
    ogTitle: "Original Cosmetics & Makeup in Bangladesh — Lookzene",
    ogDescription:
      "Buildable foundations, pigmented lipsticks and long-wear eyes. Shop 100% authentic cosmetics delivered nationwide in Bangladesh.",
    keywords: "authentic cosmetics Bangladesh, makeup shop Dhaka, original cosmetics BD, buy lipstick Bangladesh, Lookzene",
  },
  "hair-care": {
    title: "Hair Care & Treatment Products in Bangladesh — Shampoo & Oils | Lookzene",
    description:
      "Shop salon-grade hair care in Bangladesh — hair loss treatment shampoos, conditioners, scalp serums and hair repair masks.",
    ogTitle: "Hair Care & Treatment Products in Bangladesh — Lookzene",
    ogDescription:
      "Repair, hydrate and strengthen. Discover shampoos, conditioners and treatments loved by hair stylists in BD.",
    keywords: "hair care Bangladesh, hair loss shampoo BD, hair treatment Dhaka, scalp serum BD",
  },
  "body-care": {
    title: "Body Care Products & Lotions in Bangladesh — Lookzene",
    description:
      "Nourish skin head-to-toe with authentic body lotions, body washes, exfoliating scrubs and body oils in Bangladesh.",
    ogTitle: "Body Care & Moisturizing Lotions in Bangladesh — Lookzene",
    ogDescription:
      "Luxurious body care with clean formulas. Nourish, hydrate and glow with our curated edit in Bangladesh.",
    keywords: "body lotion Bangladesh, body care BD, body wash Dhaka, moisturizer BD",
  },
  "k-beauty": {
    title: "Authentic Korean Skincare & K-Beauty in Bangladesh — COSRX, Anua | Lookzene",
    description:
      "Buy 100% authentic Korean skincare in Bangladesh — COSRX Snail Mucin, Beauty of Joseon Sunscreen, Anua Rice Toners. Fast delivery in Dhaka & BD.",
    ogTitle: "Authentic K-Beauty & Korean Skincare in Bangladesh — Lookzene",
    ogDescription:
      "The complete K-Beauty ritual: hydrating toners, calming essences and hero ampoules from Korea's most-loved brands.",
    keywords: "Korean skincare Bangladesh, K-Beauty BD, COSRX Bangladesh, Beauty of Joseon Dhaka, Anua Sunscreen BD",
  },
};

export const Route = createFileRoute("/shop/$category")({
  validateSearch: zodValidator(searchSchema),
  loader: async ({ params, deps }) => {
    const sort = (deps as { sort?: string } | undefined)?.sort;
    try {
      const res = await fetchProducts({
        category_slug: params.category,
        sort_by: sort,
        page_size: 100,
      });
      return { products: res?.data || [] };
    } catch {
      return { products: [] as any[] };
    }
  },
  loaderDeps: ({ search }) => ({ sort: search.sort }),
  head: ({ params, match }) => {
    const rawSearch = (match as { search?: Record<string, unknown> } | undefined)?.search;
    const search: {
      sub: string;
      sort: string;
      brands: string;
      concerns: string;
      skin: string;
      min: number;
      max: number;
      stock: boolean;
      page: number;
    } = {
      sub: (rawSearch?.sub as string) ?? "",
      sort: (rawSearch?.sort as string) ?? "featured",
      brands: (rawSearch?.brands as string) ?? "",
      concerns: (rawSearch?.concerns as string) ?? "",
      skin: (rawSearch?.skin as string) ?? "",
      min: (rawSearch?.min as number) ?? 0,
      max: (rawSearch?.max as number) ?? 5000,
      stock: (rawSearch?.stock as boolean) ?? false,
      page: (rawSearch?.page as number) ?? 1,
    };
    const cat = getCategory(params.category);
    const seo = categorySeo[params.category];
    const name = cat?.name ?? "Shop";
    const baseUrl = `${SITE_URL}/shop/${params.category}`;
    const ogImage = cat?.hero ? `${SITE_URL}${cat.hero}` : undefined;

    const filtersOn = hasActiveFilters(search);
    const categoryProducts = products.filter((p) => p.category === params.category);
    const totalPages = Math.max(1, Math.ceil(categoryProducts.length / PAGE_SIZE));
    const currentPage = filtersOn ? 1 : Math.min(Math.max(1, search.page || 1), totalPages);
    const pageUrl = (n: number) => (n <= 1 ? baseUrl : `${baseUrl}?page=${n}`);
    const currentUrl = filtersOn ? baseUrl : pageUrl(currentPage);
    const canonicalHref = filtersOn ? baseUrl : pageUrl(currentPage);
    const prevHref = !filtersOn && currentPage > 1 ? pageUrl(currentPage - 1) : null;
    const nextHref = !filtersOn && currentPage < totalPages ? pageUrl(currentPage + 1) : null;

    const baseTitle = seo?.title ?? `${name} — Shop | Lookzene`;
    const baseDescription =
      seo?.description ?? cat?.tagline ?? "Shop premium beauty & skincare at Lookzene.";
    const pageSuffix = !filtersOn && currentPage > 1 ? ` — Page ${currentPage} of ${totalPages}` : "";
    const title = `${baseTitle}${pageSuffix}`;
    const description =
      !filtersOn && currentPage > 1
        ? `${baseDescription} Page ${currentPage} of ${totalPages}.`
        : baseDescription;
    const ogTitle = `${seo?.ogTitle ?? baseTitle}${pageSuffix}`;
    const ogDescription = seo?.ogDescription ?? description;

    const organizationLd = {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "Lookzene",
      url: SITE_URL,
      logo: `${SITE_URL}/logo.png`,
      sameAs: [
        "https://www.instagram.com/lookzene",
        "https://www.tiktok.com/@lookzene",
        "https://www.facebook.com/lookzene",
      ],
    };

    const breadcrumbLd = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: "Shop", item: `${SITE_URL}/shop` },
        { "@type": "ListItem", position: 3, name, item: baseUrl },
      ],
    };

    const collectionLd = {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: ogTitle,
      description: ogDescription,
      url: currentUrl,
      inLanguage: "en",
      isPartOf: { "@type": "WebSite", name: "Lookzene", url: SITE_URL },
      ...(ogImage ? { image: ogImage } : {}),
      about: cat?.columns?.flatMap((c) => c.items.map((i) => ({ "@type": "Thing", name: i.label }))),
      ...(!filtersOn
        ? {
            mainEntity: {
              "@type": "ItemList",
              numberOfItems: categoryProducts.length,
            },
            pagination: {
              currentPage,
              totalPages,
              pageSize: PAGE_SIZE,
              ...(prevHref ? { previousPage: prevHref } : {}),
              ...(nextHref ? { nextPage: nextHref } : {}),
            },
          }
        : {}),
    };

    const pageStart = (currentPage - 1) * PAGE_SIZE;
    const pageProducts = filtersOn
      ? categoryProducts
      : categoryProducts.slice(pageStart, pageStart + PAGE_SIZE);
    const itemListLd = {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: `${name} products${pageSuffix}`,
      url: currentUrl,
      numberOfItems: pageProducts.length,
      itemListOrder: "https://schema.org/ItemListOrderAscending",
      itemListElement: pageProducts.map((p, i) => ({
        "@type": "ListItem",
        position: pageStart + i + 1,
        url: `${baseUrl}#${p.id}`,
        item: {
          "@type": "Product",
          name: p.name,
          brand: { "@type": "Brand", name: p.brand },
          image: `${SITE_URL}${p.img}`,
          category: name,
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: p.rating,
            reviewCount: p.reviews,
          },
          offers: {
            "@type": "Offer",
            price: p.price,
            priceCurrency: "BDT",
            availability: p.inStock
              ? "https://schema.org/InStock"
              : "https://schema.org/OutOfStock",
            url: baseUrl,
          },
        },
      })),
    };

    return {
      meta: [
        { title },
        { name: "description", content: description },
        ...(seo?.keywords ? [{ name: "keywords", content: seo.keywords }] : []),
        ...(filtersOn ? [{ name: "robots", content: "noindex, follow" }] : []),
        { property: "og:title", content: ogTitle },
        { property: "og:description", content: ogDescription },
        { property: "og:type", content: "website" },
        { property: "og:url", content: currentUrl },
        { property: "og:site_name", content: "Lookzene" },
        ...(ogImage
          ? [
              { property: "og:image", content: ogImage },
              { property: "og:image:alt", content: `${name} at Lookzene` },
              { name: "twitter:image", content: ogImage },
            ]
          : []),
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: ogTitle },
        { name: "twitter:description", content: ogDescription },
      ],
      links: [
        { rel: "canonical", href: canonicalHref },
        ...(prevHref ? [{ rel: "prev", href: prevHref }] : []),
        ...(nextHref ? [{ rel: "next", href: nextHref }] : []),
      ],
      scripts: [
        { type: "application/ld+json", children: JSON.stringify(organizationLd) },
        { type: "application/ld+json", children: JSON.stringify(breadcrumbLd) },
        { type: "application/ld+json", children: JSON.stringify(collectionLd) },
        { type: "application/ld+json", children: JSON.stringify(itemListLd) },
      ],
    };
  },
  component: CategoryPage,
});


const sortOptions = [
  { value: "featured", label: "Featured" },
  { value: "newest", label: "Newest Arrivals" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "rating", label: "Top Rated" },
  { value: "discount", label: "Biggest Discount" },
];

function parseList(v: string) {
  return v ? v.split(",").filter(Boolean) : [];
}
function toList(a: string[]) {
  return a.join(",");
}

function CategoryPage() {
  const { category } = Route.useParams();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const loaderData = Route.useLoaderData();
  const cat = getCategory(category);
  const [drawer, setDrawer] = useState<"closed" | "open" | "closing">("closed");
  const openDrawer = () => setDrawer("open");
  const closeDrawer = () => {
    setDrawer("closing");
    window.setTimeout(() => setDrawer("closed"), 260);
  };

  const [dbProducts, setDbProducts] = useState<any[]>(() => loaderData?.products || []);

  useEffect(() => {
    setDbProducts(loaderData?.products || []);
  }, [loaderData?.products]);

  useEffect(() => {
    let cancelled = false;
    fetchProducts({
      category_slug: category,
      sort_by: search.sort,
      page_size: 100,
    }).then((res) => {
      if (!cancelled && res && res.data) {
        setDbProducts(res.data);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [category, search.sort]);

  const mappedProducts = useMemo(() => {
    if (!dbProducts || dbProducts.length === 0) {
      return [];
    }
    return dbProducts.map((p: any) => ({
      id: p.slug,
      name: p.title,
      brand: p.brand || "Beauty Brand",
      img: resolveMediaUrl(p.image) || pSerum,
      price: p.discount_price || p.price,
      compareAt: p.discount_price ? p.price : undefined,
      rating: 4.8,
      reviews: 35,
      category: category,
      subcategory: search.sub || "featured",
      concerns: ["Anti-Aging"],
      skinType: ["All"],
      inStock: p.stock_status === "In Stock"
    }));
  }, [dbProducts, category, search.sub]);

  const selBrands = parseList(search.brands);
  const selConcerns = parseList(search.concerns);
  const selSkin = parseList(search.skin);

  const filtered = useMemo(() => {
    let list = mappedProducts;
    if (search.sub) list = list.filter((p) => p.subcategory === search.sub);
    if (selBrands.length) list = list.filter((p) => selBrands.includes(p.brand));
    if (selConcerns.length)
      list = list.filter((p) => p.concerns.some((c) => selConcerns.includes(c)));
    if (selSkin.length) list = list.filter((p) => p.skinType.some((s) => selSkin.includes(s)));
    list = list.filter((p) => p.price >= search.min && p.price <= search.max);
    if (search.stock) list = list.filter((p) => p.inStock);

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
      case "newest":
        sorted.sort((a: any, b: any) => Number(!!b.isNew) - Number(!!a.isNew));
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
  }, [mappedProducts, search, selBrands, selConcerns, selSkin]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(Math.max(1, search.page || 1), totalPages);
  const pageStart = (currentPage - 1) * PAGE_SIZE;
  const pageItems = filtered.slice(pageStart, pageStart + PAGE_SIZE);

  const updateSearch = (patch: Partial<typeof search>) =>
    navigate({
      search: (prev: typeof search) => {
        // Any change other than page itself resets pagination to 1.
        const resetsPage = Object.keys(patch).some((k) => k !== "page");
        return { ...prev, ...patch, ...(resetsPage ? { page: 1 } : {}) };
      },
    });

  const goToPage = (n: number) =>
    navigate({ search: (prev: typeof search) => ({ ...prev, page: n }) });

  const toggleIn = (list: string[], value: string) =>
    list.includes(value) ? list.filter((x) => x !== value) : [...list, value];

  const clearAll = () =>
    navigate({
      search: {
        sub: "",
        sort: "featured",
        brands: "",
        concerns: "",
        skin: "",
        min: 0,
        max: 5000,
        stock: false,
        page: 1,
      },
    });

  const activeCount =
    selBrands.length +
    selConcerns.length +
    selSkin.length +
    (search.stock ? 1 : 0) +
    (search.min > 0 || search.max < 5000 ? 1 : 0) +
    (search.sub ? 1 : 0);

  // Staged filters for mobile drawer (only committed on Apply)
  const emptyDraft = {
    sub: "",
    brands: [] as string[],
    concerns: [] as string[],
    skin: [] as string[],
    min: 0,
    max: 5000,
    stock: false,
  };
  const [draft, setDraft] = useState(emptyDraft);
  useEffect(() => {
    if (drawer === "open") {
      setDraft({
        sub: search.sub,
        brands: selBrands,
        concerns: selConcerns,
        skin: selSkin,
        min: search.min,
        max: search.max,
        stock: search.stock,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drawer]);

  const draftFiltered = useMemo(() => {
    let list = products.filter((p) => p.category === category);
    if (draft.sub) list = list.filter((p) => p.subcategory === draft.sub);
    if (draft.brands.length) list = list.filter((p) => draft.brands.includes(p.brand));
    if (draft.concerns.length)
      list = list.filter((p) => p.concerns.some((c) => draft.concerns.includes(c)));
    if (draft.skin.length)
      list = list.filter((p) => p.skinType.some((s) => draft.skin.includes(s)));
    list = list.filter((p) => p.price >= draft.min && p.price <= draft.max);
    if (draft.stock) list = list.filter((p) => p.inStock);
    return list;
  }, [category, draft]);

  const draftActiveCount =
    draft.brands.length +
    draft.concerns.length +
    draft.skin.length +
    (draft.stock ? 1 : 0) +
    (draft.min > 0 || draft.max < 5000 ? 1 : 0) +
    (draft.sub ? 1 : 0);

  const applyDraft = () => {
    updateSearch({
      sub: draft.sub,
      brands: toList(draft.brands),
      concerns: toList(draft.concerns),
      skin: toList(draft.skin),
      min: draft.min,
      max: draft.max,
      stock: draft.stock,
    });
    closeDrawer();
  };
  const resetDraft = () => setDraft(emptyDraft);

  useEffect(() => {
    if (drawer !== "open") return;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeDrawer();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [drawer]);


  if (!cat) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <AnnouncementBar />
        <SiteHeader />
        <div className="container-luxe py-24 text-center">
          <h1 className="text-serif text-3xl">Category not found</h1>
          <Link to="/" className="mt-4 inline-block text-burgundy underline">
            Back home
          </Link>
        </div>
        <SiteFooter />
      </div>
    );
  }

  const Filters = (
    <div className="space-y-8">
      <FilterGroup title="Subcategory">
        <div className="space-y-2">
          <button
            onClick={() => updateSearch({ sub: "" })}
            className={`block text-sm text-left w-full py-1 ${!search.sub ? "text-burgundy font-semibold" : "text-foreground/80 hover:text-burgundy"}`}
          >
            All {cat.name}
          </button>
          {cat.columns.flatMap((c) => c.items).map((it) => (
            <button
              key={it.slug}
              onClick={() => updateSearch({ sub: it.slug })}
              className={`block text-sm text-left w-full py-1 ${search.sub === it.slug ? "text-burgundy font-semibold" : "text-foreground/80 hover:text-burgundy"}`}
            >
              {it.label}
            </button>
          ))}
        </div>
      </FilterGroup>

      <FilterGroup title="Brand">
        <div className="space-y-2 max-h-56 overflow-y-auto pr-2">
          {allBrands.map((b) => (
            <CheckboxRow
              key={b}
              label={b}
              checked={selBrands.includes(b)}
              onChange={() =>
                updateSearch({ brands: toList(toggleIn(selBrands, b)) })
              }
            />
          ))}
        </div>
      </FilterGroup>

      <FilterGroup title="Skin Concern">
        <div className="space-y-2">
          {allConcerns.map((c) => (
            <CheckboxRow
              key={c}
              label={c}
              checked={selConcerns.includes(c)}
              onChange={() =>
                updateSearch({ concerns: toList(toggleIn(selConcerns, c)) })
              }
            />
          ))}
        </div>
      </FilterGroup>

      <FilterGroup title="Skin Type">
        <div className="flex flex-wrap gap-2">
          {allSkinTypes.map((s) => {
            const on = selSkin.includes(s);
            return (
              <button
                key={s}
                onClick={() => updateSearch({ skin: toList(toggleIn(selSkin, s)) })}
                className={`text-xs px-3 py-1.5 rounded-full border transition ${on ? "bg-burgundy text-primary-foreground border-burgundy" : "bg-background border-border text-foreground/80 hover:border-burgundy"}`}
              >
                {s}
              </button>
            );
          })}
        </div>
      </FilterGroup>

      <FilterGroup title="Price (৳)">
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={search.min}
            min={0}
            onChange={(e) => updateSearch({ min: Number(e.target.value) || 0 })}
            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-burgundy"
          />
          <span className="text-muted-foreground">—</span>
          <input
            type="number"
            value={search.max}
            min={0}
            onChange={(e) => updateSearch({ max: Number(e.target.value) || 0 })}
            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-burgundy"
          />
        </div>
        <input
          type="range"
          min={0}
          max={5000}
          step={100}
          value={search.max}
          onChange={(e) => updateSearch({ max: Number(e.target.value) })}
          className="w-full mt-3 accent-burgundy"
        />
      </FilterGroup>

      <FilterGroup title="Availability">
        <CheckboxRow
          label="In stock only"
          checked={search.stock}
          onChange={() => updateSearch({ stock: !search.stock })}
        />
      </FilterGroup>

      {activeCount > 0 && (
        <button
          onClick={clearAll}
          className="text-xs uppercase tracking-widest text-burgundy font-semibold hover:underline"
        >
          Clear all filters
        </button>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AnnouncementBar />
      <SiteHeader />

      {/* Hero */}
      <section className="gradient-hero-bg border-b border-border">
        <div className="container-luxe py-10 md:py-16">
          <nav aria-label="Breadcrumb" className="mb-4">
            <ol className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <li className="flex items-center gap-2">
                <Link to="/" className="hover:text-burgundy transition-colors">Home</Link>
                <ChevronRight className="h-3 w-3" aria-hidden />
              </li>
              <li className="flex items-center gap-2">
                <Link to="/" className="hover:text-burgundy transition-colors">Shop</Link>
                <ChevronRight className="h-3 w-3" aria-hidden />
              </li>
              <li className="flex items-center gap-2">
                {search.sub ? (
                  <>
                    <Link
                      to="/shop/$category"
                      params={{ category }}
                      className="hover:text-burgundy transition-colors"
                    >
                      {cat.name}
                    </Link>
                    <ChevronRight className="h-3 w-3" aria-hidden />
                  </>
                ) : (
                  <span aria-current="page" className="text-foreground font-medium">
                    {cat.name}
                  </span>
                )}
              </li>
              {search.sub && (
                <li>
                  <span aria-current="page" className="text-burgundy font-medium capitalize">
                    {search.sub.replace(/-/g, " ")}
                  </span>
                </li>
              )}
            </ol>
          </nav>
          <div className="grid md:grid-cols-[1fr_auto] items-end gap-6">
            <div>
              <div className="text-[11px] tracking-[0.3em] uppercase text-burgundy font-semibold mb-3">
                Shop {cat.name}
              </div>
              <h1 className="text-serif text-4xl md:text-5xl lg:text-6xl leading-tight">
                {cat.name}
              </h1>
              <p className="mt-3 max-w-xl text-muted-foreground">{cat.tagline}</p>
            </div>
            <div className="text-sm text-muted-foreground">
              {filtered.length} product{filtered.length === 1 ? "" : "s"}
              {totalPages > 1 && (
                <span className="ml-2 text-xs">
                  · Page {currentPage} of {totalPages}
                </span>
              )}
            </div>
          </div>

          {/* Subcategory chips */}
          <div className="mt-8 flex flex-wrap gap-2">
            <Chip active={!search.sub} onClick={() => updateSearch({ sub: "" })}>
              All
            </Chip>
            {cat.columns.flatMap((c) => c.items).map((it) => (
              <Chip
                key={it.slug}
                active={search.sub === it.slug}
                onClick={() => updateSearch({ sub: it.slug })}
              >
                {it.label}
              </Chip>
            ))}
          </div>
        </div>
      </section>

      {/* Toolbar + grid */}
      <section className="container-luxe py-10 md:py-14">
        <div className="grid lg:grid-cols-[260px_1fr] gap-10">
          <aside className="hidden lg:block sticky top-32 self-start">{Filters}</aside>

          <div>
            <div className="flex items-center justify-between gap-3 pb-6 border-b border-border">
              <button
                className="lg:hidden inline-flex items-center gap-2 border border-border rounded-full px-4 py-2 text-sm font-medium hover:border-burgundy"
                onClick={openDrawer}
              >
                <SlidersHorizontal className="h-4 w-4" />
                Filters
                {activeCount > 0 && (
                  <span className="bg-burgundy text-primary-foreground text-[10px] font-bold rounded-full h-5 min-w-5 px-1.5 grid place-items-center">
                    {activeCount}
                  </span>
                )}
              </button>
              <div className="hidden lg:flex items-center gap-2 text-xs text-muted-foreground">
                {activeCount > 0 ? `${activeCount} filter${activeCount === 1 ? "" : "s"} applied` : "No filters applied"}
              </div>
              <div className="flex items-center gap-2 text-sm ml-auto">
                <label className="text-muted-foreground text-xs uppercase tracking-widest">Sort</label>
                <select
                  value={search.sort}
                  onChange={(e) => updateSearch({ sort: e.target.value })}
                  className="bg-background border border-border rounded-full px-4 py-2 text-sm focus:outline-none focus:border-burgundy"
                >
                  {sortOptions.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Active filter pills */}
            {activeCount > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {search.sub && (
                  <Pill onRemove={() => updateSearch({ sub: "" })}>
                    {search.sub.replace(/-/g, " ")}
                  </Pill>
                )}
                {selBrands.map((b) => (
                  <Pill key={b} onRemove={() => updateSearch({ brands: toList(toggleIn(selBrands, b)) })}>
                    {b}
                  </Pill>
                ))}
                {selConcerns.map((c) => (
                  <Pill key={c} onRemove={() => updateSearch({ concerns: toList(toggleIn(selConcerns, c)) })}>
                    {c}
                  </Pill>
                ))}
                {selSkin.map((s) => (
                  <Pill key={s} onRemove={() => updateSearch({ skin: toList(toggleIn(selSkin, s)) })}>
                    {s}
                  </Pill>
                ))}
                {(search.min > 0 || search.max < 5000) && (
                  <Pill onRemove={() => updateSearch({ min: 0, max: 5000 })}>
                    ৳{search.min} — ৳{search.max}
                  </Pill>
                )}
                {search.stock && (
                  <Pill onRemove={() => updateSearch({ stock: false })}>In stock</Pill>
                )}
              </div>
            )}

            {/* Grid */}
            {filtered.length > 0 ? (
              <>
                <div className="mt-8 grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                  {pageItems.map((p) => (
                    <ProductCard key={p.id} p={p} />
                  ))}
                </div>
                {totalPages > 1 && (
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onChange={goToPage}
                  />
                )}
              </>
            ) : (
              <div className="mt-16 text-center py-16 border border-dashed border-border rounded-3xl">
                <div className="text-serif text-2xl">No products match your filters</div>
                <p className="text-muted-foreground mt-2 text-sm">
                  Try clearing a filter or exploring another category.
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
      </section>

      {/* Mobile filter drawer */}
      {drawer !== "closed" && (
        <div
          className="fixed inset-0 z-50 lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Filters"
        >
          <div
            onClick={closeDrawer}
            className={`absolute inset-0 bg-foreground/50 backdrop-blur-sm transition-opacity duration-300 ${drawer === "open" ? "opacity-100" : "opacity-0"}`}
          />
          <div
            className={`absolute inset-y-0 right-0 w-[92%] max-w-md bg-background shadow-luxury flex flex-col transform-gpu transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${drawer === "open" ? "translate-x-0" : "translate-x-full"}`}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div>
                <div className="text-[10px] tracking-[0.3em] uppercase text-burgundy font-semibold">
                  Refine
                </div>
                <div className="text-serif text-xl leading-tight">Filters</div>
              </div>
              <button
                aria-label="Close filters"
                onClick={closeDrawer}
                className="p-2 -mr-2 rounded-full hover:bg-muted transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Staged filters (draft state) */}
            <div className="overflow-y-auto flex-1 px-5 py-6">
              <DraftFilters
                cat={cat}
                draft={draft}
                setDraft={setDraft}
                toggleIn={toggleIn}
              />
            </div>

            {/* Sticky action bar */}
            <div className="p-4 border-t border-border bg-background/95 backdrop-blur">
              <div className="mb-3 flex items-center justify-between text-xs">
                <span className="text-muted-foreground">
                  {draftActiveCount > 0
                    ? `${draftActiveCount} filter${draftActiveCount === 1 ? "" : "s"} selected`
                    : "No filters selected"}
                </span>
                <button
                  onClick={resetDraft}
                  disabled={draftActiveCount === 0}
                  className="uppercase tracking-widest font-semibold text-burgundy hover:underline disabled:opacity-40 disabled:no-underline"
                >
                  Reset
                </button>
              </div>
              <div className="grid grid-cols-[auto_1fr] gap-3">
                <button
                  onClick={closeDrawer}
                  className="rounded-full border border-border px-5 py-3 text-sm font-medium hover:border-burgundy transition"
                >
                  Cancel
                </button>
                <button
                  onClick={applyDraft}
                  className="rounded-full bg-burgundy text-primary-foreground px-6 py-3 text-sm font-semibold hover:opacity-90 transition"
                >
                  Show {draftFiltered.length} product{draftFiltered.length === 1 ? "" : "s"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <SiteFooter />
    </div>
  );
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-[11px] uppercase tracking-[0.25em] font-semibold text-burgundy mb-3">
        {title}
      </h3>
      {children}
    </div>
  );
}

function CheckboxRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="flex items-center gap-2.5 cursor-pointer group">
      <span
        className={`h-4 w-4 rounded border grid place-items-center transition ${checked ? "bg-burgundy border-burgundy" : "bg-background border-border group-hover:border-burgundy"}`}
      >
        {checked && <Check className="h-3 w-3 text-primary-foreground" />}
      </span>
      <input type="checkbox" checked={checked} onChange={onChange} className="sr-only" />
      <span className="text-sm text-foreground/85">{label}</span>
    </label>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`text-xs md:text-sm px-4 py-2 rounded-full border transition ${active ? "bg-burgundy text-primary-foreground border-burgundy" : "bg-background/70 border-border text-foreground/80 hover:border-burgundy hover:text-burgundy"}`}
    >
      {children}
    </button>
  );
}

function Pill({ onRemove, children }: { onRemove: () => void; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 bg-ivory border border-border rounded-full pl-3 pr-1.5 py-1 text-xs capitalize">
      {children}
      <button
        onClick={onRemove}
        aria-label="Remove filter"
        className="h-5 w-5 grid place-items-center rounded-full hover:bg-burgundy hover:text-primary-foreground transition"
      >
        <X className="h-3 w-3" />
      </button>
    </span>
  );
}

type DraftState = {
  sub: string;
  brands: string[];
  concerns: string[];
  skin: string[];
  min: number;
  max: number;
  stock: boolean;
};

function DraftFilters({
  cat,
  draft,
  setDraft,
  toggleIn,
}: {
  cat: NonNullable<ReturnType<typeof getCategory>>;
  draft: DraftState;
  setDraft: React.Dispatch<React.SetStateAction<DraftState>>;
  toggleIn: (list: string[], value: string) => string[];
}) {
  const patch = (p: Partial<DraftState>) => setDraft((d) => ({ ...d, ...p }));

  return (
    <div className="space-y-8 animate-fade-in">
      <FilterGroup title="Subcategory">
        <div className="flex flex-wrap gap-2">
          <Chip active={!draft.sub} onClick={() => patch({ sub: "" })}>
            All {cat.name}
          </Chip>
          {cat.columns.flatMap((c) => c.items).map((it) => (
            <Chip
              key={it.slug}
              active={draft.sub === it.slug}
              onClick={() => patch({ sub: it.slug })}
            >
              {it.label}
            </Chip>
          ))}
        </div>
      </FilterGroup>

      <FilterGroup title="Brand">
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 max-h-64 overflow-y-auto pr-1">
          {allBrands.map((b) => (
            <CheckboxRow
              key={b}
              label={b}
              checked={draft.brands.includes(b)}
              onChange={() => patch({ brands: toggleIn(draft.brands, b) })}
            />
          ))}
        </div>
      </FilterGroup>

      <FilterGroup title="Skin Concern">
        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
          {allConcerns.map((c) => (
            <CheckboxRow
              key={c}
              label={c}
              checked={draft.concerns.includes(c)}
              onChange={() => patch({ concerns: toggleIn(draft.concerns, c) })}
            />
          ))}
        </div>
      </FilterGroup>

      <FilterGroup title="Skin Type">
        <div className="flex flex-wrap gap-2">
          {allSkinTypes.map((s) => (
            <Chip
              key={s}
              active={draft.skin.includes(s)}
              onClick={() => patch({ skin: toggleIn(draft.skin, s) })}
            >
              {s}
            </Chip>
          ))}
        </div>
      </FilterGroup>

      <FilterGroup title="Price (৳)">
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={draft.min}
            min={0}
            onChange={(e) => patch({ min: Number(e.target.value) || 0 })}
            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-burgundy"
          />
          <span className="text-muted-foreground">—</span>
          <input
            type="number"
            value={draft.max}
            min={0}
            onChange={(e) => patch({ max: Number(e.target.value) || 0 })}
            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-burgundy"
          />
        </div>
        <input
          type="range"
          min={0}
          max={5000}
          step={100}
          value={draft.max}
          onChange={(e) => patch({ max: Number(e.target.value) })}
          className="w-full mt-3 accent-burgundy"
        />
      </FilterGroup>

      <FilterGroup title="Availability">
        <CheckboxRow
          label="In stock only"
          checked={draft.stock}
          onChange={() => patch({ stock: !draft.stock })}
        />
      </FilterGroup>
    </div>
  );
}

// unused export to satisfy references from home nav — kept for exhaustive links
export const _categories = categories;


function Pagination({
  currentPage,
  totalPages,
  onChange,
}: {
  currentPage: number;
  totalPages: number;
  onChange: (n: number) => void;
}) {
  const pages: (number | "…")[] = [];
  const push = (v: number | "…") => pages.push(v);
  const window = 1;
  for (let i = 1; i <= totalPages; i++) {
    if (
      i === 1 ||
      i === totalPages ||
      (i >= currentPage - window && i <= currentPage + window)
    ) {
      push(i);
    } else if (pages[pages.length - 1] !== "…") {
      push("…");
    }
  }

  return (
    <nav
      aria-label="Pagination"
      className="mt-12 flex items-center justify-center gap-2 flex-wrap"
    >
      <button
        onClick={() => onChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        className="text-xs uppercase tracking-widest px-4 py-2 rounded-full border border-border hover:border-burgundy hover:text-burgundy transition disabled:opacity-40 disabled:pointer-events-none"
      >
        Prev
      </button>
      {pages.map((p, i) =>
        p === "…" ? (
          <span key={`e-${i}`} className="px-2 text-muted-foreground text-sm">
            …
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onChange(p)}
            aria-current={p === currentPage ? "page" : undefined}
            className={`h-9 min-w-9 px-3 rounded-full text-sm transition ${
              p === currentPage
                ? "bg-burgundy text-primary-foreground border border-burgundy"
                : "border border-border hover:border-burgundy hover:text-burgundy"
            }`}
          >
            {p}
          </button>
        ),
      )}
      <button
        onClick={() => onChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
        className="text-xs uppercase tracking-widest px-4 py-2 rounded-full border border-border hover:border-burgundy hover:text-burgundy transition disabled:opacity-40 disabled:pointer-events-none"
      >
        Next
      </button>
    </nav>
  );
}
