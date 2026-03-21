"use client";

import { useState, useRef, useEffect } from "react";

type ColumnFilterProps = {
  values: string[];
  selected: Set<string>;
  onChange: (selected: Set<string>) => void;
};

export function ColumnFilter({ values, selected, onChange }: ColumnFilterProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  const isFiltered = selected.size < values.length;

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const filtered = search
    ? values.filter((v) => v.toLowerCase().includes(search.toLowerCase()))
    : values;

  function toggleAll() {
    if (selected.size === values.length) {
      onChange(new Set());
    } else {
      onChange(new Set(values));
    }
  }

  function toggleOne(val: string) {
    const next = new Set(selected);
    if (next.has(val)) {
      next.delete(val);
    } else {
      next.add(val);
    }
    onChange(next);
  }

  function clearFilter() {
    onChange(new Set(values));
    setOpen(false);
  }

  return (
    <div className="relative inline-block" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className={`ml-1 inline-flex items-center text-[10px] leading-none transition-colors ${
          isFiltered
            ? "text-blue-600 dark:text-[#818cf8]"
            : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        }`}
        title="Filter column"
      >
        &#9660;
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 w-52 rounded-lg border border-gray-200 bg-white shadow-lg dark:border-[#252345] dark:bg-[#13112b]">
          {/* Search */}
          <div className="border-b border-gray-100 p-2 dark:border-[#252345]">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              className="w-full rounded border border-gray-200 px-2 py-1 text-xs dark:border-[#252345] dark:bg-[#1a1835]"
              autoFocus
            />
          </div>

          {/* Select all / Clear */}
          <div className="flex items-center justify-between border-b border-gray-100 px-3 py-1.5 dark:border-[#252345]">
            <label className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-[#6b6b8a]">
              <input
                type="checkbox"
                checked={selected.size === values.length}
                onChange={toggleAll}
                className="rounded border-gray-300 dark:border-gray-600"
              />
              Select all
            </label>
            {isFiltered && (
              <button
                onClick={clearFilter}
                className="text-xs text-blue-600 hover:text-blue-800 dark:text-[#818cf8]"
              >
                Clear
              </button>
            )}
          </div>

          {/* Values list */}
          <div className="max-h-48 overflow-y-auto p-1">
            {filtered.length === 0 ? (
              <p className="px-2 py-1.5 text-xs text-gray-400">No matches</p>
            ) : (
              filtered.map((val) => (
                <label
                  key={val}
                  className="flex cursor-pointer items-center gap-1.5 rounded px-2 py-1 text-xs hover:bg-gray-50 dark:hover:bg-[#1a1835]"
                >
                  <input
                    type="checkbox"
                    checked={selected.has(val)}
                    onChange={() => toggleOne(val)}
                    className="rounded border-gray-300 dark:border-gray-600"
                  />
                  <span className="truncate">{val}</span>
                </label>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
