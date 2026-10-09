import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronRight, FileText } from "lucide-react";
import { AnnouncementBar, SiteHeader, SiteFooter } from "@/components/site/chrome";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms & Conditions — Lookzene" },
      { name: "description", content: "Lookzene's Terms and Conditions governing your use of our online store and beauty products." },
      { property: "og:title", content: "Terms & Conditions — Lookzene" },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
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
              <li className="text-foreground font-medium">Terms & Conditions</li>
            </ol>
          </nav>
          <h1 className="text-serif text-3xl md:text-5xl leading-tight font-semibold">Terms & Conditions</h1>
          <p className="mt-3 text-muted-foreground text-sm max-w-2xl leading-relaxed">
            Please review the terms governing your purchase and use of Lookzene.com.
          </p>
        </div>
      </section>

      <section className="container-luxe py-12 md:py-16 max-w-4xl space-y-8 text-sm text-foreground/90 leading-relaxed">
        <div>
          <h2 className="text-serif text-2xl font-semibold text-foreground mb-3">1. Agreement to Terms</h2>
          <p className="text-muted-foreground">
            By accessing or ordering from Lookzene (lookzene.com), you agree to be bound by these Terms and Conditions. Lookzene is a licensed beauty business registered and operating in Dhaka Cantonment, Dhaka, Bangladesh.
          </p>
        </div>

        <div>
          <h2 className="text-serif text-2xl font-semibold text-foreground mb-3">2. Pricing & Currency</h2>
          <p className="text-muted-foreground">
            All prices listed on Lookzene are in Bangladeshi Taka (BDT ৳) and inclusive of applicable taxes. We reserve the right to modify prices or discontinue items without prior notice. Promotional pricing or discount codes are valid only during specified campaign periods.
          </p>
        </div>

        <div>
          <h2 className="text-serif text-2xl font-semibold text-foreground mb-3">3. Product Authenticity & Usage</h2>
          <p className="text-muted-foreground">
            Lookzene guarantees that all products offered are 100% authentic, sourced directly from verified Korean and international beauty brand distributors. Product descriptions and ingredients are provided for informational purposes. Customers are advised to patch-test new skincare items prior to full facial application.
          </p>
        </div>

        <div>
          <h2 className="text-serif text-2xl font-semibold text-foreground mb-3">4. Governing Law</h2>
          <p className="text-muted-foreground">
            These terms shall be governed by and construed in accordance with the laws of the People's Republic of Bangladesh. Any dispute arising under these terms shall be subject to the exclusive jurisdiction of the courts in Dhaka, Bangladesh.
          </p>
        </div>

        <div className="p-5 bg-card border border-border rounded-xl text-xs space-y-1">
          <p className="font-semibold text-foreground">Lookzene Business Details:</p>
          <p className="text-muted-foreground">Dhaka Cantonment, Dhaka, Bangladesh</p>
          <p className="text-muted-foreground">Customer Support: +880 1915-930000 | Email: support@lookzene.com</p>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
