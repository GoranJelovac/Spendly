"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteBudgetLine, deleteBudgetLines, updateBudgetLine } from "@/actions/budget-line";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/shared/pagination";
import { getMonthlyAmounts, getYearlyTotal } from "@/lib/budget-utils";

const MONTH_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

type CategoryOption = { id: string; name: string };

type BudgetLine = {
  id: string;
  name: string;
  code: string | null;
  categoryId: string;
  category: { id: string; name: string };
  monthlyAmount: number;
  monthlyAmounts: unknown;
  sortOrder: number;
};

export function BudgetLineTable({
  lines,
  currency,
  categories,
  currentPage,
  totalPages,
  pageSize,
}: {
  lines: BudgetLine[];
  currency: string;
  categories: CategoryOption[];
  currentPage: number;
  totalPages: number;
  pageSize: number;
}) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editMode, setEditMode] = useState<"fixed" | "custom">("fixed");
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const allSelected = lines.length > 0 && selected.size === lines.length;

  function goToPage(page: number) {
    router.push(`/budgets?page=${page}`);
  }

  function toggleAll() {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(lines.map((l) => l.id)));
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

  function startEdit(line: BudgetLine) {
    setEditingId(line.id);
    setEditMode(line.monthlyAmounts ? "custom" : "fixed");
    setError("");
  }

  async function handleUpdate(id: string, formData: FormData) {
    setError("");
    const result = await updateBudgetLine(id, formData);
    if (result?.error) {
      setError(result.error);
    } else {
      setEditingId(null);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this line and all its expenses?")) return;
    await deleteBudgetLine(id);
  }

  async function handleBulkDelete() {
    if (selected.size === 0) return;
    if (!confirm(`Delete ${selected.size} line(s) and all their expenses?`)) return;
    setBulkDeleting(true);
    await deleteBudgetLines(Array.from(selected));
    setSelected(new Set());
    setBulkDeleting(false);
  }

  if (lines.length === 0) {
    return <p className="text-gray-500">No budget lines yet. Add one above!</p>;
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
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b text-gray-500">
            <tr>
              <th className="pb-2 w-12 font-medium">#</th>
              <th className="pb-2 font-medium">Name</th>
              <th className="pb-2 font-medium">Code</th>
              <th className="pb-2 font-medium">Category</th>
              <th className="pb-2 font-medium">Type</th>
              <th className="pb-2 text-right font-medium">Monthly ({currency})</th>
              <th className="pb-2 text-right font-medium">Yearly ({currency})</th>
              <th className="pb-2 text-right font-medium">Actions</th>
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
            {lines.map((line, index) => {
              const amounts = getMonthlyAmounts(line);
              const yearly = getYearlyTotal(amounts);
              const isCustom = !!line.monthlyAmounts;
              const displayMonthly = isCustom
                ? `${Math.min(...amounts)}–${Math.max(...amounts)}`
                : line.monthlyAmount.toFixed(2);
              const rowNumber = (currentPage - 1) * pageSize + index + 1;

              return editingId === line.id ? (
                <tr key={line.id} className="border-b">
                  <td colSpan={9} className="py-3">
                    <form
                      action={(fd) => handleUpdate(line.id, fd)}
                      className="space-y-3"
                    >
                      <input type="hidden" name="amountMode" value={editMode} />
                      <div className="flex flex-wrap items-end gap-2">
                        <div>
                          <label className="block text-xs text-gray-500">Name</label>
                          <input
                            name="name"
                            defaultValue={line.name}
                            required
                            className="w-40 rounded-md border px-2 py-1 text-sm dark:bg-gray-800 dark:border-gray-700"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500">Code</label>
                          <input
                            name="code"
                            defaultValue={line.code || ""}
                            className="w-20 rounded-md border px-2 py-1 text-sm dark:bg-gray-800 dark:border-gray-700"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500">Category</label>
                          <select
                            name="categoryId"
                            defaultValue={line.categoryId}
                            className="w-32 rounded-md border px-2 py-1 text-sm dark:bg-gray-800 dark:border-gray-700"
                          >
                            {categories.map((cat) => (
                              <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
                          </select>
                        </div>
                        <div className="flex rounded-md border">
                          <button
                            type="button"
                            onClick={() => setEditMode("fixed")}
                            className={`px-2 py-1 text-xs ${
                              editMode === "fixed"
                                ? "bg-black text-white dark:bg-white dark:text-black"
                                : ""
                            }`}
                          >
                            Fixed
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditMode("custom")}
                            className={`px-2 py-1 text-xs ${
                              editMode === "custom"
                                ? "bg-black text-white dark:bg-white dark:text-black"
                                : ""
                            }`}
                          >
                            Custom
                          </button>
                        </div>
                      </div>

                      {editMode === "fixed" ? (
                        <div className="w-32">
                          <label className="block text-xs text-gray-500">Monthly</label>
                          <input
                            name="monthlyAmount"
                            type="number"
                            step="0.01"
                            defaultValue={line.monthlyAmount}
                            required
                            className="w-full rounded-md border px-2 py-1 text-sm dark:bg-gray-800 dark:border-gray-700"
                          />
                        </div>
                      ) : (
                        <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-6">
                          {MONTH_SHORT.map((m, i) => (
                            <div key={i}>
                              <label className="block text-xs text-gray-500">{m}</label>
                              <input
                                name={`month_${i}`}
                                type="number"
                                step="0.01"
                                defaultValue={amounts[i]}
                                className="w-full rounded-md border px-2 py-1 text-sm dark:bg-gray-800 dark:border-gray-700"
                              />
                            </div>
                          ))}
                        </div>
                      )}

                      {error && <p className="text-sm text-red-500">{error}</p>}
                      <div className="flex gap-1">
                        <Button size="sm" type="submit">Save</Button>
                        <Button size="sm" variant="outline" type="button" onClick={() => setEditingId(null)}>
                          Cancel
                        </Button>
                      </div>
                    </form>
                  </td>
                </tr>
              ) : (
                <tr key={line.id} className="border-b">
                  <td className="py-2 text-gray-400">{rowNumber}</td>
                  <td className="py-2">{line.name}</td>
                  <td className="py-2 text-gray-500">{line.code || "—"}</td>
                  <td className="py-2 text-gray-500 text-xs">{line.category.name}</td>
                  <td className="py-2 text-gray-500 text-xs">{isCustom ? "Custom" : "Fixed"}</td>
                  <td className="py-2 text-right">{displayMonthly}</td>
                  <td className="py-2 text-right">{yearly.toFixed(2)}</td>
                  <td className="py-2 text-right">
                    <div className="flex justify-end gap-1">
                      <Button size="sm" variant="outline" onClick={() => startEdit(line)}>
                        Edit
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleDelete(line.id)}>
                        Delete
                      </Button>
                    </div>
                  </td>
                  <td className="py-2 text-right">
                    <input
                      type="checkbox"
                      checked={selected.has(line.id)}
                      onChange={() => toggleOne(line.id)}
                      className="rounded border-gray-300 dark:border-gray-600"
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={goToPage} />
    </div>
  );
}
