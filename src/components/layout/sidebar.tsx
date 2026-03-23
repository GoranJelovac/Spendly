"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BudgetSelector } from "./budget-selector";

const mainItems = [
  { href: "/dashboard", label: "Dashboard", icon: "⌂" },
  { href: "/categories", label: "Categories", icon: "☰" },
  { href: "/budgets", label: "Budget Lines", icon: "≡" },
  { href: "/expenses", label: "Expenses", icon: "⚖" },
  { href: "/contributions", label: "Contributions", icon: "↥" },
];

const accountItems = [
  { href: "/billing", label: "Billing", icon: "★" },
  { href: "/settings", label: "Settings", icon: "⚙" },
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
  const activeBudget = budgets.find((b) => b.id === activeBudgetId);

  return (
    <aside className="hidden w-[280px] shrink-0 border-r border-sp-border bg-sp-bg font-[var(--font-sora)] lg:block">
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="px-5 py-5">
          <Link href="/dashboard" className="text-xl font-bold tracking-tight">
            <span className="text-sp-accent">$</span>pendly
          </Link>
        </div>

        {/* Budget Selector */}
        <div className="px-4 pb-4">
          <div className="rounded-[15px] border border-gray-100 bg-gray-50/80 p-3 dark:border-sp-border dark:bg-sp-surface">
            <BudgetSelector budgets={budgets} activeBudgetId={activeBudgetId} />
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3">
          {/* Main section */}
          <p className="mb-1 px-3 pt-2 text-[10px] font-semibold uppercase tracking-[0.1em] text-gray-400 dark:text-sp-muted">
            Main
          </p>
          <div className="flex flex-col gap-[1px]">
            {mainItems.map((item) => {
              const active = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-[9px] text-[14px] font-medium transition-colors ${
                    active
                      ? "border-b-2 border-sp-accent bg-sp-accent/[0.04] text-sp-accent"
                      : "rounded-[15px] border-b-2 border-transparent text-gray-700 hover:bg-gray-100/80 hover:text-gray-900 dark:text-slate-400 dark:hover:bg-sp-accent/6 dark:hover:text-sp-text"
                  }`}
                >
                  <span className={`text-[15px] ${active ? "opacity-100" : "opacity-70"}`}>{item.icon}</span>
                  {item.label}
                </Link>
              );
            })}
          </div>

          {/* Account section */}
          <p className="mb-1 mt-5 px-3 text-[10px] font-semibold uppercase tracking-[0.1em] text-gray-400 dark:text-sp-muted">
            Account
          </p>
          <div className="flex flex-col gap-[1px]">
            {accountItems.map((item) => {
              const active = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-[9px] text-[14px] font-medium transition-colors ${
                    active
                      ? "border-b-2 border-sp-accent bg-sp-accent/[0.04] text-sp-accent"
                      : "rounded-[15px] border-b-2 border-transparent text-gray-700 hover:bg-gray-100/80 hover:text-gray-900 dark:text-slate-400 dark:hover:bg-sp-accent/6 dark:hover:text-sp-text"
                  }`}
                >
                  <span className={`text-[15px] ${active ? "opacity-100" : "opacity-70"}`}>{item.icon}</span>
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* User info */}
        <div className="mt-auto border-t border-gray-100 p-4 dark:border-sp-border">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-sp-accent text-xs font-bold text-white">
              {activeBudget?.name?.charAt(0).toUpperCase() || "S"}
            </div>
            <div className="min-w-0">
              <p className="truncate text-[13px] font-medium">{activeBudget?.name || "Spendly"}</p>
              <p className="truncate text-[11px] text-gray-400 dark:text-sp-muted">
                {activeBudget ? `${activeBudget.year} · ${activeBudget.currency}` : "No budget"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
