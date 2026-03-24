"use client";

import { type ReactNode } from "react";

type Props = {
  onAddNew: () => void;
  importExportSlot: ReactNode;
  children: ReactNode;
};

export function TransactionPageClient({
  onAddNew,
  importExportSlot,
  children,
}: Props) {
  return (
    <div>
      {/* Action bar */}
      <div className="flex flex-wrap items-center gap-2 rounded-t-2xl border border-sp-border bg-sp-surface px-3 py-2">
        <div className="flex flex-col items-start gap-0.5">
          <span className="text-[9px] font-semibold uppercase tracking-wide text-sp-muted opacity-70">
            Transaction
          </span>
          <div className="flex gap-1">
            <button
              onClick={onAddNew}
              className="flex h-7 items-center rounded-lg border border-sp-accent px-2.5 text-[12px] font-semibold text-sp-accent transition-all hover:bg-sp-accent/[0.06]"
            >
              + New
            </button>
          </div>
        </div>

        <div className="flex-1" />

        <div className="flex flex-col items-start gap-0.5">
          <span className="text-[9px] font-semibold uppercase tracking-wide text-sp-muted opacity-70">
            Data
          </span>
          {importExportSlot}
        </div>
      </div>

      {/* Panel */}
      <div className="rounded-b-2xl border border-t-0 border-sp-border bg-white p-4 dark:bg-sp-bg">
        {children}
      </div>
    </div>
  );
}
