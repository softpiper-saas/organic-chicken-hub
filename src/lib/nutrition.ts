import { nutritionProfiles } from "@/data/nutrition-profiles";
import {
  ActivityLevel,
  BudgetPeriod,
  FoodCategory,
  Gender,
  NutritionProfile,
  PlannerProduct,
  ProteinCandidate,
  ProteinGoal,
  ProteinPlannerInput,
} from "@/types/protein-planner";

const activityMultipliers: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
};

const goalCalorieMultipliers: Record<ProteinGoal, number> = {
  basic_health: 1,
  fat_loss: 0.85,
  maintain: 1,
  muscle_gain: 1.1,
};

const proteinMultipliers: Record<ProteinGoal, number> = {
  basic_health: 1,
  fat_loss: 1.6,
  maintain: 1.2,
  muscle_gain: 1.8,
};

const categoryKeywords: Record<FoodCategory, string[]> = {
  chicken: ["chicken", "murgi", "মুরগ"],
  egg: ["egg", "dim", "ডিম"],
  fish: [
    "fish",
    "ilish",
    "hilsha",
    "rui",
    "katla",
    "pangash",
    "pabda",
    "prawn",
    "chingri",
    "boal",
    "citol",
    "koral",
    "tengra",
    "মাছ",
    "ইলিশ",
    "চিংড়ি",
    "চিংড়ি",
    "কাতল",
    "পাঙ্গাশ",
  ],
  lentil: ["dal", "lentil", "ডাল"],
  nuts: ["nut", "almond", "cashew", "walnut", "pistachio", "peanut", "বাদাম", "কাজু"],
  seeds: ["seed", "chia", "flax", "pumpkin", "sunflower", "তিল"],
  dairy: ["milk", "yogurt", "doi", "dairy", "দুধ", "দই"],
  beef: ["beef", "গরু"],
};

export function calculateBmr(input: Pick<ProteinPlannerInput, "gender" | "weightKg" | "heightCm" | "age">) {
  const base = 10 * input.weightKg + 6.25 * input.heightCm - 5 * input.age;
  return Math.round(input.gender === "male" ? base + 5 : base - 161);
}

export function calculateTargetCalories(input: ProteinPlannerInput) {
  const bmr = calculateBmr(input);
  const maintenance = bmr * activityMultipliers[input.activityLevel];
  return Math.round(maintenance * goalCalorieMultipliers[input.goal]);
}

export function calculateProteinTarget(input: ProteinPlannerInput) {
  const calculatedTarget = Math.round(input.weightKg * proteinMultipliers[input.goal]);
  const minimumTarget = input.gender === "male" ? 50 : 45;
  return Math.max(calculatedTarget, minimumTarget);
}

export function toDailyBudget(amount: number, period: BudgetPeriod) {
  if (period === "daily") return amount;
  if (period === "weekly") return amount / 7;
  return amount / 30;
}

export function inferCategoryFromProduct(product: PlannerProduct): FoodCategory | null {
  const searchable = `${product.name} ${product.vendor}`.toLowerCase();

  for (const [category, keywords] of Object.entries(categoryKeywords) as [FoodCategory, string[]][]) {
    if (keywords.some((keyword) => searchable.includes(keyword))) {
      return category;
    }
  }

  return product.isOrganic ? "chicken" : null;
}

export function profileForCategory(category: FoodCategory, productName?: string) {
  if (category === "nuts" && productName) {
    const lowerName = productName.toLowerCase();
    if (lowerName.includes("peanut")) {
      return nutritionProfiles.find((profile) => profile.foodType === "peanut");
    }
    if (lowerName.includes("almond") || lowerName.includes("cashew") || lowerName.includes("walnut")) {
      return nutritionProfiles.find((profile) => profile.foodType === "almond");
    }
  }

  if (category === "fish") {
    return nutritionProfiles.find((profile) => profile.foodType === "fish_generic");
  }

  return nutritionProfiles.find((profile) => profile.category === category);
}

function priceLabelForProfile(profile: NutritionProfile, price: number) {
  if (profile.priceBasis === "kg") return `${Math.round(price)} Tk/kg`;
  if (profile.priceBasis === "unit") return `${Math.round(price)} Tk/pc`;
  return `${Math.round(price)} Tk/serving`;
}

function candidateFromProfile(profile: NutritionProfile): ProteinCandidate {
  const costPerBaseUnit =
    profile.priceBasis === "kg" ? profile.defaultPrice / 1000 : profile.defaultPrice;

  const proteinPerBaseUnit =
    profile.unit === "gram"
      ? (profile.proteinPer100g ?? 0) / 100
      : profile.unit === "unit"
        ? profile.proteinPerUnit ?? 0
        : profile.proteinPerServing ?? 0;

  const caloriesPerBaseUnit =
    profile.unit === "gram"
      ? (profile.caloriesPer100g ?? 0) / 100
      : profile.unit === "unit"
        ? profile.caloriesPerUnit ?? 0
        : profile.caloriesPerServing ?? 0;

  return {
    id: `estimated-${profile.foodType}`,
    name: profile.displayName,
    foodType: profile.foodType,
    category: profile.category,
    vendor: "Estimated local market",
    source: "estimated_market",
    isOrganic: false,
    unit: profile.unit,
    costPerBaseUnit,
    proteinPerBaseUnit,
    caloriesPerBaseUnit,
    maxDailyQuantity: profile.maxDailyQuantity,
    minQuantity: profile.minQuantity,
    stepSize: profile.stepSize,
    servingLabel: profile.servingLabel,
    priceLabel: priceLabelForProfile(profile, profile.defaultPrice),
  };
}

function candidateFromProduct(product: PlannerProduct): ProteinCandidate | null {
  const category = inferCategoryFromProduct(product);
  if (!category) return null;

  const profile = profileForCategory(category, product.name);
  if (!profile) return null;

  const base = candidateFromProfile(profile);
  const costPerBaseUnit = profile.priceBasis === "kg" ? product.price / 1000 : product.price;

  return {
    ...base,
    id: product.id,
    name: product.name,
    vendor: product.vendor,
    url: product.url,
    source: "scraped_product",
    isOrganic: Boolean(product.isOrganic),
    costPerBaseUnit,
    priceLabel: priceLabelForProfile(profile, product.price),
  };
}

export function buildProteinCandidates(products: PlannerProduct[]) {
  const productCandidates = products
    .map(candidateFromProduct)
    .filter((candidate): candidate is ProteinCandidate => Boolean(candidate));

  const estimatedCandidates = nutritionProfiles.map(candidateFromProfile);

  return [...productCandidates, ...estimatedCandidates].filter(
    (candidate) => candidate.proteinPerBaseUnit > 0 && candidate.costPerBaseUnit > 0
  );
}

export function formatQuantity(quantity: number, candidate: Pick<ProteinCandidate, "unit" | "servingLabel">) {
  if (candidate.unit === "gram") return `${Math.round(quantity)}${candidate.servingLabel}`;
  return `${Number.isInteger(quantity) ? quantity : quantity.toFixed(1)} ${candidate.servingLabel}`;
}

export function formatTk(value: number) {
  return `${Math.round(value).toLocaleString("en-US")} Tk`;
}

export function categoryLabel(category: FoodCategory) {
  return category.charAt(0).toUpperCase() + category.slice(1);
}

export function genderLabel(gender: Gender) {
  return gender === "male" ? "Male" : "Female";
}
