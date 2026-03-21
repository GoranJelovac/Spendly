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

export default async function ContributionsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const activeBudget = await getActiveBudget();

  if (!activeBudget) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-6 font-[var(--font-jakarta)] sm:px-6">
        <h1 className="mb-4 text-center text-2xl font-bold">Contributions</h1>
        <div className="rounded-2xl bg-white p-8 text-center shadow-md dark:bg-[#13112b]">
          <p className="text-gray-500">
            No budget selected. Create one using the selector in the sidebar.
          </p>
        </div>
      </div>
    );
  }

  const [{ items: contributions }, budget] = await Promise.all([
    getContributionsPaginated({ budgetId: activeBudget.id }, 1, 10000),
    getBudget(activeBudget.id),
  ]);

  const lines = (budget?.lines || []).map((l) => ({
    id: l.id,
    name: l.name,
    categoryId: l.categoryId,
    categoryName: l.category.name,
  }));

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 font-[var(--font-jakarta)] sm:px-6">
      <h1 className="mb-6 text-center text-2xl font-bold">Contributions</h1>
      <AddContributionForm lines={lines} actionSlot={
        <ImportExportTransactions
          budgetId={activeBudget.id}
          label="Contributions"
          downloadCsv={downloadContributionsCsv}
          previewImport={previewImportContributions}
          applyImport={applyImportContributions}
        />
      } />
      <ContributionList
        contributions={contributions}
        lines={lines}
        pageSize={PAGE_SIZE}
      />
    </div>
  );
}
