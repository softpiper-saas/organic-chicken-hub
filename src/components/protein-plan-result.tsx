"use client";

import { ExternalLink, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { categoryLabel, formatTk } from "@/lib/nutrition";
import { ProteinPlanResult as ProteinPlanResultType } from "@/types/protein-planner";

type ProteinPlanResultProps = {
  result: ProteinPlanResultType;
  onRemoveFood: (foodType: string) => void;
};

export function ProteinPlanResult({
  result,
  onRemoveFood,
}: ProteinPlanResultProps) {
  return (
    <aside className="space-y-2 lg:sticky lg:top-20">
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xs font-semibold uppercase text-muted-foreground">
            Suggested products
          </h2>
          <Badge variant="outline">{result.selectedItems.length}</Badge>
        </div>
        {result.selectedItems.length === 0 && (
          <div className="rounded-lg border border-dashed bg-white p-3 text-sm text-muted-foreground">
            No products match the current budget and preferences.
          </div>
        )}
        {result.selectedItems.map((item) => (
          <Card key={item.candidateId} className="rounded-lg shadow-sm">
            <CardContent className="p-2.5">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-start gap-2">
                    <h3 className="line-clamp-2 text-sm font-semibold leading-tight">{item.name}</h3>
                    <Badge variant="outline" className="shrink-0 px-1.5 py-0 text-[10px]">
                      {categoryLabel(item.category)}
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {item.quantityLabel} from {item.vendor}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Remove ${item.name}`}
                  onClick={() => onRemoveFood(item.foodType)}
                  className="h-7 w-7 shrink-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="mt-2 grid grid-cols-3 gap-1.5">
                <Metric label="Protein" value={`${Math.round(item.proteinGrams)}g`} />
                <Metric label="Cost" value={formatTk(item.cost)} />
                <Metric label="Price" value={item.priceLabel} />
              </div>

              {item.url && (
                <Button variant="outline" size="sm" className="mt-2 h-7 w-full text-xs" asChild>
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
    </aside>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-muted px-2 py-1.5">
      <p className="text-[11px] leading-none text-muted-foreground">{label}</p>
      <p className="mt-1 truncate text-xs font-semibold">{value}</p>
    </div>
  );
}
