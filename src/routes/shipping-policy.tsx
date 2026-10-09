import { createFileRoute, Link } from "@tanstack/react-router";
import { Truck, Clock, ShieldCheck, MapPin, Check, ChevronRight, Phone } from "lucide-react";
import { AnnouncementBar, SiteHeader, SiteFooter } from "@/components/site/chrome";

export const Route = createFileRoute("/shipping-policy")({
  head: () => ({
    meta: [
      { title: "Shipping & Delivery Policy — Lookzene" },
      { name: "description", content: "Learn about Lookzene's shipping timelines, fees, and delivery options across Bangladesh. Free delivery on orders over ৳2,000." },
      { property: "og:title", content: "Shipping & Delivery Policy — Lookzene" },
    ],
  }),
  component: ShippingPolicyPage,
});

function ShippingPolicyPage() {
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
              <li className="text-foreground font-medium">Shipping & Delivery Policy</li>
            </ol>
          </nav>
          <h1 className="text-serif text-3xl md:text-5xl leading-tight font-semibold">Shipping & Delivery Policy</h1>
          <p className="mt-3 text-muted-foreground text-sm max-w-2xl leading-relaxed">
            Transparent shipping timelines, flat rates, and reliable nation-wide delivery options across Bangladesh.
          </p>
        </div>
      </section>

      <section className="container-luxe py-12 md:py-16 max-w-4xl space-y-10">
        {/* Rates Overview Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-card border border-border rounded-2xl p-6 text-center space-y-2 shadow-soft">
            <div className="h-12 w-12 rounded-full bg-blush/40 text-burgundy grid place-items-center mx-auto">
              <Truck className="h-6 w-6" />
            </div>
            <h3 className="font-semibold text-foreground text-base">Inside Dhaka</h3>
            <div className="text-serif text-2xl font-bold text-burgundy">৳60</div>
            <p className="text-xs text-muted-foreground">Delivered in 1–2 business days</p>
          </div>

          <div className="bg-card border border-border rounded-2xl p-6 text-center space-y-2 shadow-soft">
            <div className="h-12 w-12 rounded-full bg-blush/40 text-burgundy grid place-items-center mx-auto">
              <MapPin className="h-6 w-6" />
            </div>
            <h3 className="font-semibold text-foreground text-base">Outside Dhaka</h3>
            <div className="text-serif text-2xl font-bold text-burgundy">৳120</div>
            <p className="text-xs text-muted-foreground">Delivered in 2–4 business days</p>
          </div>

          <div className="bg-card border border-border rounded-2xl p-6 text-center space-y-2 shadow-soft">
            <div className="h-12 w-12 rounded-full bg-emerald/20 text-emerald grid place-items-center mx-auto">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h3 className="font-semibold text-foreground text-base">Free Shipping</h3>
            <div className="text-serif text-2xl font-bold text-emerald">৳0</div>
            <p className="text-xs text-muted-foreground">On all orders over ৳2,000</p>
          </div>
        </div>

        {/* Detailed Sections */}
        <div className="space-y-8 text-sm text-foreground/90 leading-relaxed border-t border-border pt-8">
          <div>
            <h2 className="text-serif text-2xl font-semibold text-foreground mb-3">1. Order Processing Time</h2>
            <p>
              All orders are processed and dispatched within <strong>24 to 48 hours</strong> (excluding Fridays and public holidays) after order confirmation. Once your order is handed over to our courier partner (Steadfast / Redx / Pathao Courier), you will receive a tracking link via SMS and email.
            </p>
          </div>

          <div>
            <h2 className="text-serif text-2xl font-semibold text-foreground mb-3">2. Delivery Estimates</h2>
            <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
              <li><strong className="text-foreground">Dhaka Metro Area:</strong> Delivered within 24–48 hours from dispatch.</li>
              <li><strong className="text-foreground">Suburbs of Dhaka (Gazipur, Savar, Narayanganj):</strong> Delivered within 2–3 business days.</li>
              <li><strong className="text-foreground">All Divisions Outside Dhaka:</strong> Delivered within 2–4 business days via home delivery.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-serif text-2xl font-semibold text-foreground mb-3">3. Payment Methods & Cash on Delivery (COD)</h2>
            <p>
              We offer flexible payment options to ensure a smooth checkout experience:
            </p>
            <ul className="list-disc pl-5 space-y-2 mt-2 text-muted-foreground">
              <li><strong className="text-foreground">Cash on Delivery (COD):</strong> Pay cash directly to the delivery agent upon receiving and inspecting the package.</li>
              <li><strong className="text-foreground">Digital Payments:</strong> bKash, Nagad, Visa, Mastercard, and Amex via SSLCommerz secure gateway.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-serif text-2xl font-semibold text-foreground mb-3">4. Order Inspection upon Delivery</h2>
            <p>
              Customers are advised to inspect the outer package before accepting delivery from the courier driver. If the package appears severely damaged, tampered with, or unsealed, please inform the courier agent and contact our Customer Care helpline immediately.
            </p>
          </div>

          <div className="bg-ivory border border-border rounded-2xl p-6 space-y-2">
            <h3 className="font-semibold text-foreground text-base">Questions about your delivery?</h3>
            <p className="text-xs text-muted-foreground">
              Our Customer Care team in Dhaka Cantonment is ready to help track your parcel or answer questions.
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
