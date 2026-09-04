"use client";

import { AlertTriangle, ExternalLink, RotateCcw, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { categoryLabel, formatTk } from "@/lib/nutrition";
import {
  PlannerMode,
  ProteinPlanResult as ProteinPlanResultType,
} from "@/types/protein-planner";

type ProteinPlanResultProps = {
  result: ProteinPlanResultType;
  activeMode: PlannerMode;
  onModeChange: (mode: PlannerMode) => void;
  onRemoveFood: (foodType: string) => void;
  onResetExclusions: () => void;
  excludedCount: number;
};

export function ProteinPlanResult({
  result,
  activeMode,
  onModeChange,
  onRemoveFood,
  onResetExclusions,
  excludedCount,
}: ProteinPlanResultProps) {
  const isUnderBudget = result.totalCostPerDay <= result.budgetPerDay;
  const targetMet = result.proteinGap <= 5;

  return (
    <div className="space-y-4 lg:sticky lg:top-24">
      <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-1">
        {result.planOptions.map((option) => {
          const active = option.mode === activeMode;
          const optionTargetMet = option.proteinGap <= 5;

          return (
            <button
              key={option.mode}
              type="button"
              onClick={() => onModeChange(option.mode)}
              className={
                active
                  ? "rounded-lg border border-green-700 bg-green-50 p-3 text-left shadow-sm"
                  : "rounded-lg border bg-white p-3 text-left transition-colors hover:bg-muted"
              }
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className={active ? "font-semibold text-green-800" : "font-semibold"}>
                    {option.label}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {option.description}
                  </p>
                </div>
                <Badge variant={optionTargetMet ? "default" : "secondary"}>
                  {Math.round(option.totalProteinGrams)}g
                </Badge>
              </div>
              <div className="mt-3 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Daily cost</span>
                <span className="font-semibold">{formatTk(option.totalCostPerDay)}</span>
              </div>
            </button>
          );
        })}
      </div>

      <Card className="overflow-hidden rounded-lg">
        <CardHeader className="bg-zinc-950 text-white">
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle className="text-2xl">Your {result.planOptions.find((option) => option.mode === activeMode)?.label} Plan</CardTitle>
              <p className="mt-1 text-sm text-zinc-300">
                Estimated daily targets and food allocation.
              </p>
            </div>
            <Badge className={isUnderBudget ? "bg-emerald-600" : "bg-red-600"}>
              {isUnderBudget ? "Under budget" : "Over budget"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 p-4">
          <ResultRow label="Protein Target" value={`${result.targetProteinGrams}g`} />
          <ResultRow label="Plan Protein" value={`${Math.round(result.totalProteinGrams)}g`} highlight={targetMet} />
          <ResultRow label="Food Energy" value={`${result.targetCalories} Calories`} />
          <ResultRow label="Daily Cost" value={formatTk(result.totalCostPerDay)} />
          <ResultRow label="Monthly Cost" value={formatTk(result.totalCostPerMonth)} />
          <ResultRow label="Remaining Budget" value={formatTk(result.remainingBudget)} highlight={isUnderBudget} />
        </CardContent>
      </Card>

      {excludedCount > 0 && (
        <Button variant="outline" className="w-full" onClick={onResetExclusions}>
          <RotateCcw className="h-4 w-4" />
          Reset removed foods
        </Button>
      )}

      {result.warnings.length > 0 && (
        <div className="space-y-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          {result.warnings.map((warning) => (
            <div key={warning} className="flex gap-2">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{warning}</span>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-3">
        {result.selectedItems.map((item) => (
          <Card key={item.candidateId} className="rounded-lg shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold leading-tight">{item.name}</h3>
                    <Badge variant="outline">{categoryLabel(item.category)}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {item.quantityLabel} from {item.vendor}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Remove ${item.name}`}
                  onClick={() => onRemoveFood(item.foodType)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2 text-sm">
                <Metric label="Protein" value={`${Math.round(item.proteinGrams)}g`} />
                <Metric label="Cost" value={formatTk(item.cost)} />
                <Metric label="Price" value={item.priceLabel} />
              </div>

              {item.url && (
                <Button variant="outline" size="sm" className="mt-4 w-full" asChild>
                  <a href={item.url} target="_blank" rel="noopener noreferrer">
                    View product
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function ResultRow({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="grid grid-cols-[1fr_auto] items-center overflow-hidden rounded-md border border-orange-900/30 bg-zinc-950 text-white">
      <div className="bg-zinc-900 px-4 py-3 text-sm font-medium">{label}</div>
      <div className={highlight ? "px-4 py-3 text-sm font-semibold text-emerald-300" : "px-4 py-3 text-sm font-semibold"}>
        {value}
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-muted p-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="truncate text-sm font-semibold">{value}</p>
    </div>
  );
}
