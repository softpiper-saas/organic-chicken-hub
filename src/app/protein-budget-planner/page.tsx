import { ProteinBudgetPlanner } from "@/components/protein-budget-planner";

export const metadata = {
  title: "Protein Budget Planner Bangladesh",
  description:
    "Calculate your daily protein target and build a budget-aware food plan with chicken, fish, eggs, dal, nuts, seeds, and dairy in Bangladesh.",
};

export default function ProteinBudgetPlannerPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-6xl px-4 py-8 md:px-6 md:py-10">
        <ProteinBudgetPlanner />
      </div>
    </div>
  );
}
