"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

type PaginationProps = {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
};

export function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  const [goToPage, setGoToPage] = useState("");

  if (totalPages <= 1) return null;

  function handleGoTo() {
    const page = parseInt(goToPage, 10);
    if (!isNaN(page) && page >= 1 && page <= totalPages) {
      onPageChange(page);
      setGoToPage("");
    }
  }

  return (
    <div className="mt-4">
      {/* Divider */}
      <div className="mb-3 h-px bg-sp-border" />

      {/* Navigation row — centered */}
      <div className="flex flex-wrap items-center justify-center gap-2 text-sm">
        <Button
          size="sm"
          variant="outline"
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
        >
          First
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          Previous
        </Button>

        <span className="px-2 text-gray-600 dark:text-sp-muted">
          Page {currentPage} of {totalPages}
        </span>

        <Button
          size="sm"
          variant="outline"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          Next
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
        >
          Last
        </Button>
      </div>

      {/* Go to page row — centered below */}
      <div className="mt-2 flex items-center justify-center gap-1">
        <input
          type="number"
          min={1}
          max={totalPages}
          value={goToPage}
          onChange={(e) => setGoToPage(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleGoTo()}
          placeholder="#"
          className="w-16 rounded-md border border-gray-200 px-2 py-1 text-center text-sm dark:border-sp-border dark:bg-sp-surface"
        />
        <Button size="sm" variant="outline" onClick={handleGoTo}>
          Go
        </Button>
      </div>
    </div>
  );
}
