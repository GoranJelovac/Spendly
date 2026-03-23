"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createCategory, deleteCategory, deleteCategories, renameCategory } from "@/actions/category";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/shared/pagination";
import { ColumnFilter } from "@/components/shared/column-filter";

type CategoryItem = {
  id: string;
  name: string;
  _count: { lines: number };
};

export function CategoryList({
  categories,
  budgetId,
  currentPage,
  totalPages,
  pageSize,
}: {
  categories: CategoryItem[];
  budgetId: string;
  currentPage: number;
  totalPages: number;
  pageSize: number;
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [columnFilters, setColumnFilters] = useState<Record<string, Set<string>>>({});

  // Column filter logic
  const columnValues = useMemo(() => {
    const names: string[] = [];
    const lines: string[] = [];
    const nameSet = new Set<string>();
    const lineSet = new Set<string>();
    for (const cat of categories) {
      if (!nameSet.has(cat.name)) { nameSet.add(cat.name); names.push(cat.name); }
      const lv = String(cat._count.lines);
      if (!lineSet.has(lv)) { lineSet.add(lv); lines.push(lv); }
    }
    return { name: names, lines };
  }, [categories]);

  function getSelectedForCol(col: "name" | "lines"): Set<string> {
    return columnFilters[col] || new Set(columnValues[col]);
  }

  const filteredCategories = useMemo(() => {
    if (Object.keys(columnFilters).length === 0) return categories;
    return categories.filter((cat) => {
      const nameSelected = columnFilters.name;
      if (nameSelected && nameSelected.size < columnValues.name.length && !nameSelected.has(cat.name)) return false;
      const linesSelected = columnFilters.lines;
      if (linesSelected && linesSelected.size < columnValues.lines.length && !linesSelected.has(String(cat._count.lines))) return false;
      return true;
    });
  }, [categories, columnFilters, columnValues]);

  // Only non-General categories are selectable
  const selectableCategories = filteredCategories.filter((c) => c.name !== "General");
  const allSelected = selectableCategories.length > 0 && selected.size === selectableCategories.length;

  function goToPage(page: number) {
    router.push(`/categories?page=${page}`);
  }

  function toggleAll() {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(selectableCategories.map((c) => c.id)));
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

  async function handleCreate(formData: FormData) {
    setError("");
    const result = await createCategory(budgetId, formData);
    if (result?.error) setError(result.error);
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete "${name}"? Lines will be moved to General.`)) return;
    setError("");
    const result = await deleteCategory(id);
    if (result?.error) setError(result.error);
  }

  async function handleBulkDelete() {
    if (selected.size === 0) return;
    if (!confirm(`Delete ${selected.size} category(ies)? Lines will be moved to General.`)) return;
    setBulkDeleting(true);
    const result = await deleteCategories(Array.from(selected));
    if (result?.error) setError(result.error);
    setSelected(new Set());
    setBulkDeleting(false);
  }

  async function handleRename(id: string, formData: FormData) {
    setError("");
    const result = await renameCategory(id, formData);
    if (result?.error) {
      setError(result.error);
    } else {
      setEditingId(null);
    }
  }

  return (
    <div>
      {/* Add form — card */}
      <form
        action={handleCreate}
        className="mb-6 flex items-center gap-3 rounded-2xl border-2 border-gray-200 bg-white px-5 py-4 shadow-md dark:border-sp-border dark:bg-sp-bg dark:shadow-[0_0_20px_var(--sp-glow)]"
      >
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-[10px] bg-sp-accent/10 text-lg text-sp-accent">
          +
        </div>
        <input
          name="name"
          required
          placeholder="New category name"
          className="flex-1 rounded-[10px] border border-gray-200 bg-white px-3 py-2 text-sm dark:border-sp-border dark:bg-sp-surface"
        />
        <Button type="submit" size="sm">
          Add
        </Button>
      </form>

      {error && <p className="mb-4 text-sm text-red-500">{error}</p>}

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

      {/* Category list */}
      <div className="min-h-[20rem] rounded-2xl border-2 border-gray-200 bg-white shadow-md dark:border-sp-border dark:bg-sp-bg dark:shadow-[0_0_20px_var(--sp-glow)]">
        <table className="w-full border-separate border-spacing-y-2 text-left text-[14px]">
          <thead>
            <tr className="bg-sp-accent/8">
              <th className="rounded-l-2xl pb-2.5 pl-3 pt-2.5 w-12 text-[10px] font-bold uppercase tracking-[0.08em] text-gray-500 dark:text-sp-muted">#</th>
              <th className="pb-2.5 pt-2.5 text-[10px] font-bold uppercase tracking-[0.08em] text-gray-500 dark:text-sp-muted">
                Name
                <ColumnFilter
                  values={columnValues.name}
                  selected={getSelectedForCol("name")}
                  onChange={(s) => setColumnFilters((p) => ({ ...p, name: s }))}
                />
              </th>
              <th className="pb-2.5 pt-2.5 text-right text-[10px] font-bold uppercase tracking-[0.08em] text-gray-500 dark:text-sp-muted">
                Lines
                <ColumnFilter
                  values={columnValues.lines}
                  selected={getSelectedForCol("lines")}
                  onChange={(s) => setColumnFilters((p) => ({ ...p, lines: s }))}
                />
              </th>
              <th className="pb-2.5 pr-4 pt-2.5 text-right text-[10px] font-bold uppercase tracking-[0.08em] text-gray-500 dark:text-sp-muted">Actions</th>
              <th className="rounded-r-2xl pb-2.5 pr-4 pt-2.5 w-8 text-right">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                  className="rounded border-gray-300 dark:border-gray-600"
                  disabled={selectableCategories.length === 0}
                />
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredCategories.map((cat, index) => (
              <tr key={cat.id} className="bg-gray-50 dark:bg-sp-surface">
                <td className="rounded-l-xl py-[6px] pl-3 text-gray-400">
                  {(currentPage - 1) * pageSize + index + 1}
                </td>
                <td className="py-[6px]">
                  {editingId === cat.id ? (
                    <form
                      action={(fd) => handleRename(cat.id, fd)}
                      className="flex gap-2"
                    >
                      <input
                        name="name"
                        defaultValue={cat.name}
                        required
                        className="rounded-lg border border-gray-200 px-2 py-1 text-sm dark:border-sp-border dark:bg-sp-surface"
                      />
                      <Button size="sm" type="submit">Save</Button>
                      <Button
                        size="sm"
                        variant="outline"
                        type="button"
                        onClick={() => setEditingId(null)}
                      >
                        Cancel
                      </Button>
                    </form>
                  ) : (
                    <span className="font-semibold dark:text-sp-text">{cat.name}</span>
                  )}
                </td>
                <td className="py-[6px] text-right">
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 dark:bg-sp-accent/10 dark:text-sp-accent">
                    {cat._count.lines}
                  </span>
                </td>
                <td className="py-[6px] text-right">
                  {cat.name !== "General" && editingId !== cat.id && (
                    <div className="flex justify-end gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingId(cat.id)}
                      >
                        Rename
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(cat.id, cat.name)}
                      >
                        Delete
                      </Button>
                    </div>
                  )}
                </td>
                <td className="rounded-r-xl py-[6px] pr-4 text-right">
                  {cat.name !== "General" ? (
                    <input
                      type="checkbox"
                      checked={selected.has(cat.id)}
                      onChange={() => toggleOne(cat.id)}
                      className="rounded border-gray-300 dark:border-gray-600"
                    />
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={goToPage} />
    </div>
  );
}
