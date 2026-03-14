import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { getBudget } from "@/actions/budget";
import { BudgetLineTable } from "@/components/budgets/budget-line-table";
import { AddLineForm } from "@/components/budgets/add-line-form";
import Link from "next/link";

export default async function BudgetDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { id } = await params;
  const budget = await getBudget(id);
  if (!budget) notFound();

  const totalMonthly = budget.lines.reduce((sum, l) => sum + l.monthlyAmount, 0);
  const totalYearly = totalMonthly * 12;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <Link
        href="/budgets"
        className="mb-4 inline-block text-sm text-gray-500 hover:text-gray-900"
      >
        &larr; Back to Budgets
      </Link>

      <div className="mb-6">
        <h1 className="text-3xl font-bold">{budget.name}</h1>
        <p className="text-gray-500">
          {budget.year} &middot; {budget.currency}
        </p>
      </div>

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

      <AddLineForm budgetId={budget.id} />
      <BudgetLineTable lines={budget.lines} currency={budget.currency} />
    </div>
  );
}
