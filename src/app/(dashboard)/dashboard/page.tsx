import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getActiveBudget } from "@/actions/active-budget";
import { DashboardContent } from "@/components/dashboard/dashboard-content";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const activeBudget = await getActiveBudget();

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">

      {!activeBudget ? (
        <div className="rounded-xl bg-white p-8 text-center shadow-sm dark:bg-gray-900">
          <p className="text-gray-500">
            No budget selected. Create one using the selector in the sidebar.
          </p>
        </div>
      ) : (
        <DashboardContent
          budgetId={activeBudget.id}
          budgetName={activeBudget.name}
          budgetYear={activeBudget.year}
          budgetCurrency={activeBudget.currency}
        />
      )}
    </div>
  );
}
