import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { 
  Briefcase, 
  Clock, 
  MapPin, 
  Users, 
  Calendar, 
  CheckCircle2, 
  Send, 
  Sparkles, 
  Award, 
  TrendingUp, 
  Heart,
  ChevronRight
} from "lucide-react";
import { AnnouncementBar, SiteHeader, SiteFooter } from "@/components/site/chrome";

import { submitJobApplication } from "@/lib/coscore-api";

export const Route = createFileRoute("/careers")({
  head: () => ({
    meta: [
      { title: "Careers — Digital Marketer (2 Vacancies) | Lookzene Bangladesh" },
      { name: "description", content: "Join Lookzene as Digital Marketer / Performance Marketing Specialist. 2 Vacancies in Dhaka Cantonment. Deadline: 30 September 2026. Apply online now." },
      { property: "og:title", content: "Job Circular: Digital Marketer at Lookzene" },
      { property: "og:description", content: "2 Vacancies for Digital Marketing Specialist at Lookzene Bangladesh. Deadline: 30 September 2026." },
      { property: "og:url", content: "https://lookzene.com/careers" },
    ],
    links: [
      { rel: "canonical", href: "https://lookzene.com/careers" }
    ]
  }),
  component: CareersPage,
});

export function CareersPage() {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    experience: "1-2 years",
    portfolioUrl: "",
    coverLetter: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await submitJobApplication({
        ...formData,
        jobTitle: "Digital Marketer"
      });
      setSubmitted(true);
    } catch (err) {
      console.error("Submission failed", err);
      setError("Failed to submit application. Please try again or email careers@lookzene.com directly.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AnnouncementBar />
      <SiteHeader />

      <div className="bg-ivory/50 min-h-screen py-12 md:py-20">
        <div className="container-luxe max-w-5xl">
          
          {/* Breadcrumbs */}
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-muted-foreground mb-8">
            <Link to="/" className="hover:text-burgundy transition">Home</Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-foreground font-medium">Careers</span>
          </nav>

          {/* Hero Header */}
          <div className="text-center max-w-3xl mx-auto mb-14">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-burgundy/10 text-burgundy text-xs font-semibold uppercase tracking-widest mb-4">
              <Sparkles className="h-3.5 w-3.5" /> Join Team Lookzene
            </div>
            <h1 className="text-serif text-3xl sm:text-4xl md:text-5xl text-foreground font-normal tracking-tight">
              Careers at Lookzene
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base mt-4 leading-relaxed">
              We are Bangladesh&apos;s premier destination for 100% authentic K-Beauty and global skincare essentials. Help us reshape the beauty e-commerce experience in Bangladesh.
            </p>
          </div>

          {/* Company Culture Highlights */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
            <div className="bg-background border border-border rounded-2xl p-6 shadow-sm">
              <div className="h-10 w-10 rounded-xl bg-burgundy/10 text-burgundy grid place-items-center mb-4">
                <TrendingUp className="h-5 w-5" />
              </div>
              <h3 className="text-serif text-lg text-foreground font-semibold">Fast Growth</h3>
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                Work directly with cutting-edge e-commerce technology and performance marketing strategies in Bangladesh.
              </p>
            </div>

            <div className="bg-background border border-border rounded-2xl p-6 shadow-sm">
              <div className="h-10 w-10 rounded-xl bg-burgundy/10 text-burgundy grid place-items-center mb-4">
                <Heart className="h-5 w-5" />
              </div>
              <h3 className="text-serif text-lg text-foreground font-semibold">Product Perks</h3>
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                Exclusive staff discounts on top-tier authentic Korean skincare and international cosmetic brands.
              </p>
            </div>

            <div className="bg-background border border-border rounded-2xl p-6 shadow-sm">
              <div className="h-10 w-10 rounded-xl bg-burgundy/10 text-burgundy grid place-items-center mb-4">
                <Award className="h-5 w-5" />
              </div>
              <h3 className="text-serif text-lg text-foreground font-semibold">Work-Life Balance</h3>
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                Supportive corporate culture, festival bonuses, and structured career advancement pathways.
              </p>
            </div>
          </div>

          {/* Active Job Circular Section */}
          <div className="mb-14">
            <div className="flex items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-serif text-2xl md:text-3xl text-foreground font-normal">
                  Open Positions
                </h2>
                <p className="text-xs text-muted-foreground mt-1">Explore current career opportunities at our Dhaka headquarters.</p>
              </div>
              <span className="px-3 py-1 bg-burgundy text-primary-foreground text-xs font-medium rounded-full">
                1 Active Opening
              </span>
            </div>

            {/* Featured Job Card */}
            <div id="digital-marketer" className="bg-background border-2 border-burgundy/30 rounded-3xl p-6 md:p-10 shadow-luxury transition hover:border-burgundy/60">
              
              {/* Job Header Info */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-border">
                <div>
                  <div className="flex flex-wrap items-center gap-2.5 mb-2">
                    <span className="px-3 py-1 rounded-md bg-burgundy/10 text-burgundy text-xs font-semibold">
                      Full-Time
                    </span>
                    <span className="px-3 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold">
                      URGENT HIRING
                    </span>
                  </div>
                  <h3 className="text-serif text-2xl md:text-3xl text-foreground font-semibold">
                    Digital Marketer / Performance Marketing Specialist
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1.5 flex flex-wrap items-center gap-4">
                    <span className="inline-flex items-center gap-1.5"><MapPin className="h-4 w-4 text-burgundy" /> Dhaka Cantonment, Dhaka</span>
                    <span className="inline-flex items-center gap-1.5"><Users className="h-4 w-4 text-burgundy" /> 2 Vacancies</span>
                    <span className="inline-flex items-center gap-1.5"><Calendar className="h-4 w-4 text-burgundy" /> Deadline: 30 September 2026</span>
                  </p>
                </div>
                <div className="text-left md:text-right">
                  <div className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">Salary Range</div>
                  <div className="text-lg md:text-xl font-bold text-burgundy mt-0.5">৳25,000 – ৳40,000 / mo</div>
                  <div className="text-[11px] text-muted-foreground">+ ROAS Bonuses & 2x Festival Bonuses</div>
                </div>
              </div>

              {/* Job Body Description */}
              <div className="py-8 space-y-8 text-sm leading-relaxed text-foreground/90">
                
                {/* Role Context */}
                <div>
                  <h4 className="text-xs uppercase tracking-widest text-burgundy font-bold mb-3 flex items-center gap-2">
                    <Briefcase className="h-4 w-4" /> Role Summary
                  </h4>
                  <p className="text-muted-foreground">
                    Lookzene is seeking an ambitious, data-driven **Digital Marketer** to lead customer acquisition, brand awareness, and performance ad campaigns across Bangladesh. As part of our growth team, you will design high-converting Meta (Facebook & Instagram) and Google ad campaigns, execute influencer marketing strategies, and optimize e-commerce sales funnels.
                  </p>
                </div>

                {/* Key Responsibilities */}
                <div>
                  <h4 className="text-xs uppercase tracking-widest text-burgundy font-bold mb-3 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" /> Key Responsibilities
                  </h4>
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-muted-foreground">
                    <li className="flex items-start gap-2.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-burgundy mt-2 shrink-0" />
                      Plan, set up, and manage Meta Ads (FB/IG) & Google Performance Max campaigns targeting BD beauty buyers.
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-burgundy mt-2 shrink-0" />
                      Track daily ROAS, CPA, and conversion rates to maximize ad budget efficiency on lookzene.com.
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-burgundy mt-2 shrink-0" />
                      Coordinate creative assets (Reels, TikToks, Carousel Ads, Product Reviews) with graphic designers & video editors.
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-burgundy mt-2 shrink-0" />
                      Execute seasonal Bangladeshi e-commerce promotional campaigns (Eid, Puja, Winter Skincare, bKash Cashback offers).
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-burgundy mt-2 shrink-0" />
                      Identify and onboard Bangladeshi beauty vloggers & micro-influencers for product seeding.
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-burgundy mt-2 shrink-0" />
                      Analyze traffic & user conversion paths using Google Analytics 4 and Meta Pixel.
                    </li>
                  </ul>
                </div>

                {/* Requirements */}
                <div>
                  <h4 className="text-xs uppercase tracking-widest text-burgundy font-bold mb-3 flex items-center gap-2">
                    <Clock className="h-4 w-4" /> Educational & Skill Requirements
                  </h4>
                  <ul className="space-y-2 text-muted-foreground">
                    <li className="flex items-start gap-2.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-burgundy mt-2 shrink-0" />
                      <strong>Education:</strong> Bachelor&apos;s degree in Marketing, Business, Communication, or relevant field (Equivalent practical experience valued).
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-burgundy mt-2 shrink-0" />
                      <strong>Experience:</strong> 1 to 3 years of proven experience in Digital Marketing / Performance Advertising for Bangladeshi E-Commerce or D2C brands.
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-burgundy mt-2 shrink-0" />
                      <strong>Technical Skills:</strong> Meta Business Manager, Custom Audiences, Retargeting, Google Analytics 4, Canva/Photoshop basics.
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-burgundy mt-2 shrink-0" />
                      <strong>Languages:</strong> Professional fluency in English and Bengali writing for compelling ad copy.
                    </li>
                  </ul>
                </div>

                {/* Additional Information */}
                <div className="bg-blush/20 rounded-2xl p-5 border border-burgundy/10 flex flex-wrap justify-between gap-4 text-xs text-foreground/80">
                  <div><strong>Job Type:</strong> Full-Time (On-site / Dhaka Cantonment)</div>
                  <div><strong>Vacancies:</strong> 02 Openings</div>
                  <div><strong>Application Deadline:</strong> 30 September 2026</div>
                </div>

              </div>

              {/* Direct Application Form Container */}
              <div className="pt-8 border-t border-border">
                <h4 className="text-serif text-xl text-foreground font-semibold mb-2">
                  Apply Online for Digital Marketer Position
                </h4>
                <p className="text-xs text-muted-foreground mb-6">
                  Fill out the application form below or email your resume & portfolio directly to <a href="mailto:careers@lookzene.com" className="text-burgundy underline">careers@lookzene.com</a> with subject line &quot;Application - Digital Marketer&quot;.
                </p>

                {submitted ? (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center">
                    <CheckCircle2 className="h-10 w-10 text-emerald-600 mx-auto mb-3" />
                    <h5 className="text-serif text-lg text-emerald-900 font-semibold">Application Submitted Successfully!</h5>
                    <p className="text-xs text-emerald-700 mt-1 max-w-md mx-auto">
                      Thank you for applying to Lookzene. Our HR team will review your CV and contact shortlisted candidates before 30 September 2026.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-foreground mb-1">Full Name *</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Hasan Tanvir"
                          value={formData.fullName}
                          onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                          className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-burgundy/30"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-foreground mb-1">Email Address *</label>
                        <input
                          type="email"
                          required
                          placeholder="e.g. hasan@example.com"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-burgundy/30"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-foreground mb-1">Contact Phone *</label>
                        <input
                          type="tel"
                          required
                          placeholder="+880 1915-930000"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-burgundy/30"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-foreground mb-1">Years of Experience *</label>
                        <select
                          value={formData.experience}
                          onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                          className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-burgundy/30"
                        >
                          <option value="Fresher / <1 year">Fresher / &lt;1 year</option>
                          <option value="1-2 years">1-2 years</option>
                          <option value="2-3 years">2-3 years</option>
                          <option value="3+ years">3+ years</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-foreground mb-1">Resume / CV Link (Google Drive / LinkedIn / Portfolio) *</label>
                      <input
                        type="url"
                        required
                        placeholder="https://drive.google.com/file/d/your-cv-link"
                        value={formData.portfolioUrl}
                        onChange={(e) => setFormData({ ...formData, portfolioUrl: e.target.value })}
                        className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-burgundy/30"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-foreground mb-1">Cover Note / Why Lookzene?</label>
                      <textarea
                        rows={3}
                        placeholder="Briefly tell us about your past ad campaigns, ROAS achievements, or why you want to work with Lookzene..."
                        value={formData.coverLetter}
                        onChange={(e) => setFormData({ ...formData, coverLetter: e.target.value })}
                        className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-burgundy/30 resize-none"
                      />
                    </div>

                    {error && (
                      <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl">
                        {error}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={submitting}
                      className="inline-flex items-center justify-center gap-2 bg-burgundy text-primary-foreground font-semibold px-6 py-3 rounded-full hover:opacity-90 transition text-sm w-full sm:w-auto disabled:opacity-50"
                    >
                      <Send className="h-4 w-4" /> {submitting ? "Submitting..." : "Submit Application"}
                    </button>
                  </form>
                )}
              </div>

            </div>
          </div>

          {/* Contact HR Footer Note */}
          <div className="bg-background border border-border rounded-2xl p-6 text-center text-xs text-muted-foreground">
            <p>
              Have questions about careers at Lookzene? Contact our HR & Operations team at{" "}
              <a href="mailto:careers@lookzene.com" className="text-burgundy font-semibold underline">careers@lookzene.com</a> or visit our office at Dhaka Cantonment, Dhaka, Bangladesh.
            </p>
          </div>

        </div>
      </div>

      <SiteFooter />
    </div>
  );
}
