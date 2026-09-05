"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Save, Trash2 } from "lucide-react";
import type { CategoryDraft, ProductCategory } from "../_components/admin-types";
import { emptyCategoryDraft } from "../_components/admin-types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function CategoriesPage() {
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [categoryDrafts, setCategoryDrafts] = useState<Record<string, CategoryDraft>>({});
  const [newCategory, setNewCategory] = useState<CategoryDraft>(emptyCategoryDraft);

  const fetchCategories = useCallback(async () => {
    const res = await fetch("/api/admin/categories");
    if (!res.ok) return;

    const data = await res.json() as ProductCategory[];
    setCategories(data);
    setCategoryDrafts(Object.fromEntries(data.map((category) => [
      category.id,
      {
        name: category.name,
        slug: category.slug,
        description: category.description || "",
      },
    ])));
  }, []);

  useEffect(() => {
    void Promise.resolve().then(fetchCategories);
  }, [fetchCategories]);

  const createCategory = async () => {
    if (!newCategory.name) return;
    await fetch("/api/admin/categories", {
      method: "POST",
      body: JSON.stringify(newCategory),
    });
    setNewCategory(emptyCategoryDraft);
    fetchCategories();
  };

  const updateCategory = async (id: string) => {
    const draft = categoryDrafts[id];
    if (!draft) return;

    await fetch("/api/admin/categories", {
      method: "PATCH",
      body: JSON.stringify({ id, ...draft }),
    });
    fetchCategories();
  };

  const deleteCategory = async (id: string) => {
    await fetch("/api/admin/categories", {
      method: "DELETE",
      body: JSON.stringify({ id }),
    });
    fetchCategories();
  };

  return (
    <main className="container mx-auto space-y-8 py-10">
      <div>
        <h1 className="text-3xl font-bold">Product Categories</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage protein categories used across scraping, products, and planner recommendations.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add Category</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 sm:grid-cols-[1fr_1fr_1.5fr_auto]">
          <Input placeholder="Name" value={newCategory.name} onChange={(event) => setNewCategory({ ...newCategory, name: event.target.value })} />
          <Input placeholder="slug" value={newCategory.slug} onChange={(event) => setNewCategory({ ...newCategory, slug: event.target.value })} />
          <Input placeholder="Description" value={newCategory.description} onChange={(event) => setNewCategory({ ...newCategory, description: event.target.value })} />
          <Button onClick={createCategory}>
            <Plus className="h-4 w-4" />
            Add
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Existing Categories</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {categories.map((category) => {
            const draft = categoryDrafts[category.id];
            if (!draft) return null;

            return (
              <div key={category.id} className="grid gap-2 rounded-md border p-3 lg:grid-cols-[1fr_1fr_1.5fr_auto_auto]">
                <Input value={draft.name} onChange={(event) => setCategoryDrafts((current) => ({ ...current, [category.id]: { ...draft, name: event.target.value } }))} />
                <Input value={draft.slug} onChange={(event) => setCategoryDrafts((current) => ({ ...current, [category.id]: { ...draft, slug: event.target.value } }))} />
                <Input value={draft.description} onChange={(event) => setCategoryDrafts((current) => ({ ...current, [category.id]: { ...draft, description: event.target.value } }))} />
                <Button size="sm" onClick={() => updateCategory(category.id)}>
                  <Save className="h-4 w-4" />
                  Save
                </Button>
                <Button size="sm" variant="destructive" onClick={() => deleteCategory(category.id)}>
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Button>
              </div>
            );
          })}
          {categories.length === 0 && <p className="text-center text-muted-foreground">No categories found.</p>}
        </CardContent>
      </Card>
    </main>
  );
}
