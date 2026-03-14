import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getExpenses, getUserBudgetsWithLines } from "@/actions/expense";
import { AddExpenseForm } from "@/components/expenses/add-expense-form";
import { ExpenseList } from "@/components/expenses/expense-list";

export default async function ExpensesPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const [expenses, budgets] = await Promise.all([
    getExpenses(),
    getUserBudgetsWithLines(),
  ]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-8 text-3xl font-bold">Expenses</h1>
      <AddExpenseForm budgets={budgets} />
      <ExpenseList expenses={expenses} />
    </div>
  );
}
