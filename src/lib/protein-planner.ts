import {
  buildProteinCandidates,
  calculateBmr,
  calculateProteinTarget,
  calculateTargetCalories,
  formatQuantity,
  toDailyBudget,
} from "@/lib/nutrition";
import {
  FoodCategory,
  PlannerProduct,
  ProteinCandidate,
  ProteinPlanItem,
  ProteinPlanResult,
  ProteinPlannerInput,
} from "@/types/protein-planner";

const proteinShareCaps: Partial<Record<FoodCategory, number>> = {
  chicken: 0.45,
  fish: 0.45,
  egg: 0.25,
  lentil: 0.3,
  nuts: 0.12,
  seeds: 0.1,
  dairy: 0.2,
  beef: 0.35,
};

function costPerGramProtein(candidate: ProteinCandidate) {
  return candidate.costPerBaseUnit / candidate.proteinPerBaseUnit;
}

function scoreCandidate(candidate: ProteinCandidate, input: ProteinPlannerInput) {
  const preferenceBonus = input.preferredCategories.includes(candidate.category) ? 1.5 : 0;
  const sourceBonus = candidate.source === "scraped_product" ? 0.4 : 0;
  const organicPenalty = input.organicOnly && !candidate.isOrganic ? 8 : 0;

  return costPerGramProtein(candidate) - preferenceBonus - sourceBonus + organicPenalty;
}

function roundToStep(value: number, step: number) {
  return Math.floor(value / step) * step;
}

function allocateCandidate(
  candidate: ProteinCandidate,
  remainingProtein: number,
  remainingBudget: number,
  targetProtein: number,
  alreadyAllocatedQuantity: number,
  strictShareCap: boolean
) {
  const availableQuantity = candidate.maxDailyQuantity - alreadyAllocatedQuantity;
  if (availableQuantity < candidate.minQuantity) return null;

  const shareCap = strictShareCap ? proteinShareCaps[candidate.category] ?? 0.3 : 1;
  const maxProteinFromCandidate = Math.min(remainingProtein, targetProtein * shareCap);

  const quantityByProtein = maxProteinFromCandidate / candidate.proteinPerBaseUnit;
  const quantityByBudget = remainingBudget / candidate.costPerBaseUnit;
  const rawQuantity = Math.min(availableQuantity, quantityByProtein, quantityByBudget);
  const quantity = roundToStep(rawQuantity, candidate.stepSize);

  if (quantity < candidate.minQuantity) return null;

  return {
    quantity,
    protein: quantity * candidate.proteinPerBaseUnit,
    calories: quantity * candidate.caloriesPerBaseUnit,
    cost: quantity * candidate.costPerBaseUnit,
  };
}

function toPlanItem(candidate: ProteinCandidate, quantity: number): ProteinPlanItem {
  return {
    candidateId: candidate.id,
    name: candidate.name,
    foodType: candidate.foodType,
    category: candidate.category,
    vendor: candidate.vendor,
    url: candidate.url,
    source: candidate.source,
    quantity,
    quantityLabel: formatQuantity(quantity, candidate),
    proteinGrams: quantity * candidate.proteinPerBaseUnit,
    calories: quantity * candidate.caloriesPerBaseUnit,
    cost: quantity * candidate.costPerBaseUnit,
    priceLabel: candidate.priceLabel,
  };
}

export function generateProteinPlan(
  input: ProteinPlannerInput,
  products: PlannerProduct[]
): ProteinPlanResult {
  const targetProteinGrams = calculateProteinTarget(input);
  const targetCalories = calculateTargetCalories(input);
  const bmr = calculateBmr(input);
  const budgetPerDay = toDailyBudget(input.budgetAmount, input.budgetPeriod);
  const warnings: string[] = [];

  if (input.age < 18) {
    warnings.push("This planner is built for adults. For users under 18, use guidance from a guardian or qualified professional.");
  }

  if (budgetPerDay < 80) {
    warnings.push("The daily budget is very tight, so the plan may not reach the full protein target.");
  }

  let candidates = buildProteinCandidates(products)
    .filter((candidate) => !input.excludedCategories.includes(candidate.category))
    .filter((candidate) => !input.excludedFoodTypes.includes(candidate.foodType));

  if (input.organicOnly) {
    candidates = candidates.filter((candidate) => candidate.isOrganic || candidate.source === "estimated_market");
    warnings.push("Organic-only mode uses verified organic scraped products where available and estimated market options as fallback.");
  }

  candidates = candidates.sort((a, b) => scoreCandidate(a, input) - scoreCandidate(b, input));

  const quantities = new Map<string, number>();
  let remainingProtein = targetProteinGrams;
  let remainingBudget = budgetPerDay;

  for (const strictShareCap of [true, false]) {
    for (const candidate of candidates) {
      if (remainingProtein <= 0 || remainingBudget <= 0) break;

      const existingQuantity = quantities.get(candidate.id) ?? 0;
      const allocation = allocateCandidate(
        candidate,
        remainingProtein,
        remainingBudget,
        targetProteinGrams,
        existingQuantity,
        strictShareCap
      );

      if (!allocation) continue;

      quantities.set(candidate.id, existingQuantity + allocation.quantity);
      remainingProtein -= allocation.protein;
      remainingBudget -= allocation.cost;
    }
  }

  const selectedItems = candidates
    .map((candidate) => {
      const quantity = quantities.get(candidate.id) ?? 0;
      return quantity > 0 ? toPlanItem(candidate, quantity) : null;
    })
    .filter((item): item is ProteinPlanItem => Boolean(item));

  const totalProteinGrams = selectedItems.reduce((sum, item) => sum + item.proteinGrams, 0);
  const totalCalories = selectedItems.reduce((sum, item) => sum + item.calories, 0);
  const totalCostPerDay = selectedItems.reduce((sum, item) => sum + item.cost, 0);
  const proteinGap = Math.max(0, targetProteinGrams - totalProteinGrams);

  if (selectedItems.length === 0) {
    warnings.push("No plan could be generated from the selected foods and budget.");
  } else if (proteinGap > 5) {
    warnings.push(`The plan is ${Math.round(proteinGap)}g short of the target. Increase budget or allow more food categories.`);
  }

  return {
    targetProteinGrams,
    targetCalories,
    bmr,
    budgetPerDay,
    selectedItems,
    totalProteinGrams,
    totalCalories,
    totalCostPerDay,
    totalCostPerMonth: totalCostPerDay * 30,
    remainingBudget: Math.max(0, budgetPerDay - totalCostPerDay),
    proteinGap,
    warnings,
  };
}
