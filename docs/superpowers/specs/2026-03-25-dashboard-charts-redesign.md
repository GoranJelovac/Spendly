# Dashboard Charts Redesign — Spec

## Goal

Split the single "Charts" collapsible section into two separate sections and redesign the donut charts to be larger with center labels and legend below. Based on the approved "After B" variant from `playground-dashboard-charts.html`.

## Changes

### 1. Split CollapsibleSection (dashboard-content.tsx)

Replace the single `<CollapsibleSection title="Charts">` with two sections:

**Section 1: "Planned vs Spent"**
- Contains only the `PlannedVsSpentChart` component
- No changes to the bar chart itself

**Section 2: "Budget Distribution"**
- Contains the two donut charts (`BudgetBreakdownChart` and `SpendingOverviewChart`) in a 50/50 grid (`md:grid-cols-2`)
- Both sections `defaultOpen={true}` (same as the original "Charts" section)

### 2. Redesign DonutWithLegend (charts.tsx)

Replace the current side-by-side layout (donut left, legend right) with a stacked layout:

**Donut size:**
- Fixed 280x280px container
- `innerRadius` ~82, `outerRadius` ~135 (proportional to 280px)
- Donut centered horizontally above the legend

**Center label (absolute positioned overlay):**
- The 280px donut wrapper div has `position: relative`. The center label is an `absolute inset-0 flex flex-col items-center justify-center pointer-events-none` overlay.
- Values are pre-formatted by the parent using `fmtD()` (respects user decimal preferences) and passed as strings via the `centerLabel` prop.
- `BudgetBreakdownChart`: sublabel "Total", value `fmtD(total)`, detail `currency` (e.g. "EUR")
- `SpendingOverviewChart`: sublabel "Spent", value `fmtD(totalSpent)`, detail `"of ${fmtD(totalPlanned)} ${currency}"` where `totalPlanned` is the `available` amount passed in
- Center label only renders when total > 0 (the empty/zero state already returns an early fallback without DonutWithLegend)

**Legend below donut:**
- Full width, `max-height: 160px`, `overflow-y: auto`
- Same legend items as current (color dot, name, percentage, value)
- Same hover interaction (highlight donut segment on legend hover and vice versa)

### 3. Component interface changes

`DonutWithLegend` gets new optional props for the center label:
- `centerLabel?: { sublabel: string; value: string; detail?: string }`

`BudgetBreakdownChart` and `SpendingOverviewChart` pass the appropriate center label data.

### 4. Files modified

| File | Change |
|------|--------|
| `src/components/dashboard/dashboard-content.tsx` | Split "Charts" into "Planned vs Spent" + "Budget Distribution" |
| `src/components/dashboard/charts.tsx` | Stacked donut layout, 280px size, center label overlay |

### 5. What does NOT change

- `PlannedVsSpentChart` bar chart — unchanged
- Color palette, hover/tooltip behavior — preserved
- Data flow from `dashboard-content.tsx` to chart components — same props
- No new dependencies
