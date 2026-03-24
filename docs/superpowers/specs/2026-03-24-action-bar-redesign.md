# Budget Plan Action Bar Redesign

## Summary

Consolidate all action buttons into a single action bar (the category bar). Remove the separate Import/Export row and the +Add Line button from inside the panel. Remove "All" from the category dropdown.

## Changes

### 1. Unified Action Bar
All buttons move into the category bar, grouped with mini labels above:

```
[Category ▼ dropdown] [CATEGORY: New Rename Delete] | [LINE: + New] ——spacer—— [DATA: Export Import]
```

- **Left side**: Category dropdown, then category actions, separator, line actions
- **Right side**: Export / Import (pushed right by spacer)
- Mini uppercase labels ("CATEGORY", "LINE", "DATA") above each button group

### 2. Uniform Button Style
All buttons use the same accent outline style:
- `border: 1px solid accent`
- `color: accent`
- `background: transparent`
- Hover: `background: accent/8%`
- Exception: Delete button uses danger color (red border + red text)

### 3. Remove "All" Category Option
- No "All" pseudo-category in the dropdown
- Default view: first category (General)
- No grouped-by-category view needed — always flat list for one category
- URL state simplified: `?cat=<id>&page=<n>` (cat is always required)

### 4. PAGE_SIZE = 20
Increase from 15 to 20 lines per page.

### 5. Button Visibility Rules
| Selected Category | Category Buttons | Line Buttons | Data Buttons |
|---|---|---|---|
| Custom (e.g. Food) | New, Rename, Delete | + New | Export, Import |
| General (protected) | New | + New | Export, Import |

### 6. Remove Old UI Elements
- Remove standalone `ImportExportLines` row (was between Monthly Breakdown and category bar)
- Remove `AddLineForm` toggle button from inside the panel (the form itself still exists, triggered from the bar)

## Visual Reference
- Playground: `playground-action-bar.html`
