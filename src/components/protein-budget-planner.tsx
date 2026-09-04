"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Calculator, Target, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ProteinPlanResult } from "@/components/protein-plan-result";
import { categoryLabel, formatTk } from "@/lib/nutrition";
import { generateProteinPlan } from "@/lib/protein-planner";
import {
  ActivityLevel,
  BudgetPeriod,
  FoodCategory,
  Gender,
  PlannerProduct,
  ProteinGoal,
  ProteinPlannerInput,
} from "@/types/protein-planner";

const foodCategories: FoodCategory[] = [
  "chicken",
  "egg",
  "fish",
  "lentil",
  "nuts",
  "seeds",
  "dairy",
  "beef",
];

const defaultInput: ProteinPlannerInput = {
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

export function ProteinBudgetPlanner() {
  const [input, setInput] = useState<ProteinPlannerInput>(defaultInput);
  const [products, setProducts] = useState<PlannerProduct[]>([]);
  const [productsLoaded, setProductsLoaded] = useState(false);

  useEffect(() => {
    async function fetchProducts() {
      try {
        const res = await fetch("/api/products");
        if (res.ok) {
          setProducts(await res.json());
        }
      } catch (error) {
        console.error("Failed to fetch products", error);
      } finally {
        setProductsLoaded(true);
      }
    }

    fetchProducts();
  }, []);

  const result = useMemo(() => generateProteinPlan(input, products), [input, products]);

  const updateInput = <Key extends keyof ProteinPlannerInput>(
    key: Key,
    value: ProteinPlannerInput[Key]
  ) => {
    setInput((current) => ({ ...current, [key]: value }));
  };

  const togglePreferredCategory = (category: FoodCategory) => {
    setInput((current) => {
      const exists = current.preferredCategories.includes(category);
      return {
        ...current,
        preferredCategories: exists
          ? current.preferredCategories.filter((item) => item !== category)
          : [...current.preferredCategories, category],
      };
    });
  };

  const removeFoodType = (foodType: string) => {
    setInput((current) => ({
      ...current,
      excludedFoodTypes: current.excludedFoodTypes.includes(foodType)
        ? current.excludedFoodTypes
        : [...current.excludedFoodTypes, foodType],
    }));
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
      <div className="space-y-6">
        <Card className="rounded-lg">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-green-100 text-green-700">
                <Calculator className="h-5 w-5" />
              </div>
              <div>
                <CardTitle>Protein Budget Planner</CardTitle>
                <CardDescription>
                  Estimate daily protein needs and build a Bangladesh-friendly food plan.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <section className="space-y-4">
              <SectionTitle icon={<Target className="h-4 w-4" />} title="Body and goal" />
              <div className="grid gap-4 sm:grid-cols-2">
                <NumberField
                  id="age"
                  label="Age"
                  value={input.age}
                  min={18}
                  max={90}
                  onChange={(value) => updateInput("age", value)}
                />
                <SelectField
                  label="Gender"
                  value={input.gender}
                  onValueChange={(value) => updateInput("gender", value as Gender)}
                  options={[
                    ["male", "Male"],
                    ["female", "Female"],
                  ]}
                />
                <NumberField
                  id="weight"
                  label="Weight (kg)"
                  value={input.weightKg}
                  min={35}
                  max={180}
                  onChange={(value) => updateInput("weightKg", value)}
                />
                <NumberField
                  id="height"
                  label="Height (cm)"
                  value={input.heightCm}
                  min={120}
                  max={230}
                  onChange={(value) => updateInput("heightCm", value)}
                />
                <SelectField
                  label="Activity"
                  value={input.activityLevel}
                  onValueChange={(value) => updateInput("activityLevel", value as ActivityLevel)}
                  options={[
                    ["sedentary", "Sedentary"],
                    ["light", "Light"],
                    ["moderate", "Moderate"],
                    ["active", "Active"],
                  ]}
                />
                <SelectField
                  label="Goal"
                  value={input.goal}
                  onValueChange={(value) => updateInput("goal", value as ProteinGoal)}
                  options={[
                    ["basic_health", "Basic health"],
                    ["fat_loss", "Fat loss"],
                    ["maintain", "Maintain"],
                    ["muscle_gain", "Muscle gain"],
                  ]}
                />
              </div>
            </section>

            <section className="space-y-4">
              <SectionTitle icon={<Wallet className="h-4 w-4" />} title="Budget" />
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="sm:col-span-2">
                  <NumberField
                    id="budget"
                    label="Budget"
                    value={input.budgetAmount}
                    min={50}
                    max={100000}
                    onChange={(value) => updateInput("budgetAmount", value)}
                  />
                </div>
                <SelectField
                  label="Period"
                  value={input.budgetPeriod}
                  onValueChange={(value) => updateInput("budgetPeriod", value as BudgetPeriod)}
                  options={[
                    ["daily", "Daily"],
                    ["weekly", "Weekly"],
                    ["monthly", "Monthly"],
                  ]}
                />
              </div>
              <div className="rounded-md bg-muted p-3 text-sm text-muted-foreground">
                Daily planning budget: <span className="font-semibold text-foreground">{formatTk(result.budgetPerDay)}</span>
              </div>
            </section>

            <section className="space-y-4">
              <SectionTitle title="Planner mode" />
              <div className="grid gap-2 sm:grid-cols-3">
                <ModeButton
                  active={input.plannerMode === "balanced"}
                  title="Balanced"
                  description="Mix cost and food variety"
                  onClick={() => updateInput("plannerMode", "balanced")}
                />
                <ModeButton
                  active={input.plannerMode === "cheapest"}
                  title="Cheapest"
                  description="Lowest protein cost"
                  onClick={() => updateInput("plannerMode", "cheapest")}
                />
                <ModeButton
                  active={input.plannerMode === "organic"}
                  title="Organic"
                  description="Prefer premium sources"
                  onClick={() => updateInput("plannerMode", "organic")}
                />
              </div>
            </section>

            <section className="space-y-4">
              <SectionTitle title="Food preferences" />
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {foodCategories.map((category) => {
                  const active = input.preferredCategories.includes(category);
                  return (
                    <Button
                      key={category}
                      type="button"
                      variant={active ? "default" : "outline"}
                      className="h-11 justify-start"
                      onClick={() => togglePreferredCategory(category)}
                    >
                      {categoryLabel(category)}
                    </Button>
                  );
                })}
              </div>
              <div className="flex flex-col gap-3 rounded-md border p-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium">Organic / premium preference</p>
                  <p className="text-sm text-muted-foreground">
                    Use verified organic scraped products when available.
                  </p>
                </div>
                <Button
                  type="button"
                  variant={input.organicOnly ? "default" : "outline"}
                  onClick={() => updateInput("organicOnly", !input.organicOnly)}
                >
                  {input.organicOnly ? "Enabled" : "Disabled"}
                </Button>
              </div>
            </section>
          </CardContent>
        </Card>

        <div className="rounded-lg border bg-white p-4 text-sm text-muted-foreground">
          Product prices are pulled from the current product API when possible. Missing categories use estimated local market prices until fish, nuts, eggs, dal, and dairy scraping are expanded.
          {productsLoaded && products.length > 0 && (
            <span className="block pt-2 text-foreground">
              Loaded {products.length} scraped product{products.length === 1 ? "" : "s"} for matching.
            </span>
          )}
        </div>
      </div>

      <ProteinPlanResult
        result={result}
        activeMode={input.plannerMode}
        onModeChange={(mode) => updateInput("plannerMode", mode)}
        onRemoveFood={removeFoodType}
        onResetExclusions={() => updateInput("excludedFoodTypes", [])}
        excludedCount={input.excludedFoodTypes.length}
      />
    </div>
  );
}

function ModeButton({
  active,
  title,
  description,
  onClick,
}: {
  active: boolean;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active
          ? "rounded-md border border-green-700 bg-green-50 p-3 text-left shadow-sm"
          : "rounded-md border bg-background p-3 text-left transition-colors hover:bg-muted"
      }
    >
      <span className={active ? "block font-semibold text-green-800" : "block font-semibold"}>
        {title}
      </span>
      <span className="mt-1 block text-xs text-muted-foreground">{description}</span>
    </button>
  );
}

function NumberField({
  id,
  label,
  value,
  min,
  max,
  onChange,
}: {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </div>
  );
}

function SelectField({
  label,
  value,
  onValueChange,
  options,
}: {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  options: [string, string][];
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map(([optionValue, optionLabel]) => (
            <SelectItem key={optionValue} value={optionValue}>
              {optionLabel}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function SectionTitle({ icon, title }: { icon?: ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2 text-sm font-semibold uppercase text-muted-foreground">
      {icon}
      <span>{title}</span>
    </div>
  );
}
