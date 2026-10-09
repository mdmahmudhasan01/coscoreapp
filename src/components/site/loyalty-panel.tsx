import { Sparkles, Gift, Crown, UserPlus } from "lucide-react";
import { pointsForOrder, tierFor } from "@/lib/loyalty";
import { useAuth, useRewardsBalance } from "@/hooks/use-auth";

/**
 * Glow Rewards panel.
 *
 * Behaviour follows the loyalty spec:
 *  - Guests: no points earned, shown a "create account" CTA.
 *  - Signed-in customers: points-earned preview + tier progress based on
 *    their POINTS BALANCE (never money spent).
 *  - The underlying earning rate is never surfaced in this panel.
 */
export function LoyaltyPanel({
  subtotal,
  variant = "card",
}: {
  subtotal: number;
  variant?: "card" | "inline";
}) {
  const { user } = useAuth();
  const { balance } = useRewardsBalance(user?.id ?? null);

  const earning = pointsForOrder(subtotal);
  const projected = balance + (user ? earning : 0);
  const { current, next } = tierFor(projected);

  const progressPct = next
    ? Math.min(100, Math.round(((projected - current.min) / (next.min - current.min)) * 100))
    : 100;
  const pointsToNext = next ? Math.max(0, next.min - projected) : 0;

  const wrapClass =
    variant === "card"
      ? "rounded-2xl border border-burgundy/20 bg-gradient-to-br from-blush/40 via-ivory to-background p-5"
      : "rounded-xl border border-burgundy/15 bg-blush/25 p-4";

  /* ---------- GUEST STATE ---------- */
  if (!user) {
    return (
      <div className={wrapClass}>
        <div className="flex items-start gap-3">
          <div className="h-9 w-9 rounded-full bg-burgundy text-primary-foreground grid place-items-center shrink-0 shadow-sm">
            <Sparkles className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-serif text-base md:text-lg leading-tight">Glow Rewards</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Create an account to earn Glow Rewards points on eligible purchases.
            </p>
            <div className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-semibold text-burgundy">
              <UserPlus className="h-3.5 w-3.5" />
              Tick "Create a Lookzene account" at checkout to start earning.
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ---------- SIGNED-IN STATE ---------- */
  return (
    <div className={wrapClass}>
      <div className="flex items-start gap-3">
        <div className="h-9 w-9 rounded-full bg-burgundy text-primary-foreground grid place-items-center shrink-0 shadow-sm">
          <Sparkles className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <h3 className="text-serif text-base md:text-lg leading-tight">Glow Rewards</h3>
            <span className="text-[10px] uppercase tracking-widest text-burgundy font-semibold">
              {current.label} tier
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {earning > 0 ? (
              <>
                You'll earn{" "}
                <span className="text-burgundy font-semibold">
                  +{earning.toLocaleString()} Points
                </span>{" "}
                on this order.
              </>
            ) : (
              <>Add eligible items to earn points on this order.</>
            )}
          </p>
          <div className="mt-2 text-[11px] text-muted-foreground">
            Current balance:{" "}
            <span className="font-semibold text-foreground">
              {balance.toLocaleString()} pts
            </span>
          </div>
        </div>
      </div>

      {next ? (
        <div className="mt-4">
          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
            <span className="inline-flex items-center gap-1 font-semibold text-foreground">
              <Crown className="h-3 w-3 text-burgundy" /> Next: {next.label}
            </span>
            <span>
              {projected.toLocaleString()} / {next.min.toLocaleString()} pts
            </span>
          </div>
          <div className="mt-2 h-1.5 rounded-full bg-burgundy/10 overflow-hidden">
            <div
              className="h-full bg-burgundy transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          {pointsToNext > 0 && (
            <p className="mt-2 text-[11px] text-burgundy">
              {pointsToNext.toLocaleString()} points to unlock{" "}
              <span className="font-semibold">{next.perk}</span>.
            </p>
          )}
        </div>
      ) : (
        <div className="mt-4 inline-flex items-center gap-1.5 text-[11px] text-burgundy font-semibold">
          <Gift className="h-3 w-3" /> Top tier unlocked — {current.perk}.
        </div>
      )}
    </div>
  );
}
