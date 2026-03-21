import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getActiveBudget } from "@/actions/active-budget";
import { getContributionsPaginated } from "@/actions/contribution";
import { getBudget } from "@/actions/budget";
import { AddContributionForm } from "@/components/contributions/add-contribution-form";
import { ContributionList } from "@/components/contributions/contribution-list";
import { ImportExportTransactions } from "@/components/shared/import-export-transactions";
import {
  downloadContributionsCsv,
  previewImportContributions,
  applyImportContributions,
} from "@/actions/import-export-contributions";

const PAGE_SIZE = 20;

export default async function ContributionsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const activeBudget = await getActiveBudget();

  if (!activeBudget) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
        <h1 className="mb-4 text-center text-2xl font-bold">Contributions</h1>
        <div className="rounded-xl bg-white p-8 text-center shadow-sm dark:bg-gray-900">
          <p className="text-gray-500">
            No budget selected. Create one using the selector in the sidebar.
          </p>
        </div>
      </div>
    );
  }

  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page || "1", 10) || 1);

  const [{ items: contributions, total }, budget] = await Promise.all([
    getContributionsPaginated({ budgetId: activeBudget.id }, page, PAGE_SIZE),
    getBudget(activeBudget.id),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const lines = (budget?.lines || []).map((l) => ({
    id: l.id,
    name: l.name,
    categoryId: l.categoryId,
    categoryName: l.category.name,
  }));

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
      <h1 className="mb-1 text-center text-2xl font-bold">Contributions</h1>
      <p className="mb-6 text-center text-sm text-gray-500">
        {activeBudget.name} &middot; {activeBudget.year} &middot; {activeBudget.currency}
      </p>
      <ImportExportTransactions
        budgetId={activeBudget.id}
        label="Contributions"
        downloadCsv={downloadContributionsCsv}
        previewImport={previewImportContributions}
        applyImport={applyImportContributions}
      />
      <AddContributionForm lines={lines} />
      <ContributionList
        contributions={contributions}
        lines={lines}
        currentPage={page}
        totalPages={totalPages}
        pageSize={PAGE_SIZE}
      />
    </div>
  );
}
