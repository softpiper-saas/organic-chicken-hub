"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Edit, Plus, RefreshCw, Search, Trash2 } from "lucide-react";
import type { Config, ProductCategory } from "../_components/admin-types";
import { CategorySelect } from "../_components/category-select";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type SourceDraft = {
  url: string;
  vendorName: string;
  category: string;
  sourceType: string;
  isActive: boolean;
};

const emptySourceDraft: SourceDraft = {
  url: "",
  vendorName: "",
  category: "chicken",
  sourceType: "product_page",
  isActive: true,
};

export default function SourcesPage() {
  const [configs, setConfigs] = useState<Config[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [createDraft, setCreateDraft] = useState<SourceDraft>(emptySourceDraft);
  const [editSource, setEditSource] = useState<Config | null>(null);
  const [editDraft, setEditDraft] = useState<SourceDraft>(emptySourceDraft);
  const [deleteSource, setDeleteSource] = useState<Config | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [scraping, setScraping] = useState(false);
  const [scrapingSourceId, setScrapingSourceId] = useState("");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sourceTypeFilter, setSourceTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const categoryOptions = useMemo(
    () => categories.map((category) => category.slug),
    [categories]
  );

  const filteredConfigs = useMemo(() => {
    const query = search.trim().toLowerCase();

    return configs.filter((config) => {
      const matchesSearch = !query ||
        config.url.toLowerCase().includes(query) ||
        (config.vendorName || "").toLowerCase().includes(query);
      const matchesCategory = categoryFilter === "all" || config.category === categoryFilter;
      const matchesSourceType = sourceTypeFilter === "all" || config.sourceType === sourceTypeFilter;
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && config.isActive) ||
        (statusFilter === "inactive" && !config.isActive);

      return matchesSearch && matchesCategory && matchesSourceType && matchesStatus;
    });
  }, [categoryFilter, configs, search, sourceTypeFilter, statusFilter]);

  const fetchConfigs = useCallback(async () => {
    const res = await fetch("/api/admin/config");
    if (res.ok) setConfigs(await res.json());
  }, []);

  const fetchCategories = useCallback(async () => {
    const res = await fetch("/api/admin/categories");
    if (res.ok) setCategories(await res.json());
  }, []);

  useEffect(() => {
    void Promise.resolve().then(() => {
      fetchConfigs();
      fetchCategories();
    });
  }, [fetchCategories, fetchConfigs]);

  const createSource = async () => {
    if (!createDraft.url) return;

    setSaving(true);
    await fetch("/api/admin/config", {
      method: "POST",
      body: JSON.stringify(createDraft),
    });
    setCreateDraft(emptySourceDraft);
    setCreateOpen(false);
    setSaving(false);
    fetchConfigs();
  };

  const openEditModal = (config: Config) => {
    setEditSource(config);
    setEditDraft({
      url: config.url,
      vendorName: config.vendorName || "",
      category: config.category || "chicken",
      sourceType: config.sourceType || "product_page",
      isActive: config.isActive,
    });
  };

  const saveSource = async () => {
    if (!editSource) return;

    setSaving(true);
    await fetch("/api/admin/config", {
      method: "PATCH",
      body: JSON.stringify({ id: editSource.id, ...editDraft }),
    });
    setEditSource(null);
    setSaving(false);
    fetchConfigs();
  };

  const confirmDeleteSource = async () => {
    if (!deleteSource) return;

    setSaving(true);
    await fetch("/api/admin/config", {
      method: "DELETE",
      body: JSON.stringify({ id: deleteSource.id }),
    });
    setDeleteSource(null);
    setSaving(false);
    fetchConfigs();
  };

  const triggerScrape = async () => {
    setScraping(true);
    try {
      const res = await fetch("/api/scrape", { method: "POST" });
      const data = await res.json();
      alert(`Scrape completed. Processed ${data.data.length} items.`);
      fetchConfigs();
    } catch {
      alert("Scrape failed");
    } finally {
      setScraping(false);
    }
  };

  const triggerSourceScrape = async (config: Config) => {
    setScrapingSourceId(config.id);
    try {
      const res = await fetch("/api/scrape", {
        method: "POST",
        body: JSON.stringify({ sourceId: config.id }),
      });
      const data = await res.json();
      alert(`Scrape completed. Processed ${data.data.length} items.`);
      fetchConfigs();
    } catch {
      alert("Scrape failed");
    } finally {
      setScrapingSourceId("");
    }
  };

  const resetFilters = () => {
    setSearch("");
    setCategoryFilter("all");
    setSourceTypeFilter("all");
    setStatusFilter("all");
  };

  return (
    <main className="container mx-auto space-y-8 py-10">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Scraping Sources</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage vendor URLs and run product scraping jobs.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={triggerScrape} disabled={scraping} variant="outline">
            <RefreshCw className="h-4 w-4" />
            {scraping ? "Scraping..." : "Run All"}
          </Button>
          <Button onClick={() => setCreateOpen(true)} disabled={categoryOptions.length === 0}>
            <Plus className="h-4 w-4" />
            Add Source
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 lg:grid-cols-[minmax(220px,1.5fr)_repeat(3,minmax(150px,1fr))_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search sources"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {categoryOptions.map((category) => (
                <SelectItem key={category} value={category}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sourceTypeFilter} onValueChange={setSourceTypeFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Source type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All source types</SelectItem>
              <SelectItem value="product_page">Product page</SelectItem>
              <SelectItem value="collection_page">Collection page</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={resetFilters}>
            Reset
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle>Source Table</CardTitle>
          <p className="text-sm text-muted-foreground">
            {filteredConfigs.length} of {configs.length}
          </p>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-80">Source</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Scraped</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredConfigs.map((config) => (
                <TableRow key={config.id}>
                  <TableCell className="max-w-96 truncate">{config.url}</TableCell>
                  <TableCell>{config.vendorName || "Unknown vendor"}</TableCell>
                  <TableCell>{config.category || "uncategorized"}</TableCell>
                  <TableCell>{config.sourceType || "product_page"}</TableCell>
                  <TableCell>{config.isActive ? "Active" : "Inactive"}</TableCell>
                  <TableCell>{config.lastScrapedAt ? new Date(config.lastScrapedAt).toLocaleString() : "Never"}</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <Button
                        size="icon"
                        variant="outline"
                        aria-label="Scrape source"
                        onClick={() => triggerSourceScrape(config)}
                        disabled={Boolean(scrapingSourceId) || scraping}
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="outline" aria-label="Edit source" onClick={() => openEditModal(config)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="destructive" aria-label="Delete source" onClick={() => setDeleteSource(config)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredConfigs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                    No sources match the current filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <SourceDialog
        title="Add Source"
        description="Create a scraping source for a vendor product page or collection page."
        open={createOpen}
        draft={createDraft}
        categories={categoryOptions}
        saving={saving}
        actionLabel="Create Source"
        onOpenChange={setCreateOpen}
        onDraftChange={(patch) => setCreateDraft({ ...createDraft, ...patch })}
        onSubmit={createSource}
      />

      <SourceDialog
        title="Edit Source"
        description="Update source URL, category mapping, active status, or scrape mode."
        open={Boolean(editSource)}
        draft={editDraft}
        categories={categoryOptions}
        saving={saving}
        actionLabel="Save Source"
        onOpenChange={(open) => !open && setEditSource(null)}
        onDraftChange={(patch) => setEditDraft({ ...editDraft, ...patch })}
        onSubmit={saveSource}
      />

      <Dialog open={Boolean(deleteSource)} onOpenChange={(open) => !open && setDeleteSource(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Source</DialogTitle>
            <DialogDescription>This removes the scraping source. Existing products are not deleted.</DialogDescription>
          </DialogHeader>
          <div className="rounded-md border p-3 text-sm">
            <p className="truncate font-medium">{deleteSource?.url}</p>
            <p className="text-muted-foreground">{deleteSource?.vendorName || "Unknown vendor"}</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteSource(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDeleteSource} disabled={saving}>
              Delete Source
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}

function SourceDialog({
  title,
  description,
  open,
  draft,
  categories,
  saving,
  actionLabel,
  onOpenChange,
  onDraftChange,
  onSubmit,
}: {
  title: string;
  description: string;
  open: boolean;
  draft: SourceDraft;
  categories: string[];
  saving: boolean;
  actionLabel: string;
  onOpenChange: (open: boolean) => void;
  onDraftChange: (patch: Partial<SourceDraft>) => void;
  onSubmit: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <Input placeholder="https://example.com/products" value={draft.url} onChange={(event) => onDraftChange({ url: event.target.value })} />
          <Input placeholder="Vendor name" value={draft.vendorName} onChange={(event) => onDraftChange({ vendorName: event.target.value })} />
          <div className="grid gap-2 sm:grid-cols-2">
            <CategorySelect value={draft.category} categories={categories} onValueChange={(value) => onDraftChange({ category: value })} />
            <Select value={draft.sourceType} onValueChange={(value) => onDraftChange({ sourceType: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Source type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="product_page">Product page</SelectItem>
                <SelectItem value="collection_page">Collection page</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <label className="flex h-9 items-center gap-2 rounded-md border px-3 text-sm">
            <input type="checkbox" checked={draft.isActive} onChange={(event) => onDraftChange({ isActive: event.target.checked })} />
            Active
          </label>
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
