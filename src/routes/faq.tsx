import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronRight, ChevronDown, HelpCircle } from "lucide-react";
import { AnnouncementBar, SiteHeader, SiteFooter } from "@/components/site/chrome";

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { title: "Frequently Asked Questions (FAQ) — Customer Support BD | Lookzene" },
      { name: "description", content: "Find answers to popular questions regarding product authenticity, bKash payments, Cash on Delivery, shipping timelines, and returns at Lookzene Bangladesh." },
      { property: "og:title", content: "Frequently Asked Questions (FAQ) — Lookzene" },
      { property: "og:url", content: "https://lookzene.com/faq" },
    ],
    links: [
      { rel: "canonical", href: "https://lookzene.com/faq" }
    ]
  }),
  component: FAQPage,
});

const faqs = [
  {
    q: "Are all products on Lookzene 100% authentic?",
    a: "Yes, 100%! We source all Korean skincare and cosmetics directly from brand authorized distributors in Seoul, Korea and official global brand representatives. Every item carries our 100% authenticity guarantee."
  },
  {
    q: "What are your delivery charges and delivery times?",
    a: "We offer flat-rate delivery across Bangladesh: Inside Dhaka Metro is ৳60 (delivered in 1–2 business days), and Outside Dhaka is ৳120 (delivered in 2–4 business days). Orders over ৳2,000 enjoy FREE delivery."
  },
  {
    q: "Do you offer Cash on Delivery (COD)?",
    a: "Yes! Cash on Delivery is available across all districts in Bangladesh. You can pay cash directly to the courier delivery agent upon receiving your parcel."
  },
  {
    q: "What is your return policy?",
    a: "We offer a 7-day return and exchange policy for unopened, unsealed products in their original packaging. If an item arrives damaged or incorrect, contact us immediately at +880 1915-930000 for an instant replacement or refund."
  },
  {
    q: "Where is your office / physical address located?",
    a: "Our customer operations and dispatch hub is located at Dhaka Cantonment, Dhaka, Bangladesh."
  },
  {
    q: "How can I contact customer support?",
    a: "You can reach us by phone at +880 1915-930000 (Saturday to Thursday, 9:00 AM – 10:00 PM), or by email at support@lookzene.com."
  }
];

function FAQPage() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

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
              <li className="text-foreground font-medium">FAQ</li>
            </ol>
          </nav>
          <h1 className="text-serif text-3xl md:text-5xl leading-tight font-semibold">Frequently Asked Questions</h1>
          <p className="mt-3 text-muted-foreground text-sm max-w-2xl leading-relaxed">
            Find quick answers regarding our products, shipping, returns, and ordering process.
          </p>
        </div>
      </section>

      <section className="container-luxe py-12 md:py-16 max-w-4xl space-y-4">
        {faqs.map((faq, idx) => {
          const isOpen = openIdx === idx;
          return (
            <div
              key={idx}
              className="border border-border rounded-2xl bg-card overflow-hidden transition-shadow duration-200"
            >
              <button
                onClick={() => setOpenIdx(isOpen ? null : idx)}
                className="w-full p-6 text-left flex items-center justify-between gap-4 font-semibold text-foreground text-base hover:text-burgundy transition-colors"
              >
                <span>{faq.q}</span>
                <ChevronDown className={`h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-300 ${isOpen ? "rotate-180 text-burgundy" : ""}`} />
              </button>
              {isOpen && (
                <div className="px-6 pb-6 text-sm text-muted-foreground leading-relaxed border-t border-border/50 pt-4">
                  {faq.a}
                </div>
              )}
            </div>
          );
        })}
      </section>

      <SiteFooter />
    </div>
  );
}
