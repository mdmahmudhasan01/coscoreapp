import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { MapPin, Phone, Mail, Clock, Send, ShieldCheck, CheckCircle2, ChevronRight } from "lucide-react";
import { AnnouncementBar, SiteHeader, SiteFooter } from "@/components/site/chrome";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact Us — Lookzene Timeless Beauty" },
      { name: "description", content: "Get in touch with Lookzene customer care. Physical address: Dhaka Cantonment, Dhaka, Bangladesh. Phone: +880 1915-930000." },
      { property: "og:title", content: "Contact Us — Lookzene" },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", subject: "", message: "" });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

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
              <li className="text-foreground font-medium">Contact Us</li>
            </ol>
          </nav>
          <h1 className="text-serif text-3xl md:text-5xl leading-tight font-semibold">Contact Us</h1>
          <p className="mt-3 text-muted-foreground text-sm max-w-2xl leading-relaxed">
            Have questions about our authentic beauty collection, order tracking, or returns? Our dedicated Customer Care team is here to assist you.
          </p>
        </div>
      </section>

      <section className="container-luxe py-12 md:py-16">
        <div className="grid lg:grid-cols-12 gap-10">
          {/* Contact Details Column */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-card border border-border rounded-2xl p-6 md:p-8 space-y-6 shadow-soft">
              <h2 className="text-serif text-2xl font-semibold">Get in Touch</h2>

              <div className="flex items-start gap-4">
                <div className="h-10 w-10 rounded-full bg-blush/40 grid place-items-center text-burgundy shrink-0 mt-1">
                  <MapPin className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-xs uppercase tracking-widest font-bold text-muted-foreground">Physical Office & Store</h3>
                  <p className="mt-1 font-medium text-foreground text-sm leading-relaxed">
                    Dhaka Cantonment, Dhaka, Bangladesh
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 border-t border-border pt-5">
                <div className="h-10 w-10 rounded-full bg-blush/40 grid place-items-center text-burgundy shrink-0 mt-1">
                  <Phone className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-xs uppercase tracking-widest font-bold text-muted-foreground">Direct Customer Helpline</h3>
                  <p className="mt-1 font-semibold text-foreground text-sm">
                    Phone: <a href="tel:+8801915930000" className="hover:text-burgundy transition">+880 1915-930000</a>
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 border-t border-border pt-5">
                <div className="h-10 w-10 rounded-full bg-blush/40 grid place-items-center text-burgundy shrink-0 mt-1">
                  <Mail className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-xs uppercase tracking-widest font-bold text-muted-foreground">Email Support</h3>
                  <p className="mt-1 font-medium text-foreground text-sm">
                    <a href="mailto:support@lookzene.com" className="hover:text-burgundy transition">support@lookzene.com</a>
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">We respond within 24 hours</p>
                </div>
              </div>

              <div className="flex items-start gap-4 border-t border-border pt-5">
                <div className="h-10 w-10 rounded-full bg-blush/40 grid place-items-center text-burgundy shrink-0 mt-1">
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-xs uppercase tracking-widest font-bold text-muted-foreground">Operating Hours</h3>
                  <p className="mt-1 text-sm text-foreground">Saturday – Thursday: 9:00 AM – 10:00 PM (BST)</p>
                  <p className="text-xs text-muted-foreground">Friday: 2:00 PM – 9:00 PM</p>
                </div>
              </div>
            </div>

            <div className="bg-ivory border border-border rounded-2xl p-6 text-xs space-y-3">
              <div className="flex items-center gap-2 text-emerald font-semibold">
                <ShieldCheck className="h-4 w-4" /> Official Google Merchant Verified Business
              </div>
              <p className="text-muted-foreground leading-relaxed">
                Lookzene is an authorized retailer operating in Dhaka, Bangladesh. All skincare and cosmetic items are 100% authentic and covered by our 7-day guarantee.
              </p>
            </div>
          </div>

          {/* Form Column */}
          <div className="lg:col-span-7">
            <div className="bg-card border border-border rounded-2xl p-6 md:p-10 shadow-soft">
              <h2 className="text-serif text-2xl font-semibold">Send Us a Message</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Fill out the form below and our customer care team will get back to you promptly.
              </p>

              {submitted ? (
                <div className="mt-8 text-center py-10 bg-emerald/10 border border-emerald/20 rounded-2xl space-y-3">
                  <CheckCircle2 className="h-12 w-12 text-emerald mx-auto" />
                  <h3 className="text-serif text-2xl font-semibold text-foreground">Message Sent Successfully!</h3>
                  <p className="text-sm text-muted-foreground max-w-md mx-auto">
                    Thank you for reaching out. We have received your inquiry and will contact you shortly.
                  </p>
                  <button
                    onClick={() => setSubmitted(false)}
                    className="mt-4 inline-flex items-center gap-2 bg-burgundy text-primary-foreground rounded-full px-6 py-2.5 text-xs font-semibold hover:opacity-90 transition"
                  >
                    Send Another Message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-foreground mb-1.5">Full Name *</label>
                      <input
                        type="text"
                        required
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        placeholder="Your full name"
                        className="w-full h-11 px-4 text-sm bg-background border border-border rounded-xl focus:border-burgundy focus:ring-1 focus:ring-burgundy outline-none transition"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-foreground mb-1.5">Email Address *</label>
                      <input
                        type="email"
                        required
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        placeholder="name@example.com"
                        className="w-full h-11 px-4 text-sm bg-background border border-border rounded-xl focus:border-burgundy focus:ring-1 focus:ring-burgundy outline-none transition"
                      />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-foreground mb-1.5">Phone Number *</label>
                      <input
                        type="tel"
                        required
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        placeholder="017XXXXXXXX"
                        className="w-full h-11 px-4 text-sm bg-background border border-border rounded-xl focus:border-burgundy focus:ring-1 focus:ring-burgundy outline-none transition"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-foreground mb-1.5">Subject</label>
                      <input
                        type="text"
                        value={form.subject}
                        onChange={(e) => setForm({ ...form, subject: e.target.value })}
                        placeholder="Order inquiry, return, product advice..."
                        className="w-full h-11 px-4 text-sm bg-background border border-border rounded-xl focus:border-burgundy focus:ring-1 focus:ring-burgundy outline-none transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1.5">Message *</label>
                    <textarea
                      required
                      rows={5}
                      value={form.message}
                      onChange={(e) => setForm({ ...form, message: e.target.value })}
                      placeholder="How can we help you today?"
                      className="w-full p-4 text-sm bg-background border border-border rounded-xl focus:border-burgundy focus:ring-1 focus:ring-burgundy outline-none transition resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full inline-flex items-center justify-center gap-2 bg-burgundy text-primary-foreground rounded-full py-3.5 text-sm font-semibold hover:shadow-luxury transition"
                  >
                    Submit Message <Send className="h-4 w-4" />
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
