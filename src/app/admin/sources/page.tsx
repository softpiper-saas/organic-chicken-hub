"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, RefreshCw, Trash2 } from "lucide-react";
import type { Config, ProductCategory } from "../_components/admin-types";
import { CategorySelect } from "../_components/category-select";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function SourcesPage() {
  const [configs, setConfigs] = useState<Config[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [newUrl, setNewUrl] = useState("");
  const [newVendorName, setNewVendorName] = useState("");
  const [newSourceCategory, setNewSourceCategory] = useState("chicken");
  const [newSourceType, setNewSourceType] = useState("product_page");
  const [loading, setLoading] = useState(false);
  const [scraping, setScraping] = useState(false);

  const categoryOptions = useMemo(
    () => categories.map((category) => category.slug),
    [categories]
  );

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

  const addUrl = async () => {
    if (!newUrl) return;
    setLoading(true);
    await fetch("/api/admin/config", {
      method: "POST",
      body: JSON.stringify({
        url: newUrl,
        vendorName: newVendorName,
        category: newSourceCategory,
        sourceType: newSourceType,
      }),
    });
    setNewUrl("");
    setNewVendorName("");
    setLoading(false);
    fetchConfigs();
  };

  const deleteUrl = async (id: string) => {
    await fetch("/api/admin/config", {
      method: "DELETE",
      body: JSON.stringify({ id }),
    });
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

  return (
    <main className="container mx-auto space-y-8 py-10">
      <div>
        <h1 className="text-3xl font-bold">Scraping Sources</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage vendor URLs and run product scraping jobs.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add Source</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3">
          <Input placeholder="https://example.com/products" value={newUrl} onChange={(event) => setNewUrl(event.target.value)} />
          <Input placeholder="Vendor name" value={newVendorName} onChange={(event) => setNewVendorName(event.target.value)} />
          <div className="grid gap-2 sm:grid-cols-2">
            <CategorySelect value={newSourceCategory} categories={categoryOptions} onValueChange={setNewSourceCategory} />
            <Select value={newSourceType} onValueChange={setNewSourceType}>
              <SelectTrigger>
                <SelectValue placeholder="Source type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="product_page">Product page</SelectItem>
                <SelectItem value="collection_page">Collection page</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <Button onClick={addUrl} disabled={loading || categoryOptions.length === 0}>
              <Plus className="h-4 w-4" />
              Add Source
            </Button>
            <Button onClick={triggerScrape} disabled={scraping} variant="outline">
              <RefreshCw className="h-4 w-4" />
              {scraping ? "Scraping..." : "Run Scrape"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Configured Sources</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {configs.map((config) => (
            <div key={config.id} className="flex items-center justify-between gap-3 rounded-md border p-3">
              <div className="min-w-0">
                <p className="truncate font-medium">{config.url}</p>
                <p className="text-xs text-muted-foreground">
                  {config.vendorName || "Unknown vendor"} / {config.category || "uncategorized"} / {config.sourceType || "product_page"}
                </p>
                <p className="text-xs text-muted-foreground">
                  Last scraped: {config.lastScrapedAt ? new Date(config.lastScrapedAt).toLocaleString() : "Never"}
                </p>
              </div>
              <Button variant="destructive" size="icon" aria-label="Remove source" onClick={() => deleteUrl(config.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          {configs.length === 0 && <p className="text-center text-muted-foreground">No sources configured.</p>}
        </CardContent>
      </Card>
    </main>
  );
}
