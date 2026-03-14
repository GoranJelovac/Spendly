import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { BillingContent } from "@/components/billing/billing-content";

export default async function BillingPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      subscriptionTier: true,
      subscriptionStatus: true,
      currentPeriodEnd: true,
    },
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-8 text-3xl font-bold">Billing</h1>
      <BillingContent
        tier={user?.subscriptionTier || "free"}
        status={user?.subscriptionStatus || null}
        periodEnd={user?.currentPeriodEnd?.toISOString() || null}
      />
    </div>
  );
}
