import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getActiveBudget } from "@/actions/active-budget";
import { getBudget } from "@/actions/budget";
import { getBudgetLinesPaginated, getBudgetLinesByCategoryPaginated } from "@/actions/budget-line";
import { getCategories } from "@/actions/category";
import { BudgetLineTable } from "@/components/budgets/budget-line-table";
import { AddLineForm } from "@/components/budgets/add-line-form";
import { ImportExportLines } from "@/components/budgets/import-export-lines";
import { MonthlyBreakdown } from "@/components/budgets/monthly-breakdown";
import { CategorySelector } from "@/components/budget-plan/category-carousel";
import { getMonthlyAmounts } from "@/lib/budget-utils";

/** Number of budget lines per page */
const PAGE_SIZE = 15;

export default async function BudgetPlanPage({
  searchParams,
}: {
  searchParams: Promise<{ cat?: string; page?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const activeBudget = await getActiveBudget();

  if (!activeBudget) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-6 font-[var(--font-jakarta)] sm:px-6">
        <h1 className="mb-4 text-2xl font-bold">Budget Plan</h1>
        <div className="rounded-2xl bg-white p-8 text-center shadow-md dark:bg-sp-bg">
          <p className="text-gray-500">
            No budget selected. Create one using the selector in the sidebar.
          </p>
        </div>
      </div>
    );
  }

  const params = await searchParams;
  const catParam = params.cat || null;
  const page = Math.max(1, parseInt(params.page || "1", 10) || 1);

  const [budget, categories] = await Promise.all([
    getBudget(activeBudget.id),
    getCategories(activeBudget.id),
  ]);
  if (!budget) return null;

  // Fetch lines: all or filtered by category
  const { items: paginatedLines, total } = catParam
    ? await getBudgetLinesByCategoryPaginated(activeBudget.id, catParam, page, PAGE_SIZE)
    : await getBudgetLinesPaginated(activeBudget.id, page, PAGE_SIZE);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const totalLineCount = budget.lines.length;
  const isAllView = !catParam;

  // Monthly totals across ALL lines (for MonthlyBreakdown)
  const monthTotals = Array(12).fill(0);
  for (const line of budget.lines) {
    const amounts = getMonthlyAmounts(line);
    for (let i = 0; i < 12; i++) {
      monthTotals[i] += amounts[i];
    }
  }

  // Category monthly/yearly totals (for the active category total bar)
  let catMonthly = 0;
  let catYearly = 0;
  if (catParam) {
    const catLines = budget.lines.filter((l: { categoryId: string }) => l.categoryId === catParam);
    for (const line of catLines) {
      const amounts = getMonthlyAmounts(line);
      catYearly += amounts.reduce((s: number, v: number) => s + v, 0);
    }
    catMonthly = catYearly / 12;
  }

  // Find active category name
  const activeCatName = catParam
    ? categories.find((c) => c.id === catParam)?.name || "Unknown"
    : "All";

  const activeCatLineCount = catParam
    ? budget.lines.filter((l: { categoryId: string }) => l.categoryId === catParam).length
    : totalLineCount;

  const fmt = new Intl.NumberFormat(undefined, { style: "currency", currency: budget.currency });

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 font-[var(--font-jakarta)] sm:px-6">
      <h1 className="mb-6 text-center text-2xl font-bold">Budget Plan</h1>

      <MonthlyBreakdown monthTotals={monthTotals} currency={budget.currency} />

      {/* Action bar: Import/Export */}
      <div className="mb-4">
        <ImportExportLines budgetId={budget.id} />
      </div>

      {/* Category dropdown bar (connected to panel) */}
      <CategorySelector
        categories={categories}
        activeCategoryId={catParam}
        budgetId={budget.id}
        totalLineCount={totalLineCount}
      />

      {/* Lines panel (connected to dropdown bar above) */}
      <div className="rounded-b-2xl border border-t-0 border-sp-border bg-white p-4 dark:bg-sp-bg">
        <AddLineForm
          budgetId={budget.id}
          categories={budget.categories}
          fixedCategoryId={catParam || undefined}
        />
        <BudgetLineTable
          lines={paginatedLines}
          currency={budget.currency}
          categories={budget.categories}
          currentPage={page}
          totalPages={totalPages}
          pageSize={PAGE_SIZE}
          hideCategory={!isAllView}
        />

        {/* Category total bar (only when viewing a specific category) */}
        {catParam && (
          <div className="mt-2 flex justify-between rounded-[10px] bg-sp-accent/[0.08] px-3 py-2.5 text-[13px] font-semibold text-sp-accent">
            <span>{activeCatName} Total ({activeCatLineCount} lines)</span>
            <span>
              {fmt.format(catMonthly)} / mo · {fmt.format(catYearly)} / yr
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
