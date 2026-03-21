import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getActiveBudget } from "@/actions/active-budget";
import { getExpensesPaginated } from "@/actions/expense";
import { getBudget } from "@/actions/budget";
import { AddExpenseForm } from "@/components/expenses/add-expense-form";
import { ExpenseList } from "@/components/expenses/expense-list";
import { ImportExportTransactions } from "@/components/shared/import-export-transactions";
import {
  downloadExpensesCsv,
  previewImportExpenses,
  applyImportExpenses,
} from "@/actions/import-export-expenses";

const PAGE_SIZE = 20;

export default async function ExpensesPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const activeBudget = await getActiveBudget();

  if (!activeBudget) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-6 font-[var(--font-jakarta)] sm:px-6">
        <h1 className="mb-4 text-2xl font-bold">Expenses</h1>
        <div className="rounded-2xl bg-white p-8 text-center shadow-md dark:bg-[#13112b]">
          <p className="text-gray-500">
            No budget selected. Create one using the selector in the sidebar.
          </p>
        </div>
      </div>
    );
  }

  const [{ items: expenses }, budget] = await Promise.all([
    getExpensesPaginated({ budgetId: activeBudget.id }, 1, 10000),
    getBudget(activeBudget.id),
  ]);

  const lines = (budget?.lines || []).map((l) => ({
    id: l.id,
    name: l.name,
    categoryId: l.categoryId,
    categoryName: l.category.name,
  }));

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 font-[var(--font-jakarta)] sm:px-6">
      <h1 className="mb-6 text-center text-2xl font-bold">Expenses</h1>
      <AddExpenseForm lines={lines} actionSlot={
        <ImportExportTransactions
          budgetId={activeBudget.id}
          label="Expenses"
          downloadCsv={downloadExpensesCsv}
          previewImport={previewImportExpenses}
          applyImport={applyImportExpenses}
        />
      } />
      <ExpenseList
        expenses={expenses}
        lines={lines}
        pageSize={PAGE_SIZE}
      />
    </div>
  );
}
