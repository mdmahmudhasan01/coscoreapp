import { createFileRoute, Link } from "@tanstack/react-router";
import { RotateCcw, ShieldCheck, CheckCircle2, Clock, ChevronRight } from "lucide-react";
import { AnnouncementBar, SiteHeader, SiteFooter } from "@/components/site/chrome";

export const Route = createFileRoute("/return-policy")({
  head: () => ({
    meta: [
      { title: "Return & Refund Policy — Lookzene" },
      { name: "description", content: "Lookzene's hassle-free 7-day return and refund policy. Learn how to return items and request refunds." },
      { property: "og:title", content: "Return & Refund Policy — Lookzene" },
    ],
  }),
  component: ReturnPolicyPage,
});

function ReturnPolicyPage() {
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
              <li className="text-foreground font-medium">Return & Refund Policy</li>
            </ol>
          </nav>
          <h1 className="text-serif text-3xl md:text-5xl leading-tight font-semibold">Return & Refund Policy</h1>
          <p className="mt-3 text-muted-foreground text-sm max-w-2xl leading-relaxed">
            Your satisfaction is our priority. Enjoy a transparent 7-day return and exchange policy on all authentic beauty purchases.
          </p>
        </div>
      </section>

      <section className="container-luxe py-12 md:py-16 max-w-4xl space-y-10">
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-card border border-border rounded-2xl p-6 text-center space-y-2 shadow-soft">
            <div className="h-12 w-12 rounded-full bg-blush/40 text-burgundy grid place-items-center mx-auto">
              <RotateCcw className="h-6 w-6" />
            </div>
            <h3 className="font-semibold text-foreground text-base">7-Day Guarantee</h3>
            <p className="text-xs text-muted-foreground">Return or exchange within 7 days of receiving your order.</p>
          </div>

          <div className="bg-card border border-border rounded-2xl p-6 text-center space-y-2 shadow-soft">
            <div className="h-12 w-12 rounded-full bg-emerald/20 text-emerald grid place-items-center mx-auto">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <h3 className="font-semibold text-foreground text-base">100% Refund</h3>
            <p className="text-xs text-muted-foreground">Processed to original payment or bKash within 3–5 days.</p>
          </div>

          <div className="bg-card border border-border rounded-2xl p-6 text-center space-y-2 shadow-soft">
            <div className="h-12 w-12 rounded-full bg-blush/40 text-burgundy grid place-items-center mx-auto">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h3 className="font-semibold text-foreground text-base">Damaged / Wrong Item</h3>
            <p className="text-xs text-muted-foreground">Free instant replacement if delivered damaged or incorrect.</p>
          </div>
        </div>

        <div className="space-y-8 text-sm text-foreground/90 leading-relaxed border-t border-border pt-8">
          <div>
            <h2 className="text-serif text-2xl font-semibold text-foreground mb-3">1. Eligibility for Returns</h2>
            <p>
              To be eligible for a return or exchange, the item must meet the following criteria:
            </p>
            <ul className="list-disc pl-5 space-y-2 mt-2 text-muted-foreground">
              <li>The return request must be submitted within <strong>7 calendar days</strong> from the delivery date.</li>
              <li>The item must be unused, unopened, in its original product packaging, with safety seals and tags intact.</li>
              <li>Proof of purchase (Order ID or invoice number) must be provided.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-serif text-2xl font-semibold text-foreground mb-3">2. How to Request a Return</h2>
            <ol className="list-decimal pl-5 space-y-2 text-muted-foreground">
              <li>Contact our Customer Support via phone (<strong>+880 1915-930000</strong>) or email at <strong>support@lookzene.com</strong>.</li>
              <li>Provide your Order ID and photo/video proof if the item arrived damaged or incorrect.</li>
              <li>Our team will arrange courier pickup or guide you on returning the parcel to our office at <strong>Dhaka Cantonment, Dhaka</strong>.</li>
            </ol>
          </div>

          <div>
            <h2 className="text-serif text-2xl font-semibold text-foreground mb-3">3. Refund Processing & Timelines</h2>
            <p>
              Once your returned package is received and inspected at our Dhaka Cantonment hub, we will notify you of the approval or rejection of your refund.
            </p>
            <ul className="list-disc pl-5 space-y-2 mt-2 text-muted-foreground">
              <li><strong className="text-foreground">bKash / Nagad / Wallet Refunds:</strong> Processed within 24–48 hours after inspection.</li>
              <li><strong className="text-foreground">Bank Card / Credit Card Refunds:</strong> Processed within 3–5 business days depending on issuer bank policies.</li>
              <li><strong className="text-foreground">Cash on Delivery Orders:</strong> Refunded via bKash / Nagad or store credit as preferred.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-serif text-2xl font-semibold text-foreground mb-3">4. Non-Returnable Items</h2>
            <p className="text-muted-foreground">
              Due to hygiene standards and health regulations in Bangladesh, items that have been unsealed, opened, used, or altered cannot be returned unless they were received damaged or defective.
            </p>
          </div>

          <div className="bg-ivory border border-border rounded-2xl p-6 space-y-2">
            <h3 className="font-semibold text-foreground text-base">Need help initiating a return?</h3>
            <p className="text-xs text-muted-foreground">
              Our customer helpline is open Saturday to Thursday 9am to 10pm.
            </p>
            <div className="pt-2 flex flex-wrap gap-4 text-xs font-semibold text-burgundy">
              <a href="tel:+8801915930000" className="hover:underline">📞 Phone: +880 1915-930000</a>
              <a href="mailto:support@lookzene.com" className="hover:underline">✉️ support@lookzene.com</a>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
