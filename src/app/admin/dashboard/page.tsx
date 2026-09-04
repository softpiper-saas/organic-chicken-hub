"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Config = {
  id: string;
  url: string;
  vendorName: string | null;
  category: string | null;
  sourceType: string | null;
  isActive: boolean;
  lastScrapedAt: string | null;
};

type Product = {
  id: string;
  name: string;
  vendor: string;
  price: number;
  category: string | null;
  foodType: string | null;
  normalizedPricePerKg: number | null;
  normalizedPricePerUnit: number | null;
  nutritionVerified: boolean | null;
};

type ProductDraft = {
  category: string;
  foodType: string;
  normalizedPricePerKg: string;
  normalizedPricePerUnit: string;
  nutritionVerified: boolean;
};

const categories = ["chicken", "egg", "fish", "lentil", "nuts", "seeds", "dairy", "beef"];

export default function Dashboard() {
  const [configs, setConfigs] = useState<Config[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [productDrafts, setProductDrafts] = useState<Record<string, ProductDraft>>({});
  const [newUrl, setNewUrl] = useState("");
  const [newVendorName, setNewVendorName] = useState("");
  const [newCategory, setNewCategory] = useState("chicken");
  const [newSourceType, setNewSourceType] = useState("product_page");
  const [loading, setLoading] = useState(false);
  const [scraping, setScraping] = useState(false);

  const fetchConfigs = async () => {
    const res = await fetch("/api/admin/config");
    if (res.ok) {
      setConfigs(await res.json());
    }
  };

  const fetchProducts = async () => {
    const res = await fetch("/api/admin/products");
    if (!res.ok) return;

    const data = await res.json() as Product[];
    setProducts(data);
    setProductDrafts(Object.fromEntries(
      data.map((product) => [
        product.id,
        {
          category: product.category || "chicken",
          foodType: product.foodType || "chicken",
          normalizedPricePerKg: product.normalizedPricePerKg?.toString() || "",
          normalizedPricePerUnit: product.normalizedPricePerUnit?.toString() || "",
          nutritionVerified: Boolean(product.nutritionVerified),
        },
      ])
    ));
  };

  useEffect(() => {
    fetchConfigs();
    fetchProducts();
  }, []);

  const addUrl = async () => {
    if (!newUrl) return;
    setLoading(true);
    await fetch("/api/admin/config", {
      method: "POST",
      body: JSON.stringify({
        url: newUrl,
        vendorName: newVendorName,
        category: newCategory,
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
        alert(`Scrape completed! Processed ${data.data.length} items.`);
        fetchConfigs();
        fetchProducts();
    } catch {
        alert("Scrape failed");
    } finally {
        setScraping(false);
    }
  };

  const updateProductDraft = (productId: string, patch: Partial<ProductDraft>) => {
    setProductDrafts((current) => ({
      ...current,
      [productId]: {
        ...current[productId],
        ...patch,
      },
    }));
  };

  const saveProductMapping = async (productId: string) => {
    const draft = productDrafts[productId];
    if (!draft) return;

    await fetch("/api/admin/products", {
      method: "PATCH",
      body: JSON.stringify({
        id: productId,
        category: draft.category,
        foodType: draft.foodType,
        normalizedPricePerKg: draft.normalizedPricePerKg ? Number(draft.normalizedPricePerKg) : null,
        normalizedPricePerUnit: draft.normalizedPricePerUnit ? Number(draft.normalizedPricePerUnit) : null,
        nutritionVerified: draft.nutritionVerified,
      }),
    });

    fetchProducts();
  };

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

      <div className="grid gap-8 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Manage Target URLs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3">
              <Input
                placeholder="https://example.com/product/chicken"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
              />
              <Input
                placeholder="Vendor name, e.g. Fish Vally"
                value={newVendorName}
                onChange={(e) => setNewVendorName(e.target.value)}
              />
              <div className="grid gap-2 sm:grid-cols-2">
                <Select value={newCategory} onValueChange={setNewCategory}>
                  <SelectTrigger>
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
              <Button onClick={addUrl} disabled={loading}>Add Source</Button>
            </div>

            <div className="space-y-2">
              {configs.map((config) => (
                <div key={config.id} className="flex items-center justify-between p-2 border rounded">
                  <div className="truncate flex-1 mr-2">
                    <p className="font-medium truncate">{config.url}</p>
                    <p className="text-xs text-muted-foreground">
                      {config.vendorName || "Unknown vendor"} / {config.category || "chicken"} / {config.sourceType || "product_page"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Last Scraped: {config.lastScrapedAt ? new Date(config.lastScrapedAt).toLocaleString() : "Never"}
                    </p>
                  </div>
                  <Button variant="destructive" size="sm" onClick={() => deleteUrl(config.id)}>
                    Remove
                  </Button>
                </div>
              ))}
              {configs.length === 0 && <p className="text-muted-foreground text-center">No URLs configured.</p>}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Scraping Operations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Trigger a manual scrape of all configured URLs immediately.
            </p>
            <Button onClick={triggerScrape} disabled={scraping} className="w-full">
              {scraping ? "Scraping in progress..." : "Trigger Manual Scrape Now"}
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Product Nutrition Mapping</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {products.map((product) => {
            const draft = productDrafts[product.id];
            if (!draft) return null;

            return (
              <div key={product.id} className="grid gap-3 rounded-md border p-3 lg:grid-cols-[minmax(0,1.4fr)_160px_160px_150px_150px_110px] lg:items-center">
                <div className="min-w-0">
                  <p className="truncate font-medium">{product.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {product.vendor} / Current price {product.price} Tk
                  </p>
                </div>
                <Select
                  value={draft.category}
                  onValueChange={(value) => updateProductDraft(product.id, { category: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  value={draft.foodType}
                  onChange={(event) => updateProductDraft(product.id, { foodType: event.target.value })}
                  placeholder="food type"
                />
                <Input
                  type="number"
                  value={draft.normalizedPricePerKg}
                  onChange={(event) => updateProductDraft(product.id, { normalizedPricePerKg: event.target.value })}
                  placeholder="Tk/kg"
                />
                <Input
                  type="number"
                  value={draft.normalizedPricePerUnit}
                  onChange={(event) => updateProductDraft(product.id, { normalizedPricePerUnit: event.target.value })}
                  placeholder="Tk/pc"
                />
                <div className="flex items-center justify-between gap-2 lg:justify-end">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={draft.nutritionVerified}
                      onChange={(event) => updateProductDraft(product.id, { nutritionVerified: event.target.checked })}
                    />
                    Verified
                  </label>
                  <Button size="sm" onClick={() => saveProductMapping(product.id)}>
                    Save
                  </Button>
                </div>
              </div>
            );
          })}
          {products.length === 0 && (
            <p className="text-center text-muted-foreground">No products found yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
