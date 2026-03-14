"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BudgetSelector } from "./budget-selector";

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/categories", label: "Categories" },
  { href: "/budgets", label: "Budget Lines" },
  { href: "/expenses", label: "Expenses" },
  { href: "/billing", label: "Billing" },
  { href: "/settings", label: "Settings" },
];

type Budget = {
  id: string;
  name: string;
  year: number;
  currency: string;
};

export function MobileNav({
  budgets,
  activeBudgetId,
}: {
  budgets: Budget[];
  activeBudgetId: string | null;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="lg:hidden">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <Link href="/dashboard" className="text-lg font-bold">
          Spendly
        </Link>
        <button
          onClick={() => setOpen(!open)}
          className="rounded-md p-2 hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <span className="text-lg">{open ? "\u2715" : "\u2630"}</span>
        </button>
      </div>
      {open && (
        <div className="border-b bg-white dark:bg-gray-950">
          <div className="border-b py-3">
            <BudgetSelector budgets={budgets} activeBudgetId={activeBudgetId} />
          </div>
          <nav className="p-3">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`block rounded-md px-3 py-2 text-sm font-medium ${
                  pathname.startsWith(item.href)
                    ? "bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-white"
                    : "text-gray-600 hover:bg-gray-50 dark:text-gray-400"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </div>
  );
}
