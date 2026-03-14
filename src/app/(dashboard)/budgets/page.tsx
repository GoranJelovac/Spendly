import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getBudgets } from "@/actions/budget";
import { BudgetList } from "@/components/budgets/budget-list";
import { CreateBudgetForm } from "@/components/budgets/create-budget-form";

export default async function BudgetsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const budgets = await getBudgets();

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Budgets</h1>
      </div>
      <CreateBudgetForm />
      <BudgetList budgets={budgets} />
    </div>
  );
}
