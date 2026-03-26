# Budget Plan Page — Design Spec

**Date:** 2026-03-23
**Status:** Approved

## Summary

Merge the separate Categories and Budget Lines pages into a single **"Budget Plan"** page. Categories are navigated via a sliding-window carousel; each category shows its own paginated list of budget lines.

## Current State

- `/categories` page — CRUD for categories with pagination
- `/budgets` page — all budget lines in a single table, grouped by category with collapsible headers
- Categories and budget lines are managed separately, requiring navigation between two pages

## New Design

### Page: `/budget-plan`

One unified page with these sections (top to bottom):

1. **Monthly Breakdown** — same as current, shows totals across ALL categories
2. **Category Carousel** — sliding-window navigation for categories
3. **Content Panel** — add line form + lines table + category total + pagination

### Category Carousel

- **Sliding window of up to 5 visible slots**, active category centered when possible
- **4 arrow buttons**: `«` (first), `‹` (prev), `›` (next), `»` (last)
- **Edge slots** (leftmost/rightmost when more exist beyond) shown at reduced opacity (0.35) to hint at more content
- **Active slot** styled with accent color + bottom border
- **Each slot** shows: category name + line count badge
- **Active non-protected slot** also shows: edit (✎) and delete (✕) icon buttons
- **"+" button** between slots and right arrows to add a new category
- **Protected categories**: "All" and "General" — no edit/delete icons
- **"All" pseudo-category** at index 0 — shows all lines grouped by category (like current budget lines page)

### Content Panel (per category)

- **Add Line button** + **Import/Export button** (same as current)
- **Lines table** with columns: #, Name, Code, Type, Monthly, Yearly, Actions (edit/delete)
- **Category total bar** — monthly + yearly sum for active category
- **Pagination** — server-side, PAGE_SIZE = 15

### Category Management (inline)

- **Add**: "+" button opens inline text input in carousel area
- **Edit**: ✎ icon on active tab triggers inline rename
- **Delete**: ✕ icon with confirmation, moves lines to "General"
- Same validation rules as current (unique names, General protected)

### Navigation Changes

- Sidebar + mobile nav: replace "Categories" and "Budget Lines" entries with single "Budget Plan" entry
- Route: `/budget-plan`
- Old routes (`/categories`, `/budgets`) can redirect to `/budget-plan`

### URL State

- `?cat=<categoryId>` — which category is active (default: "all")
- `?page=<n>` — pagination within the active category

## Data Flow

- Server component fetches: budget, all categories (for carousel), paginated lines for active category
- When `cat=all`: fetch all lines paginated (current behavior with grouping)
- When `cat=<id>`: fetch only that category's lines paginated
- Category CRUD uses existing server actions (createCategory, renameCategory, deleteCategory)
- Line CRUD uses existing server actions (createBudgetLine, updateBudgetLine, deleteBudgetLine)

## Files Affected

### New
- `src/app/(dashboard)/budget-plan/page.tsx` — server component
- `src/components/budget-plan/category-carousel.tsx` — client component
- `src/components/budget-plan/budget-plan-content.tsx` — client wrapper

### Modified
- `src/components/layout/sidebar.tsx` — update nav items
- `src/components/layout/mobile-nav.tsx` — update nav items
- `src/actions/budget-line.ts` — add `getBudgetLinesByCategory()` action

### Reused (no changes)
- `src/components/budgets/add-line-form.tsx`
- `src/components/budgets/budget-line-table.tsx` (may need minor prop adjustments)
- `src/components/budgets/monthly-breakdown.tsx`
- `src/components/budgets/import-export-lines.tsx`
- `src/actions/category.ts`

### Removed (after verification)
- `src/app/(dashboard)/categories/page.tsx`
- `src/components/categories/category-list.tsx`
- `src/app/(dashboard)/budgets/page.tsx` (replaced by budget-plan)
