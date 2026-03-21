"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createCategory, deleteCategory, deleteCategories, renameCategory } from "@/actions/category";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/shared/pagination";

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

  // Only non-General categories are selectable
  const selectableCategories = categories.filter((c) => c.name !== "General");
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
      {/* Add form */}
      <form action={handleCreate} className="mb-6 flex gap-2">
        <input
          name="name"
          required
          placeholder="New category name"
          className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm dark:border-gray-700 dark:bg-gray-800"
        />
        <Button type="submit" size="sm">
          Add Category
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
      <div className="rounded-xl bg-white shadow-sm dark:bg-gray-900">
        <table className="w-full text-left text-sm">
          <thead className="text-xs uppercase tracking-wider text-gray-500">
            <tr className="border-b border-gray-100 dark:border-gray-800">
              <th className="p-4 w-12 font-medium">#</th>
              <th className="p-4 font-medium">Name</th>
              <th className="p-4 text-right font-medium">Lines</th>
              <th className="p-4 text-right font-medium">Actions</th>
              <th className="p-4 w-8 text-right">
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
            {categories.map((cat, index) => (
              <tr key={cat.id} className="border-b border-gray-50 last:border-0 dark:border-gray-800/50">
                <td className="p-4 text-gray-400">
                  {(currentPage - 1) * pageSize + index + 1}
                </td>
                <td className="p-4">
                  {editingId === cat.id ? (
                    <form
                      action={(fd) => handleRename(cat.id, fd)}
                      className="flex gap-2"
                    >
                      <input
                        name="name"
                        defaultValue={cat.name}
                        required
                        className="rounded-lg border border-gray-200 px-2 py-1 text-sm dark:border-gray-700 dark:bg-gray-800"
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
                    <span className="font-medium">{cat.name}</span>
                  )}
                </td>
                <td className="p-4 text-right">
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                    {cat._count.lines}
                  </span>
                </td>
                <td className="p-4 text-right">
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
                <td className="p-4 text-right">
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
