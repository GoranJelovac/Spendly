"use client";

import { useState } from "react";
import { deleteExpense } from "@/actions/expense";
import { Button } from "@/components/ui/button";

type Expense = {
  id: string;
  amount: number;
  description: string | null;
  date: Date;
  budgetLine: {
    name: string;
    budget: {
      name: string;
      currency: string;
    };
  };
};

export function ExpenseList({ expenses }: { expenses: Expense[] }) {
  const [deleting, setDeleting] = useState<string | null>(null);

  async function handleDelete(id: string) {
    if (!confirm("Delete this expense?")) return;
    setDeleting(id);
    await deleteExpense(id);
    setDeleting(null);
  }

  if (expenses.length === 0) {
    return <p className="text-gray-500">No expenses yet. Add one above!</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="border-b text-gray-500">
          <tr>
            <th className="pb-2 font-medium">Date</th>
            <th className="pb-2 font-medium">Budget</th>
            <th className="pb-2 font-medium">Line</th>
            <th className="pb-2 font-medium">Description</th>
            <th className="pb-2 text-right font-medium">Amount</th>
            <th className="pb-2 text-right font-medium"></th>
          </tr>
        </thead>
        <tbody>
          {expenses.map((expense) => (
            <tr key={expense.id} className="border-b">
              <td className="py-2">
                {new Date(expense.date).toLocaleDateString()}
              </td>
              <td className="py-2">{expense.budgetLine.budget.name}</td>
              <td className="py-2">{expense.budgetLine.name}</td>
              <td className="py-2 text-gray-500">
                {expense.description || "—"}
              </td>
              <td className="py-2 text-right">
                {expense.amount.toFixed(2)}{" "}
                {expense.budgetLine.budget.currency}
              </td>
              <td className="py-2 text-right">
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleDelete(expense.id)}
                  disabled={deleting === expense.id}
                >
                  {deleting === expense.id ? "..." : "Delete"}
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
