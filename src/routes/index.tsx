import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CheckCircle2,
  Heart,
  Loader2,
  Star,
  Truck,
  ShieldCheck,
  Sparkles,
  Leaf,
  ChevronRight,
  ArrowRight,
  Plus,
  ShoppingBag,
  X,
} from "lucide-react";

import heroImg from "@/assets/hero-skincare.jpg";
import editorialImg from "@/assets/editorial-banner.jpg";
import pSerum from "@/assets/product-serum.jpg";
import pMoist from "@/assets/product-moisturizer.jpg";
import pCleanser from "@/assets/product-cleanser.jpg";
import pToner from "@/assets/product-toner.jpg";
import catSkin from "@/assets/cat-skincare.jpg";
import catMakeup from "@/assets/cat-makeup.jpg";
import catHair from "@/assets/cat-hair.jpg";
import catSun from "@/assets/cat-sun.jpg";
import catBody from "@/assets/cat-body.jpg";
import catKbeauty from "@/assets/cat-kbeauty.jpg";

import {
  AnnouncementBar,
  SiteHeader,
  SiteFooter,
  ProductCard as SharedProductCard,
} from "@/components/site/chrome";
import { cart } from "@/lib/cart-store";
import { fetchHomepageData, fetchProducts, resolveMediaUrl } from "@/lib/coscore-api";

export const Route = createFileRoute("/")({
  loader: async () => {
    try {
      const data = await fetchHomepageData();
      const prodsRes = await fetchProducts({ page_size: 20 });
      return {
        homepageData: data,
        initialProducts: prodsRes?.data || [],
      };
    } catch (e) {
      return { homepageData: null, initialProducts: [] };
    }
  },
  head: () => ({
    meta: [
      { title: "Lookzene — Timeless Beauty | Premium Skincare Bangladesh" },
      {
        name: "description",
        content:
          "Curated Korean skincare, international beauty, makeup and grooming. 100% authentic products. Free delivery over BDT 2,000 across Bangladesh.",
      },
      { property: "og:title", content: "Lookzene — Timeless Beauty | Premium Skincare Bangladesh" },
      {
        property: "og:description",
        content: "Curated Korean skincare, international beauty, makeup and grooming. 100% authentic products. Free delivery over BDT 2,000 across Bangladesh.",
      },
    ],
    links: [
      { rel: "canonical", href: "https://lookzene.com/" }
    ]
  }),
  component: Home,
});

function Home() {
  const loaderData = Route.useLoaderData();
  const [data, setData] = useState<{ banners: any[]; sections: any[] } | null>(loaderData?.homepageData || null);
  const [allDbProducts, setAllDbProducts] = useState<any[]>(loaderData?.initialProducts || []);

  useEffect(() => {
    fetchHomepageData().then((res) => {
      if (res && res.banners) {
        setData(res);
      }
    });
    fetchProducts({ page_size: 20 }).then((res) => {
      if (res && res.data) {
        setAllDbProducts(res.data);
      }
    });
  }, []);

  const banners = data?.banners || [];
  const categorySection = data?.sections?.find((s: any) => s.section_type === "Category Grid");
  const featuredSection = data?.sections?.find((s: any) => s.section_type === "Featured Products");
  const rawDbProducts = (featuredSection?.products && featuredSection.products.length > 0) ? featuredSection.products : allDbProducts;

  const dbProducts = useMemo(() => {
    return rawDbProducts.filter((p: any) => {
      const title = (p.title || p.name || p.item || "").toLowerCase().trim();
      const slug = (p.slug || "").toLowerCase().trim();
      const category = (p.category_name || p.category_slug || p.category || "").toLowerCase().trim();
      return (
        title !== "shipping charge" &&
        !title.includes("shipping charge") &&
        slug !== "shipping-charge" &&
        category !== "service" &&
        category !== "services" &&
        !category.includes("service")
      );
    });
  }, [rawDbProducts]);

  const dbCategories = useMemo(() => {
    const raw = categorySection?.categories || [];
    return raw.filter((c: any) => {
      const name = (c.category_name || c.name || "").toLowerCase().trim();
      const slug = (c.slug || "").toLowerCase().trim();
      return name !== "service" && name !== "services" && slug !== "service" && slug !== "services" && !name.includes("service");
    });
  }, [categorySection]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AnnouncementBar />
      <SiteHeader />
      <main>
        <Hero banners={banners} />
        <TrustStrip />
        <ShopByCategory dbCategories={dbCategories} />
        <BestSellers dbProducts={dbProducts} />
        <ShopByConcern />
        <FlashSale dbProducts={dbProducts} />
        <TopBrands />
        <EditorialBanner />
        <NewArrivals dbProducts={dbProducts} />
        <UGCReviews />
        <WhyLookzene />
        <BeautyJournal />
        <Newsletter />
      </main>
      <SiteFooter />
    </div>
  );
}

/* Header, AnnouncementBar, Footer, MobileBottomNav live in @/components/site/chrome */

/* ───────── Hero ───────── */
function Hero({ banners }: { banners?: any[] }) {
  const banner = banners && banners.length > 0 ? banners[0] : null;
  const title = banner && banner.title ? banner.title : "Your Skin. Your Ritual. Your Timeless Beauty.";
  const subtitle = banner && banner.subtitle ? banner.subtitle : "Curated skincare and beauty essentials from Korea and around the world, selected to elevate your everyday beauty ritual.";
  const image = banner?.image ? resolveMediaUrl(banner.image) || heroImg : heroImg;
  const ctaLink = banner && banner.cta_link ? banner.cta_link : "/shop/skincare";

  return (
    <section className="relative overflow-hidden gradient-hero-bg">
      <div className="container-luxe grid lg:grid-cols-2 gap-10 lg:gap-16 items-center py-14 md:py-20 lg:py-28">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 bg-background/70 border border-border rounded-full px-4 py-1.5 text-[11px] tracking-[0.25em] uppercase text-burgundy font-semibold mb-6">
            <Sparkles className="h-3 w-3" /> Curated Beauty Essentials
          </div>
          <h1 className="text-serif text-[42px] sm:text-5xl lg:text-[68px] leading-[1.02] tracking-tight text-foreground">
            {title === "Your Skin. Your Ritual. Your Timeless Beauty." ? (
              <>
                Your Skin.
                <br />
                Your Ritual.
                <br />
                <span className="italic text-burgundy">Your Timeless Beauty.</span>
              </>
            ) : (
              title
            )}
          </h1>
          <p className="mt-6 max-w-lg text-[15px] md:text-base text-muted-foreground leading-relaxed">
            {subtitle}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to={ctaLink} className="group inline-flex items-center gap-2 bg-burgundy text-primary-foreground rounded-full px-7 py-4 text-sm font-semibold hover:shadow-luxury transition-all">
              Shop Best Sellers
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link to="/shop/$category" params={{ category: "skincare" }} className="inline-flex items-center gap-2 border border-burgundy/30 text-burgundy rounded-full px-7 py-4 text-sm font-semibold hover:bg-burgundy hover:text-primary-foreground transition-all">
              Explore Skincare
            </Link>
          </div>

          <div className="mt-10 flex items-center gap-6 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                {[catSkin, catMakeup, catKbeauty].map((s, i) => (
                  <img
                    key={i}
                    src={s}
                    alt=""
                    className="h-7 w-7 rounded-full border-2 border-background object-cover"
                  />
                ))}
              </div>
              <span>Loved by 12,400+ beauty lovers</span>
            </div>
          </div>
        </div>

        <div className="relative">
          <div className="relative rounded-[32px] overflow-hidden shadow-luxury">
            <img
              src={image}
              alt={title}
              width={1400}
              height={1400}
              className="w-full h-[420px] sm:h-[520px] lg:h-[620px] object-cover"
            />
          </div>
          {/* Floating badges */}
          <div className="absolute -left-3 top-8 sm:-left-6 sm:top-16 bg-background rounded-2xl shadow-card p-3 sm:p-4 flex items-center gap-3 animate-float">
            <div className="h-10 w-10 grid place-items-center rounded-full bg-emerald/15 text-emerald">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-widest text-muted-foreground">Guarantee</div>
              <div className="text-sm font-semibold">100% Authentic</div>
            </div>
          </div>
          <div className="absolute -right-3 bottom-8 sm:-right-6 sm:bottom-16 bg-background rounded-2xl shadow-card p-3 sm:p-4 animate-float [animation-delay:1s]">
            <div className="flex items-center gap-1 text-gold">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="h-3.5 w-3.5 fill-current" />
              ))}
            </div>
            <div className="text-sm font-semibold mt-1">4.9 · 3,200+ Reviews</div>
          </div>
          {/* Gold circle deco */}
          <div className="absolute -top-6 -right-6 h-24 w-24 rounded-full border border-gold/40 hidden lg:block" />
          <div className="absolute -bottom-4 -left-4 h-16 w-16 rounded-full bg-blush/60 hidden lg:block" />
        </div>
      </div>
    </section>
  );
}

/* ───────── Trust Strip ───────── */
function TrustStrip() {
  const items = [
    { icon: ShieldCheck, text: "100% Authentic Products" },
    { icon: Sparkles, text: "Curated International Brands" },
    { icon: ShoppingBag, text: "Secure Payment" },
    { icon: Truck, text: "Fast Delivery Across Bangladesh" },
  ];
  return (
    <section className="bg-ivory border-y border-border">
      <div className="container-luxe grid grid-cols-2 md:grid-cols-4 gap-4 py-6">
        {items.map(({ icon: Icon, text }) => (
          <div key={text} className="flex items-center gap-3 text-sm">
            <div className="h-9 w-9 grid place-items-center rounded-full bg-background text-burgundy shrink-0">
              <Icon className="h-4 w-4" />
            </div>
            <span className="font-medium text-foreground/80">{text}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ───────── Section Header ───────── */
function SectionHeader({
  eyebrow,
  title,
  subtitle,
  cta,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  cta?: string;
}) {
  return (
    <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-10">
      <div className="max-w-2xl">
        {eyebrow && (
          <div className="text-[11px] tracking-[0.3em] uppercase text-burgundy font-semibold mb-3">
            {eyebrow}
          </div>
        )}
        <h2 className="text-serif text-3xl md:text-4xl lg:text-5xl leading-tight">
          {title}
        </h2>
        {subtitle && (
          <p className="mt-3 text-muted-foreground text-[15px] md:text-base">
            {subtitle}
          </p>
        )}
      </div>
      {cta && (
        <a
          href="#"
          className="inline-flex items-center gap-2 text-sm font-semibold text-burgundy hover:gap-3 transition-all whitespace-nowrap"
        >
          {cta} <ArrowRight className="h-4 w-4" />
        </a>
      )}
    </div>
  );
}

/* ───────── Shop By Category ───────── */
const PRIMARY_SLUGS = ["skincare", "sun-protection", "makeup", "hair-care", "body-care", "k-beauty"];

const categories = [
  { name: "Skincare", slug: "skincare", desc: "Cleansers, serums, moisturizers", img: catSkin, tint: "bg-blush/40" },
  { name: "Sun Protection", slug: "sun-protection", desc: "Daily SPF essentials", img: catSun, tint: "bg-beige" },
  { name: "Makeup", slug: "makeup", desc: "Lips, eyes, complexion", img: catMakeup, tint: "bg-blush/40" },
  { name: "Hair Care", slug: "hair-care", desc: "Shampoo, conditioner, treatments", img: catHair, tint: "bg-mint" },
  { name: "Body Care", slug: "body-care", desc: "Lotions, scrubs, cleansers", img: catBody, tint: "bg-peach/50" },
  { name: "K-Beauty", slug: "k-beauty", desc: "Direct from Korea", img: catKbeauty, tint: "bg-beige" },
];

const categoryMetaMap: Record<string, { desc: string; img: string; tint: string }> = {
  "skincare": { desc: "Cleansers, serums, moisturizers", img: catSkin, tint: "bg-blush/40" },
  "sun-protection": { desc: "Daily SPF essentials", img: catSun, tint: "bg-beige" },
  "makeup": { desc: "Lips, eyes, complexion", img: catMakeup, tint: "bg-blush/40" },
  "hair-care": { desc: "Shampoo, conditioner, treatments", img: catHair, tint: "bg-mint" },
  "body-care": { desc: "Lotions, scrubs, cleansers", img: catBody, tint: "bg-peach/50" },
  "k-beauty": { desc: "Direct from Korea", img: catKbeauty, tint: "bg-beige" },
};

function ShopByCategory({ dbCategories }: { dbCategories?: any[] }) {
  const categoriesList = useMemo(() => {
    if (dbCategories && dbCategories.length > 0) {
      const filtered = dbCategories.filter((c: any) => {
        const slug = (c.slug || "").toLowerCase().trim();
        return PRIMARY_SLUGS.includes(slug);
      });
      if (filtered.length > 0) {
        return filtered.map((c: any) => {
          const slug = (c.slug || "").toLowerCase().trim();
          const meta = categoryMetaMap[slug] || {
            desc: "Curated beauty essentials",
            img: catSkin,
            tint: "bg-blush/40"
          };
          return {
            name: c.category_name || c.name,
            slug: c.slug,
            desc: meta.desc,
            img: resolveMediaUrl(c.banner_image) || meta.img,
            tint: meta.tint
          };
        });
      }
    }
    return categories;
  }, [dbCategories]);

  return (
    <section className="py-16 md:py-24">
      <div className="container-luxe">
        <SectionHeader
          eyebrow="Explore"
          title="Find Your Beauty Ritual"
          subtitle="Everything you need for skin, hair, body and beyond — carefully curated."
          cta="View all categories"
        />
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {categoriesList.map((c: any) => (
            <Link
              key={c.name}
              to="/shop/$category"
              params={{ category: c.slug }}
              className={`group relative overflow-hidden rounded-3xl ${c.tint} p-5 md:p-7 aspect-[4/5] flex flex-col justify-between hover:shadow-luxury transition-all duration-500`}
            >
              <div className="relative z-10">
                <h3 className="text-serif text-xl md:text-2xl lg:text-3xl text-foreground">
                  {c.name}
                </h3>
                <p className="text-xs md:text-sm text-muted-foreground mt-1">{c.desc}</p>
              </div>
              <div className="relative z-10 inline-flex items-center gap-1.5 text-sm font-semibold text-burgundy">
                Explore <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
              <img
                src={c.img}
                alt={c.name}
                loading="lazy"
                className="absolute inset-0 h-full w-full object-cover mix-blend-multiply opacity-70 group-hover:scale-105 group-hover:opacity-85 transition-all duration-700"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background/60 via-background/10 to-transparent" />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ───────── Products ───────── */
type Product = {
  name: string;
  brand: string;
  img: string;
  price: number;
  compareAt?: number;
  rating: number;
  reviews: number;
  badge?: { label: string; tone: "burgundy" | "emerald" | "gold" | "blush" };
};

const bestSellers: Product[] = [
  {
    name: "Advanced Snail 96 Mucin Power Essence",
    brand: "COSRX",
    img: pSerum,
    price: 1490,
    compareAt: 1890,
    rating: 4.9,
    reviews: 1284,
    badge: { label: "Best Seller", tone: "burgundy" },
  },
  {
    name: "Glow Serum Propolis + Niacinamide",
    brand: "Beauty of Joseon",
    img: pMoist,
    price: 1690,
    rating: 4.8,
    reviews: 942,
    badge: { label: "Editor's Pick", tone: "gold" },
  },
  {
    name: "Salicylic Acid Daily Gentle Cleanser",
    brand: "CeraVe",
    img: pCleanser,
    price: 1290,
    compareAt: 1590,
    rating: 4.7,
    reviews: 651,
    badge: { label: "Trending", tone: "blush" },
  },
  {
    name: "Heartleaf 77% Soothing Toner",
    brand: "Anua",
    img: pToner,
    price: 1850,
    rating: 4.9,
    reviews: 2140,
    badge: { label: "New", tone: "emerald" },
  },
];

function ProductCard({ p }: { p: Product }) {
  const shim = {
    id: p.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    category: "skincare",
    subcategory: "featured",
    concerns: [] as string[],
    skinType: [] as string[],
    ...p,
  } as unknown as Parameters<typeof SharedProductCard>[0]["p"];
  return <SharedProductCard p={shim} />;
}

const PRICE_PRESETS = [
  { label: "All prices", min: 0, max: 100000 },
  { label: "Under ৳1,300", min: 0, max: 1300 },
  { label: "৳1,300 – ৳1,700", min: 1300, max: 1700 },
  { label: "৳1,700 – ৳2,000", min: 1700, max: 2000 },
  { label: "Over ৳2,000", min: 2000, max: 100000 },
];

function BestSellers({ dbProducts }: { dbProducts?: any[] }) {
  const mappedProducts = useMemo(() => {
    if (!dbProducts || dbProducts.length === 0) return [];
    return dbProducts.map((p: any) => ({
      id: p.slug,
      name: p.title,
      brand: p.brand || "Beauty Brand",
      img: resolveMediaUrl(p.image) || pSerum,
      price: p.discount_price || p.price,
      compareAt: p.discount_price ? p.price : undefined,
      rating: 4.8,
      reviews: 42,
      category: "skincare",
      subcategory: "serums",
      concerns: ["Anti-Aging"],
      skinType: ["All"],
      inStock: p.stock_status === "In Stock"
    }));
  }, [dbProducts]);

  const catalogMin = useMemo(() => (mappedProducts.length ? Math.min(...mappedProducts.map((p) => p.price)) : 0), [mappedProducts]);
  const catalogMax = useMemo(() => (mappedProducts.length ? Math.max(...mappedProducts.map((p) => p.price)) : 0), [mappedProducts]);
  const [min, setMin] = useState<number>(0);
  const [max, setMax] = useState<number>(100000);
  const [activePreset, setActivePreset] = useState<string>("All prices");

  const filtered = useMemo(() => mappedProducts.filter((p) => p.price >= min && p.price <= max), [mappedProducts, min, max]);

  const applyPreset = (preset: (typeof PRICE_PRESETS)[number]) => {
    setActivePreset(preset.label);
    setMin(preset.min);
    setMax(preset.max);
  };

  const reset = () => applyPreset(PRICE_PRESETS[0]);

  return (
    <section className="py-16 md:py-24 bg-ivory">
      <div className="container-luxe">
        <SectionHeader
          eyebrow="Beauty Favorites"
          title="Loved by Many, Trusted by Skin"
          subtitle="The products our customers can't stop talking about."
          cta="View all best sellers"
        />

        <div className="mb-8 rounded-2xl border border-border bg-background p-4 md:p-5">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <div className="text-[11px] uppercase tracking-[0.25em] text-burgundy font-semibold">
                Shop by budget
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                Showing {filtered.length} of {mappedProducts.length} — ৳{catalogMin.toLocaleString()} to ৳{catalogMax.toLocaleString()} available
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {PRICE_PRESETS.map((preset) => {
                const active = activePreset === preset.label;
                return (
                  <button
                    key={preset.label}
                    onClick={() => applyPreset(preset)}
                    className={`text-xs font-semibold rounded-full px-4 py-2 border transition-all ${
                      active
                        ? "bg-burgundy text-primary-foreground border-burgundy"
                        : "bg-background text-foreground border-border hover:border-burgundy hover:text-burgundy"
                    }`}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-5 flex flex-col md:flex-row md:items-end gap-4">
            <div className="flex items-end gap-3">
              <label className="flex flex-col text-[11px] uppercase tracking-widest text-muted-foreground font-semibold">
                Min ৳
                <input
                  type="number"
                  min={0}
                  value={min}
                  onChange={(e) => {
                    setActivePreset("Custom");
                    setMin(Number(e.target.value) || 0);
                  }}
                  className="mt-1 w-28 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:border-burgundy"
                />
              </label>
              <span className="pb-2 text-muted-foreground">–</span>
              <label className="flex flex-col text-[11px] uppercase tracking-widest text-muted-foreground font-semibold">
                Max ৳
                <input
                  type="number"
                  min={0}
                  value={max === 100000 ? "" : max}
                  placeholder="Any"
                  onChange={(e) => {
                    setActivePreset("Custom");
                    setMax(Number(e.target.value) || 100000);
                  }}
                  className="mt-1 w-28 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:border-burgundy"
                />
              </label>
            </div>
            {activePreset !== "All prices" && (
              <button
                onClick={reset}
                className="text-xs font-semibold text-burgundy hover:underline self-start md:self-auto md:pb-3"
              >
                Reset filter
              </button>
            )}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-background py-16 text-center">
            <p className="text-sm text-muted-foreground">
              No best sellers in this price range.
            </p>
            <button
              onClick={reset}
              className="mt-3 text-sm font-semibold text-burgundy hover:underline"
            >
              Clear filter
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {filtered.map((p) => (
              <ProductCard key={p.name} p={p} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

/* ───────── Shop by Concern ───────── */
const concerns = [
  { name: "Acne & Blemish Care", count: 128, tint: "bg-blush/50" },
  { name: "Pigmentation & Brightening", count: 96, tint: "bg-peach/50" },
  { name: "Anti-Aging & Wrinkles", count: 84, tint: "bg-beige" },
  { name: "Dry Skin & Hydration", count: 142, tint: "bg-mint" },
  { name: "Oily Skin & Oil Control", count: 76, tint: "bg-ivory" },
  { name: "Sensitive Skin", count: 108, tint: "bg-blush/50" },
];

function ShopByConcern() {
  return (
    <section className="py-16 md:py-24">
      <div className="container-luxe">
        <SectionHeader
          eyebrow="Personalize"
          title="Shop by Skin Concern"
          subtitle="Find the right products for what your skin needs most."
        />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-5">
          {concerns.map((c) => (
            <a
              key={c.name}
              href="#"
              className={`group ${c.tint} rounded-2xl p-5 md:p-6 flex flex-col justify-between h-36 md:h-44 border border-border/50 hover:shadow-card transition-all`}
            >
              <Leaf className="h-6 w-6 text-burgundy" />
              <div>
                <h3 className="text-serif text-lg md:text-xl leading-tight">{c.name}</h3>
                <div className="flex items-center justify-between mt-1.5">
                  <span className="text-xs text-muted-foreground">{c.count} products</span>
                  <ArrowRight className="h-4 w-4 text-burgundy opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ───────── Flash Sale ───────── */
function useCountdown(seconds: number) {
  const [t, setT] = useState(seconds);
  useEffect(() => {
    const id = setInterval(() => setT((v) => (v > 0 ? v - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, []);
  const d = Math.floor(t / 86400);
  const h = Math.floor((t % 86400) / 3600);
  const m = Math.floor((t % 3600) / 60);
  const s = t % 60;
  return { d, h, m, s };
}

function FlashSale({ dbProducts }: { dbProducts?: any[] }) {
  const { d, h, m, s } = useCountdown(2 * 86400 + 12 * 3600 + 34 * 60);

  const items = useMemo(() => {
    if (!dbProducts || dbProducts.length === 0) return [];
    return dbProducts.slice(0, 4).map((p: any) => ({
      id: p.slug,
      name: p.title,
      brand: p.brand || "Beauty Brand",
      img: resolveMediaUrl(p.image) || pSerum,
      price: p.discount_price || p.price,
      compareAt: p.discount_price ? p.price : Math.round((p.price || 1200) * 1.25),
      rating: 4.9,
      reviews: 64,
      category: "skincare",
      subcategory: "serums",
      concerns: ["Brightening"],
      skinType: ["All"],
      inStock: p.stock_status === "In Stock",
      badge: p.is_featured ? { label: "Deal", tone: "burgundy" as const } : undefined,
    }));
  }, [dbProducts]);

  if (items.length === 0) return null;
  return (
    <section className="py-16 md:py-24 bg-burgundy text-primary-foreground relative overflow-hidden">
      <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_20%_20%,oklch(0.86_0.065_15/.5),transparent_50%),radial-gradient(circle_at_80%_80%,oklch(0.78_0.055_75/.4),transparent_50%)]" />
      <div className="container-luxe relative">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8 mb-12">
          <div>
            <div className="text-[11px] tracking-[0.3em] uppercase text-blush font-semibold mb-3">
              Limited Time
            </div>
            <h2 className="text-serif text-4xl md:text-5xl lg:text-6xl leading-tight">
              Glow More. <span className="italic">Spend Less.</span>
            </h2>
            <p className="mt-3 text-primary-foreground/80 max-w-md">
              Limited-time beauty deals, available while stocks last.
            </p>
          </div>
          <div className="flex gap-2 md:gap-3">
            {[
              { l: "Days", v: d },
              { l: "Hours", v: h },
              { l: "Min", v: m },
              { l: "Sec", v: s },
            ].map((x) => (
              <div key={x.l} className="bg-background/10 backdrop-blur border border-primary-foreground/15 rounded-2xl px-3 md:px-5 py-3 md:py-4 text-center min-w-16 md:min-w-20">
                <div className="text-serif text-2xl md:text-4xl font-semibold tabular-nums">
                  {String(x.v).padStart(2, "0")}
                </div>
                <div className="text-[10px] uppercase tracking-widest text-primary-foreground/70 mt-1">
                  {x.l}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {items.map((p) => (
            <div key={p.name} className="[&_.bg-card]:bg-background [&_.text-foreground]:text-foreground">
              <ProductCard p={{ ...p, compareAt: p.compareAt ?? p.price + 400 }} />
            </div>
          ))}
        </div>
        <div className="mt-10 text-center">
          <a href="#" className="inline-flex items-center gap-2 bg-background text-burgundy rounded-full px-8 py-4 text-sm font-semibold hover:shadow-luxury transition-all">
            Shop All Deals <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </div>
    </section>
  );
}

/* ───────── Top Brands ───────── */
const brands = [
  "COSRX",
  "Beauty of Joseon",
  "CeraVe",
  "The Ordinary",
  "La Roche-Posay",
  "Anua",
  "SKIN1004",
  "Axis-Y",
];

function TopBrands() {
  return (
    <section className="py-14 md:py-20 border-y border-border">
      <div className="container-luxe">
        <div className="text-center mb-10">
          <div className="text-[11px] tracking-[0.3em] uppercase text-burgundy font-semibold mb-3">
            Trusted Labels
          </div>
          <h2 className="text-serif text-3xl md:text-4xl">Explore Your Favorite Brands</h2>
        </div>
        <div className="overflow-hidden">
          <div className="flex gap-12 md:gap-20 animate-marquee w-max">
            {[...brands, ...brands].map((b, i) => (
              <div key={i} className="text-serif text-2xl md:text-3xl italic text-muted-foreground hover:text-burgundy transition whitespace-nowrap">
                {b}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ───────── Editorial Banner ───────── */
function EditorialBanner() {
  return (
    <section className="py-16 md:py-24">
      <div className="container-luxe">
        <div className="relative rounded-3xl overflow-hidden">
          <img
            src={editorialImg}
            alt="Beauty ritual"
            loading="lazy"
            className="w-full h-[420px] md:h-[560px] object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/40 to-transparent" />
          <div className="absolute inset-0 flex items-center">
            <div className="container-luxe">
              <div className="max-w-lg">
                <div className="text-[11px] tracking-[0.3em] uppercase text-burgundy font-semibold mb-4">
                  Editorial
                </div>
                <h2 className="text-serif text-4xl md:text-5xl lg:text-6xl leading-[1.05]">
                  Your Skin Deserves a <span className="italic text-burgundy">Ritual.</span>
                </h2>
                <p className="mt-5 text-muted-foreground text-[15px] md:text-base max-w-md">
                  Turn everyday skincare into a moment of self-care with routines
                  designed around your needs.
                </p>
                <button className="mt-7 inline-flex items-center gap-2 bg-foreground text-background rounded-full px-7 py-4 text-sm font-semibold hover:bg-burgundy transition">
                  Build Your Routine <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ───────── New Arrivals ───────── */
function NewArrivals({ dbProducts }: { dbProducts?: any[] }) {
  const tabs = ["All", "Skincare", "Makeup", "Hair Care", "Body Care"];
  const [active, setActive] = useState("All");

  const mappedProducts = useMemo(() => {
    if (!dbProducts || dbProducts.length === 0) {
      return [];
    }
    return dbProducts.map((p: any) => ({
      id: p.slug,
      name: p.title,
      brand: "New Arrival",
      img: p.image || pSerum,
      price: p.discount_price || p.price,
      compareAt: p.discount_price ? p.price : undefined,
      rating: 4.9,
      reviews: 18,
      category: "skincare",
      subcategory: "serums",
      concerns: ["Brightening"],
      skinType: ["All"],
      inStock: p.stock_status === "In Stock"
    }));
  }, [dbProducts]);

  return (
    <section className="py-16 md:py-24 bg-ivory">
      <div className="container-luxe">
        <SectionHeader
          eyebrow="Just Landed"
          title="Fresh Into Your Routine"
          subtitle="New arrivals from the brands you love."
          cta="Explore new arrivals"
        />
        <div className="flex gap-2 flex-wrap mb-8">
          {tabs.map((t) => (
            <button
              key={t}
              onClick={() => setActive(t)}
              className={`px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-widest transition ${
                active === t
                  ? "bg-burgundy text-primary-foreground"
                  : "bg-background text-muted-foreground hover:text-burgundy"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {mappedProducts.slice(0, 4).map((p) => (
            <ProductCard key={p.name} p={{ ...p, badge: { label: "New", tone: "emerald" } }} />
          ))}
        </div>
      </div>
    </section>
  );
}

/* ───────── UGC + Reviews ───────── */
const reviews = [
  {
    name: "Sadia R.",
    text: "Absolutely loved the texture and packaging. Arrived perfectly packed and feels completely authentic.",
  },
  {
    name: "Nadia K.",
    text: "My skin has never looked so glowy. Delivery was fast and the products are the real deal.",
  },
  {
    name: "Mahia F.",
    text: "Lookzene is now my go-to for K-beauty. The curation makes shopping so much easier.",
  },
];

function UGCReviews() {
  const grid = [catSkin, catMakeup, catKbeauty, catBody, catSun, catHair];
  return (
    <section className="py-16 md:py-24">
      <div className="container-luxe">
        <SectionHeader
          eyebrow="@lookzene"
          title="Real Skin. Real Stories."
          subtitle="Tag @lookzene to be featured in our beauty community."
        />
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2 md:gap-3 mb-14">
          {grid.map((g, i) => (
            <a key={i} href="#" className="group relative aspect-square overflow-hidden rounded-2xl">
              <img src={g} alt="" loading="lazy" className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" />
              <div className="absolute inset-0 bg-burgundy/0 group-hover:bg-burgundy/40 transition grid place-items-center">
                <Sparkles className="h-6 w-6 text-primary-foreground opacity-0 group-hover:opacity-100 transition" />
              </div>
            </a>
          ))}
        </div>
        <div className="grid md:grid-cols-3 gap-5">
          {reviews.map((r) => (
            <div key={r.name} className="bg-card border border-border rounded-2xl p-6 shadow-soft">
              <div className="flex text-gold mb-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-current" />
                ))}
              </div>
              <p className="text-[15px] leading-relaxed text-foreground/85">"{r.text}"</p>
              <div className="mt-5 flex items-center justify-between">
                <div className="font-semibold text-sm">— {r.name}</div>
                <span className="text-[10px] uppercase tracking-widest text-emerald font-bold flex items-center gap-1">
                  <ShieldCheck className="h-3 w-3" /> Verified
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ───────── Why Lookzene ───────── */
function WhyLookzene() {
  const items = [
    { icon: ShieldCheck, title: "Authentic Products", desc: "Every product is carefully sourced and verified." },
    { icon: Sparkles, title: "Curated Beauty", desc: "We select products that truly deserve a place in your routine." },
    { icon: Leaf, title: "Beauty Expertise", desc: "Discover routines and products designed around your needs." },
    { icon: Heart, title: "Customer First", desc: "From browsing to delivery, we make beauty shopping effortless." },
  ];
  return (
    <section className="py-16 md:py-24 gradient-luxury-bg">
      <div className="container-luxe">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <div className="text-[11px] tracking-[0.3em] uppercase text-burgundy font-semibold mb-3">
            The Lookzene Promise
          </div>
          <h2 className="text-serif text-4xl md:text-5xl leading-tight">
            Beauty You Can <span className="italic text-burgundy">Trust.</span>
          </h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {items.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="bg-background rounded-2xl p-7 border border-border/60 hover:shadow-card transition">
              <div className="h-12 w-12 grid place-items-center rounded-xl bg-blush/50 text-burgundy mb-5">
                <Icon className="h-5 w-5" />
              </div>
              <div className="h-px w-8 bg-gold mb-4" />
              <h3 className="text-serif text-xl mb-2">{title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ───────── Beauty Journal ───────── */
const journal = [
  {
    cat: "Routine",
    title: "5 Steps to Build a Simple Korean Skincare Routine",
    img: catKbeauty,
  },
  {
    cat: "Guide",
    title: "How to Choose the Right Sunscreen for Your Skin",
    img: catSun,
  },
  {
    cat: "Ingredients",
    title: "Best Ingredients for Acne-Prone Skin",
    img: catSkin,
  },
];

function BeautyJournal() {
  return (
    <section className="py-16 md:py-24">
      <div className="container-luxe">
        <SectionHeader
          eyebrow="Journal"
          title="Your Beauty Journal"
          subtitle="Guides, tips and rituals to elevate your everyday beauty."
          cta="Read all articles"
        />
        <div className="grid md:grid-cols-3 gap-6">
          {journal.map((j) => (
            <a key={j.title} href="#" className="group">
              <div className="overflow-hidden rounded-2xl aspect-[4/5] mb-4">
                <img src={j.img} alt={j.title} loading="lazy" className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" />
              </div>
              <div className="text-[11px] uppercase tracking-widest text-burgundy font-semibold mb-2">
                {j.cat}
              </div>
              <h3 className="text-serif text-xl md:text-2xl leading-tight group-hover:text-burgundy transition">
                {j.title}
              </h3>
              <div className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-foreground">
                Read More <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ───────── Newsletter ───────── */
type CustomerSuggestion = { email: string; customer_name: string };

function Newsletter() {
  const [emailInput, setEmailInput] = useState("");
  const [suggestions, setSuggestions] = useState<CustomerSuggestion[]>([]);
  const [loadingSuggest, setLoadingSuggest] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState<string | null>(null);
  const [submitState, setSubmitState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [submitMsg, setSubmitMsg] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const COSCORE_API = "https://cp.lookzene.com/api/method/coscore.api";

  // Helper: read session data from localStorage (set at login)
  const readSession = () => {
    try {
      const raw = localStorage.getItem("lookzene_user_session");
      if (raw) {
        const session = JSON.parse(raw);
        const meta = session?.user_metadata || session;
        return {
          email: session?.email || meta?.email || "",
          full_name: meta?.full_name || session?.full_name || "",
          phone: meta?.phone || session?.phone || "",
        };
      }
    } catch { /* ignore */ }
    return { email: "", full_name: "", phone: "" };
  };

  // Pre-fill email from session on mount
  useEffect(() => {
    const { email } = readSession();
    if (email && !emailInput) {
      setEmailInput(email);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchSuggestions = useCallback(async (q: string) => {
    if (q.length < 2) { setSuggestions([]); setShowDropdown(false); return; }
    setLoadingSuggest(true);
    try {
      const res = await fetch(`${COSCORE_API}.auth.search_customers?query=${encodeURIComponent(q)}`);
      if (res.ok) {
        const json = await res.json();
        const custs: CustomerSuggestion[] = (json.message || json).customers || [];
        setSuggestions(custs);
        setShowDropdown(custs.length > 0);
      }
    } catch { setSuggestions([]); }
    finally { setLoadingSuggest(false); }
  }, []);

  useEffect(() => {
    if (selectedEmail) return; // already selected
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(emailInput), 280);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [emailInput, fetchSuggestions, selectedEmail]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current && !inputRef.current.contains(e.target as Node)
      ) setShowDropdown(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSelect = (cust: CustomerSuggestion) => {
    setEmailInput(cust.email);
    setSelectedEmail(cust.email);
    setSuggestions([]);
    setShowDropdown(false);
    inputRef.current?.focus();
  };

  const clearSelected = () => {
    setSelectedEmail(null);
    setEmailInput("");
    setSuggestions([]);
    setSubmitState("idle");
    inputRef.current?.focus();
  };

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    // Resolve email: selectedTag > typed input > session email
    const session = readSession();
    const email = (selectedEmail || emailInput || session.email).trim();
    if (!email || !email.includes("@")) {
      setSubmitState("error");
      setSubmitMsg("Please enter a valid email address.");
      return;
    }
    setSubmitState("loading");

    // Enrich subscriber from session (name + phone)
    const full_name = session.full_name;
    const phone = session.phone;

    try {
      const res = await fetch(`${COSCORE_API}.auth.subscribe_newsletter`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, full_name, phone }),
      });
      const json = await res.json();
      const data = json.message || json;
      if (data.status === "success") {
        setSubmitState("success");
        setSubmitMsg(data.message || "Subscribed! Welcome to Lookzene.");
      } else {
        setSubmitState("error");
        setSubmitMsg(data.message || "Subscription failed. Please try again.");
      }
    } catch {
      setSubmitState("error");
      setSubmitMsg("Connection error. Please try again.");
    }
  };

  const selectedCust = suggestions.find(s => s.email === selectedEmail) ||
    (selectedEmail ? { email: selectedEmail, customer_name: selectedEmail.split("@")[0] } : null);

  const activeEmail = selectedEmail || emailInput;

  return (
    <section className="py-16 md:py-24">
      <div className="container-luxe">
        <div className="rounded-3xl gradient-blush-bg p-10 md:p-16 lg:p-20 text-center relative overflow-hidden">
          <div className="absolute -top-16 -right-16 h-64 w-64 rounded-full border border-gold/40" />
          <div className="absolute -bottom-20 -left-16 h-72 w-72 rounded-full bg-background/30" />
          <div className="relative max-w-2xl mx-auto">
            <div className="text-[11px] tracking-[0.3em] uppercase text-burgundy font-semibold mb-4">
              Join Lookzene
            </div>
            <h2 className="text-serif text-4xl md:text-5xl lg:text-6xl leading-tight">
              Stay Beautiful, <span className="italic">Stay in the Know.</span>
            </h2>
            <p className="mt-4 text-muted-foreground max-w-lg mx-auto">
              Skincare tips, new arrivals, exclusive offers and beauty inspiration
              — delivered to your inbox.
            </p>

            {submitState === "success" ? (
              <div className="mt-8 flex flex-col items-center gap-3">
                <div className="inline-flex items-center gap-2 rounded-full bg-green-100 border border-green-300 text-green-700 px-6 py-3 text-sm font-semibold">
                  <CheckCircle2 className="w-4 h-4" />
                  {submitMsg}
                </div>
                <p className="text-xs text-muted-foreground">
                  Check your inbox — beauty tips are on the way! 💄
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="mt-8 max-w-md mx-auto" noValidate>
                {/* Hidden input always carries the real email value for form submission */}
                <input type="hidden" name="email" value={activeEmail} />

                <div className="relative flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    {/* Selected customer tag */}
                    {selectedEmail ? (
                      <div className="flex items-center gap-2 rounded-full bg-background border-2 border-burgundy/40 px-4 py-3 min-h-[52px]">
                        <div className="flex-1 flex items-center gap-2 overflow-hidden">
                          <span className="inline-flex items-center gap-1.5 bg-burgundy/10 text-burgundy text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0">
                            <span className="w-1.5 h-1.5 bg-burgundy rounded-full" />
                            {selectedCust?.customer_name || selectedEmail.split("@")[0]}
                          </span>
                          <span className="text-xs text-muted-foreground truncate">{selectedEmail}</span>
                        </div>
                        <button type="button" onClick={clearSelected}
                          className="text-muted-foreground hover:text-foreground transition ml-1 flex-shrink-0">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <input
                        ref={inputRef}
                        type="text"
                        inputMode="email"
                        value={emailInput}
                        onChange={e => { setEmailInput(e.target.value); setSelectedEmail(null); setSubmitState("idle"); }}
                        onFocus={() => { if (suggestions.length > 0) setShowDropdown(true); }}
                        placeholder="Enter your email address"
                        autoComplete="off"
                        className="w-full rounded-full bg-background border border-border px-5 py-4 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-burgundy/30 pr-10"
                      />
                    )}
                    {loadingSuggest && !selectedEmail && (
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />
                      </span>
                    )}
                    {/* Autocomplete dropdown */}
                    {showDropdown && suggestions.length > 0 && !selectedEmail && (
                      <div
                        ref={dropdownRef}
                        className="absolute top-full left-0 right-0 mt-1 z-50 rounded-2xl bg-card border border-border shadow-luxury overflow-hidden"
                      >
                        <div className="p-1.5">
                          {suggestions.map((cust) => (
                            <button
                              key={cust.email}
                              type="button"
                              onMouseDown={e => { e.preventDefault(); handleSelect(cust); }}
                              className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-blush/30 transition group"
                            >
                              <div className="flex-shrink-0 w-7 h-7 rounded-full bg-burgundy/10 flex items-center justify-center text-burgundy text-[11px] font-bold uppercase">
                                {(cust.customer_name || cust.email).charAt(0)}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="text-xs font-semibold text-foreground truncate">
                                  {cust.customer_name}
                                </div>
                                <div className="text-[11px] text-muted-foreground truncate">{cust.email}</div>
                              </div>
                              <span className="flex-shrink-0 text-[10px] font-semibold bg-burgundy/10 text-burgundy px-2 py-0.5 rounded-full opacity-0 group-hover:opacity-100 transition">
                                Subscriber
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <button
                    type="submit"
                    disabled={submitState === "loading" || !activeEmail}
                    className="rounded-full bg-burgundy text-primary-foreground px-7 py-4 text-sm font-semibold hover:shadow-luxury transition disabled:opacity-60 inline-flex items-center gap-2 flex-shrink-0"
                  >
                    {submitState === "loading" ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    Subscribe
                  </button>
                </div>
                {submitState === "error" && (
                  <p className="mt-2 text-xs text-burgundy text-left px-2 flex items-center gap-1">
                    ⚠ {submitMsg}
                  </p>
                )}
              </form>
            )}
            <p className="mt-3 text-xs text-muted-foreground">
              By subscribing, you agree to receive marketing emails from Lookzene.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* Footer + MobileBottomNav now provided by @/components/site/chrome */
