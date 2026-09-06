import {
  ActivityLevel,
  BudgetPeriod,
  FoodCategory,
  Gender,
  PlannerMode,
  ProteinGoal,
  ProteinPlannerInput,
} from "@/types/protein-planner";

export const defaultPlannerInput: ProteinPlannerInput = {
  age: 30,
  gender: "male",
  weightKg: 70,
  heightCm: 170,
  activityLevel: "light",
  goal: "basic_health",
  budgetAmount: 300,
  budgetPeriod: "daily",
  preferredCategories: ["chicken", "egg", "fish", "lentil"],
  excludedCategories: [],
  excludedFoodTypes: [],
  organicOnly: false,
  plannerMode: "balanced",
  mealCount: 3,
};

const genderValues: readonly Gender[] = ["male", "female"];
const activityValues: readonly ActivityLevel[] = ["sedentary", "light", "moderate", "active"];
const goalValues: readonly ProteinGoal[] = ["basic_health", "fat_loss", "maintain", "muscle_gain"];
const budgetPeriodValues: readonly BudgetPeriod[] = ["daily", "weekly", "monthly"];
const plannerModeValues: readonly PlannerMode[] = ["cheapest", "balanced", "organic"];
const foodCategoryValues: readonly FoodCategory[] = [
  "chicken",
  "egg",
  "fish",
  "lentil",
  "nuts",
  "seeds",
  "dairy",
  "beef",
];
const mealCountValues = [2, 3, 4] as const;

function toBoundedNumber(value: string | null, fallback: number, min: number, max: number) {
  if (value === null) return fallback;

  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;

  return Math.min(Math.max(parsed, min), max);
}

function toOptionValue<T extends string>(value: string | null, options: readonly T[], fallback: T) {
  return value && options.includes(value as T) ? (value as T) : fallback;
}

function toBooleanValue(value: string | null, fallback: boolean) {
  if (value === null) return fallback;
  return value === "true" || value === "1";
}

function toOptionList<T extends string>(value: string | null, options: readonly T[], fallback: T[]) {
  if (value === null) return fallback;
  if (value.trim() === "") return [];

  return value
    .split(",")
    .map((item) => item.trim())
    .filter((item): item is T => options.includes(item as T));
}

function toStringList(value: string | null, fallback: string[]) {
  if (value === null) return fallback;
  if (value.trim() === "") return [];

  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function toMealCount(value: string | null, fallback: ProteinPlannerInput["mealCount"]) {
  const parsed = Number(value);
  return mealCountValues.includes(parsed as ProteinPlannerInput["mealCount"])
    ? (parsed as ProteinPlannerInput["mealCount"])
    : fallback;
}

export function parsePlannerInputFromUrl(params: URLSearchParams): ProteinPlannerInput {
  return {
    age: toBoundedNumber(params.get("age"), defaultPlannerInput.age, 18, 90),
    gender: toOptionValue(params.get("gender"), genderValues, defaultPlannerInput.gender),
    weightKg: toBoundedNumber(params.get("weightKg"), defaultPlannerInput.weightKg, 35, 180),
    heightCm: toBoundedNumber(params.get("heightCm"), defaultPlannerInput.heightCm, 120, 230),
    activityLevel: toOptionValue(
      params.get("activityLevel"),
      activityValues,
      defaultPlannerInput.activityLevel
    ),
    goal: toOptionValue(params.get("goal"), goalValues, defaultPlannerInput.goal),
    budgetAmount: toBoundedNumber(
      params.get("budgetAmount"),
      defaultPlannerInput.budgetAmount,
      50,
      100000
    ),
    budgetPeriod: toOptionValue(
      params.get("budgetPeriod"),
      budgetPeriodValues,
      defaultPlannerInput.budgetPeriod
    ),
    preferredCategories: toOptionList(
      params.get("preferredCategories"),
      foodCategoryValues,
      defaultPlannerInput.preferredCategories
    ),
    excludedCategories: toOptionList(
      params.get("excludedCategories"),
      foodCategoryValues,
      defaultPlannerInput.excludedCategories
    ),
    excludedFoodTypes: toStringList(
      params.get("excludedFoodTypes"),
      defaultPlannerInput.excludedFoodTypes
    ),
    organicOnly: toBooleanValue(params.get("organicOnly"), defaultPlannerInput.organicOnly),
    plannerMode: toOptionValue(
      params.get("plannerMode"),
      plannerModeValues,
      defaultPlannerInput.plannerMode
    ),
    mealCount: toMealCount(params.get("mealCount"), defaultPlannerInput.mealCount),
  };
}

export function serializePlannerInputToUrl(input: ProteinPlannerInput) {
  const params = new URLSearchParams();

  params.set("age", String(input.age));
  params.set("gender", input.gender);
  params.set("weightKg", String(input.weightKg));
  params.set("heightCm", String(input.heightCm));
  params.set("activityLevel", input.activityLevel);
  params.set("goal", input.goal);
  params.set("budgetAmount", String(input.budgetAmount));
  params.set("budgetPeriod", input.budgetPeriod);
  params.set("preferredCategories", input.preferredCategories.join(","));
  params.set("excludedCategories", input.excludedCategories.join(","));
  params.set("excludedFoodTypes", input.excludedFoodTypes.join(","));
  params.set("organicOnly", String(input.organicOnly));
  params.set("plannerMode", input.plannerMode);
  params.set("mealCount", String(input.mealCount));

  return params;
}
