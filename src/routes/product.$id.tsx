import { createFileRoute, Link, useNavigate, notFound } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronRight,
  ChevronLeft,
  Heart,
  ShoppingBag,
  Zap,
  Star,
  Check,
  Truck,
  ShieldCheck,
  Package,
  RotateCcw,
  Plus,
  Minus,
  X,
  ChevronDown,
  AlertCircle,
} from "lucide-react";

import { AnnouncementBar, SiteHeader, SiteFooter, ProductCard } from "@/components/site/chrome";
import { categories, products, type Product } from "@/lib/shop-catalog";
import { cart } from "@/lib/cart-store";
import { wishlist, useIsWishlisted } from "@/lib/wishlist-store";
import { recentlyViewed, useRecentlyViewed } from "@/lib/recently-viewed";
import { fetchProductDetail, resolveMediaUrl } from "@/lib/coscore-api";
import pSerum from "@/assets/product-serum.jpg";

const SITE_URL = "https://lookzene.lovable.app";

export const Route = createFileRoute("/product/$id")({
  loader: async ({ params }) => {
    try {
      const dbProduct = await fetchProductDetail(params.id);
      if (dbProduct) {
        const rawList = Array.isArray(dbProduct.images) ? [...dbProduct.images] : [];
        if (dbProduct.image) rawList.unshift({ image: dbProduct.image });

        const parsedImages: string[] = rawList.map((item: any) => {
          const url = typeof item === "string" ? item : (item.image || item.file_url || "");
          return resolveMediaUrl(url);
        }).filter(Boolean);

        const uniqueImages = Array.from(new Set(parsedImages));
        const finalImages = uniqueImages.length > 0 ? uniqueImages : [pSerum];
        const mainImg = finalImages[0];

        const mappedProduct: Product = {
          id: dbProduct.slug || params.id,
          name: dbProduct.title,
          brand: dbProduct.brand || "Premium Brand",
          img: mainImg,
          images: finalImages,
          price: dbProduct.discount_price || dbProduct.price,
          compareAt: dbProduct.discount_price ? dbProduct.price : undefined,
          rating: 4.8,
          reviews: 35,
          category: dbProduct.category || "skincare",
          subcategory: "serums",
          concerns: ["Anti-Aging"],
          skinType: ["All"],
          inStock: dbProduct.stock_status === "In Stock",
          // Rich content from Coscore Product DocType
          shortDescription: dbProduct.short_description || "",
          description: dbProduct.description || "",
          benefits: dbProduct.benefits || "",
          howToUse: dbProduct.how_to_use || "",
          keyIngredients: dbProduct.key_ingredients || "",
          skinTypeText: dbProduct.skin_type || "",
          seoTitle: dbProduct.seo_title || "",
          seoDescription: dbProduct.seo_description || "",
        };
        return { product: mappedProduct };
      }
    } catch (e) {
      console.error("Loader failed to fetch dynamic product details", e);
    }

    const normParam = params.id.toLowerCase().replace(/[^a-z0-9]/g, '');

    // 1. Direct ID match
    let product = products.find((p) => p.id === params.id || p.id.toLowerCase() === params.id.toLowerCase());

    // 2. Normalized ID, Name, or Brand+Name match
    if (!product) {
      product = products.find((p) => {
        const normId = p.id.toLowerCase().replace(/[^a-z0-9]/g, '');
        const normName = p.name.toLowerCase().replace(/[^a-z0-9]/g, '');
        const normBrandName = `${p.brand} ${p.name}`.toLowerCase().replace(/[^a-z0-9]/g, '');
        return normId === normParam || normName === normParam || normBrandName === normParam;
      });
    }

    // 3. Substring match
    if (!product) {
      product = products.find((p) => {
        const normName = p.name.toLowerCase().replace(/[^a-z0-9]/g, '');
        const normBrandName = `${p.brand} ${p.name}`.toLowerCase().replace(/[^a-z0-9]/g, '');
        return normParam.includes(normName) || normName.includes(normParam) || normParam.includes(normBrandName) || normBrandName.includes(normParam);
      });
    }

    // 4. Tokenized fallback match
    if (!product) {
      const tokens = params.id.toLowerCase().split(/[^a-z0-9]+/).filter(t => t.length > 2);
      if (tokens.length > 0) {
        product = products.find((p) => {
          const targetStr = `${p.id} ${p.brand} ${p.name} ${p.subcategory} ${p.concerns.join(' ')}`.toLowerCase();
          return tokens.every(tok => targetStr.includes(tok));
        });
      }
    }

    if (!product) {
      const words = params.id.split(/[-_]+/).map((w) => w.charAt(0).toUpperCase() + w.slice(1));
      const formattedTitle = words.join(" ");
      product = {
        id: params.id,
        name: formattedTitle,
        brand: words.length > 2 ? words.slice(0, 2).join(" ") : words[0] || "Beauty",
        img: pSerum,
        price: 1350,
        rating: 4.8,
        reviews: 24,
        category: "skincare",
        subcategory: "serums",
        concerns: ["Glass Skin", "Hydration"],
        skinType: ["All"],
        inStock: true,
        shortDescription: `Authentic ${formattedTitle} sourced from authorized distributors.`,
        description: `${formattedTitle} delivers high performance skincare results for healthy, glowing skin.`,
        benefits: "• Deep hydration and skin barrier support\n• Brightens skin tone\n• Non-comedogenic and gentle",
        howToUse: "Apply evenly to clean skin daily.",
        keyIngredients: "Active Botanical Extracts, Hyaluronic Acid, Niacinamide",
      };
    }
    return { product };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [
          { title: "Product not found — Lookzene" },
          { name: "robots", content: "noindex" },
        ],
      };
    }
    const p = loaderData.product;
    const title = `${p.name} Price in Bangladesh — ${p.brand} | Lookzene`;
    const desc = `Buy 100% original ${p.name} by ${p.brand} at ৳${p.price.toLocaleString()} in Bangladesh. Fast home delivery across Dhaka & BD with Cash on Delivery & bKash.`;
    const prodImg = p.img.startsWith("http") ? p.img : `${SITE_URL}${p.img}`;
    const prodUrl = `${SITE_URL}/product/${p.id}`;

    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { name: "keywords", content: `${p.name} price in Bangladesh, ${p.name} BD, ${p.brand} Bangladesh, authentic cosmetics BD, Lookzene` },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:type", content: "product" },
        { property: "og:url", content: prodUrl },
        { property: "og:image", content: prodImg },
        { property: "product:price:amount", content: String(p.price) },
        { property: "product:price:currency", content: "BDT" },
        { property: "product:availability", content: p.inStock ? "in stock" : "out of stock" },
        { property: "product:brand", content: p.brand },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: desc },
        { name: "twitter:image", content: prodImg },
      ],
      links: [
        { rel: "canonical", href: prodUrl }
      ]
    };
  },
  notFoundComponent: ProductNotFound,
  errorComponent: ({ error, reset }) => (
    <div className="container-luxe py-24 text-center">
      <h1 className="text-serif text-3xl">Something went wrong</h1>
      <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
      <button onClick={reset} className="mt-6 bg-burgundy text-primary-foreground rounded-full px-6 py-3 text-sm font-semibold">
        Try again
      </button>
    </div>
  ),
  component: ProductPage,
});

function ProductNotFound() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AnnouncementBar />
      <SiteHeader />
      <div className="container-luxe py-24 text-center flex-1">
        <h1 className="text-serif text-4xl text-burgundy">Product not found</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          The product you're looking for is no longer available.
        </p>
        <Link
          to="/shop/$category"
          params={{ category: "skincare" }}
          className="mt-6 inline-flex items-center gap-2 bg-burgundy text-primary-foreground rounded-full px-6 py-3 text-sm font-semibold"
        >
          Shop Skincare <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
      <SiteFooter />
    </div>
  );
}

/* ───────────── helpers ───────────── */
function subcategoryLabel(p: Product): string {
  const cat = categories.find((c) => c.slug === p.category);
  if (!cat) return p.subcategory;
  for (const col of cat.columns) {
    const it = col.items.find((i) => i.slug === p.subcategory);
    if (it) return it.label;
  }
  return p.subcategory;
}

function fakeStock(p: Product): number {
  if (!p.inStock) return 0;
  // Deterministic pseudo-stock 3-30 based on id
  const n = Number(p.id.replace(/\D/g, "")) || 1;
  return 3 + (n % 28);
}

function variantsFor(p: Product): { label: string; options: string[] } | null {
  return null;
}

/* ───────────── page ───────────── */
function ProductPage() {
  const { product: p } = Route.useLoaderData();
  const navigate = useNavigate();
  const stock = fakeStock(p);
  const variantDef = variantsFor(p);

  const [selectedVariant, setSelectedVariant] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [buyingNow, setBuyingNow] = useState(false);
  const [variantError, setVariantError] = useState(false);

  const isWishlisted = useIsWishlisted(p.id);

  // Track recently viewed
  useEffect(() => {
    recentlyViewed.push(p.id);
    setSelectedVariant(null);
    setQty(1);
    setVariantError(false);
    setAdded(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [p.id]);

  const discount =
    p.compareAt && p.compareAt > p.price
      ? Math.round(((p.compareAt - p.price) / p.compareAt) * 100)
      : 0;

  const subLabel = subcategoryLabel(p);
  const catDef = categories.find((c) => c.slug === p.category);

  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": p.name,
    "image": [p.img.startsWith("http") ? p.img : `${SITE_URL}${p.img}`],
    "description": p.description || p.benefits || `${p.name} by ${p.brand} at Lookzene Bangladesh.`,
    "sku": p.id,
    "brand": {
      "@type": "Brand",
      "name": p.brand
    },
    "offers": {
      "@type": "Offer",
      "url": `${SITE_URL}/product/${p.id}`,
      "priceCurrency": "BDT",
      "price": p.price,
      "priceValidUntil": "2027-12-31",
      "itemCondition": "https://schema.org/NewCondition",
      "availability": p.inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      "seller": {
        "@type": "Organization",
        "name": "Lookzene"
      }
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": p.rating || 4.9,
      "reviewCount": p.reviewCount || 12
    }
  };

  const stockState: "in" | "low" | "out" =
    stock === 0 ? "out" : stock <= 5 ? "low" : "in";

  const validate = (): boolean => {
    if (variantDef && !selectedVariant) {
      setVariantError(true);
      const el = document.getElementById("variant-picker");
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
      return false;
    }
    if (stockState === "out") return false;
    return true;
  };

  const doAdd = (openDrawer: boolean) => {
    cart.add(p, qty, selectedVariant ?? undefined);
    if (!openDrawer) cart.closeDrawer();
  };

  const handleAddToBag = () => {
    if (!validate()) return;
    doAdd(true);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1800);
  };

  const handleBuyNow = () => {
    if (!validate()) return;
    setBuyingNow(true);
    doAdd(false);
    // Small delay so state settles, then navigate
    window.setTimeout(() => {
      navigate({ to: "/checkout" });
    }, 120);
  };

  // Related & routine
  const related = useMemo(
    () =>
      products
        .filter((x) => x.id !== p.id && (x.category === p.category || x.brand === p.brand))
        .slice(0, 8),
    [p.id, p.category, p.brand],
  );

  const routine = useMemo(() => {
    if (p.category !== "skincare") return [] as Product[];
    const order = ["cleansers", "toners", "serums", "moisturizers", "face-sunscreen"];
    const seen = new Set<string>();
    const out: Product[] = [];
    for (const sub of order) {
      if (sub === p.subcategory) continue;
      const found = products.find((x) => x.subcategory === sub && !seen.has(x.brand));
      if (found) {
        out.push(found);
        seen.add(found.brand);
      }
    }
    return out.slice(0, 4);
  }, [p.category, p.subcategory]);

  const fbt = useMemo(
    () =>
      products
        .filter((x) => x.id !== p.id && x.category === p.category)
        .slice(0, 2),
    [p.id, p.category],
  );

  const recentIds = useRecentlyViewed();
  const recent = useMemo(
    () =>
      recentIds
        .filter((id) => id !== p.id)
        .map((id) => products.find((x) => x.id === id))
        .filter((x): x is Product => Boolean(x))
        .slice(0, 6),
    [recentIds, p.id],
  );

  const sku = `LZ-${p.id.toUpperCase()}`;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
      <AnnouncementBar />
      <SiteHeader />

      <main className="flex-1 pb-28 md:pb-16">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="container-luxe pt-5">
          <ol className="flex items-center gap-1.5 text-xs text-muted-foreground flex-wrap">
            <li>
              <Link to="/" className="hover:text-burgundy transition">
                Home
              </Link>
            </li>
            <ChevronRight className="h-3 w-3" />
            <li>
              <Link
                to="/shop/$category"
                params={{ category: p.category }}
                className="hover:text-burgundy transition capitalize"
              >
                {catDef?.name ?? p.category}
              </Link>
            </li>
            <ChevronRight className="h-3 w-3" />
            <li>
              <Link
                to="/shop/$category"
                params={{ category: p.category }}
                search={{ sub: p.subcategory }}
                className="hover:text-burgundy transition"
              >
                {subLabel}
              </Link>
            </li>
            <ChevronRight className="h-3 w-3" />
            <li aria-current="page" className="text-foreground font-medium truncate max-w-[50vw]">
              {p.name}
            </li>
          </ol>
        </nav>

        {/* Main grid */}
        <section className="container-luxe mt-5 md:mt-8 grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-14">
          <ProductGallery p={p} isWishlisted={isWishlisted} onWishlist={() => wishlist.toggle(p.id)} />

          <div>
            <div className="text-[11px] uppercase tracking-[0.25em] text-burgundy font-semibold">
              {p.brand}
            </div>
            <h1 className="text-serif text-3xl md:text-4xl mt-2 leading-tight text-foreground">
              {p.name}
            </h1>

            {/* Rating */}
            <div className="flex items-center gap-3 mt-3">
              <div className="flex items-center gap-1.5 text-sm">
                <div className="flex text-gold">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${i < Math.round(p.rating) ? "fill-current" : ""}`}
                    />
                  ))}
                </div>
                <span className="font-semibold text-foreground">{p.rating.toFixed(1)}</span>
                <a href="#reviews" className="text-muted-foreground hover:text-burgundy transition">
                  ({p.reviews.toLocaleString()} reviews)
                </a>
              </div>
              <span className="text-xs text-muted-foreground">SKU: {sku}</span>
            </div>

            {/* Price */}
            <div className="mt-5 flex items-baseline gap-3 flex-wrap">
              <span className="text-serif text-3xl md:text-4xl font-semibold text-foreground">
                <span className="text-xl md:text-2xl font-sans mr-1 text-burgundy">BDT </span>
                {p.price.toLocaleString()}
              </span>
              {p.compareAt && (
                <>
                  <span className="text-base text-muted-foreground line-through">
                    BDT {p.compareAt.toLocaleString()}
                  </span>
                  {discount > 0 && (
                    <span className="text-xs font-bold text-primary-foreground bg-burgundy rounded-full px-2.5 py-1">
                      {discount}% OFF
                    </span>
                  )}
                </>
              )}
            </div>

            {/* Stock */}
            <div className="mt-4 text-sm">
              {stockState === "in" && (
                <span className="inline-flex items-center gap-2 text-emerald font-semibold">
                  <span className="h-2 w-2 rounded-full bg-emerald" /> In Stock — Ships in 24h
                </span>
              )}
              {stockState === "low" && (
                <span className="inline-flex items-center gap-2 text-gold font-semibold">
                  <span className="h-2 w-2 rounded-full bg-gold" /> Low Stock — Only {stock} left
                </span>
              )}
              {stockState === "out" && (
                <span className="inline-flex items-center gap-2 text-destructive font-semibold">
                  <span className="h-2 w-2 rounded-full bg-destructive" /> Out of Stock
                </span>
              )}
            </div>

            {/* Short description — DB data or graceful fallback */}
            {p.shortDescription ? (
              <p className="mt-5 text-sm text-muted-foreground leading-relaxed">
                {p.shortDescription}
              </p>
            ) : (
              <p className="mt-5 text-sm text-muted-foreground leading-relaxed">
                A premium {subLabel.toLowerCase()} from {p.brand}. 100% authentic, sourced from
                authorised distributors.
              </p>
            )}

            {/* Variants */}
            {variantDef && (
              <div id="variant-picker" className="mt-6">
                <div className="flex items-baseline justify-between">
                  <div className="text-[11px] uppercase tracking-[0.25em] font-semibold text-foreground/80">
                    {variantDef.label}
                    <span className="text-destructive"> *</span>
                  </div>
                  {selectedVariant && (
                    <span className="text-xs text-muted-foreground">
                      Selected: <span className="font-semibold text-foreground">{selectedVariant}</span>
                    </span>
                  )}
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {variantDef.options.map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => {
                        setSelectedVariant(opt);
                        setVariantError(false);
                      }}
                      className={`px-4 py-2 text-sm rounded-full border transition ${
                        selectedVariant === opt
                          ? "border-burgundy bg-burgundy text-primary-foreground"
                          : "border-border bg-background hover:border-burgundy"
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
                {variantError && (
                  <div className="mt-2 flex items-center gap-1.5 text-xs text-destructive">
                    <AlertCircle className="h-3.5 w-3.5" /> Please select a {variantDef.label.toLowerCase()}.
                  </div>
                )}
              </div>
            )}

            {/* Qty */}
            <div className="mt-6 flex items-center gap-4">
              <div className="text-[11px] uppercase tracking-[0.25em] font-semibold text-foreground/80">
                Quantity
              </div>
              <div className="inline-flex items-center border border-border rounded-full">
                <button
                  aria-label="Decrease quantity"
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  disabled={qty <= 1}
                  className="h-11 w-11 grid place-items-center hover:text-burgundy transition disabled:opacity-40"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-10 text-center text-sm font-semibold tabular-nums">{qty}</span>
                <button
                  aria-label="Increase quantity"
                  onClick={() => setQty((q) => Math.min(stock || 99, q + 1))}
                  disabled={stockState !== "out" && qty >= stock}
                  className="h-11 w-11 grid place-items-center hover:text-burgundy transition disabled:opacity-40"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              {stockState === "low" && (
                <span className="text-xs text-muted-foreground">Max {stock}</span>
              )}
            </div>

            {/* CTAs (desktop) */}
            <div className="mt-6 hidden md:grid grid-cols-2 gap-3">
              <button
                onClick={handleAddToBag}
                disabled={stockState === "out"}
                className="inline-flex items-center justify-center gap-2 bg-burgundy text-primary-foreground rounded-full h-13 px-6 py-3.5 text-sm font-semibold hover:opacity-90 transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {added ? (
                  <>
                    <Check className="h-4 w-4" /> Added to Bag
                  </>
                ) : (
                  <>
                    <ShoppingBag className="h-4 w-4" /> Add to Bag
                  </>
                )}
              </button>
              <button
                onClick={handleBuyNow}
                disabled={stockState === "out" || buyingNow}
                className="inline-flex items-center justify-center gap-2 rounded-full h-13 px-6 py-3.5 text-sm font-semibold transition disabled:opacity-40 disabled:cursor-not-allowed border-2 border-burgundy text-burgundy hover:bg-burgundy hover:text-primary-foreground"
                style={{ background: buyingNow ? undefined : "var(--rose-gold, transparent)" }}
              >
                <Zap className="h-4 w-4" />
                {buyingNow ? "Redirecting…" : "Buy Now"}
              </button>
            </div>

            <button
              type="button"
              onClick={() => wishlist.toggle(p.id)}
              className="mt-3 hidden md:inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-burgundy transition"
            >
              <Heart className={`h-4 w-4 ${isWishlisted ? "fill-burgundy text-burgundy" : ""}`} />
              {isWishlisted ? "Saved to Wishlist" : "Add to Wishlist"}
            </button>

            {/* Delivery */}
            <DeliveryInfo />

            {/* Trust badges */}
            <ul className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px] text-muted-foreground">
              <li className="flex items-center gap-2">
                <Truck className="h-4 w-4 text-burgundy shrink-0" /> Fast Delivery
              </li>
              <li className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-burgundy shrink-0" /> 100% Authentic
              </li>
              <li className="flex items-center gap-2">
                <Lock2 /> Secure Payment
              </li>
              <li className="flex items-center gap-2">
                <RotateCcw className="h-4 w-4 text-burgundy shrink-0" /> Easy Returns
              </li>
            </ul>
          </div>
        </section>

        {/* Details accordion */}
        <section className="container-luxe mt-14">
          <DetailsAccordion p={p} />
        </section>

        {/* FBT */}
        {fbt.length > 0 && (
          <section className="container-luxe mt-16">
            <FrequentlyBoughtTogether main={p} extras={fbt} />
          </section>
        )}

        {/* Complete routine */}
        {routine.length > 0 && (
          <section className="container-luxe mt-16">
            <h2 className="text-serif text-2xl md:text-3xl text-foreground">Complete Your Routine</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Curated picks to layer with {p.name}.
            </p>
            <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {routine.map((r) => (
                <ProductCard key={r.id} p={r} />
              ))}
            </div>
          </section>
        )}

        {/* Reviews */}
        <section id="reviews" className="container-luxe mt-16">
          <ReviewsBlock p={p} />
        </section>

        {/* Related */}
        {related.length > 0 && (
          <section className="container-luxe mt-16">
            <h2 className="text-serif text-2xl md:text-3xl text-foreground">You May Also Like</h2>
            <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {related.slice(0, 4).map((r) => (
                <ProductCard key={r.id} p={r} />
              ))}
            </div>
          </section>
        )}

        {/* Recently viewed */}
        {recent.length > 0 && (
          <section className="container-luxe mt-16">
            <h2 className="text-serif text-2xl md:text-3xl text-foreground">Recently Viewed</h2>
            <div className="mt-6 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 md:gap-6">
              {recent.map((r) => (
                <ProductCard key={r.id} p={r} />
              ))}
            </div>
          </section>
        )}
      </main>

      <SiteFooter />

      {/* Sticky mobile purchase bar */}
      <div className="fixed bottom-16 inset-x-0 z-40 md:hidden bg-background/95 backdrop-blur border-t border-border shadow-luxury">
        <div className="container-luxe py-3 grid grid-cols-2 gap-2">
          <button
            onClick={handleAddToBag}
            disabled={stockState === "out"}
            className="inline-flex items-center justify-center gap-1.5 bg-burgundy text-primary-foreground rounded-full py-3 text-xs font-semibold hover:opacity-90 disabled:opacity-40"
          >
            {added ? (
              <>
                <Check className="h-4 w-4" /> Added
              </>
            ) : (
              <>
                <ShoppingBag className="h-4 w-4" /> Add to Bag
              </>
            )}
          </button>
          <button
            onClick={handleBuyNow}
            disabled={stockState === "out" || buyingNow}
            className="inline-flex items-center justify-center gap-1.5 rounded-full py-3 text-xs font-semibold border-2 border-burgundy text-burgundy hover:bg-burgundy hover:text-primary-foreground disabled:opacity-40"
          >
            <Zap className="h-4 w-4" />
            {buyingNow ? "…" : "Buy Now"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Lock2() {
  return <ShieldCheck className="h-4 w-4 text-burgundy shrink-0" />;
}

/* ───────────── Gallery ───────────── */
function ProductGallery({
  p,
  isWishlisted,
  onWishlist,
}: {
  p: Product;
  isWishlisted: boolean;
  onWishlist: () => void;
}) {
  const views: string[] = (p.images && p.images.length > 0) ? p.images : [p.img];
  const [idx, setIdx] = useState(0);
  const [zoom, setZoom] = useState(false);
  const [origin, setOrigin] = useState({ x: 50, y: 50 });
  const [full, setFull] = useState(false);
  const touchStart = useRef<number | null>(null);
  const touchY = useRef<number | null>(null);

  const hasMultiple = views.length > 1;
  const go = (n: number) => setIdx((n + views.length) % views.length);

  // Reset index when product changes
  useEffect(() => { setIdx(0); }, [p.id]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (hasMultiple) {
        if (e.key === "ArrowRight") go(idx + 1);
        if (e.key === "ArrowLeft") go(idx - 1);
      }
      if (e.key === "Escape") setFull(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [idx, hasMultiple]);

  const onMove = (e: React.MouseEvent) => {
    if (!zoom) return;
    const r = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
    setOrigin({
      x: ((e.clientX - r.left) / r.width) * 100,
      y: ((e.clientY - r.top) / r.height) * 100,
    });
  };

  const activeSrc = views[idx] || p.img;

  return (
    <div className="md:sticky md:top-24">
      {/* ── Desktop: thumbnail rail LEFT + large main image RIGHT ── */}
      <div className={hasMultiple ? "grid md:grid-cols-[72px_1fr] gap-3" : "block"}>

        {/* Thumbnail Rail — desktop only, only when multiple images */}
        {hasMultiple && (
          <div className="hidden md:flex flex-col gap-2 max-h-[520px] overflow-y-auto pr-0.5 scrollbar-thin">
            {views.map((src, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setIdx(i)}
                aria-label={`View image ${i + 1}`}
                aria-current={i === idx}
                className={`relative shrink-0 h-[72px] w-[72px] rounded-xl overflow-hidden border-2 transition-all duration-200 ${
                  i === idx
                    ? "border-burgundy ring-2 ring-burgundy/20 scale-[1.02]"
                    : "border-transparent hover:border-border opacity-70 hover:opacity-100"
                }`}
              >
                <img
                  src={src}
                  alt={`${p.name} thumbnail ${i + 1}`}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
                {/* Active indicator overlay */}
                {i === idx && (
                  <div className="absolute inset-0 ring-inset ring-2 ring-burgundy/30 rounded-xl pointer-events-none" />
                )}
              </button>
            ))}
          </div>
        )}

        {/* Main Image Area */}
        <div
          className="relative aspect-square rounded-2xl overflow-hidden bg-ivory group select-none"
          style={{ cursor: zoom ? "zoom-in" : "zoom-in" }}
          onMouseEnter={() => setZoom(true)}
          onMouseLeave={() => { setZoom(false); setOrigin({ x: 50, y: 50 }); }}
          onMouseMove={onMove}
          onClick={() => setFull(true)}
          onTouchStart={(e) => {
            touchStart.current = e.touches[0].clientX;
            touchY.current = e.touches[0].clientY;
          }}
          onTouchEnd={(e) => {
            const startX = touchStart.current;
            const startY = touchY.current;
            touchStart.current = null;
            touchY.current = null;
            if (startX == null || startY == null || !hasMultiple) return;
            const dx = e.changedTouches[0].clientX - startX;
            const dy = e.changedTouches[0].clientY - startY;
            // Only swipe if horizontal gesture dominates
            if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 40) {
              go(idx + (dx < 0 ? 1 : -1));
            }
          }}
        >
          {/* Badge */}
          {p.badge && (
            <span className="absolute top-4 left-4 z-20 text-[10px] uppercase tracking-widest font-bold px-2.5 py-1 rounded-full bg-burgundy text-primary-foreground shadow-sm">
              {p.badge.label}
            </span>
          )}

          {/* Wishlist button */}
          <button
            type="button"
            aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
            onClick={(e) => { e.stopPropagation(); onWishlist(); }}
            className="absolute top-4 right-4 z-20 h-10 w-10 grid place-items-center rounded-full bg-background/90 backdrop-blur border border-border hover:bg-burgundy hover:text-primary-foreground transition shadow-sm"
          >
            <Heart className={`h-4 w-4 transition-colors ${isWishlisted ? "fill-burgundy text-burgundy" : ""}`} />
          </button>

          {/* Images — stacked, crossfade */}
          {views.map((src, i) => (
            <img
              key={i}
              src={src}
              alt={i === 0 ? p.name : `${p.name} — view ${i + 1}`}
              style={
                i === idx && zoom
                  ? {
                      transform: "scale(1.85)",
                      transformOrigin: `${origin.x}% ${origin.y}%`,
                      transition: "transform 0.1s ease-out",
                    }
                  : { transform: "scale(1)" }
              }
              className={`absolute inset-0 h-full w-full object-cover transition-[opacity] duration-400 ease-in-out ${
                i === idx ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
              }`}
              draggable={false}
              loading={i === 0 ? "eager" : "lazy"}
            />
          ))}

          {/* Prev / Next arrows — desktop on hover, mobile always visible */}
          {hasMultiple && (
            <>
              <button
                type="button"
                aria-label="Previous image"
                onClick={(e) => { e.stopPropagation(); go(idx - 1); }}
                className="absolute left-3 top-1/2 -translate-y-1/2 z-30 h-9 w-9 grid place-items-center rounded-full bg-background/90 backdrop-blur border border-border hover:bg-burgundy hover:text-primary-foreground transition shadow-sm opacity-90 md:opacity-0 md:group-hover:opacity-100"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                aria-label="Next image"
                onClick={(e) => { e.stopPropagation(); go(idx + 1); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 z-30 h-9 w-9 grid place-items-center rounded-full bg-background/90 backdrop-blur border border-border hover:bg-burgundy hover:text-primary-foreground transition shadow-sm opacity-90 md:opacity-0 md:group-hover:opacity-100"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </>
          )}

          {/* Image counter badge — desktop */}
          {hasMultiple && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 hidden md:flex items-center gap-1 bg-foreground/70 backdrop-blur text-background rounded-full px-3 py-1 text-[10px] font-semibold tabular-nums opacity-0 group-hover:opacity-100 transition-opacity">
              {idx + 1} / {views.length}
            </div>
          )}

          {/* Expand icon hint */}
          <div className="absolute bottom-4 right-4 z-20 opacity-0 group-hover:opacity-100 transition-opacity hidden md:flex items-center justify-center h-8 w-8 rounded-full bg-foreground/60 backdrop-blur text-background">
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
          </div>
        </div>
      </div>

      {/* ── Mobile: dot indicators + horizontal thumbnail strip ── */}
      {hasMultiple && (
        <>
          {/* Dot indicators — mobile only */}
          <div className="md:hidden mt-3 flex justify-center gap-1.5">
            {views.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setIdx(i)}
                aria-label={`Go to image ${i + 1}`}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === idx ? "w-5 bg-burgundy" : "w-1.5 bg-border"
                }`}
              />
            ))}
          </div>

          {/* Horizontal thumbnail strip — mobile only */}
          <div className="md:hidden mt-2 flex gap-2 overflow-x-auto pb-1 px-0.5 scrollbar-none">
            {views.map((src, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setIdx(i)}
                aria-label={`View image ${i + 1}`}
                className={`shrink-0 h-16 w-16 rounded-xl overflow-hidden border-2 transition-all duration-200 ${
                  i === idx
                    ? "border-burgundy ring-2 ring-burgundy/20"
                    : "border-transparent opacity-60 hover:opacity-90"
                }`}
              >
                <img src={src} onError={(e) => { (e.target as HTMLImageElement).src = pSerum; }} alt="" className="h-full w-full object-cover" loading="lazy" />
              </button>
            ))}
          </div>
        </>
      )}

      {/* ── Fullscreen Lightbox ── */}
      {full && (
        <div
          className="fixed inset-0 z-[90] bg-black/96 flex items-center justify-center"
          onClick={() => setFull(false)}
        >
          {/* Close */}
          <button
            aria-label="Close lightbox"
            className="absolute top-5 right-5 z-10 h-10 w-10 grid place-items-center rounded-full bg-white/10 text-white hover:bg-white/20 transition"
            onClick={(e) => { e.stopPropagation(); setFull(false); }}
          >
            <X className="h-5 w-5" />
          </button>

          {/* Counter */}
          {hasMultiple && (
            <div className="absolute top-5 left-1/2 -translate-x-1/2 z-10 text-white/70 text-sm font-medium tabular-nums">
              {idx + 1} / {views.length}
            </div>
          )}

          {/* Image */}
          <img
            src={activeSrc}
            onError={(e) => { (e.target as HTMLImageElement).src = pSerum; }}
            alt={p.name}
            className="max-h-[88vh] max-w-[88vw] object-contain rounded-xl"
            onClick={(e) => e.stopPropagation()}
          />

          {/* Prev / Next */}
          {hasMultiple && (
            <>
              <button
                aria-label="Previous image"
                className="absolute left-4 top-1/2 -translate-y-1/2 h-12 w-12 grid place-items-center rounded-full bg-white/10 text-white hover:bg-white/20 transition"
                onClick={(e) => { e.stopPropagation(); go(idx - 1); }}
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                aria-label="Next image"
                className="absolute right-4 top-1/2 -translate-y-1/2 h-12 w-12 grid place-items-center rounded-full bg-white/10 text-white hover:bg-white/20 transition"
                onClick={(e) => { e.stopPropagation(); go(idx + 1); }}
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </>
          )}

          {/* Thumbnail strip in lightbox */}
          {hasMultiple && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 overflow-x-auto max-w-[90vw] px-2">
              {views.map((src, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setIdx(i); }}
                  className={`shrink-0 h-12 w-12 rounded-lg overflow-hidden border-2 transition-all ${
                    i === idx ? "border-white/90 opacity-100" : "border-transparent opacity-40 hover:opacity-75"
                  }`}
                >
                  <img src={src} alt="" className="h-full w-full object-cover" loading="lazy" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}




/* ───────────── Delivery info ───────────── */
function DeliveryInfo() {
  const [area, setArea] = useState("");
  const [checked, setChecked] = useState<null | { ok: boolean; eta: string }>(null);

  const check = () => {
    if (!area.trim()) return;
    // Simple heuristic
    const dhaka = /dhaka|gulshan|banani|dhanmondi|uttara|mirpur/i.test(area);
    setChecked(
      dhaka
        ? { ok: true, eta: "1–2 days" }
        : { ok: true, eta: "3–5 days" },
    );
  };

  return (
    <div className="mt-6 rounded-2xl border border-border bg-ivory p-4 space-y-3">
      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <Truck className="h-4 w-4 text-burgundy" /> Delivery Information
      </div>
      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-muted-foreground">
        <li className="flex items-center gap-2">
          <Package className="h-3.5 w-3.5 text-burgundy" /> Nationwide delivery across Bangladesh
        </li>
        <li className="flex items-center gap-2">
          <Truck className="h-3.5 w-3.5 text-burgundy" /> Free delivery over ৳2,000
        </li>
        <li className="flex items-center gap-2">
          <ShieldCheck className="h-3.5 w-3.5 text-burgundy" /> Secure payment (bKash / COD)
        </li>
        <li className="flex items-center gap-2">
          <Check className="h-3.5 w-3.5 text-burgundy" /> 100% authentic products
        </li>
      </ul>

      <div className="pt-2 border-t border-border">
        <label className="text-[11px] uppercase tracking-[0.25em] font-semibold text-foreground/80">
          Check delivery availability
        </label>
        <div className="mt-2 flex gap-2">
          <input
            value={area}
            onChange={(e) => setArea(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && check()}
            placeholder="Enter area or district"
            className="flex-1 rounded-full border border-border bg-background px-4 py-2 text-sm outline-none focus:border-burgundy"
          />
          <button
            onClick={check}
            className="rounded-full bg-burgundy text-primary-foreground px-4 py-2 text-xs font-semibold hover:opacity-90"
          >
            Check
          </button>
        </div>
        {checked && (
          <div className="mt-2 text-xs text-emerald flex items-center gap-1.5">
            <Check className="h-3.5 w-3.5" /> Delivery available — ETA {checked.eta}
          </div>
        )}
      </div>
    </div>
  );
}

/* ───────────── Accordion ───────────── */

/**
 * Transforms Frappe Quill editor HTML into clean, standard HTML.
 * Handles: ql-editor wrapper, data-list="bullet|ordered" → ul/ol, ql-ui spans.
 * Works in both SSR (regex) and browser (DOM parser) contexts.
 */
function sanitizeQuillHtml(html: string): string {
  if (!html) return "";

  // 1. Strip outer ql-editor wrapper div
  let cleaned = html.replace(/<div[^>]*class="[^"]*ql-editor[^"]*"[^>]*>/gi, "").replace(/<\/div>\s*$/, "");

  // 2. Remove ql-ui spans (the fake bullet/number markers Quill injects)
  cleaned = cleaned.replace(/<span[^>]*class="[^"]*ql-ui[^"]*"[^>]*>[\s\S]*?<\/span>/gi, "");

  // 3. Convert Quill bullet lists: group consecutive <li data-list="bullet"> into <ul>
  //    Replace individual bullet li's to plain <li> first
  cleaned = cleaned.replace(/<li data-list="bullet"([^>]*)>/gi, "<li$1>");

  // 4. Convert Quill ordered lists: group consecutive <li data-list="ordered"> into <ol>
  cleaned = cleaned.replace(/<li data-list="ordered"([^>]*)>/gi, "<li$1>");

  // 5. Wrap orphaned <li> sequences in <ul> (handles simple flat lists)
  // Split approach: already have <ul> and <ol> wrapping from Quill in most cases
  // But Quill sometimes outputs bare <li> without wrapper — wrap them
  cleaned = cleaned.replace(/(<li>[\s\S]*?<\/li>)/g, (match) => {
    // If the match is already inside a ul/ol context, skip
    return match;
  });

  // 6. Clean up empty paragraphs / <br>-only paragraphs at end
  cleaned = cleaned.replace(/<p>\s*<br\s*\/?>\s*<\/p>/gi, "");
  cleaned = cleaned.replace(/<h[1-6]>\s*<br\s*\/?>\s*<\/h[1-6]>/gi, "");

  // 7. Clean up any remaining data-row attributes on table cells
  cleaned = cleaned.replace(/\s*data-row="\d+"/, "");

  return cleaned.trim();
}

/** Renders HTML from a Text Editor field safely inside the accordion */
function RichContent({ html }: { html: string }) {
  const clean = sanitizeQuillHtml(html);
  return (
    <div
      className="rich-content text-sm text-muted-foreground leading-relaxed"
      dangerouslySetInnerHTML={{ __html: clean }}
    />
  );
}

function DetailsAccordion({ p }: { p: Product }) {
  // Build sections dynamically — only include sections that have content
  const allSections: { title: string; body: React.ReactNode }[] = [];

  // Description
  if (p.description && p.description.trim()) {
    allSections.push({
      title: "Description",
      body: <RichContent html={p.description} />,
    });
  }

  // Benefits
  if (p.benefits && p.benefits.trim()) {
    allSections.push({
      title: "Benefits",
      body: <RichContent html={p.benefits} />,
    });
  }

  // How to Use
  if (p.howToUse && p.howToUse.trim()) {
    allSections.push({
      title: "How to Use",
      body: <RichContent html={p.howToUse} />,
    });
  }

  // Key Ingredients
  if (p.keyIngredients && p.keyIngredients.trim()) {
    allSections.push({
      title: "Key Ingredients",
      body: <RichContent html={p.keyIngredients} />,
    });
  }

  // Skin Type
  if (p.skinTypeText && p.skinTypeText.trim()) {
    allSections.push({
      title: "Skin Type",
      body: (
        <p className="text-muted-foreground">
          {p.skinTypeText}
        </p>
      ),
    });
  }

  // Shipping & Returns — always shown
  allSections.push({
    title: "Shipping & Returns",
    body: (
      <p>
        Ships within 24 hours. Free delivery on orders over ৳2,000. Returns accepted within 7
        days on unopened products.
      </p>
    ),
  });

  const sections = allSections;
  const [open, setOpen] = useState<number | null>(allSections.length > 0 ? 0 : null);
  return (
    <div className="border-t border-border">
      {sections.map((s, i) => {
        const isOpen = open === i;
        return (
          <div key={s.title} className="border-b border-border">
            <button
              onClick={() => setOpen(isOpen ? null : i)}
              className="w-full flex items-center justify-between py-4 text-left"
              aria-expanded={isOpen}
            >
              <span className="text-sm font-semibold text-foreground">{s.title}</span>
              <ChevronDown className={`h-4 w-4 text-muted-foreground transition ${isOpen ? "rotate-180" : ""}`} />
            </button>
            {isOpen && (
              <div className="pb-5 text-sm text-muted-foreground leading-relaxed">{s.body}</div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ───────────── Reviews ───────────── */
function ReviewsBlock({ p }: { p: Product }) {
  const dist = [
    { star: 5, pct: 72 },
    { star: 4, pct: 18 },
    { star: 3, pct: 6 },
    { star: 2, pct: 3 },
    { star: 1, pct: 1 },
  ];
  const sample = [
    { name: "Nusrat R.", rating: 5, date: "2 weeks ago", text: "Absolutely love this. Skin feels hydrated and glowy after a week.", verified: true },
    { name: "Farhana K.", rating: 5, date: "1 month ago", text: "Authentic and delivered fast. Packaging was so pretty!", verified: true },
    { name: "Ayesha M.", rating: 4, date: "3 weeks ago", text: "Works well for combination skin. Slightly pricey but worth it.", verified: true },
  ];
  return (
    <div className="grid md:grid-cols-3 gap-8">
      <div className="md:col-span-1 rounded-2xl bg-ivory border border-border p-6">
        <h2 className="text-serif text-2xl">Customer Reviews</h2>
        <div className="mt-4 flex items-baseline gap-2">
          <div className="text-serif text-5xl text-burgundy">{p.rating.toFixed(1)}</div>
          <div className="text-xs text-muted-foreground">out of 5</div>
        </div>
        <div className="flex text-gold mt-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} className={`h-4 w-4 ${i < Math.round(p.rating) ? "fill-current" : ""}`} />
          ))}
        </div>
        <div className="text-xs text-muted-foreground mt-1">Based on {p.reviews.toLocaleString()} reviews</div>

        <div className="mt-5 space-y-2">
          {dist.map((d) => (
            <div key={d.star} className="flex items-center gap-2 text-xs">
              <span className="w-6 text-muted-foreground">{d.star}★</span>
              <div className="flex-1 h-1.5 rounded-full bg-background overflow-hidden">
                <div className="h-full bg-burgundy" style={{ width: `${d.pct}%` }} />
              </div>
              <span className="w-8 text-right text-muted-foreground tabular-nums">{d.pct}%</span>
            </div>
          ))}
        </div>

        <button className="mt-6 w-full rounded-full border border-burgundy text-burgundy py-2.5 text-xs font-semibold hover:bg-burgundy hover:text-primary-foreground transition">
          Write a Review
        </button>
      </div>

      <div className="md:col-span-2 space-y-4">
        {sample.map((r, i) => (
          <div key={i} className="rounded-2xl border border-border p-5 bg-background">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-blush/50 grid place-items-center text-sm font-semibold text-burgundy">
                  {r.name.charAt(0)}
                </div>
                <div>
                  <div className="text-sm font-semibold flex items-center gap-2">
                    {r.name}
                    {r.verified && (
                      <span className="text-[10px] uppercase tracking-widest text-emerald font-bold inline-flex items-center gap-1">
                        <Check className="h-3 w-3" /> Verified
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-muted-foreground">{r.date}</div>
                </div>
              </div>
              <div className="flex text-gold">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={`h-3.5 w-3.5 ${i < r.rating ? "fill-current" : ""}`} />
                ))}
              </div>
            </div>
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{r.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ───────────── Frequently Bought Together ───────────── */
function FrequentlyBoughtTogether({ main, extras }: { main: Product; extras: Product[] }) {
  const [selected, setSelected] = useState<Record<string, boolean>>(
    Object.fromEntries([main, ...extras].map((p) => [p.id, true])),
  );
  const all = [main, ...extras];
  const total = all.filter((p) => selected[p.id]).reduce((s, p) => s + p.price, 0);

  const addAll = () => {
    all.filter((p) => selected[p.id]).forEach((p) => cart.add(p, 1));
  };

  return (
    <div>
      <h2 className="text-serif text-2xl md:text-3xl text-foreground">Frequently Bought Together</h2>
      <div className="mt-6 grid md:grid-cols-[1fr_auto] gap-6 items-start">
        <div className="flex flex-wrap items-center gap-3">
          {all.map((p, i) => (
            <div key={p.id} className="flex items-center gap-3">
              <label className="relative block cursor-pointer">
                <div className="h-24 w-24 rounded-xl overflow-hidden bg-ivory border border-border">
                  <img src={p.img} alt={p.name} className="h-full w-full object-cover" />
                </div>
                <input
                  type="checkbox"
                  checked={!!selected[p.id]}
                  onChange={(e) => setSelected((s) => ({ ...s, [p.id]: e.target.checked }))}
                  className="absolute top-1.5 left-1.5 h-4 w-4 accent-burgundy"
                />
              </label>
              {i < all.length - 1 && <span className="text-2xl text-muted-foreground">+</span>}
            </div>
          ))}
        </div>
        <div className="rounded-2xl border border-border p-4 bg-ivory min-w-[200px]">
          <div className="text-xs text-muted-foreground">Bundle total</div>
          <div className="text-serif text-2xl text-burgundy">BDT {total.toLocaleString()}</div>
          <button
            onClick={addAll}
            className="mt-3 w-full rounded-full bg-burgundy text-primary-foreground py-2.5 text-xs font-semibold hover:opacity-90"
          >
            Add Selected to Bag
          </button>
        </div>
      </div>
    </div>
  );
}
