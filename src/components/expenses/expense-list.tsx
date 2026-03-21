"use client";

import { useState, useMemo, useEffect } from "react";
import { deleteExpense, deleteExpenses, updateExpense } from "@/actions/expense";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/shared/pagination";
import { ColumnFilter } from "@/components/shared/column-filter";
import { fmt } from "@/lib/format";

type BudgetLine = {
  id: string;
  name: string;
  categoryId: string;
  categoryName: string;
};

type Expense = {
  id: string;
  amount: number;
  description: string | null;
  date: Date;
  budgetLineId: string;
  budgetLine: {
    name: string;
    budget: {
      name: string;
      currency: string;
    };
  };
};

export function ExpenseList({
  expenses,
  lines,
  pageSize,
}: {
  expenses: Expense[];
  lines: BudgetLine[];
  pageSize: number;
}) {
  const [deleting, setDeleting] = useState<string | null>(null);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editError, setEditError] = useState("");
  const [saving, setSaving] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [columnFilters, setColumnFilters] = useState<Record<string, Set<string>>>({});
  const [clientPage, setClientPage] = useState(1);

  const categories = Array.from(
    new Map(lines.map((l) => [l.categoryId, l.categoryName])).entries()
  ).map(([id, name]) => ({ id, name }));

  const filteredLines = selectedCategory
    ? lines.filter((l) => l.categoryId === selectedCategory)
    : [];

  type ColKey = "date" | "line" | "description" | "amount";
  const columnValues = useMemo(() => {
    const cols: Record<ColKey, string[]> = { date: [], line: [], description: [], amount: [] };
    const sets: Record<ColKey, Set<string>> = { date: new Set(), line: new Set(), description: new Set(), amount: new Set() };
    for (const e of expenses) {
      const vals: Record<ColKey, string> = {
        date: new Date(e.date).toLocaleDateString(),
        line: e.budgetLine.name,
        description: e.description || "—",
        amount: fmt(e.amount) + " " + e.budgetLine.budget.currency,
      };
      for (const key of Object.keys(vals) as ColKey[]) {
        if (!sets[key].has(vals[key])) { sets[key].add(vals[key]); cols[key].push(vals[key]); }
      }
    }
    return cols;
  }, [expenses]);

  function getSelectedForCol(col: ColKey): Set<string> {
    return columnFilters[col] || new Set(columnValues[col]);
  }

  const filteredExpenses = useMemo(() => {
    if (Object.keys(columnFilters).length === 0) return expenses;
    return expenses.filter((e) => {
      const vals: Record<ColKey, string> = {
        date: new Date(e.date).toLocaleDateString(),
        line: e.budgetLine.name,
        description: e.description || "—",
        amount: fmt(e.amount) + " " + e.budgetLine.budget.currency,
      };
      for (const [col, sel] of Object.entries(columnFilters)) {
        if (sel.size < columnValues[col as ColKey].length && !sel.has(vals[col as ColKey])) return false;
      }
      return true;
    });
  }, [expenses, columnFilters, columnValues]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setClientPage(1);
  }, [columnFilters]);

  // Client-side pagination
  const totalPages = Math.max(1, Math.ceil(filteredExpenses.length / pageSize));
  const currentPage = Math.min(clientPage, totalPages);
  const displayedExpenses = filteredExpenses.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const allSelected = displayedExpenses.length > 0 && selected.size === displayedExpenses.length;

  function goToPage(page: number) {
    setClientPage(page);
  }

  function toggleAll() {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(displayedExpenses.map((e) => e.id)));
    }
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function startEdit(e: Expense) {
    const line = lines.find((l) => l.id === e.budgetLineId);
    setSelectedCategory(line?.categoryId || "");
    setEditingId(e.id);
    setEditError("");
  }

  async function handleSave(id: string, formData: FormData) {
    setEditError("");
    setSaving(true);
    const result = await updateExpense(id, formData);
    if (result?.error) {
      setEditError(result.error);
    } else {
      setEditingId(null);
    }
    setSaving(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this expense?")) return;
    setDeleting(id);
    await deleteExpense(id);
    setDeleting(null);
  }

  async function handleBulkDelete() {
    if (selected.size === 0) return;
    if (!confirm(`Delete ${selected.size} expense(s)?`)) return;
    setBulkDeleting(true);
    await deleteExpenses(Array.from(selected));
    setSelected(new Set());
    setBulkDeleting(false);
  }

  if (expenses.length === 0) {
    return <p className="text-gray-500">No expenses yet. Add one above!</p>;
  }

  return (
    <div>
      {selected.size > 0 && (
        <div className="mb-3 flex items-center justify-end gap-3">
          <button
            onClick={() => setSelected(new Set())}
            className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          >
            Clear selection
          </button>
          <Button
            size="sm"
            variant="destructive"
            onClick={handleBulkDelete}
            disabled={bulkDeleting}
          >
            {bulkDeleting ? "Deleting..." : `Delete ${selected.size} selected`}
          </Button>
        </div>
      )}
      <div className="min-h-[20rem] overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b text-gray-500">
            <tr>
              <th className="pb-2 w-12 font-medium">#</th>
              <th className="pb-2 font-medium">
                Date
                <ColumnFilter values={columnValues.date} selected={getSelectedForCol("date")} onChange={(s) => setColumnFilters((p) => ({ ...p, date: s }))} />
              </th>
              <th className="pb-2 font-medium">
                Line
                <ColumnFilter values={columnValues.line} selected={getSelectedForCol("line")} onChange={(s) => setColumnFilters((p) => ({ ...p, line: s }))} />
              </th>
              <th className="pb-2 font-medium">
                Description
                <ColumnFilter values={columnValues.description} selected={getSelectedForCol("description")} onChange={(s) => setColumnFilters((p) => ({ ...p, description: s }))} />
              </th>
              <th className="pb-2 text-right font-medium">
                Amount
                <ColumnFilter values={columnValues.amount} selected={getSelectedForCol("amount")} onChange={(s) => setColumnFilters((p) => ({ ...p, amount: s }))} />
              </th>
              <th className="pb-2 text-right font-medium"></th>
              <th className="pb-2 w-8 text-right">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                  className="rounded border-gray-300 dark:border-gray-600"
                />
              </th>
            </tr>
          </thead>
          <tbody>
            {displayedExpenses.map((expense, index) =>
              editingId === expense.id ? (
                <tr key={expense.id} className="border-b bg-gray-50 dark:bg-[#1a1835]/50">
                  <td colSpan={7} className="py-3 px-1">
                    <form
                      action={(formData) => handleSave(expense.id, formData)}
                      className="space-y-3"
                    >
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                        <div>
                          <label className="block text-xs font-medium text-gray-500">Category</label>
                          <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="mt-1 w-full rounded-md border px-2 py-1.5 text-sm dark:bg-[#1a1835] dark:border-[#252345]"
                          >
                            <option value="">Select...</option>
                            {categories.map((cat) => (
                              <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-500">Budget Line</label>
                          <select
                            name="budgetLineId"
                            defaultValue={expense.budgetLineId}
                            className="mt-1 w-full rounded-md border px-2 py-1.5 text-sm dark:bg-[#1a1835] dark:border-[#252345]"
                            required
                            disabled={!selectedCategory}
                          >
                            <option value="">{selectedCategory ? "Select line..." : "Select category first"}</option>
                            {filteredLines.map((l) => (
                              <option key={l.id} value={l.id}>{l.name}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-500">Date</label>
                          <input
                            name="date"
                            type="date"
                            required
                            defaultValue={new Date(expense.date).toISOString().split("T")[0]}
                            className="mt-1 w-full rounded-md border px-2 py-1.5 text-sm dark:bg-[#1a1835] dark:border-[#252345]"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-500">Amount</label>
                          <input
                            name="amount"
                            type="number"
                            step="0.01"
                            required
                            defaultValue={expense.amount}
                            className="mt-1 w-full rounded-md border px-2 py-1.5 text-sm dark:bg-[#1a1835] dark:border-[#252345]"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500">Description</label>
                        <input
                          name="description"
                          defaultValue={expense.description || ""}
                          placeholder="Optional"
                          className="mt-1 w-full rounded-md border px-2 py-1.5 text-sm dark:bg-[#1a1835] dark:border-[#252345]"
                        />
                      </div>
                      {editError && <p className="text-sm text-red-500">{editError}</p>}
                      <div className="flex gap-2">
                        <Button type="submit" size="sm" disabled={saving}>
                          {saving ? "Saving..." : "Save"}
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingId(null)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </form>
                  </td>
                </tr>
              ) : (
                <tr key={expense.id} className="border-b">
                  <td className="py-2 text-gray-400">
                    {(currentPage - 1) * pageSize + index + 1}
                  </td>
                  <td className="py-2">
                    {new Date(expense.date).toLocaleDateString()}
                  </td>
                  <td className="py-2">{expense.budgetLine.name}</td>
                  <td className="py-2 text-gray-500">
                    {expense.description || "—"}
                  </td>
                  <td className="py-2 text-right">
                    {fmt(expense.amount)}{" "}
                    {expense.budgetLine.budget.currency}
                  </td>
                  <td className="py-2 text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => startEdit(expense)}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(expense.id)}
                        disabled={deleting === expense.id}
                      >
                        {deleting === expense.id ? "..." : "Delete"}
                      </Button>
                    </div>
                  </td>
                  <td className="py-2 text-right">
                    <input
                      type="checkbox"
                      checked={selected.has(expense.id)}
                      onChange={() => toggleOne(expense.id)}
                      className="rounded border-gray-300 dark:border-gray-600"
                    />
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>
      </div>

      <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={goToPage} />
    </div>
  );
}
