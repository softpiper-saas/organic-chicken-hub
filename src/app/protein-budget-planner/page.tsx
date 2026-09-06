import { ProteinBudgetPlanner } from "@/components/protein-budget-planner";
import { parsePlannerInputFromUrl } from "@/lib/protein-planner-url";

export const metadata = {
  title: "Protein Budget Planner Bangladesh",
  description:
    "Calculate your daily protein target and build a budget-aware food plan with chicken, fish, eggs, dal, nuts, seeds, and dairy in Bangladesh.",
};

type ProteinBudgetPlannerPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function toUrlSearchParams(searchParams: Record<string, string | string[] | undefined>) {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(searchParams)) {
    if (Array.isArray(value)) {
      params.set(key, value.join(","));
    } else if (value !== undefined) {
      params.set(key, value);
    }
  }

  return params;
}

export default async function ProteinBudgetPlannerPage({
  searchParams,
}: ProteinBudgetPlannerPageProps) {
  const params = toUrlSearchParams((await searchParams) ?? {});
  const initialInput = parsePlannerInputFromUrl(params);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-6xl px-4 py-8 md:px-6 md:py-10">
        <ProteinBudgetPlanner
          initialInput={initialInput}
          urlProvidedPreferences={params.has("preferredCategories")}
        />
      </div>
    </div>
  );
}
