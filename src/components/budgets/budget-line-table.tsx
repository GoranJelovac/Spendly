"use client";

import { useState, useMemo, Fragment } from "react";
import { useRouter } from "next/navigation";
import { deleteBudgetLine, deleteBudgetLines, updateBudgetLine } from "@/actions/budget-line";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/shared/pagination";
import { ColumnFilter } from "@/components/shared/column-filter";
import { getMonthlyAmounts, getYearlyTotal } from "@/lib/budget-utils";
import { useDecimals } from "@/lib/decimals-context";

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
  const { fmtD } = useDecimals();
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editMode, setEditMode] = useState<"fixed" | "custom">("fixed");
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [columnFilters, setColumnFilters] = useState<Record<string, Set<string>>>({});
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());

  type ColKey = "name" | "code" | "type";
  const columnValues = useMemo(() => {
    const cols: Record<ColKey, string[]> = { name: [], code: [], type: [] };
    const sets: Record<ColKey, Set<string>> = { name: new Set(), code: new Set(), type: new Set() };
    for (const line of lines) {
      const vals: Record<ColKey, string> = {
        name: line.name,
        code: line.code || "—",
        type: line.monthlyAmounts ? "Custom" : "Fixed",
      };
      for (const key of Object.keys(vals) as ColKey[]) {
        if (!sets[key].has(vals[key])) { sets[key].add(vals[key]); cols[key].push(vals[key]); }
      }
    }
    return cols;
  }, [lines]);

  function getSelectedForCol(col: ColKey): Set<string> {
    return columnFilters[col] || new Set(columnValues[col]);
  }

  const filteredLines = useMemo(() => {
    if (Object.keys(columnFilters).length === 0) return lines;
    return lines.filter((line) => {
      const vals: Record<ColKey, string> = {
        name: line.name,
        code: line.code || "—",
        type: line.monthlyAmounts ? "Custom" : "Fixed",
      };
      for (const [col, selected] of Object.entries(columnFilters)) {
        if (selected.size < columnValues[col as ColKey].length && !selected.has(vals[col as ColKey])) return false;
      }
      return true;
    });
  }, [lines, columnFilters, columnValues]);

  // Group filtered lines by category
  const groupedLines = useMemo(() => {
    const groups: { categoryId: string; categoryName: string; lines: typeof filteredLines }[] = [];
    const map = new Map<string, typeof filteredLines>();
    const order: string[] = [];
    for (const line of filteredLines) {
      const key = line.categoryId;
      if (!map.has(key)) {
        map.set(key, []);
        order.push(key);
      }
      map.get(key)!.push(line);
    }
    for (const catId of order) {
      const catLines = map.get(catId)!;
      groups.push({
        categoryId: catId,
        categoryName: catLines[0].category.name,
        lines: catLines,
      });
    }
    return groups;
  }, [filteredLines]);

  const allSelected = filteredLines.length > 0 && selected.size === filteredLines.length;

  function toggleCategory(categoryId: string) {
    setCollapsedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) next.delete(categoryId);
      else next.add(categoryId);
      return next;
    });
  }

  function expandAll() {
    setCollapsedCategories(new Set());
  }

  function collapseAll() {
    setCollapsedCategories(new Set(groupedLines.map((g) => g.categoryId)));
  }

  function goToPage(page: number) {
    router.push(`/budgets?page=${page}`);
  }

  function toggleAll() {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filteredLines.map((l) => l.id)));
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

  let globalRowIndex = 0;

  return (
    <div>
      {/* Expand/Collapse All + Bulk actions */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex gap-2">
          <button
            onClick={expandAll}
            className="rounded-md border border-gray-300 px-2.5 py-1 text-xs text-gray-500 hover:text-gray-700 dark:border-gray-600 dark:hover:text-gray-300"
          >
            Expand All
          </button>
          <button
            onClick={collapseAll}
            className="rounded-md border border-gray-300 px-2.5 py-1 text-xs text-gray-500 hover:text-gray-700 dark:border-gray-600 dark:hover:text-gray-300"
          >
            Collapse All
          </button>
        </div>
        {selected.size > 0 && (
          <div className="flex items-center gap-3">
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
      </div>

      <div className="min-h-[20rem] overflow-x-auto rounded-2xl border-2 border-gray-200 bg-white shadow-md dark:border-sp-border dark:bg-sp-bg dark:shadow-[0_0_20px_var(--sp-glow)]">
        <table className="w-full text-left text-[14px]">
          <thead>
            <tr className="bg-sp-accent/8">
              <th className="pb-2.5 pl-3 pt-2.5 w-12 text-[10px] font-bold uppercase tracking-[0.08em] text-gray-500 dark:text-sp-muted">#</th>
              <th className="pb-2.5 pt-2.5 text-[10px] font-bold uppercase tracking-[0.08em] text-gray-500 dark:text-sp-muted">
                Name
                <ColumnFilter values={columnValues.name} selected={getSelectedForCol("name")} onChange={(s) => setColumnFilters((p) => ({ ...p, name: s }))} />
              </th>
              <th className="pb-2.5 pt-2.5 text-[10px] font-bold uppercase tracking-[0.08em] text-gray-500 dark:text-sp-muted">
                Code
                <ColumnFilter values={columnValues.code} selected={getSelectedForCol("code")} onChange={(s) => setColumnFilters((p) => ({ ...p, code: s }))} />
              </th>
              <th className="pb-2.5 pt-2.5 text-[10px] font-bold uppercase tracking-[0.08em] text-gray-500 dark:text-sp-muted">
                Type
                <ColumnFilter values={columnValues.type} selected={getSelectedForCol("type")} onChange={(s) => setColumnFilters((p) => ({ ...p, type: s }))} />
              </th>
              <th className="pb-2.5 pt-2.5 text-right text-[10px] font-bold uppercase tracking-[0.08em] text-gray-500 dark:text-sp-muted">Monthly ({currency})</th>
              <th className="pb-2.5 pt-2.5 text-right text-[10px] font-bold uppercase tracking-[0.08em] text-gray-500 dark:text-sp-muted">Yearly ({currency})</th>
              <th className="pb-2.5 pt-2.5 text-right text-[10px] font-bold uppercase tracking-[0.08em] text-gray-500 dark:text-sp-muted">Actions</th>
              <th className="pb-2.5 pr-4 pt-2.5 w-8 text-right">
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
            {groupedLines.map((group) => {
              const isCollapsed = collapsedCategories.has(group.categoryId);
              const groupMonthlyTotal = group.lines.reduce((sum, line) => {
                const amounts = getMonthlyAmounts(line);
                return sum + amounts.reduce((a, b) => a + b, 0) / 12;
              }, 0);

              return (
                <Fragment key={group.categoryId}>
                  {/* Category header row */}
                  <tr
                    className="cursor-pointer select-none"
                    onClick={() => toggleCategory(group.categoryId)}
                  >
                    <td colSpan={8} className="px-3 pb-1 pt-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[10px] text-gray-400 dark:text-sp-muted transition-transform duration-200 ${
                              isCollapsed ? "" : "rotate-180"
                            }`}
                          >
                            &#9660;
                          </span>
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-sp-accent/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.1em] text-sp-accent">
                            {group.categoryName}
                            <span className="font-normal text-[10px] text-sp-accent/60 dark:text-sp-accent/50">
                              {group.lines.length}
                            </span>
                          </span>
                        </div>
                        <span className="text-[11px] font-semibold tabular-nums text-gray-500 dark:text-sp-muted">
                          {fmtD(groupMonthlyTotal)} {currency}/mo
                        </span>
                      </div>
                    </td>
                  </tr>
                  {/* Line rows — striped, indented */}
                  {!isCollapsed && group.lines.map((line, lineIndex) => {
                    globalRowIndex++;
                    const amounts = getMonthlyAmounts(line);
                    const yearly = getYearlyTotal(amounts);
                    const isCustom = !!line.monthlyAmounts;
                    const displayMonthly = isCustom
                      ? `${fmtD(Math.min(...amounts))}–${fmtD(Math.max(...amounts))}`
                      : fmtD(line.monthlyAmount);
                    const rowNumber = (currentPage - 1) * pageSize + globalRowIndex;

                    return editingId === line.id ? (
                      <tr key={line.id} className="bg-gray-50 dark:bg-sp-surface/50">
                        <td colSpan={8} className="py-3 pl-7 pr-3">
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
                                  className="w-40 rounded-md border px-2 py-1 text-sm dark:bg-sp-surface dark:border-sp-border"
                                />
                              </div>
                              <div>
                                <label className="block text-xs text-gray-500">Code</label>
                                <input
                                  name="code"
                                  defaultValue={line.code || ""}
                                  className="w-20 rounded-md border px-2 py-1 text-sm dark:bg-sp-surface dark:border-sp-border"
                                />
                              </div>
                              <div>
                                <label className="block text-xs text-gray-500">Category</label>
                                <select
                                  name="categoryId"
                                  defaultValue={line.categoryId}
                                  className="w-32 rounded-md border px-2 py-1 text-sm dark:bg-sp-surface dark:border-sp-border"
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
                                      ? "bg-black text-white dark:bg-sp-accent dark:text-white"
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
                                      ? "bg-black text-white dark:bg-sp-accent dark:text-white"
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
                                  className="w-full rounded-md border px-2 py-1 text-sm dark:bg-sp-surface dark:border-sp-border"
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
                                      className="w-full rounded-md border px-2 py-1 text-sm dark:bg-sp-surface dark:border-sp-border"
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
                      <tr key={line.id} className={lineIndex % 2 === 0 ? "bg-sp-accent/[0.04]" : ""}>
                        <td className="py-[5px] pl-7 text-gray-400">{rowNumber}</td>
                        <td className="py-[5px] font-semibold dark:text-sp-text">{line.name}</td>
                        <td className="py-[5px] text-gray-500 dark:text-sp-muted">{line.code || "—"}</td>
                        <td className="py-[5px] text-gray-500 text-xs dark:text-sp-muted">{isCustom ? "Custom" : "Fixed"}</td>
                        <td className="py-[5px] text-right tabular-nums dark:text-sp-text">{displayMonthly}</td>
                        <td className="py-[5px] text-right tabular-nums dark:text-sp-text">{fmtD(yearly)}</td>
                        <td className="py-[5px] text-right">
                          <div className="flex justify-end gap-1">
                            <Button size="sm" variant="outline" onClick={() => startEdit(line)}>
                              Edit
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => handleDelete(line.id)}>
                              Delete
                            </Button>
                          </div>
                        </td>
                        <td className="py-[5px] pr-4 text-right">
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
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={goToPage} />
    </div>
  );
}
