/**
 * Glow Rewards centralised earning rules.
 * Points are awarded server-side by a Postgres trigger; the client only
 * previews what a logged-in customer WOULD earn for the current order.
 */
export const POINTS_PER_TAKA = 1 / 150; // ৳150 spent = 1 point
export const TAKA_PER_POINT = 150;

export type LoyaltyTier = {
  key: "glow" | "rose" | "burgundy" | "noir";
  label: string;
  min: number; // points threshold (lifetime earned balance)
  perk: string;
};

export const TIERS: LoyaltyTier[] = [
  { key: "glow", label: "Glow", min: 0, perk: "Free birthday gift" },
  { key: "rose", label: "Rose", min: 500, perk: "Early access to drops" },
  { key: "burgundy", label: "Burgundy", min: 1500, perk: "Free express delivery" },
  { key: "noir", label: "Noir", min: 3000, perk: "Private beauty concierge" },
];

/** Points a customer will earn for a given eligible order amount (in ৳). */
export function pointsForOrder(eligibleAmount: number): number {
  if (!Number.isFinite(eligibleAmount) || eligibleAmount <= 0) return 0;
  return Math.floor(eligibleAmount / TAKA_PER_POINT);
}

/** Current + next tier for a given points balance. */
export function tierFor(points: number) {
  let current: LoyaltyTier = TIERS[0];
  for (const t of TIERS) if (points >= t.min) current = t;
  const idx = TIERS.findIndex((t) => t.key === current.key);
  const next: LoyaltyTier | undefined = TIERS[idx + 1];
  return { current, next };
}
