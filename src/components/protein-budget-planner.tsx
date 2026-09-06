"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { AlertTriangle, Calculator, RotateCcw, Target, Wallet } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
} from "@/components/ui/select";
import { ProteinPlanResult } from "@/components/protein-plan-result";
import { categoryLabel, formatTk, inferCategoryFromProduct } from "@/lib/nutrition";
import {
  defaultPlannerInput,
  serializePlannerInputToUrl,
} from "@/lib/protein-planner-url";
import { generateProteinPlan } from "@/lib/protein-planner";
import {
  ActivityLevel,
  BudgetPeriod,
  FoodCategory,
  Gender,
  PlannerMode,
  PlannerProduct,
  ProteinPlanResult as ProteinPlanResultType,
  ProteinGoal,
  ProteinPlannerInput,
} from "@/types/protein-planner";

function equalStringLists(first: readonly string[], second: readonly string[]) {
  return first.length === second.length && first.every((item, index) => item === second[index]);
}

type ProteinBudgetPlannerProps = {
  initialInput?: ProteinPlannerInput;
  urlProvidedPreferences?: boolean;
};

export function ProteinBudgetPlanner({
  initialInput = defaultPlannerInput,
  urlProvidedPreferences = false,
}: ProteinBudgetPlannerProps) {
  const [input, setInput] = useState<ProteinPlannerInput>(initialInput);
  const [products, setProducts] = useState<PlannerProduct[]>([]);
  const [productsLoaded, setProductsLoaded] = useState(false);
  const [urlSyncReady, setUrlSyncReady] = useState(false);

  const availableFoodCategories = useMemo(() => {
    const categories = products
      .filter((product) => product.inStock !== false)
      .map(inferCategoryFromProduct)
      .filter((category): category is FoodCategory => Boolean(category));

    return Array.from(new Set(categories));
  }, [products]);

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

  useEffect(() => {
    setUrlSyncReady(true);
  }, []);

  useEffect(() => {
    if (!urlSyncReady || (!urlProvidedPreferences && !productsLoaded)) return;

    const url = new URL(window.location.href);
    const params = serializePlannerInputToUrl(input);
    const nextSearch = params.toString();

    if (url.search.slice(1) === nextSearch) return;

    url.search = nextSearch;
    window.history.replaceState(null, "", url);
  }, [input, productsLoaded, urlProvidedPreferences, urlSyncReady]);

  useEffect(() => {
    if (urlProvidedPreferences || !productsLoaded) return;

    setInput((current) => {
      if (equalStringLists(current.preferredCategories, availableFoodCategories)) {
        return current;
      }

      return { ...current, preferredCategories: availableFoodCategories };
    });
  }, [availableFoodCategories, productsLoaded, urlProvidedPreferences]);

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
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_420px]">
      <div className="space-y-4">
        <Card className="rounded-lg">
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-green-100 text-green-700">
                <Calculator className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-base">Protein Budget Planner</CardTitle>
                <CardDescription className="text-sm">
                  Estimate daily protein needs and build a Bangladesh-friendly food plan.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 p-4 pt-2">
            <section className="space-y-3">
              <SectionTitle icon={<Target className="h-4 w-4" />} title="Body and goal" />
              <div className="grid gap-3 sm:grid-cols-2">
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

            <section className="space-y-3">
              <SectionTitle icon={<Wallet className="h-4 w-4" />} title="Budget" />
              <div className="grid gap-3 sm:grid-cols-3">
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
              <div className="rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">
                Daily planning budget: <span className="font-semibold text-foreground">{formatTk(result.budgetPerDay)}</span>
              </div>
            </section>

            <PlanOverview
              result={result}
              activeMode={input.plannerMode}
              onModeChange={(mode) => updateInput("plannerMode", mode)}
              onResetExclusions={() => updateInput("excludedFoodTypes", [])}
              excludedCount={input.excludedFoodTypes.length}
            />

            <section className="space-y-3">
              <SectionTitle title="Food preferences" />
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {availableFoodCategories.map((category) => {
                  const active = input.preferredCategories.includes(category);
                  return (
                    <Button
                      key={category}
                      type="button"
                      variant={active ? "default" : "outline"}
                      className="h-9 justify-start"
                      onClick={() => togglePreferredCategory(category)}
                    >
                      {categoryLabel(category)}
                    </Button>
                  );
                })}
                {productsLoaded && availableFoodCategories.length === 0 && (
                  <p className="col-span-full rounded-md border border-dashed p-3 text-sm text-muted-foreground">
                    No in-stock scraped products are available yet.
                  </p>
                )}
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

        <div className="rounded-lg border bg-white p-3 text-sm text-muted-foreground">
          Product prices are pulled only from active products currently saved in the database.
          {productsLoaded && products.length > 0 && (
            <span className="block pt-2 text-foreground">
              Loaded {products.length} active scraped product{products.length === 1 ? "" : "s"} across {availableFoodCategories.length} categor{availableFoodCategories.length === 1 ? "y" : "ies"}.
            </span>
          )}
        </div>
      </div>

      <ProteinPlanResult
        result={result}
        onRemoveFood={removeFoodType}
      />
    </div>
  );
}

function PlanOverview({
  result,
  activeMode,
  onModeChange,
  onResetExclusions,
  excludedCount,
}: {
  result: ProteinPlanResultType;
  activeMode: PlannerMode;
  onModeChange: (mode: PlannerMode) => void;
  onResetExclusions: () => void;
  excludedCount: number;
}) {
  const activeOption = result.planOptions.find((option) => option.mode === activeMode);
  const isUnderBudget = result.totalCostPerDay <= result.budgetPerDay;
  const targetMet = result.proteinGap <= 5;

  return (
    <section className="space-y-2">
      <SectionTitle title="Plan overview" />
      <div className="grid grid-cols-3 gap-1 rounded-lg border bg-white p-1 shadow-sm">
        {result.planOptions.map((option) => {
          const active = option.mode === activeMode;
          const optionTargetMet = option.proteinGap <= 5;

          return (
            <button
              key={option.mode}
              type="button"
              aria-pressed={active}
              onClick={() => onModeChange(option.mode)}
              className={
                active
                  ? "rounded-md bg-green-50 px-2 py-1.5 text-left text-green-900 ring-1 ring-green-700"
                  : "rounded-md px-2 py-1.5 text-left transition-colors hover:bg-muted"
              }
            >
              <span className="block truncate text-sm font-semibold">{option.label}</span>
              <span className="mt-1 flex items-center justify-between gap-1 text-[11px]">
                <Badge
                  variant={optionTargetMet ? "default" : "secondary"}
                  className="px-1.5 py-0 text-[10px]"
                >
                  {Math.round(option.totalProteinGrams)}g
                </Badge>
                <span className="truncate font-medium">{formatTk(option.totalCostPerDay)}</span>
              </span>
            </button>
          );
        })}
      </div>

      <div className="rounded-lg border bg-zinc-950 p-3 text-white">
        <div className="mb-2 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold">Your {activeOption?.label} Plan</h2>
            <p className="text-xs text-zinc-400">Daily targets and allocation.</p>
          </div>
          <Badge className={isUnderBudget ? "shrink-0 bg-emerald-600" : "shrink-0 bg-red-600"}>
            {isUnderBudget ? "Under budget" : "Over budget"}
          </Badge>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <SummaryMetric label="Target" value={`${result.targetProteinGrams}g`} />
          <SummaryMetric
            label="Plan protein"
            value={`${Math.round(result.totalProteinGrams)}g`}
            highlight={targetMet}
          />
          <SummaryMetric label="Calories" value={`${result.targetCalories}`} />
          <SummaryMetric label="Daily cost" value={formatTk(result.totalCostPerDay)} />
          <SummaryMetric label="Monthly" value={formatTk(result.totalCostPerMonth)} />
          <SummaryMetric
            label="Remaining"
            value={formatTk(result.remainingBudget)}
            highlight={isUnderBudget}
          />
        </div>
      </div>

      {excludedCount > 0 && (
        <Button variant="outline" className="w-full" onClick={onResetExclusions}>
          <RotateCcw className="h-4 w-4" />
          Reset removed foods
        </Button>
      )}

      {result.warnings.length > 0 && (
        <div className="space-y-1.5 rounded-lg border border-amber-200 bg-amber-50 p-2.5 text-sm text-amber-900">
          {result.warnings.map((warning) => (
            <div key={warning} className="flex gap-2">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{warning}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function SummaryMetric({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="rounded-md border border-white/10 bg-zinc-900 p-2">
      <p className="text-xs text-zinc-400">{label}</p>
      <p className={highlight ? "mt-1 truncate text-sm font-semibold text-emerald-300" : "mt-1 truncate text-sm font-semibold"}>
        {value}
      </p>
    </div>
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
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs font-semibold">{label}</Label>
      <Input
        id={id}
        type="number"
        className="h-8"
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
  const selectedLabel = options.find(([optionValue]) => optionValue === value)?.[1];

  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-semibold">{label}</Label>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className="h-8">
          <span className="truncate">{selectedLabel ?? value}</span>
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
    <div className="flex items-center gap-2 text-xs font-semibold uppercase text-muted-foreground">
      {icon}
      <span>{title}</span>
    </div>
  );
}
