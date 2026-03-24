import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { BillingContent } from "@/components/billing/billing-content";

export default async function BillingPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const [user, budgetCount, lineCount] = await Promise.all([
    db.user.findUnique({
      where: { id: session.user.id },
      select: {
        subscriptionTier: true,
        subscriptionStatus: true,
        currentPeriodEnd: true,
      },
    }),
    db.budget.count({ where: { userId: session.user.id } }),
    db.budgetLine.count({
      where: { budget: { userId: session.user.id } },
    }),
  ]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 font-[var(--font-jakarta)] sm:px-6">
      <h1 className="mb-6 text-center text-2xl font-bold">Billing</h1>
      <BillingContent
        tier={user?.subscriptionTier || "free"}
        status={user?.subscriptionStatus || null}
        periodEnd={user?.currentPeriodEnd?.toISOString() || null}
        budgetCount={budgetCount}
        lineCount={lineCount}
      />
    </div>
  );
}
