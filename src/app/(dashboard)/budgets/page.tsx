import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getActiveBudget } from "@/actions/active-budget";
import { getBudget } from "@/actions/budget";
import { getBudgetLinesPaginated } from "@/actions/budget-line";
import { BudgetLineTable } from "@/components/budgets/budget-line-table";
import { AddLineForm } from "@/components/budgets/add-line-form";
import { ImportExportLines } from "@/components/budgets/import-export-lines";
import { MonthlyBreakdown } from "@/components/budgets/monthly-breakdown";
import { getMonthlyAmounts } from "@/lib/budget-utils";

/** Number of budget lines per page (adjust between 10–20 to taste) */
const PAGE_SIZE = 15;

export default async function BudgetLinesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const activeBudget = await getActiveBudget();

  if (!activeBudget) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-6 font-[var(--font-jakarta)] sm:px-6">
        <h1 className="mb-4 text-2xl font-bold">Budget Lines</h1>
        <div className="rounded-2xl bg-white p-8 text-center shadow-md dark:bg-sp-bg">
          <p className="text-gray-500">
            No budget selected. Create one using the selector in the sidebar.
          </p>
        </div>
      </div>
    );
  }

  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page || "1", 10) || 1);

  const [budget, { items: paginatedLines, total }] = await Promise.all([
    getBudget(activeBudget.id),
    getBudgetLinesPaginated(activeBudget.id, page, PAGE_SIZE),
  ]);
  if (!budget) return null;

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // Calculate total per month across all lines (uses all lines from budget)
  const monthTotals = Array(12).fill(0);
  for (const line of budget.lines) {
    const amounts = getMonthlyAmounts(line);
    for (let i = 0; i < 12; i++) {
      monthTotals[i] += amounts[i];
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 font-[var(--font-jakarta)] sm:px-6">
      <h1 className="mb-6 text-center text-2xl font-bold">Budget Lines</h1>

      <MonthlyBreakdown monthTotals={monthTotals} currency={budget.currency} />

      <AddLineForm budgetId={budget.id} categories={budget.categories} actionSlot={<ImportExportLines budgetId={budget.id} />} />
      <BudgetLineTable
        lines={paginatedLines}
        currency={budget.currency}
        categories={budget.categories}
        currentPage={page}
        totalPages={totalPages}
        pageSize={PAGE_SIZE}
      />
    </div>
  );
}
