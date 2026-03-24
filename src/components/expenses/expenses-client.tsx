"use client";

import { useState, type ReactNode } from "react";
import { TransactionPageClient } from "@/components/shared/transaction-page-client";
import { AddExpenseForm } from "@/components/expenses/add-expense-form";

type BudgetLine = {
  id: string;
  name: string;
  categoryId: string;
  categoryName: string;
};

export function ExpensesClient({
  lines,
  importExportSlot,
  children,
}: {
  lines: BudgetLine[];
  importExportSlot: ReactNode;
  children: ReactNode;
}) {
  const [addOpen, setAddOpen] = useState(false);

  if (lines.length === 0) {
    return (
      <p className="mb-6 text-gray-500">
        No budget lines yet. Add some on the Budget Plan page first.
      </p>
    );
  }

  return (
    <TransactionPageClient
      onAddNew={() => setAddOpen(true)}
      importExportSlot={importExportSlot}
    >
      <AddExpenseForm
        lines={lines}
        externalOpen={addOpen}
        onOpenChange={setAddOpen}
      />
      {children}
    </TransactionPageClient>
  );
}
