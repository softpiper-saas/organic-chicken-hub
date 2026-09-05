"use client";

import type { ProductDraft } from "./admin-types";
import { Input } from "@/components/ui/input";
import { CategorySelect } from "./category-select";

export function ProductDraftFields({
  draft,
  categories,
  onChange,
}: {
  draft: ProductDraft;
  categories: string[];
  onChange: (patch: Partial<ProductDraft>) => void;
}) {
  return (
    <div className="grid gap-3 lg:grid-cols-4">
      <Input className="lg:col-span-2" placeholder="Product name" value={draft.name} onChange={(event) => onChange({ name: event.target.value })} />
      <Input placeholder="Vendor" value={draft.vendor} onChange={(event) => onChange({ vendor: event.target.value })} />
      <Input type="number" placeholder="Current price" value={draft.price} onChange={(event) => onChange({ price: event.target.value })} />
      <Input className="lg:col-span-2" placeholder="Product URL" value={draft.url} onChange={(event) => onChange({ url: event.target.value })} />
      <Input className="lg:col-span-2" placeholder="Image URL" value={draft.imageUrl} onChange={(event) => onChange({ imageUrl: event.target.value })} />
      <Input className="lg:col-span-4" placeholder="Description" value={draft.description} onChange={(event) => onChange({ description: event.target.value })} />
      <CategorySelect value={draft.category} categories={categories} onValueChange={(value) => onChange({ category: value })} />
      <Input placeholder="food type" value={draft.foodType} onChange={(event) => onChange({ foodType: event.target.value })} />
      <Input type="number" placeholder="Package size" value={draft.packageSize} onChange={(event) => onChange({ packageSize: event.target.value })} />
      <Input placeholder="Unit, e.g. kg/g/pc" value={draft.packageUnit} onChange={(event) => onChange({ packageUnit: event.target.value })} />
      <Input type="number" placeholder="Normalized Tk/kg" value={draft.normalizedPricePerKg} onChange={(event) => onChange({ normalizedPricePerKg: event.target.value })} />
      <Input type="number" placeholder="Normalized Tk/pc" value={draft.normalizedPricePerUnit} onChange={(event) => onChange({ normalizedPricePerUnit: event.target.value })} />
      <BooleanToggle label="Organic" checked={draft.isOrganic} onChange={(value) => onChange({ isOrganic: value })} />
      <BooleanToggle label="In stock" checked={draft.inStock} onChange={(value) => onChange({ inStock: value })} />
      <BooleanToggle label="Nutrition verified" checked={draft.nutritionVerified} onChange={(value) => onChange({ nutritionVerified: value })} />
    </div>
  );
}

function BooleanToggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex h-9 items-center gap-2 rounded-md border px-3 text-sm">
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      {label}
    </label>
  );
}
