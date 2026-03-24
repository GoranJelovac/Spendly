"use client";

import { createCheckoutSession, createBillingPortalSession } from "@/actions/stripe";
import { TIER_LIMITS, TIER_PRICES, type SubscriptionTier } from "@/lib/constants";

const allFeatures = [
  { key: "budgets", label: (t: SubscriptionTier) => TIER_LIMITS[t].budgets === Infinity ? "Unlimited budgets" : `${TIER_LIMITS[t].budgets} budget${TIER_LIMITS[t].budgets > 1 ? "s" : ""}` },
  { key: "lines", label: (t: SubscriptionTier) => TIER_LIMITS[t].lines === Infinity ? "Unlimited lines" : `${TIER_LIMITS[t].lines} budget lines` },
  { key: "csv", label: () => "CSV export", minTier: "pro" as const },
  { key: "support", label: () => "Priority support", minTier: "business" as const },
];

const tierOrder: SubscriptionTier[] = ["free", "pro", "business"];

const plans: { tier: SubscriptionTier; name: string; description: string }[] = [
  { tier: "free", name: "Free", description: "For personal use" },
  { tier: "pro", name: "Pro", description: "For power users" },
  { tier: "business", name: "Business", description: "Unlimited everything" },
];

function tierIndex(t: SubscriptionTier) {
  return tierOrder.indexOf(t);
}

function hasFeature(planTier: SubscriptionTier, minTier?: SubscriptionTier) {
  if (!minTier) return true;
  return tierIndex(planTier) >= tierIndex(minTier);
}

export function BillingContent({
  tier,
  status,
  periodEnd,
  budgetCount,
  lineCount,
}: {
  tier: string;
  status: string | null;
  periodEnd: string | null;
  budgetCount: number;
  lineCount: number;
}) {
  const currentTier = (tierOrder.includes(tier as SubscriptionTier) ? tier : "free") as SubscriptionTier;
  const currentIdx = tierIndex(currentTier);
  const limits = TIER_LIMITS[currentTier];

  const budgetUsage = limits.budgets === Infinity
    ? `${budgetCount} budgets`
    : `${budgetCount} of ${limits.budgets} budget${limits.budgets > 1 ? "s" : ""} used`;
  const lineUsage = limits.lines === Infinity
    ? `${lineCount} lines`
    : `${lineCount} of ${limits.lines} lines used`;

  // For free users, recommend Pro. For pro users, recommend Business.
  const recommendedTier: SubscriptionTier | null =
    currentTier === "free" ? "pro" : currentTier === "pro" ? "business" : null;

  return (
    <div>
      {/* Action bar */}
      <div className="flex flex-wrap items-center gap-2 rounded-t-2xl border border-sp-border bg-sp-surface px-3 py-2">
        <span className="text-sm font-bold capitalize">{currentTier} Plan</span>
        <span className="text-[11px] text-sp-muted">
          {status && currentTier !== "free" ? (
            <>· <span className="capitalize">{status}</span>{periodEnd && <> · Renews {new Date(periodEnd).toLocaleDateString()}</>}</>
          ) : (
            <>· {budgetUsage} · {lineUsage}</>
          )}
        </span>

        <div className="flex-1" />

        {currentTier !== "free" && (
          <div className="flex flex-col items-start gap-0.5">
            <span className="text-[9px] font-semibold uppercase tracking-wide text-sp-muted opacity-70">
              Subscription
            </span>
            <form action={createBillingPortalSession}>
              <button
                type="submit"
                className="flex h-7 items-center rounded-lg border border-sp-accent px-2.5 text-[12px] font-semibold text-sp-accent transition-all hover:bg-sp-accent/[0.06]"
              >
                Manage Subscription
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Panel */}
      <div className="rounded-b-2xl border border-t-0 border-sp-border bg-white p-5 dark:bg-sp-bg">
        <div className="grid gap-4 md:grid-cols-3">
          {plans.map((plan) => {
            const isActive = plan.tier === currentTier;
            const isRecommended = plan.tier === recommendedTier;
            const planIdx = tierIndex(plan.tier);

            return (
              <div
                key={plan.tier}
                className={`relative rounded-2xl border-2 p-6 transition-all ${
                  isRecommended
                    ? "border-sp-accent shadow-[0_0_0_1px_var(--sp-accent),0_4px_20px_var(--sp-glow)]"
                    : isActive
                      ? "border-sp-accent"
                      : "border-gray-200 dark:border-sp-border"
                }`}
              >
                {isRecommended && (
                  <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-sp-accent px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                    Recommended
                  </span>
                )}

                <h3 className="text-base font-bold">{plan.name}</h3>
                <p className="text-xs text-sp-muted">{plan.description}</p>

                <div className="mt-3">
                  <span className="text-3xl font-extrabold">
                    <span className="align-super text-base font-semibold">€</span>
                    {TIER_PRICES[plan.tier]}
                  </span>
                  <span className="text-sm text-sp-muted">/mo</span>
                </div>

                <ul className="mt-4 space-y-1.5">
                  {allFeatures.map((f) => {
                    const enabled = hasFeature(plan.tier, f.minTier);
                    return (
                      <li
                        key={f.key}
                        className={`flex items-center gap-1.5 text-xs ${
                          enabled ? "" : "text-sp-muted opacity-40"
                        }`}
                      >
                        <span className={`text-sm font-bold ${enabled ? "text-green-500 dark:text-green-400" : "invisible"}`}>
                          ✓
                        </span>
                        {f.label(plan.tier)}
                      </li>
                    );
                  })}
                </ul>

                <div className="mt-4">
                  {isActive ? (
                    <button
                      disabled
                      className="w-full rounded-xl border border-sp-border bg-sp-surface py-2 text-xs font-bold text-sp-muted"
                    >
                      Current plan
                    </button>
                  ) : plan.tier === "free" ? (
                    <button
                      disabled
                      className="w-full rounded-xl border border-sp-accent py-2 text-xs font-bold text-sp-accent opacity-60"
                    >
                      Downgrade
                    </button>
                  ) : (
                    <form
                      action={async () => {
                        const priceId =
                          plan.tier === "pro"
                            ? process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID
                            : process.env.NEXT_PUBLIC_STRIPE_BUSINESS_PRICE_ID;
                        if (priceId) await createCheckoutSession(priceId);
                      }}
                    >
                      <button
                        type="submit"
                        className={`w-full rounded-xl py-2 text-xs font-bold transition-all ${
                          isRecommended || planIdx > currentIdx
                            ? "bg-sp-accent text-white hover:bg-[var(--sp-accent-hover,#2563eb)]"
                            : "border border-sp-accent text-sp-accent hover:bg-sp-accent/[0.06]"
                        }`}
                      >
                        {planIdx > currentIdx ? "Upgrade" : "Switch"} to {plan.name}
                      </button>
                    </form>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
