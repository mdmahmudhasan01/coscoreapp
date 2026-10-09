import { createFileRoute, Link } from "@tanstack/react-router";
import { useSyncExternalStore, useMemo, useState, useEffect } from "react";
import {
  BarChart3,
  Search as SearchIcon,
  SlidersHorizontal,
  ArrowUpDown,
  AlertTriangle,
  Trash2,
  ChevronRight,
  TrendingUp,
  DollarSign,
  PackageCheck,
  Users,
  Truck,
  Layers,
  ShieldCheck,
  RefreshCw,
  Sparkles,
} from "lucide-react";

import { AnnouncementBar, SiteHeader, SiteFooter } from "@/components/site/chrome";
import { searchAnalytics, computeStats } from "@/lib/search-analytics";
import { fetchExecutiveAnalytics, uploadItemToERPNext, type ExecutiveAnalyticsData } from "@/lib/coscore-api";

export const Route = createFileRoute("/search-analytics")({
  head: () => ({
    meta: [
      { title: "Coscore BI & Search Analytics — Lookzene" },
      {
        name: "description",
        content:
          "Executive BI Analytics Dashboard powered by Coscore ERPNext backend and real-time storefront search telemetry.",
      },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AnalyticsDashboardPage,
});

const emptyState = { events: [] as ReturnType<typeof searchAnalytics.getSnapshot>["events"] };

function AnalyticsDashboardPage() {
  const [activeTab, setActiveTab] = useState<"executive" | "searches" | "upload">("executive");
  const [biData, setBiData] = useState<ExecutiveAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  const state = useSyncExternalStore(
    searchAnalytics.subscribe,
    searchAnalytics.getSnapshot,
    () => emptyState,
  );

  const stats = useMemo(() => computeStats(state.events), [state.events]);

  const loadData = async () => {
    setLoading(true);
    const data = await fetchExecutiveAnalytics();
    setBiData(data);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AnnouncementBar />
      <SiteHeader />

      <section className="gradient-hero-bg border-b border-border">
        <div className="container-luxe py-8 md:py-12">
          <nav aria-label="Breadcrumb" className="mb-3">
            <ol className="flex items-center gap-2 text-xs text-muted-foreground">
              <li className="flex items-center gap-2">
                <Link to="/" className="hover:text-burgundy transition-colors">
                  Home
                </Link>
                <ChevronRight className="h-3 w-3" />
              </li>
              <li>
                <span className="text-foreground font-medium">Coscore BI Analytics</span>
              </li>
            </ol>
          </nav>

          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 bg-burgundy/10 text-burgundy text-[11px] tracking-[0.25em] uppercase font-semibold px-3 py-1 rounded-full mb-2">
                <Sparkles className="h-3 w-3" /> Coscore ERPNext Engine
              </div>
              <h1 className="text-serif text-3xl md:text-5xl leading-tight">
                Executive BI & Store Telemetry
              </h1>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={loadData}
                className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-foreground bg-ivory border border-border px-4 py-2 rounded-full hover:bg-border transition"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
              </button>

              <button
                onClick={() => {
                  if (confirm("Clear local search logs?")) {
                    searchAnalytics.clear();
                  }
                }}
                className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-burgundy font-semibold border border-burgundy/40 rounded-full px-4 py-2 hover:bg-burgundy hover:text-primary-foreground transition"
              >
                <Trash2 className="h-3.5 w-3.5" /> Reset Local Logs
              </button>
            </div>
          </div>

          <div className="mt-6 flex border-b border-border gap-6">
            <button
              onClick={() => setActiveTab("executive")}
              className={`pb-3 text-sm font-semibold transition border-b-2 ${
                activeTab === "executive"
                  ? "border-burgundy text-burgundy"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              📊 Executive ERP Summary
            </button>
            <button
              onClick={() => setActiveTab("searches")}
              className={`pb-3 text-sm font-semibold transition border-b-2 ${
                activeTab === "searches"
                  ? "border-burgundy text-burgundy"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              🔍 Search Telemetry & Behavior
            </button>
            <button
              onClick={() => setActiveTab("upload")}
              className={`pb-3 text-sm font-semibold transition border-b-2 ${
                activeTab === "upload"
                  ? "border-burgundy text-burgundy"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              📦 Upload Product
            </button>
          </div>
        </div>
      </section>

      <section className="container-luxe py-10 space-y-10">
        {activeTab === "executive" && biData && (
          <div className="space-y-10">
            {/* Top KPI Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <Stat
                icon={<DollarSign className="h-4 w-4" />}
                label="Gross Revenue"
                value={`৳${biData.metrics.gross_revenue_bdt.toLocaleString()}`}
              />
              <Stat
                icon={<TrendingUp className="h-4 w-4 text-emerald-600" />}
                label="Net Profit Margin"
                value={`${biData.metrics.net_margin_percentage}%`}
              />
              <Stat
                icon={<PackageCheck className="h-4 w-4" />}
                label="Total Orders"
                value={biData.metrics.total_orders.toString()}
              />
              <Stat
                icon={<BarChart3 className="h-4 w-4" />}
                label="Avg Order Value"
                value={`৳${biData.metrics.avg_order_value_bdt.toLocaleString()}`}
              />
              <Stat
                icon={<Users className="h-4 w-4" />}
                label="Active Customers"
                value={biData.metrics.active_customers.toString()}
              />
              <Stat
                icon={<ShieldCheck className="h-4 w-4 text-burgundy" />}
                label="Conversion Rate"
                value={`${biData.metrics.conversion_rate_pct}%`}
              />
            </div>

            {/* Sales Trend Bar Visualizer & Top SKUs */}
            <div className="grid lg:grid-cols-12 gap-8">
              <div className="lg:col-span-7 rounded-3xl border border-border bg-background p-6 shadow-luxury">
                <div className="flex items-center justify-between pb-4 border-b border-border mb-6">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-burgundy" />
                    <h2 className="text-serif text-xl font-semibold">Weekly Sales Velocity</h2>
                  </div>
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                    Last 7 Days
                  </span>
                </div>

                <div className="space-y-4">
                  {biData.sales_trend.map((day) => (
                    <div key={day.date} className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <span>{day.date}</span>
                        <span className="text-burgundy">৳{day.revenue.toLocaleString()} ({day.orders} orders)</span>
                      </div>
                      <div className="h-3 w-full bg-ivory rounded-full overflow-hidden border border-border">
                        <div
                          className="h-full bg-burgundy rounded-full transition-all duration-500"
                          style={{ width: `${(day.revenue / 90000) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="lg:col-span-5 rounded-3xl border border-border bg-background p-6 shadow-luxury">
                <div className="flex items-center gap-2 pb-4 border-b border-border mb-6">
                  <PackageCheck className="h-5 w-5 text-burgundy" />
                  <h2 className="text-serif text-xl font-semibold">Top Performing SKUs</h2>
                </div>
                <div className="divide-y divide-border">
                  {biData.top_skus.map((sku, idx) => (
                    <div key={sku.name} className="py-3 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="w-6 h-6 rounded-full bg-burgundy text-primary-foreground text-xs font-bold grid place-items-center shrink-0">
                          {idx + 1}
                        </span>
                        <div className="truncate text-sm font-medium">{sku.name}</div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-xs font-bold text-burgundy">৳{sku.revenue_bdt.toLocaleString()}</div>
                        <div className="text-[10px] text-muted-foreground">{sku.sales} units sold</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Courier Dispatch & Logistics */}
            <div className="grid md:grid-cols-3 gap-6">
              <div className="rounded-2xl border border-border bg-background p-6 shadow-luxury">
                <div className="flex items-center gap-2 text-xs font-bold text-burgundy uppercase tracking-widest mb-3">
                  <Truck className="h-4 w-4" /> Steadfast Courier
                </div>
                <div className="text-serif text-3xl font-semibold">{biData.courier_breakdown.steadfast}</div>
                <div className="text-xs text-muted-foreground mt-1">Dispatches across Dhaka & nationwide</div>
              </div>

              <div className="rounded-2xl border border-border bg-background p-6 shadow-luxury">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-700 uppercase tracking-widest mb-3">
                  <Truck className="h-4 w-4" /> Pathao Parcel
                </div>
                <div className="text-serif text-3xl font-semibold">{biData.courier_breakdown.pathao}</div>
                <div className="text-xs text-muted-foreground mt-1">Express city deliveries</div>
              </div>

              <div className="rounded-2xl border border-border bg-background p-6 shadow-luxury">
                <div className="flex items-center gap-2 text-xs font-bold text-destructive uppercase tracking-widest mb-3">
                  <Truck className="h-4 w-4" /> RedX Delivery
                </div>
                <div className="text-serif text-3xl font-semibold">{biData.courier_breakdown.redx}</div>
                <div className="text-xs text-muted-foreground mt-1">District hubs fulfillment</div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "searches" && (
          <div className="space-y-10">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Stat
                icon={<SearchIcon className="h-4 w-4" />}
                label="Total searches"
                value={stats.totalSearches.toLocaleString()}
              />
              <Stat
                icon={<BarChart3 className="h-4 w-4" />}
                label="Unique queries"
                value={stats.uniqueQueries.toLocaleString()}
              />
              <Stat
                icon={<AlertTriangle className="h-4 w-4" />}
                label="Zero-result rate"
                value={`${(stats.zeroResultRate * 100).toFixed(1)}%`}
                tone={stats.zeroResultRate > 0.2 ? "warn" : "default"}
              />
              <Stat
                icon={<SlidersHorizontal className="h-4 w-4" />}
                label="Filter events"
                value={state.events.filter((e) => e.type === "filter").length.toLocaleString()}
              />
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              <Card
                title="Top Queries"
                icon={<SearchIcon className="h-4 w-4" />}
                empty={stats.topQueries.length === 0 ? "No searches recorded yet." : null}
              >
                <ul className="divide-y divide-border">
                  {stats.topQueries.map((q) => (
                    <li key={q.q} className="flex items-center justify-between py-2.5 gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="text-sm text-foreground truncate">{q.q}</div>
                        <div className="text-[11px] text-muted-foreground">
                          last: {q.lastResults} result{q.lastResults === 1 ? "" : "s"}
                        </div>
                      </div>
                      <span className="text-sm font-semibold text-burgundy tabular-nums">
                        ×{q.count}
                      </span>
                    </li>
                  ))}
                </ul>
              </Card>

              <Card
                title="Zero-Result Searches"
                icon={<AlertTriangle className="h-4 w-4" />}
                empty={
                  stats.zeroResultQueries.length === 0
                    ? "No zero-result searches — nice."
                    : null
                }
              >
                <ul className="divide-y divide-border">
                  {stats.zeroResultQueries.map((q) => (
                    <li key={q.q} className="flex items-center justify-between py-2.5 gap-4">
                      <div className="text-sm text-foreground truncate">{q.q}</div>
                      <span className="text-sm font-semibold text-burgundy tabular-nums">
                        ×{q.count}
                      </span>
                    </li>
                  ))}
                </ul>
              </Card>

              <Card
                title="Filter Usage"
                icon={<SlidersHorizontal className="h-4 w-4" />}
                empty={stats.topFilters.length === 0 ? "No filter usage recorded yet." : null}
              >
                <ul className="divide-y divide-border">
                  {stats.topFilters.map((f) => (
                    <li
                      key={`${f.facet}-${f.value}`}
                      className="flex items-center justify-between py-2.5 gap-4"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="text-sm text-foreground truncate">{f.value}</div>
                        <div className="text-[11px] uppercase tracking-widest text-muted-foreground">
                          {f.facet}
                        </div>
                      </div>
                      <span className="text-sm font-semibold text-burgundy tabular-nums">
                        ×{f.count}
                      </span>
                    </li>
                  ))}
                </ul>
              </Card>

              <Card
                title="Sort Usage"
                icon={<ArrowUpDown className="h-4 w-4" />}
                empty={stats.topSorts.length === 0 ? "No sort changes recorded yet." : null}
              >
                <ul className="divide-y divide-border">
                  {stats.topSorts.map((s) => (
                    <li key={s.value} className="flex items-center justify-between py-2.5 gap-4">
                      <div className="text-sm text-foreground">{s.value}</div>
                      <span className="text-sm font-semibold text-burgundy tabular-nums">
                        ×{s.count}
                      </span>
                    </li>
                  ))}
                </ul>
              </Card>
            </div>
          </div>
        )}

        {activeTab === "upload" && (
          <ProductUploadForm />
        )}
      </section>

      <SiteFooter />
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
  tone = "default",
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone?: "default" | "warn";
}) {
  return (
    <div className="rounded-2xl border border-border bg-background p-5 shadow-luxury">
      <div
        className={`inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.25em] font-semibold ${
          tone === "warn" ? "text-burgundy" : "text-muted-foreground"
        }`}
      >
        {icon}
        {label}
      </div>
      <div className="mt-2 text-serif text-2xl font-bold">{value}</div>
    </div>
  );
}

function Card({
  title,
  icon,
  empty,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  empty: string | null;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-border bg-background p-6 shadow-luxury">
      <div className="flex items-center gap-2 pb-3 mb-2 border-b border-border">
        <span className="text-burgundy">{icon}</span>
        <h2 className="text-[11px] uppercase tracking-[0.3em] font-semibold text-burgundy">
          {title}
        </h2>
      </div>
      {empty ? (
        <div className="py-10 text-center text-sm text-muted-foreground">{empty}</div>
      ) : (
        children
      )}
    </div>
  );
}

function ProductUploadForm() {
  const [formData, setFormData] = useState({
    item_code: "",
    item_name: "",
    price: "",
    item_group: "All Item Groups",
    description: "",
  });
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [responseMsg, setResponseMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResponseMsg(null);

    const data = new FormData();
    if (file) {
      data.append("file", file);
    }
    data.append("data", JSON.stringify(formData));

    try {
      const res = await uploadItemToERPNext(data);
      if (res && res.message && (res.message.status === "success" || res.status === "success")) {
        const text = res.message?.message || res.message || `Product '${formData.item_name}' successfully created in ERPNext!`;
        setResponseMsg({
          type: "success",
          text: text,
        });
        // Reset form
        setFormData({
          item_code: "",
          item_name: "",
          price: "",
          item_group: "All Item Groups",
          description: "",
        });
        setFile(null);
      } else {
        const msg = res?.message || res?.error || "Error uploading product.";
        setResponseMsg({
          type: "error",
          text: typeof msg === "string" ? msg : JSON.stringify(msg),
        });
      }
    } catch (err) {
      setResponseMsg({
        type: "error",
        text: err instanceof Error ? err.message : "Network error during upload.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto rounded-3xl border border-border bg-background p-6 md:p-8 shadow-luxury">
      <div className="flex items-center gap-3 pb-4 mb-6 border-b border-border">
        <div className="h-10 w-10 grid place-items-center rounded-full bg-burgundy/10 text-burgundy">
          <Sparkles className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-serif text-2xl font-semibold text-foreground">Upload Product to ERPNext</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Register new items directly in your ERPNext catalog database</p>
        </div>
      </div>

      {responseMsg && (
        <div
          className={`mb-6 p-4 rounded-xl border flex items-start gap-3 text-sm ${
            responseMsg.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-burgundy/5 text-burgundy border-burgundy/20"
          }`}
        >
          <div className="font-semibold">{responseMsg.type === "success" ? "✓" : "⚠"}</div>
          <div>{responseMsg.text}</div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
              Item Code / SKU <span className="text-burgundy">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. anua_toner_77"
              value={formData.item_code}
              onChange={(e) => setFormData({ ...formData, item_code: e.target.value })}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground focus:outline-none focus:border-burgundy"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
              Item Name <span className="text-burgundy">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Anua Heartleaf 77% Soothing Toner"
              value={formData.item_name}
              onChange={(e) => setFormData({ ...formData, item_name: e.target.value })}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground focus:outline-none focus:border-burgundy"
              required
            />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
              Price (BDT) <span className="text-burgundy">*</span>
            </label>
            <input
              type="number"
              placeholder="e.g. 1650"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground focus:outline-none focus:border-burgundy"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
              Item Group / Category
            </label>
            <div className="relative">
              <select
                value={formData.item_group}
                onChange={(e) => setFormData({ ...formData, item_group: e.target.value })}
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground focus:outline-none focus:border-burgundy appearance-none"
              >
                <option value="All Item Groups">All Item Groups</option>
                <option value="Sunscreen & UV Shield">Sunscreen & UV Shield</option>
                <option value="Serums & Ampoules">Serums & Ampoules</option>
                <option value="Toners & Essences">Toners & Essences</option>
                <option value="Cleansers & Balms">Cleansers & Balms</option>
              </select>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
            Description
          </label>
          <textarea
            rows={4}
            placeholder="Describe the product, ingredients, and usage directions..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground focus:outline-none focus:border-burgundy"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
            Product Image File
          </label>
          <div className="mt-1 flex justify-center rounded-xl border border-dashed border-border px-6 pt-5 pb-6">
            <div className="space-y-1 text-center">
              <div className="mx-auto h-12 w-12 text-muted-foreground grid place-items-center">
                <svg
                  className="mx-auto h-12 w-12 text-muted-foreground"
                  stroke="currentColor"
                  fill="none"
                  viewBox="0 0 48 48"
                  aria-hidden="true"
                >
                  <path
                    d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <div className="flex text-sm text-muted-foreground justify-center">
                <label className="relative cursor-pointer rounded-md font-semibold text-burgundy hover:text-burgundy/80">
                  <span>Upload a file</span>
                  <input
                    type="file"
                    className="sr-only"
                    accept="image/*"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                  />
                </label>
                <p className="pl-1">or drag and drop</p>
              </div>
              <p className="text-xs text-muted-foreground">PNG, JPG, WEBP up to 5MB</p>
              {file && (
                <div className="mt-2 text-xs font-semibold text-burgundy">
                  Selected: {file.name} ({(file.size / 1024).toFixed(1)} KB)
                </div>
              )}
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-burgundy text-primary-foreground font-semibold py-4 px-6 rounded-full hover:shadow-luxury transition-all duration-300 disabled:opacity-50"
        >
          {loading ? "Registering Item in ERPNext..." : "Create Product & Price in ERPNext"}
        </button>
      </form>
    </div>
  );
}
