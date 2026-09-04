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
  PlannerMode,
  PlannerProduct,
  ProteinCandidate,
  ProteinPlanItem,
  ProteinPlanOption,
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

const modeLabels: Record<PlannerMode, { label: string; description: string }> = {
  cheapest: {
    label: "Cheapest",
    description: "Prioritizes lowest cost per gram of protein.",
  },
  balanced: {
    label: "Balanced",
    description: "Mixes affordable foods with more variety across categories.",
  },
  organic: {
    label: "Organic",
    description: "Prefers verified organic products and premium sources.",
  },
};

function costPerGramProtein(candidate: ProteinCandidate) {
  return candidate.costPerBaseUnit / candidate.proteinPerBaseUnit;
}

function shareCapForMode(category: FoodCategory, mode: PlannerMode) {
  const baseCap = proteinShareCaps[category] ?? 0.3;

  if (mode === "cheapest") return Math.min(baseCap + 0.2, 0.75);
  if (mode === "organic") return Math.min(baseCap + 0.1, 0.6);

  return baseCap;
}

function scoreCandidate(
  candidate: ProteinCandidate,
  input: ProteinPlannerInput,
  mode: PlannerMode,
  selectedCategoryCounts = new Map<FoodCategory, number>()
) {
  const costWeight = mode === "cheapest" ? 1.4 : mode === "organic" ? 0.8 : 1;
  const preferenceBonus = input.preferredCategories.includes(candidate.category)
    ? mode === "balanced"
      ? 1.8
      : 0.8
    : 0;
  const sourceBonus = candidate.source === "scraped_product" ? 0.4 : 0;
  const organicBonus = candidate.isOrganic ? (mode === "organic" ? 3 : 0.25) : 0;
  const estimatedPenalty = mode === "organic" && candidate.source === "estimated_market" ? 0.6 : 0;
  const requiredOrganicPenalty = input.organicOnly && !candidate.isOrganic ? 8 : 0;
  const repeatedCategoryPenalty =
    mode === "balanced" ? (selectedCategoryCounts.get(candidate.category) ?? 0) * 1.2 : 0;

  return (
    costPerGramProtein(candidate) * costWeight -
    preferenceBonus -
    sourceBonus -
    organicBonus +
    estimatedPenalty +
    requiredOrganicPenalty +
    repeatedCategoryPenalty
  );
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
  strictShareCap: boolean,
  mode: PlannerMode
) {
  const availableQuantity = candidate.maxDailyQuantity - alreadyAllocatedQuantity;
  if (availableQuantity < candidate.minQuantity) return null;

  const shareCap = strictShareCap ? shareCapForMode(candidate.category, mode) : 1;
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

function summarizeItems(items: ProteinPlanItem[], targetProteinGrams: number, budgetPerDay: number) {
  const totalProteinGrams = items.reduce((sum, item) => sum + item.proteinGrams, 0);
  const totalCalories = items.reduce((sum, item) => sum + item.calories, 0);
  const totalCostPerDay = items.reduce((sum, item) => sum + item.cost, 0);
  const proteinGap = Math.max(0, targetProteinGrams - totalProteinGrams);

  return {
    totalProteinGrams,
    totalCalories,
    totalCostPerDay,
    totalCostPerMonth: totalCostPerDay * 30,
    remainingBudget: Math.max(0, budgetPerDay - totalCostPerDay),
    proteinGap,
  };
}

function buildWarnings(
  items: ProteinPlanItem[],
  targetProteinGrams: number,
  budgetPerDay: number,
  proteinGap: number,
  mode: PlannerMode
) {
  const warnings: string[] = [];
  const totalCost = items.reduce((sum, item) => sum + item.cost, 0);
  const categories = new Set(items.map((item) => item.category));

  if (items.length === 0) {
    warnings.push("No plan could be generated from the selected foods and budget.");
  } else if (proteinGap > 5) {
    warnings.push(`The plan is ${Math.round(proteinGap)}g short of the target. Increase budget or allow more food categories.`);
  }

  if (budgetPerDay < 80) {
    warnings.push("The daily budget is very tight, so the plan may not reach the full protein target.");
  }

  if (items.length > 0 && totalCost / Math.max(budgetPerDay, 1) > 0.95 && proteinGap > 0) {
    warnings.push("This plan uses nearly the full budget before meeting the full target.");
  }

  if (mode === "balanced" && categories.size < Math.min(3, items.length)) {
    warnings.push("Food variety is limited by the selected budget or allowed categories.");
  }

  if (mode === "organic" && !items.some((item) => item.source === "scraped_product")) {
    warnings.push("No verified organic scraped products were available for this option, so estimated market foods are used.");
  }

  if (targetProteinGrams > 120 && budgetPerDay < 250) {
    warnings.push("The target is high for this budget. Consider increasing budget or adding lower-cost staples.");
  }

  return warnings;
}

function generateOption(
  input: ProteinPlannerInput,
  products: PlannerProduct[],
  mode: PlannerMode,
  targetProteinGrams: number,
  budgetPerDay: number
): ProteinPlanOption {
  const optionInput = mode === "organic" ? { ...input, organicOnly: true } : input;
  let candidates = buildProteinCandidates(products)
    .filter((candidate) => !optionInput.excludedCategories.includes(candidate.category))
    .filter((candidate) => !optionInput.excludedFoodTypes.includes(candidate.foodType));

  if (optionInput.organicOnly) {
    candidates = candidates.filter((candidate) => candidate.isOrganic || candidate.source === "estimated_market");
  }

  const quantities = new Map<string, number>();
  const categoryCounts = new Map<FoodCategory, number>();
  let remainingProtein = targetProteinGrams;
  let remainingBudget = budgetPerDay;

  for (const strictShareCap of [true, false]) {
    for (let pass = 0; pass < 2; pass += 1) {
      const rankedCandidates = [...candidates].sort(
        (a, b) =>
          scoreCandidate(a, optionInput, mode, categoryCounts) -
          scoreCandidate(b, optionInput, mode, categoryCounts)
      );

      for (const candidate of rankedCandidates) {
        if (remainingProtein <= 0 || remainingBudget <= 0) break;

        if (
          mode === "balanced" &&
          strictShareCap &&
          pass === 0 &&
          categoryCounts.has(candidate.category)
        ) {
          continue;
        }

        const existingQuantity = quantities.get(candidate.id) ?? 0;
        const allocation = allocateCandidate(
          candidate,
          remainingProtein,
          remainingBudget,
          targetProteinGrams,
          existingQuantity,
          strictShareCap,
          mode
        );

        if (!allocation) continue;

        quantities.set(candidate.id, existingQuantity + allocation.quantity);
        categoryCounts.set(candidate.category, (categoryCounts.get(candidate.category) ?? 0) + 1);
        remainingProtein -= allocation.protein;
        remainingBudget -= allocation.cost;
      }
    }
  }

  const selectedItems = candidates
    .map((candidate) => {
      const quantity = quantities.get(candidate.id) ?? 0;
      return quantity > 0 ? toPlanItem(candidate, quantity) : null;
    })
    .filter((item): item is ProteinPlanItem => Boolean(item));

  const summary = summarizeItems(selectedItems, targetProteinGrams, budgetPerDay);
  const modeLabel = modeLabels[mode];

  return {
    mode,
    label: modeLabel.label,
    description: modeLabel.description,
    selectedItems,
    ...summary,
    warnings: buildWarnings(
      selectedItems,
      targetProteinGrams,
      budgetPerDay,
      summary.proteinGap,
      mode
    ),
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

  const planOptions = (["balanced", "cheapest", "organic"] as PlannerMode[]).map((mode) =>
    generateOption(input, products, mode, targetProteinGrams, budgetPerDay)
  );
  const activeOption =
    planOptions.find((option) => option.mode === input.plannerMode) ?? planOptions[0];
  const combinedWarnings = [...warnings, ...activeOption.warnings];

  return {
    targetProteinGrams,
    targetCalories,
    bmr,
    budgetPerDay,
    activeMode: activeOption.mode,
    planOptions,
    selectedItems: activeOption.selectedItems,
    totalProteinGrams: activeOption.totalProteinGrams,
    totalCalories: activeOption.totalCalories,
    totalCostPerDay: activeOption.totalCostPerDay,
    totalCostPerMonth: activeOption.totalCostPerMonth,
    remainingBudget: activeOption.remainingBudget,
    proteinGap: activeOption.proteinGap,
    warnings: combinedWarnings,
  };
}
