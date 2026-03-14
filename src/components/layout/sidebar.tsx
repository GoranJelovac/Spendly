"use client";

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

export function Sidebar({
  budgets,
  activeBudgetId,
}: {
  budgets: Budget[];
  activeBudgetId: string | null;
}) {
  const pathname = usePathname();

  return (
    <aside className="hidden w-56 shrink-0 border-r bg-white dark:bg-gray-950 lg:block">
      <div className="flex h-full flex-col">
        <div className="border-b px-6 py-4">
          <Link href="/dashboard" className="text-xl font-bold">
            Spendly
          </Link>
        </div>

        {/* Budget Selector */}
        <div className="border-b py-3">
          <BudgetSelector budgets={budgets} activeBudgetId={activeBudgetId} />
        </div>

        <nav className="flex-1 space-y-1 p-3">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`block rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                pathname.startsWith(item.href)
                  ? "bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-white"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </aside>
  );
}
