import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getBudgets } from "@/actions/budget";
import { getActiveBudget } from "@/actions/active-budget";
import { db } from "@/lib/db";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { DecimalsProvider } from "@/lib/decimals-context";
import { AccentProvider } from "@/lib/accent-context";
import type { AccentColor } from "@/lib/constants";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const [budgets, activeBudget, user] = await Promise.all([
    getBudgets(),
    getActiveBudget(),
    db.user.findUnique({
      where: { id: session.user.id },
      select: { decimals: true, accentColor: true },
    }),
  ]);

  const budgetData = budgets.map((b) => ({
    id: b.id,
    name: b.name,
    year: b.year,
    currency: b.currency,
  }));

  return (
    <AccentProvider initial={(user?.accentColor as AccentColor) ?? "blue"}>
      <DecimalsProvider initial={user?.decimals ?? 0}>
        <div className="flex min-h-screen bg-gray-50/50 dark:bg-[#0c0a1d]">
          <Sidebar budgets={budgetData} activeBudgetId={activeBudget?.id || null} />
          <div className="flex-1">
            <MobileNav budgets={budgetData} activeBudgetId={activeBudget?.id || null} />
            <main>{children}</main>
          </div>
        </div>
      </DecimalsProvider>
    </AccentProvider>
  );
}
