"use client";

import { useState } from "react";
import { CategorySelector } from "@/components/budget-plan/category-carousel";
import { AddLineForm } from "@/components/budgets/add-line-form";

type Category = { id: string; name: string; _count: { lines: number } };
type CategoryOption = { id: string; name: string };

export function BudgetPlanClient({
  categories,
  activeCategoryId,
  budgetId,
  budgetCategories,
  fixedCategoryId,
  importExportSlot,
  children,
}: {
  categories: Category[];
  activeCategoryId: string;
  budgetId: string;
  budgetCategories: CategoryOption[];
  fixedCategoryId?: string;
  importExportSlot: React.ReactNode;
  children: React.ReactNode;
}) {
  const [addLineOpen, setAddLineOpen] = useState(false);

  return (
    <>
      <CategorySelector
        categories={categories}
        activeCategoryId={activeCategoryId}
        budgetId={budgetId}
        onAddLine={() => setAddLineOpen(true)}
        importExportSlot={importExportSlot}
      />

      <div className="rounded-b-2xl border border-t-0 border-sp-border bg-white p-4 dark:bg-sp-bg">
        <AddLineForm
          budgetId={budgetId}
          categories={budgetCategories}
          fixedCategoryId={fixedCategoryId}
          externalOpen={addLineOpen}
          onOpenChange={setAddLineOpen}
        />
        {children}
      </div>
    </>
  );
}
