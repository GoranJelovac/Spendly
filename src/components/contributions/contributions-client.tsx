"use client";

import { useState, type ReactNode } from "react";
import { TransactionPageClient } from "@/components/shared/transaction-page-client";
import { AddContributionForm } from "@/components/contributions/add-contribution-form";
import { ImportExportTransactions } from "@/components/shared/import-export-transactions";

type BudgetLine = {
  id: string;
  name: string;
  categoryId: string;
  categoryName: string;
};

type Props = {
  lines: BudgetLine[];
  budgetId: string;
  downloadCsv: (budgetId: string) => Promise<{ csv: string } | { error: string }>;
  previewImport: (
    budgetId: string,
    rows: { date: string; line: string; amount: number; description: string }[]
  ) => Promise<{ rows: any[] } | { error: string }>;
  applyImport: (
    budgetId: string,
    rows: { date: string; line: string; amount: number; description: string }[]
  ) => Promise<{ success: string } | { error: string }>;
  children: ReactNode;
};

export function ContributionsClient({
  lines,
  budgetId,
  downloadCsv,
  previewImport,
  applyImport,
  children,
}: Props) {
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
      importExportSlot={
        <ImportExportTransactions
          budgetId={budgetId}
          label="Contributions"
          downloadCsv={downloadCsv}
          previewImport={previewImport}
          applyImport={applyImport}
        />
      }
    >
      <div>
        <AddContributionForm
          lines={lines}
          externalOpen={addOpen}
          onOpenChange={setAddOpen}
        />
        {children}
      </div>
    </TransactionPageClient>
  );
}
