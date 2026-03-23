"use client";

import { createCheckoutSession, createBillingPortalSession } from "@/actions/stripe";
import { Button } from "@/components/ui/button";
import { TIER_LIMITS, TIER_PRICES } from "@/lib/constants";

const plans = [
  {
    name: "Free",
    tier: "free" as const,
    description: "For personal use",
    features: [
      `${TIER_LIMITS.free.budgets} budget`,
      `${TIER_LIMITS.free.lines} budget lines`,
    ],
  },
  {
    name: "Pro",
    tier: "pro" as const,
    description: "For power users",
    features: [
      `${TIER_LIMITS.pro.budgets} budgets`,
      `${TIER_LIMITS.pro.lines} budget lines`,
      "CSV export",
    ],
  },
  {
    name: "Business",
    tier: "business" as const,
    description: "Unlimited everything",
    features: ["Unlimited budgets", "Unlimited lines", "CSV export", "Priority support"],
  },
];

export function BillingContent({
  tier,
  status,
  periodEnd,
}: {
  tier: string;
  status: string | null;
  periodEnd: string | null;
}) {
  return (
    <div className="space-y-6">
      {/* Current plan */}
      <div className="rounded-2xl border-2 border-gray-200 bg-white p-6 shadow-md dark:border-sp-border dark:bg-sp-bg dark:shadow-[0_0_20px_var(--sp-glow)]">
        <h2 className="text-lg font-semibold">Current Plan</h2>
        <p className="mt-1 text-2xl font-bold capitalize">{tier}</p>
        {status && (
          <p className="text-sm text-gray-500">
            Status: <span className="capitalize">{status}</span>
          </p>
        )}
        {periodEnd && (
          <p className="text-sm text-gray-500">
            Current period ends: {new Date(periodEnd).toLocaleDateString()}
          </p>
        )}
        {tier !== "free" && (
          <form action={createBillingPortalSession} className="mt-4">
            <Button variant="outline">Manage Subscription</Button>
          </form>
        )}
      </div>

      {/* Plans */}
      <div className="grid gap-4 md:grid-cols-3">
        {plans.map((plan) => (
          <div
            key={plan.tier}
            className={`rounded-2xl border-2 p-6 shadow-md ${
              tier === plan.tier
                ? "border-sp-accent dark:border-sp-accent dark:bg-sp-bg dark:shadow-[0_0_20px_var(--sp-glow)]"
                : "border-gray-200 bg-white dark:border-sp-border dark:bg-sp-bg"
            }`}
          >
            <h3 className="text-lg font-bold">{plan.name}</h3>
            <p className="text-sm text-gray-500">{plan.description}</p>
            <p className="mt-2 text-3xl font-bold">
              {TIER_PRICES[plan.tier]}&euro;
              <span className="text-sm font-normal text-gray-500">/mo</span>
            </p>
            <ul className="mt-4 space-y-2 text-sm">
              {plan.features.map((f) => (
                <li key={f}>&check; {f}</li>
              ))}
            </ul>
            {tier === plan.tier ? (
              <p className="mt-4 text-center text-sm font-medium text-gray-500">
                Current plan
              </p>
            ) : plan.tier === "free" ? null : (
              <form
                action={async () => {
                  const priceId =
                    plan.tier === "pro"
                      ? process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID
                      : process.env.NEXT_PUBLIC_STRIPE_BUSINESS_PRICE_ID;
                  if (priceId) await createCheckoutSession(priceId);
                }}
                className="mt-4"
              >
                <Button className="w-full">
                  {tier === "free" ? "Upgrade" : "Switch"} to {plan.name}
                </Button>
              </form>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
