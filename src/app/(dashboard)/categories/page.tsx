import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getActiveBudget } from "@/actions/active-budget";
import { getCategoriesPaginated } from "@/actions/category";
import { CategoryList } from "@/components/categories/category-list";

const PAGE_SIZE = 20;

export default async function CategoriesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const activeBudget = await getActiveBudget();

  if (!activeBudget) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-6 font-[var(--font-jakarta)] sm:px-6">
        <h1 className="mb-4 text-2xl font-bold">Categories</h1>
        <div className="rounded-2xl bg-white p-8 text-center shadow-md dark:bg-[#13112b]">
          <p className="text-gray-500">
            No budget selected. Create one using the selector in the sidebar.
          </p>
        </div>
      </div>
    );
  }

  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page || "1", 10) || 1);
  const { items: categories, total } = await getCategoriesPaginated(activeBudget.id, page, PAGE_SIZE);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 font-[var(--font-jakarta)] sm:px-6">
      <h1 className="mb-1 text-center text-2xl font-bold">Categories</h1>
      <p className="mb-6 text-center text-sm text-gray-500">
        {activeBudget.name} &middot; {activeBudget.year} &middot; {activeBudget.currency}
      </p>
      <CategoryList
        categories={categories}
        budgetId={activeBudget.id}
        currentPage={page}
        totalPages={totalPages}
        pageSize={PAGE_SIZE}
      />
    </div>
  );
}
