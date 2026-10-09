import { createFileRoute, Link } from "@tanstack/react-router";
import { Sparkles, ShieldCheck, Heart, Award, ChevronRight } from "lucide-react";
import { AnnouncementBar, SiteHeader, SiteFooter } from "@/components/site/chrome";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "Our Story — Lookzene Timeless Beauty | Authentic Skincare BD" },
      { name: "description", content: "Discover Lookzene's journey as Bangladesh's premier destination for authentic Korean skincare, international cosmetics and luxury beauty essentials." },
      { property: "og:title", content: "Our Story — Lookzene Timeless Beauty" },
      { property: "og:url", content: "https://lookzene.com/about" },
    ],
    links: [
      { rel: "canonical", href: "https://lookzene.com/about" }
    ]
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <AnnouncementBar />
      <SiteHeader />

      <section className="gradient-hero-bg border-b border-border">
        <div className="container-luxe py-12 md:py-20 text-center max-w-3xl mx-auto">
          <span className="text-[11px] font-bold uppercase tracking-[0.3em] text-burgundy">Our Journey</span>
          <h1 className="text-serif text-3xl md:text-5xl leading-tight font-semibold mt-3">Timeless Beauty Curated for You</h1>
          <p className="mt-4 text-muted-foreground text-sm leading-relaxed">
            Lookzene was founded with a single mission: to provide skin-loving beauty enthusiasts in Bangladesh with 100% genuine, dermatologist-approved K-Beauty and global skincare rituals.
          </p>
        </div>
      </section>

      <section className="container-luxe py-14 md:py-20 max-w-5xl space-y-16">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-4">
            <h2 className="text-serif text-3xl font-semibold">Authentic Beauty, Zero Compromise</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Based in <strong>Dhaka Cantonment, Dhaka</strong>, Lookzene bridges the gap between international skincare innovation and beauty lovers across Bangladesh. We work exclusively with authorized distributors in Seoul, Korea to guarantee that every serum, toner, and moisturizer on our shelf is 100% genuine.
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Whether you are discovering glass-skin hydration or targeted barrier-repair treatments, our team curates formulations suited specifically for South Asian climate and skin types.
            </p>
          </div>
          <div className="bg-blush/30 border border-border rounded-3xl p-8 space-y-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-burgundy text-primary-foreground grid place-items-center shrink-0">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground text-base">Direct Sourcing</h3>
                <p className="text-xs text-muted-foreground">Directly imported from official brand representatives.</p>
              </div>
            </div>

            <div className="flex items-center gap-4 border-t border-border/60 pt-5">
              <div className="h-12 w-12 rounded-2xl bg-burgundy text-primary-foreground grid place-items-center shrink-0">
                <Award className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground text-base">Verified Quality</h3>
                <p className="text-xs text-muted-foreground">Stored in climate-controlled facilities in Dhaka.</p>
              </div>
            </div>

            <div className="flex items-center gap-4 border-t border-border/60 pt-5">
              <div className="h-12 w-12 rounded-2xl bg-burgundy text-primary-foreground grid place-items-center shrink-0">
                <Heart className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground text-base">Customer First</h3>
                <p className="text-xs text-muted-foreground">Dedicated phone helplines and 7-day return guarantee.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-8 bg-ivory border border-border rounded-3xl text-center space-y-3">
          <h3 className="text-serif text-2xl font-semibold">Visit or Contact Our Hub</h3>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            Physical Office: Dhaka Cantonment, Dhaka, Bangladesh<br />
            Helplines: +880 1915-930000 | Email: support@lookzene.com
          </p>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
