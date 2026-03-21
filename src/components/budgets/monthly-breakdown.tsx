"use client";

import { useState } from "react";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function MonthlyBreakdown({
  monthTotals,
  currency,
}: {
  monthTotals: number[];
  currency: string;
}) {
  const [open, setOpen] = useState(false);
  const yearlyTotal = monthTotals.reduce((sum, a) => sum + a, 0);

  return (
    <div className="mb-6 rounded-xl bg-white shadow-sm dark:bg-gray-900">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-5 py-3.5 text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-xl"
      >
        <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
          Monthly Breakdown
        </h3>
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold">
            {yearlyTotal.toFixed(2)} {currency} / year
          </span>
          <span
            className={`text-gray-400 text-xs transition-transform duration-200 ${
              open ? "rotate-180" : ""
            }`}
          >
            &#9660;
          </span>
        </div>
      </button>
      {open && (
        <div className="border-t border-gray-100 px-5 pb-5 pt-4 dark:border-gray-800">
          <div className="grid grid-cols-7 gap-2">
            {/* Jan - Jun */}
            {monthTotals.slice(0, 6).map((val, i) => (
              <div
                key={i}
                className="rounded-lg border border-gray-100 bg-gray-50/50 p-2.5 text-center dark:border-gray-800 dark:bg-gray-800/30"
              >
                <p className="text-[11px] font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">
                  {MONTHS[i]}
                </p>
                <p className={`mt-0.5 text-sm font-semibold ${
                  val === 0 ? "text-gray-300 dark:text-gray-600" : ""
                }`}>
                  {val.toFixed(2)}
                </p>
              </div>
            ))}
            {/* Total - spans 2 rows */}
            <div className="row-span-2 flex flex-col items-center justify-center rounded-lg border-2 border-emerald-200 bg-emerald-50 p-2.5 text-center dark:border-emerald-800 dark:bg-emerald-950/40">
              <p className="text-[11px] font-medium uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                Total
              </p>
              <p className="mt-0.5 text-lg font-bold text-emerald-700 dark:text-emerald-300">
                {yearlyTotal.toFixed(2)}
              </p>
              <p className="text-[10px] text-emerald-500 dark:text-emerald-500">
                {currency}
              </p>
            </div>
            {/* Jul - Dec */}
            {monthTotals.slice(6, 12).map((val, i) => (
              <div
                key={i + 6}
                className="rounded-lg border border-gray-100 bg-gray-50/50 p-2.5 text-center dark:border-gray-800 dark:bg-gray-800/30"
              >
                <p className="text-[11px] font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">
                  {MONTHS[i + 6]}
                </p>
                <p className={`mt-0.5 text-sm font-semibold ${
                  val === 0 ? "text-gray-300 dark:text-gray-600" : ""
                }`}>
                  {val.toFixed(2)}
                </p>
              </div>
            ))}
          </div>
          <p className="mt-3 text-right text-xs text-gray-400">
            All amounts in {currency}
          </p>
        </div>
      )}
    </div>
  );
}
