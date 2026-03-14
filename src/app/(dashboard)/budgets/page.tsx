import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getActiveBudget } from "@/actions/active-budget";
import { getBudget } from "@/actions/budget";
import { BudgetLineTable } from "@/components/budgets/budget-line-table";
import { AddLineForm } from "@/components/budgets/add-line-form";
import { ImportExportLines } from "@/components/budgets/import-export-lines";
import { getMonthlyAmounts, getYearlyTotal } from "@/lib/budget-utils";

export default async function BudgetLinesPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const activeBudget = await getActiveBudget();

  if (!activeBudget) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="mb-4 text-3xl font-bold">Budget Lines</h1>
        <p className="text-gray-500">
          No budget selected. Create one using the selector in the sidebar.
        </p>
      </div>
    );
  }

  const budget = await getBudget(activeBudget.id);
  if (!budget) return null;

  const totalYearly = budget.lines.reduce(
    (sum, l) => sum + getYearlyTotal(getMonthlyAmounts(l)),
    0
  );
  const totalMonthly = totalYearly / 12;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-2 text-3xl font-bold">Budget Lines</h1>
      <p className="mb-6 text-gray-500">
        {budget.name} &middot; {budget.year} &middot; {budget.currency}
      </p>

      <div className="mb-6 grid grid-cols-2 gap-4">
        <div className="rounded-lg border bg-white p-4 dark:bg-gray-900">
          <p className="text-sm text-gray-500">Monthly Budget</p>
          <p className="text-2xl font-bold">
            {totalMonthly.toFixed(2)} {budget.currency}
          </p>
        </div>
        <div className="rounded-lg border bg-white p-4 dark:bg-gray-900">
          <p className="text-sm text-gray-500">Yearly Budget</p>
          <p className="text-2xl font-bold">
            {totalYearly.toFixed(2)} {budget.currency}
          </p>
        </div>
      </div>

      <AddLineForm budgetId={budget.id} categories={budget.categories} />
      <ImportExportLines budgetId={budget.id} />
      <BudgetLineTable lines={budget.lines} currency={budget.currency} categories={budget.categories} />
    </div>
  );
}
