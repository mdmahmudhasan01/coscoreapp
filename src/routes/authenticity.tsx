import { createFileRoute, Link } from "@tanstack/react-router";
import { ShieldCheck, CheckCircle2, Award, ChevronRight } from "lucide-react";
import { AnnouncementBar, SiteHeader, SiteFooter } from "@/components/site/chrome";

export const Route = createFileRoute("/authenticity")({
  head: () => ({
    meta: [
      { title: "100% Authenticity Guarantee — Verified K-Beauty BD | Lookzene" },
      { name: "description", content: "Lookzene's 100% Authenticity Guarantee. Learn how we verify and source 100% genuine Korean skincare and luxury cosmetics directly from authorized brand distributors." },
      { property: "og:title", content: "100% Authenticity Guarantee — Lookzene" },
      { property: "og:url", content: "https://lookzene.com/authenticity" },
    ],
    links: [
      { rel: "canonical", href: "https://lookzene.com/authenticity" }
    ]
  }),
  component: AuthenticityPage,
});

function AuthenticityPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <AnnouncementBar />
      <SiteHeader />

      <section className="gradient-hero-bg border-b border-border">
        <div className="container-luxe py-10 md:py-16">
          <nav aria-label="Breadcrumb" className="mb-4">
            <ol className="flex items-center gap-2 text-xs text-muted-foreground">
              <li><Link to="/" className="hover:text-burgundy transition-colors">Home</Link></li>
              <li><ChevronRight className="h-3 w-3" /></li>
              <li className="text-foreground font-medium">Authenticity Guarantee</li>
            </ol>
          </nav>
          <h1 className="text-serif text-3xl md:text-5xl leading-tight font-semibold">100% Authenticity Guarantee</h1>
          <p className="mt-3 text-muted-foreground text-sm max-w-2xl leading-relaxed">
            How we protect our customers against counterfeit cosmetics and ensure genuine beauty formulations.
          </p>
        </div>
      </section>

      <section className="container-luxe py-12 md:py-16 max-w-4xl space-y-8 text-sm text-foreground/90 leading-relaxed">
        <div className="p-6 bg-emerald/10 border border-emerald/20 rounded-2xl flex items-start gap-4">
          <ShieldCheck className="h-8 w-8 text-emerald shrink-0 mt-1" />
          <div>
            <h2 className="font-semibold text-emerald text-lg">Our Promise to You</h2>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              Every single product sold on Lookzene is guaranteed to be 100% authentic, fresh, and sourced directly from official brand manufacturers or authorized distributors in Korea and global markets.
            </p>
          </div>
        </div>

        <div className="space-y-6">
          <h2 className="text-serif text-2xl font-semibold text-foreground">Our 4-Step Verification Process</h2>
          
          <div className="grid sm:grid-cols-2 gap-6">
            <div className="p-5 border border-border rounded-2xl bg-card space-y-2">
              <span className="text-xs font-bold text-burgundy uppercase tracking-widest">Step 1</span>
              <h3 className="font-semibold text-foreground text-base">Authorized Channel Sourcing</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                We bypass grey-market suppliers and purchase directly from brand headquarters and authorized global exporters in South Korea.
              </p>
            </div>

            <div className="p-5 border border-border rounded-2xl bg-card space-y-2">
              <span className="text-xs font-bold text-burgundy uppercase tracking-widest">Step 2</span>
              <h3 className="font-semibold text-foreground text-base">Batch & Hologram Checks</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Each product batch undergoes barcode, QR code, and security hologram verification before being added to inventory.
              </p>
            </div>

            <div className="p-5 border border-border rounded-2xl bg-card space-y-2">
              <span className="text-xs font-bold text-burgundy uppercase tracking-widest">Step 3</span>
              <h3 className="font-semibold text-foreground text-base">Climate Control Storage</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Skincare formulations are stored in temperature-controlled warehouses in Dhaka Cantonment to prevent heat degradation.
              </p>
            </div>

            <div className="p-5 border border-border rounded-2xl bg-card space-y-2">
              <span className="text-xs font-bold text-burgundy uppercase tracking-widest">Step 4</span>
              <h3 className="font-semibold text-foreground text-base">Money-Back Guarantee</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                If you ever receive a product that fails authenticity verification, we offer a 100% full refund immediately.
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 bg-ivory border border-border rounded-2xl text-xs space-y-2">
          <p className="font-semibold text-foreground">Questions or Concerns?</p>
          <p className="text-muted-foreground">
            Contact our verification team at Dhaka Cantonment, Dhaka. Phone: +880 1915-930000 | Email: support@lookzene.com
          </p>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
