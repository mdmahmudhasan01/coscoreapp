import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Sparkles, Crown, Gift, LogOut } from "lucide-react";
import { AnnouncementBar, SiteHeader, SiteFooter } from "@/components/site/chrome";
import { useAuth, useRewardsBalance } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { tierFor } from "@/lib/loyalty";

export const Route = createFileRoute("/account/rewards")({
  head: () => ({
    meta: [
      { title: "My Glow Rewards — Lookzene" },
      { name: "description", content: "Track your Lookzene Glow Rewards points, tier, and history." },
      { name: "robots", content: "noindex, follow" },
      { property: "og:title", content: "My Glow Rewards — Lookzene" },
      { property: "og:description", content: "Track your Lookzene Glow Rewards points and tier." },
    ],
  }),
  component: RewardsPage,
});

type Txn = {
  id: string;
  points: number;
  kind: string;
  order_id: string | null;
  created_at: string;
};

function RewardsPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { balance } = useRewardsBalance(user?.id ?? null);
  const [history, setHistory] = useState<Txn[]>([]);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("reward_transactions")
      .select("id,points,kind,order_id,created_at")
      .order("created_at", { ascending: false })
      .then(({ data }) => setHistory((data as Txn[]) ?? []));
  }, [user]);

  const { current, next } = tierFor(balance);
  const progressPct = next
    ? Math.min(100, Math.round(((balance - current.min) / (next.min - current.min)) * 100))
    : 100;
  const pointsToNext = next ? Math.max(0, next.min - balance) : 0;

  return (
    <div className="min-h-screen bg-background">
      <AnnouncementBar />
      <SiteHeader />

      <main className="container-luxe py-8 md:py-14">
        <div className="flex items-baseline justify-between gap-4 mb-8">
          <div>
            <h1 className="text-serif text-3xl md:text-5xl">My Glow Rewards</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {user?.email && <>Signed in as {user.email}</>}
            </p>
          </div>
          <button
            onClick={async () => {
              await supabase.auth.signOut();
              navigate({ to: "/" });
            }}
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-burgundy"
          >
            <LogOut className="h-3.5 w-3.5" /> Sign out
          </button>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-burgundy/20 bg-gradient-to-br from-blush/40 via-ivory to-background p-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-burgundy text-primary-foreground grid place-items-center">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-widest text-burgundy font-semibold">
                  Current tier
                </div>
                <div className="text-serif text-2xl">{current.label}</div>
              </div>
            </div>
            <div className="mt-6">
              <div className="text-[11px] uppercase tracking-widest text-muted-foreground font-semibold">
                Current points
              </div>
              <div className="text-serif text-5xl mt-1">{balance.toLocaleString()}</div>
            </div>
            {next ? (
              <div className="mt-6">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1 font-semibold text-foreground">
                    <Crown className="h-3.5 w-3.5 text-burgundy" /> Next: {next.label}
                  </span>
                  <span>
                    {balance.toLocaleString()} / {next.min.toLocaleString()} pts
                  </span>
                </div>
                <div className="mt-2 h-2 rounded-full bg-burgundy/10 overflow-hidden">
                  <div className="h-full bg-burgundy transition-all" style={{ width: `${progressPct}%` }} />
                </div>
                <p className="mt-3 text-xs text-burgundy">
                  {pointsToNext.toLocaleString()} points to unlock{" "}
                  <span className="font-semibold">{next.perk}</span>.
                </p>
              </div>
            ) : (
              <div className="mt-6 inline-flex items-center gap-1.5 text-xs text-burgundy font-semibold">
                <Gift className="h-3.5 w-3.5" /> Top tier unlocked — {current.perk}.
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-border bg-card p-6">
            <h2 className="text-serif text-2xl">Rewards history</h2>
            {history.length === 0 ? (
              <p className="mt-4 text-sm text-muted-foreground">
                No points yet. Place a completed order to start earning.
              </p>
            ) : (
              <ul className="mt-4 divide-y divide-border">
                {history.map((t) => (
                  <li key={t.id} className="py-3 flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium capitalize">
                        {t.kind === "earn" ? "Earned from order" : t.kind === "refund" ? "Refund adjustment" : t.kind}
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        {new Date(t.created_at).toLocaleDateString(undefined, {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </div>
                    </div>
                    <div
                      className={`text-sm font-bold ${
                        t.points >= 0 ? "text-burgundy" : "text-muted-foreground"
                      }`}
                    >
                      {t.points > 0 ? "+" : ""}
                      {t.points} pts
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="mt-8 text-center">
          <Link to="/" className="text-xs text-muted-foreground hover:text-burgundy">
            ← Back to shopping
          </Link>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
