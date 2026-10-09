import { createFileRoute, Link } from "@tanstack/react-router";
import { ShieldCheck, Lock, Eye, ChevronRight } from "lucide-react";
import { AnnouncementBar, SiteHeader, SiteFooter } from "@/components/site/chrome";

export const Route = createFileRoute("/privacy-policy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — Lookzene" },
      { name: "description", content: "Lookzene's Privacy Policy explaining how we collect, store, and protect your personal information." },
      { property: "og:title", content: "Privacy Policy — Lookzene" },
    ],
  }),
  component: PrivacyPolicyPage,
});

function PrivacyPolicyPage() {
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
              <li className="text-foreground font-medium">Privacy Policy</li>
            </ol>
          </nav>
          <h1 className="text-serif text-3xl md:text-5xl leading-tight font-semibold">Privacy Policy</h1>
          <p className="mt-3 text-muted-foreground text-sm max-w-2xl leading-relaxed">
            How Lookzene collects, uses, and safeguards your personal data when shopping on our platform.
          </p>
        </div>
      </section>

      <section className="container-luxe py-12 md:py-16 max-w-4xl space-y-8 text-sm text-foreground/90 leading-relaxed">
        <div>
          <h2 className="text-serif text-2xl font-semibold text-foreground mb-3">1. Information We Collect</h2>
          <p className="text-muted-foreground">
            When you visit or place an order on Lookzene (lookzene.com), we collect personal information necessary to process your transaction and deliver your products safely:
          </p>
          <ul className="list-disc pl-5 space-y-2 mt-2 text-muted-foreground">
            <li><strong>Contact Information:</strong> Full name, phone numbers (+880 mobile numbers), delivery address, and email address.</li>
            <li><strong>Order Details:</strong> Purchased items, delivery location, billing preference, and transaction history.</li>
            <li><strong>Technical Data:</strong> IP address, device type, browser information, and cookies used to improve your browsing experience.</li>
          </ul>
        </div>

        <div>
          <h2 className="text-serif text-2xl font-semibold text-foreground mb-3">2. How We Use Your Information</h2>
          <p className="text-muted-foreground">
            We use your data solely for core eCommerce operations:
          </p>
          <ul className="list-disc pl-5 space-y-2 mt-2 text-muted-foreground">
            <li>Processing, dispatching, and delivering your orders to your specified address.</li>
            <li>Sending order confirmations, SMS tracking updates, and delivery notifications.</li>
            <li>Providing customer support and resolving inquiries or return requests.</li>
            <li>Preventing fraudulent transactions and ensuring security across our website.</li>
          </ul>
        </div>

        <div>
          <h2 className="text-serif text-2xl font-semibold text-foreground mb-3">3. Data Security & Payment Protection</h2>
          <p className="text-muted-foreground">
            We enforce strict security protocols to safeguard your personal data. All connections to lookzene.com are encrypted using 256-bit SSL technology. Payment processing via bKash, Nagad, Visa, or Mastercard is handled directly through SSLCommerz secure gateways. Lookzene never stores your credit card CVV or mobile banking PIN numbers.
          </p>
        </div>

        <div>
          <h2 className="text-serif text-2xl font-semibold text-foreground mb-3">4. Third-Party Sharing</h2>
          <p className="text-muted-foreground">
            We respect your privacy and <strong>never sell or rent your personal data</strong> to third parties. We share limited delivery information (Name, Address, Phone Number) solely with authorized logistics partners (Pathao, Steadfast, Redx) to fulfill your orders.
          </p>
        </div>

        <div>
          <h2 className="text-serif text-2xl font-semibold text-foreground mb-3">5. Contact Our Data Protection Lead</h2>
          <p className="text-muted-foreground">
            For questions regarding your personal data or privacy rights, please contact our physical office:
          </p>
          <div className="mt-3 p-5 bg-card border border-border rounded-xl space-y-1 text-xs text-foreground font-medium">
            <p><strong>Lookzene Customer Care & Data Office</strong></p>
            <p>Dhaka Cantonment, Dhaka, Bangladesh</p>
            <p>Phone: +880 1915-930000</p>
            <p>Email: support@lookzene.com</p>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
