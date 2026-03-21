"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BudgetSelector } from "./budget-selector";
import { ThemeToggle } from "@/components/theme-toggle";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: "\u2302" },
  { href: "/categories", label: "Categories", icon: "\u2630" },
  { href: "/budgets", label: "Budget Lines", icon: "\u2261" },
  { href: "/expenses", label: "Expenses", icon: "\u2696" },
  { href: "/contributions", label: "Contributions", icon: "\u21A5" },
  { href: "/billing", label: "Billing", icon: "\u2605" },
  { href: "/settings", label: "Settings", icon: "\u2699" },
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
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-800">
        <Link href="/dashboard" className="text-lg font-bold tracking-tight">
          <span className="text-blue-600">$</span>pendly
        </Link>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            onClick={() => setOpen(!open)}
            className="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <span className="text-lg">{open ? "\u2715" : "\u2630"}</span>
          </button>
        </div>
      </div>
      {open && (
        <div className="border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950">
          <div className="border-b border-gray-200 py-3 dark:border-gray-800">
            <BudgetSelector budgets={budgets} activeBudgetId={activeBudgetId} />
          </div>
          <nav className="p-3 space-y-0.5">
            {navItems.map((item) => {
              const active = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    active
                      ? "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                      : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
                  }`}
                >
                  <span className="text-base">{item.icon}</span>
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      )}
    </div>
  );
}
