# Action Bar Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Consolidate all Budget Plan action buttons into a single unified action bar, remove "All" category option, and increase page size to 20.

**Architecture:** Modify `CategorySelector` to accept `onAddLine` callback and `importExportSlot` ReactNode. Move Add Line trigger and Import/Export into the bar. Remove "All" from dropdown items; default to first real category. Page component orchestrates by passing slots.

**Tech Stack:** Next.js App Router, React, Tailwind CSS

**Spec:** `docs/superpowers/specs/2026-03-24-action-bar-redesign.md`

---

### Task 1: Remove "All" from category dropdown and default to first category

**Files:**
- Modify: `src/components/budget-plan/category-carousel.tsx:41-53`
- Modify: `src/app/(dashboard)/budget-plan/page.tsx:40-57,80-88`

- [ ] **Step 1: Update CategorySelector — remove "All" item from dropdown**

In `src/components/budget-plan/category-carousel.tsx`, replace the items array (line 41-49):

```tsx
const items: DropdownItem[] = categories.map((c) => ({
  id: c.id,
  name: c.name,
  count: c._count.lines,
  protected: c.name === "General",
}));
```

- [ ] **Step 2: Update activeItem fallback**

In same file, replace lines 51-53:

```tsx
const activeItem = activeCategoryId
  ? items.find((i) => i.id === activeCategoryId) || items[0]
  : items[0];
```

(Same code, but now `items[0]` is General instead of "All")

- [ ] **Step 3: Update navigateTo — always use cat param**

In same file, replace `navigateTo` function (lines 65-70):

```tsx
function navigateTo(item: DropdownItem) {
  setDropdownOpen(false);
  const url = `/budget-plan?cat=${item.id}`;
  startTransition(() => router.push(url));
}
```

- [ ] **Step 4: Update handleDelete — navigate to first category instead of "All"**

In same file, replace lines 103-105:

```tsx
if (activeCategoryId === id) {
  navigateTo(items[0]);
}
```

(Same code, but items[0] is now General instead of All)

- [ ] **Step 5: Remove `totalLineCount` prop**

In same file, remove `totalLineCount` from the props type and destructuring (lines 20-30). It's no longer needed since we removed "All".

- [ ] **Step 6: Update page.tsx — redirect to first category when no cat param**

In `src/app/(dashboard)/budget-plan/page.tsx`, after fetching categories (after line 47), add redirect logic:

```tsx
const params = await searchParams;
const page = Math.max(1, parseInt(params.page || "1", 10) || 1);

// If no category selected, redirect to first category
if (!params.cat && categories.length > 0) {
  redirect(`/budget-plan?cat=${categories[0].id}`);
}
const catParam = params.cat!;
```

- [ ] **Step 7: Remove "All" view logic from page.tsx**

Remove `isAllView` variable (line 57). Remove the ternary for fetching — always use `getBudgetLinesByCategoryPaginated`. Remove `totalLineCount`. Remove the `activeCatName` fallback to "All" (line 82-83). The category total bar now always shows (remove `{catParam &&` conditional wrapper).

Updated fetch section:

```tsx
const { items: paginatedLines, total } = await getBudgetLinesByCategoryPaginated(
  activeBudget.id, catParam, page, PAGE_SIZE
);
const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
```

Updated category info:

```tsx
const activeCatName = categories.find((c) => c.id === catParam)?.name || "Unknown";
const activeCatLineCount = budget.lines.filter(
  (l: { categoryId: string }) => l.categoryId === catParam
).length;
```

- [ ] **Step 8: Update CategorySelector usage — remove totalLineCount prop**

In page.tsx, update the `<CategorySelector>` call to remove `totalLineCount`:

```tsx
<CategorySelector
  categories={categories}
  activeCategoryId={catParam}
  budgetId={budget.id}
/>
```

- [ ] **Step 9: Pass `hideCategory={true}` always to BudgetLineTable**

Since we always view one category, always hide the category column:

```tsx
<BudgetLineTable
  lines={paginatedLines}
  currency={budget.currency}
  categories={budget.categories}
  currentPage={page}
  totalPages={totalPages}
  pageSize={PAGE_SIZE}
  hideCategory={true}
/>
```

- [ ] **Step 10: Verify in browser**

Run: `npm run dev`
- Visit `/budget-plan` — should redirect to `/budget-plan?cat=<first-category-id>`
- Dropdown should NOT show "All"
- Table should show flat list (no category grouping)

- [ ] **Step 11: Commit**

```bash
git add src/components/budget-plan/category-carousel.tsx src/app/\(dashboard\)/budget-plan/page.tsx
git commit -m "feat: remove All category option, always show single category view"
```

---

### Task 2: Change PAGE_SIZE to 20

**Files:**
- Modify: `src/app/(dashboard)/budget-plan/page.tsx:15`

- [ ] **Step 1: Update PAGE_SIZE**

Change line 15:

```tsx
const PAGE_SIZE = 20;
```

- [ ] **Step 2: Commit**

```bash
git add src/app/\(dashboard\)/budget-plan/page.tsx
git commit -m "feat: increase budget plan page size from 15 to 20"
```

---

### Task 3: Move + New Line button into the action bar

**Files:**
- Modify: `src/components/budget-plan/category-carousel.tsx`
- Modify: `src/components/budgets/add-line-form.tsx:43-51`
- Modify: `src/app/(dashboard)/budget-plan/page.tsx`

- [ ] **Step 1: Add `onAddLine` callback prop to CategorySelector**

In `category-carousel.tsx`, add prop:

```tsx
export function CategorySelector({
  categories,
  activeCategoryId,
  budgetId,
  onAddLine,
}: {
  categories: Category[];
  activeCategoryId: string | null;
  budgetId: string;
  onAddLine?: () => void;
}) {
```

- [ ] **Step 2: Add "+ New" button in the action bar with LINE group label**

In the JSX of CategorySelector, after the category actions `<div>`, add a separator and the line group:

```tsx
{/* Separator between category and line actions */}
<div className="mx-0.5 h-[18px] w-px bg-sp-border" />

{/* Line actions */}
<div className="flex flex-col items-start gap-0.5">
  <span className="text-[9px] font-semibold uppercase tracking-[0.06em] text-gray-500/70 dark:text-sp-muted/70">
    Line
  </span>
  <button
    onClick={onAddLine}
    className="flex h-7 items-center rounded-lg border border-sp-accent px-2.5 text-[12px] font-semibold text-sp-accent transition-all hover:bg-sp-accent/[0.06]"
  >
    + New
  </button>
</div>
```

- [ ] **Step 3: Add "CATEGORY" group label above existing category buttons**

Wrap the existing category buttons div (lines 152-175) in a labeled group:

```tsx
{/* Category actions */}
<div className="flex flex-col items-start gap-0.5">
  <span className="text-[9px] font-semibold uppercase tracking-[0.06em] text-gray-500/70 dark:text-sp-muted/70">
    Category
  </span>
  <div className="flex gap-1.5">
    {/* existing New, Rename, Delete buttons here */}
  </div>
</div>
```

- [ ] **Step 4: Update all category button styles to accent outline**

Change all three category buttons (New, Rename, Delete) from:
```
border border-sp-border ... text-gray-500 ... hover:border-sp-accent hover:bg-sp-accent/[0.06] hover:text-sp-accent
```
to:
```
border border-sp-accent ... text-sp-accent ... hover:bg-sp-accent/[0.06]
```

Delete button keeps its danger variant:
```
border border-red-400 text-red-500 hover:bg-red-500/[0.06]
```

- [ ] **Step 5: Update AddLineForm to expose open state externally**

In `add-line-form.tsx`, add optional `externalOpen` and `onOpenChange` props:

```tsx
export function AddLineForm({
  budgetId,
  categories,
  actionSlot,
  fixedCategoryId,
  externalOpen,
  onOpenChange,
}: {
  budgetId: string;
  categories: CategoryOption[];
  actionSlot?: ReactNode;
  fixedCategoryId?: string;
  externalOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = externalOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;
```

- [ ] **Step 6: Remove the closed-state button from AddLineForm**

Replace the `if (!open)` block (lines 43-51) — when not open, render nothing (the trigger is now in the action bar):

```tsx
if (!open) {
  return null;
}
```

- [ ] **Step 7: Wire up in page.tsx — create a wrapper client component**

Create a small client wrapper that connects the CategorySelector's `onAddLine` to AddLineForm's open state. Add this to `src/components/budget-plan/budget-plan-client.tsx`:

```tsx
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
}: {
  categories: Category[];
  activeCategoryId: string;
  budgetId: string;
  budgetCategories: CategoryOption[];
  fixedCategoryId?: string;
  importExportSlot: React.ReactNode;
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
      </div>
    </>
  );
}
```

Wait — the table and category total also need to be inside the panel. The client wrapper should accept `children` for the table/total content:

```tsx
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
```

- [ ] **Step 8: Update page.tsx to use BudgetPlanClient**

Replace the CategorySelector + panel section in `page.tsx`:

```tsx
import { BudgetPlanClient } from "@/components/budget-plan/budget-plan-client";

// ... in the return JSX:

<BudgetPlanClient
  categories={categories}
  activeCategoryId={catParam}
  budgetId={budget.id}
  budgetCategories={budget.categories}
  fixedCategoryId={catParam}
  importExportSlot={<ImportExportLines budgetId={budget.id} />}
>
  <BudgetLineTable
    lines={paginatedLines}
    currency={budget.currency}
    categories={budget.categories}
    currentPage={page}
    totalPages={totalPages}
    pageSize={PAGE_SIZE}
    hideCategory={true}
  />

  {/* Category total bar */}
  <div className="mt-2 flex justify-between rounded-[10px] bg-sp-accent/[0.08] px-3 py-2.5 text-[13px] font-semibold text-sp-accent">
    <span>{activeCatName} Total ({activeCatLineCount} lines)</span>
    <span>
      {fmt.format(catMonthly)} / mo · {fmt.format(catYearly)} / yr
    </span>
  </div>
</BudgetPlanClient>
```

Remove the old standalone `<ImportExportLines>` div and the old `<CategorySelector>` + panel `<div>`.

- [ ] **Step 9: Verify in browser**

- "+ New" button should appear in the action bar next to category buttons
- Clicking "+ New" should open the AddLineForm inside the panel
- Old standalone "+ Add Line" button should be gone

- [ ] **Step 10: Commit**

```bash
git add src/components/budget-plan/category-carousel.tsx src/components/budgets/add-line-form.tsx src/components/budget-plan/budget-plan-client.tsx src/app/\(dashboard\)/budget-plan/page.tsx
git commit -m "feat: move +New Line button into action bar"
```

---

### Task 4: Move Import/Export into action bar (right side)

**Files:**
- Modify: `src/components/budget-plan/category-carousel.tsx`

- [ ] **Step 1: Add `importExportSlot` prop to CategorySelector**

```tsx
export function CategorySelector({
  categories,
  activeCategoryId,
  budgetId,
  onAddLine,
  importExportSlot,
}: {
  categories: Category[];
  activeCategoryId: string | null;
  budgetId: string;
  onAddLine?: () => void;
  importExportSlot?: React.ReactNode;
}) {
```

- [ ] **Step 2: Add spacer + DATA group in the action bar JSX**

After the LINE group, add:

```tsx
{/* Spacer pushes data actions to the right */}
<div className="flex-1" />

{/* Data actions */}
{importExportSlot && (
  <div className="flex flex-col items-start gap-0.5">
    <span className="text-[9px] font-semibold uppercase tracking-[0.06em] text-gray-500/70 dark:text-sp-muted/70">
      Data
    </span>
    <div className="flex gap-1.5">
      {importExportSlot}
    </div>
  </div>
)}
```

- [ ] **Step 3: Update ImportExportLines button styles to match accent outline**

In `src/components/budgets/import-export-lines.tsx`, find the Export and Import `<Button>` elements and change their styles to match the accent outline pattern:

```tsx
className="flex h-7 items-center rounded-lg border border-sp-accent px-2.5 text-[12px] font-semibold text-sp-accent transition-all hover:bg-sp-accent/[0.06]"
```

Remove any wrapper div/layout from ImportExportLines since it's now inside the action bar.

- [ ] **Step 4: Remove old standalone ImportExportLines section from page.tsx**

The old `<div className="mb-4"><ImportExportLines>` is already removed in Task 3 Step 8. Verify it's gone.

- [ ] **Step 5: Verify in browser**

- Export and Import should appear on the right side of the action bar
- They should have the same accent outline style as other buttons
- "DATA" label should appear above them

- [ ] **Step 6: Commit**

```bash
git add src/components/budget-plan/category-carousel.tsx src/components/budgets/import-export-lines.tsx
git commit -m "feat: move Import/Export into action bar right side"
```

---

### Task 5: Final cleanup and verify

**Files:**
- Modify: `src/app/(dashboard)/budget-plan/page.tsx`
- Remove unused imports

- [ ] **Step 1: Clean up unused imports in page.tsx**

Remove any now-unused imports (e.g. standalone `CategorySelector`, `AddLineForm`, `ImportExportLines` if they're only used through BudgetPlanClient). Keep `ImportExportLines` since it's passed as a slot.

- [ ] **Step 2: Remove `getBudgetLinesPaginated` import if unused**

Since we no longer have the "All" view, `getBudgetLinesPaginated` may be unused. Remove it from the import if so.

- [ ] **Step 3: Full browser verification**

Test all states:
- Visit `/budget-plan` → redirects to `?cat=<general-id>`
- Dropdown shows categories (no "All")
- Category bar: [Dropdown] [CATEGORY: New] [LINE: + New] ——— [DATA: Export Import]
- Select custom category (e.g. Food) → shows Rename + Delete too
- Click "+ New" → form opens in panel
- Click Export/Import → works as before
- Pagination works with 20 items per page
- Category total bar always shows

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore: clean up unused imports after action bar redesign"
```
