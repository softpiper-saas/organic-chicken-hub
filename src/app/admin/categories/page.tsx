"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Edit, Plus, Search, Trash2 } from "lucide-react";
import type { CategoryDraft, ProductCategory } from "../_components/admin-types";
import { emptyCategoryDraft } from "../_components/admin-types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function CategoriesPage() {
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [createDraft, setCreateDraft] = useState<CategoryDraft>(emptyCategoryDraft);
  const [editCategory, setEditCategory] = useState<ProductCategory | null>(null);
  const [editDraft, setEditDraft] = useState<CategoryDraft>(emptyCategoryDraft);
  const [deleteCategory, setDeleteCategory] = useState<ProductCategory | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");

  const filteredCategories = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return categories;

    return categories.filter((category) =>
      category.name.toLowerCase().includes(query) ||
      category.slug.toLowerCase().includes(query) ||
      (category.description || "").toLowerCase().includes(query)
    );
  }, [categories, search]);

  const fetchCategories = useCallback(async () => {
    const res = await fetch("/api/admin/categories");
    if (res.ok) setCategories(await res.json());
  }, []);

  useEffect(() => {
    void Promise.resolve().then(fetchCategories);
  }, [fetchCategories]);

  const createCategory = async () => {
    if (!createDraft.name) return;

    setSaving(true);
    await fetch("/api/admin/categories", {
      method: "POST",
      body: JSON.stringify(createDraft),
    });
    setCreateDraft(emptyCategoryDraft);
    setCreateOpen(false);
    setSaving(false);
    fetchCategories();
  };

  const openEditModal = (category: ProductCategory) => {
    setEditCategory(category);
    setEditDraft({
      name: category.name,
      slug: category.slug,
      description: category.description || "",
    });
  };

  const saveCategory = async () => {
    if (!editCategory) return;

    setSaving(true);
    await fetch("/api/admin/categories", {
      method: "PATCH",
      body: JSON.stringify({ id: editCategory.id, ...editDraft }),
    });
    setEditCategory(null);
    setSaving(false);
    fetchCategories();
  };

  const confirmDeleteCategory = async () => {
    if (!deleteCategory) return;

    setSaving(true);
    await fetch("/api/admin/categories", {
      method: "DELETE",
      body: JSON.stringify({ id: deleteCategory.id }),
    });
    setDeleteCategory(null);
    setSaving(false);
    fetchCategories();
  };

  return (
    <main className="container mx-auto space-y-8 py-10">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Product Categories</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage protein categories used across scraping, products, and planner recommendations.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" />
          Add Category
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-[minmax(220px,1fr)_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search categories"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <Button variant="outline" onClick={() => setSearch("")}>
            Reset
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle>Category Table</CardTitle>
          <p className="text-sm text-muted-foreground">
            {filteredCategories.length} of {categories.length}
          </p>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCategories.map((category) => (
                <TableRow key={category.id}>
                  <TableCell className="font-medium">{category.name}</TableCell>
                  <TableCell>{category.slug}</TableCell>
                  <TableCell>{category.description || "-"}</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <Button size="icon" variant="outline" aria-label="Edit category" onClick={() => openEditModal(category)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="destructive" aria-label="Delete category" onClick={() => setDeleteCategory(category)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredCategories.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                    No categories match the current filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <CategoryDialog
        title="Add Category"
        description="Create a product category for scraping and planner recommendations."
        open={createOpen}
        draft={createDraft}
        saving={saving}
        actionLabel="Create Category"
        onOpenChange={setCreateOpen}
        onDraftChange={(patch) => setCreateDraft({ ...createDraft, ...patch })}
        onSubmit={createCategory}
      />

      <CategoryDialog
        title="Edit Category"
        description="Update the category name, slug, or description."
        open={Boolean(editCategory)}
        draft={editDraft}
        saving={saving}
        actionLabel="Save Category"
        onOpenChange={(open) => !open && setEditCategory(null)}
        onDraftChange={(patch) => setEditDraft({ ...editDraft, ...patch })}
        onSubmit={saveCategory}
      />

      <Dialog open={Boolean(deleteCategory)} onOpenChange={(open) => !open && setDeleteCategory(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Category</DialogTitle>
            <DialogDescription>
              Products in this category will be uncategorized.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-md border p-3 text-sm">
            <p className="font-medium">{deleteCategory?.name}</p>
            <p className="text-muted-foreground">{deleteCategory?.slug}</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteCategory(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDeleteCategory} disabled={saving}>
              Delete Category
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}

function CategoryDialog({
  title,
  description,
  open,
  draft,
  saving,
  actionLabel,
  onOpenChange,
  onDraftChange,
  onSubmit,
}: {
  title: string;
  description: string;
  open: boolean;
  draft: CategoryDraft;
  saving: boolean;
  actionLabel: string;
  onOpenChange: (open: boolean) => void;
  onDraftChange: (patch: Partial<CategoryDraft>) => void;
  onSubmit: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <Input placeholder="Name" value={draft.name} onChange={(event) => onDraftChange({ name: event.target.value })} />
          <Input placeholder="slug" value={draft.slug} onChange={(event) => onDraftChange({ slug: event.target.value })} />
          <Input placeholder="Description" value={draft.description} onChange={(event) => onDraftChange({ description: event.target.value })} />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onSubmit} disabled={saving}>
            {actionLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
