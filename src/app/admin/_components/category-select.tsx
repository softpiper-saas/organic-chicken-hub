"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function CategorySelect({
  value,
  categories,
  onValueChange,
}: {
  value: string;
  categories: string[];
  onValueChange: (value: string) => void;
}) {
  return (
    <Select value={value || categories[0] || "chicken"} onValueChange={onValueChange}>
      <SelectTrigger disabled={categories.length === 0}>
        <SelectValue placeholder="Category" />
      </SelectTrigger>
      <SelectContent>
        {categories.map((category) => (
          <SelectItem key={category} value={category}>
            {category.charAt(0).toUpperCase() + category.slice(1)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
