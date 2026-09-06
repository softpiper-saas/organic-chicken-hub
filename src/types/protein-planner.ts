export type Gender = "male" | "female";

export type ActivityLevel = "sedentary" | "light" | "moderate" | "active";

export type ProteinGoal =
  | "basic_health"
  | "fat_loss"
  | "maintain"
  | "muscle_gain";

export type BudgetPeriod = "daily" | "weekly" | "monthly";

export type PlannerMode = "cheapest" | "balanced" | "premium";

export type FoodCategory =
  | "chicken"
  | "egg"
  | "fish"
  | "lentil"
  | "nuts"
  | "seeds"
  | "dairy"
  | "beef";

export type CandidateUnit = "gram" | "unit" | "serving";

export type CandidateSource = "scraped_product" | "estimated_market";

export type PlannerProduct = {
  id: string;
  name: string;
  vendor: string;
  price: number;
  url: string;
  category?: string | null;
  foodType?: string | null;
  packageSize?: number | null;
  packageUnit?: string | null;
  normalizedPricePerKg?: number | null;
  normalizedPricePerUnit?: number | null;
  isOrganic: boolean | null;
  inStock?: boolean | null;
  nutritionVerified?: boolean | null;
  imageUrl?: string | null;
};

export type NutritionProfile = {
  foodType: string;
  displayName: string;
  category: FoodCategory;
  unit: CandidateUnit;
  proteinPer100g?: number;
  caloriesPer100g?: number;
  fatPer100g?: number;
  carbsPer100g?: number;
  proteinPerUnit?: number;
  caloriesPerUnit?: number;
  proteinPerServing?: number;
  caloriesPerServing?: number;
  maxDailyQuantity: number;
  minQuantity: number;
  stepSize: number;
  defaultPrice: number;
  priceBasis: "kg" | "unit" | "serving";
  servingLabel: string;
};

export type ProteinPlannerInput = {
  age: number;
  gender: Gender;
  weightKg: number;
  heightCm: number;
  activityLevel: ActivityLevel;
  goal: ProteinGoal;
  budgetAmount: number;
  budgetPeriod: BudgetPeriod;
  preferredCategories: FoodCategory[];
  excludedCategories: FoodCategory[];
  excludedFoodTypes: string[];
  organicOnly: boolean;
  plannerMode: PlannerMode;
  mealCount: 2 | 3 | 4;
};

export type ProteinCandidate = {
  id: string;
  name: string;
  foodType: string;
  category: FoodCategory;
  vendor: string;
  url?: string;
  source: CandidateSource;
  isOrganic: boolean;
  unit: CandidateUnit;
  costPerBaseUnit: number;
  proteinPerBaseUnit: number;
  caloriesPerBaseUnit: number;
  maxDailyQuantity: number;
  minQuantity: number;
  stepSize: number;
  servingLabel: string;
  priceLabel: string;
};

export type ProteinPlanItem = {
  candidateId: string;
  name: string;
  foodType: string;
  category: FoodCategory;
  vendor: string;
  url?: string;
  source: CandidateSource;
  quantity: number;
  quantityLabel: string;
  proteinGrams: number;
  calories: number;
  cost: number;
  priceLabel: string;
};

export type ProteinPlanOption = {
  mode: PlannerMode;
  label: string;
  description: string;
  selectedItems: ProteinPlanItem[];
  totalProteinGrams: number;
  totalCalories: number;
  totalCostPerDay: number;
  totalCostPerMonth: number;
  remainingBudget: number;
  proteinGap: number;
  warnings: string[];
};

export type ProteinPlanResult = {
  targetProteinGrams: number;
  targetCalories: number;
  bmr: number;
  budgetPerDay: number;
  activeMode: PlannerMode;
  planOptions: ProteinPlanOption[];
  selectedItems: ProteinPlanItem[];
  totalProteinGrams: number;
  totalCalories: number;
  totalCostPerDay: number;
  totalCostPerMonth: number;
  remainingBudget: number;
  proteinGap: number;
  warnings: string[];
};
