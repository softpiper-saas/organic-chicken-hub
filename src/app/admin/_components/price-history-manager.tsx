"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Save, Trash2 } from "lucide-react";
import type { PriceHistoryDraft, PriceHistoryRow, Product } from "./admin-types";
import { dateTimeLocalValue } from "./admin-types";
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

export function PriceHistoryManager({ initialProductId }: { initialProductId: string }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProductId, setSelectedProductId] = useState(initialProductId);
  const [priceHistory, setPriceHistory] = useState<PriceHistoryRow[]>([]);
  const [priceHistoryDrafts, setPriceHistoryDrafts] = useState<Record<string, PriceHistoryDraft>>({});
  const [newHistoryPrice, setNewHistoryPrice] = useState("");
  const [newHistoryDate, setNewHistoryDate] = useState("");

  const selectedProduct = products.find((product) => product.id === selectedProductId);

  const fetchProducts = useCallback(async () => {
    const res = await fetch("/api/admin/products");
    if (!res.ok) return;

    const data = await res.json() as Product[];
    setProducts(data);
    setSelectedProductId((current) => current || data[0]?.id || "");
  }, []);

  const fetchPriceHistory = useCallback(async (productId: string) => {
    if (!productId) {
      setPriceHistory([]);
      setPriceHistoryDrafts({});
      return;
    }

    const res = await fetch(`/api/admin/price-history?productId=${productId}`);
    if (!res.ok) return;

    const data = await res.json() as PriceHistoryRow[];
    setPriceHistory(data);
    setPriceHistoryDrafts(Object.fromEntries(data.map((row) => [
      row.id,
      {
        price: row.price.toString(),
        recordedAt: dateTimeLocalValue(row.recordedAt),
      },
    ])));
  }, []);

  useEffect(() => {
    void Promise.resolve().then(fetchProducts);
  }, [fetchProducts]);

  useEffect(() => {
    void Promise.resolve().then(() => fetchPriceHistory(selectedProductId));
  }, [fetchPriceHistory, selectedProductId]);

  const addPriceHistory = async () => {
    if (!selectedProductId || !newHistoryPrice) return;

    await fetch("/api/admin/price-history", {
      method: "POST",
      body: JSON.stringify({
        productId: selectedProductId,
        price: Number(newHistoryPrice),
        recordedAt: newHistoryDate,
      }),
    });

    setNewHistoryPrice("");
    setNewHistoryDate("");
    fetchPriceHistory(selectedProductId);
  };

  const updatePriceHistoryDraft = (id: string, patch: Partial<PriceHistoryDraft>) => {
    setPriceHistoryDrafts((current) => ({
      ...current,
      [id]: {
        ...current[id],
        ...patch,
      },
    }));
  };

  const savePriceHistory = async (id: string) => {
    const draft = priceHistoryDrafts[id];
    if (!draft || !draft.price) return;

    await fetch("/api/admin/price-history", {
      method: "PATCH",
      body: JSON.stringify({
        id,
        price: Number(draft.price),
        recordedAt: draft.recordedAt,
      }),
    });
    fetchPriceHistory(selectedProductId);
  };

  const deletePriceHistory = async (id: string) => {
    await fetch("/api/admin/price-history", {
      method: "DELETE",
      body: JSON.stringify({ id }),
    });
    fetchPriceHistory(selectedProductId);
  };

  return (
    <main className="container mx-auto space-y-8 py-10">
      <div>
        <h1 className="text-3xl font-bold">Price History</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Review, add, edit, and delete recorded product price points.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Select Product</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select value={selectedProductId} onValueChange={setSelectedProductId}>
            <SelectTrigger disabled={products.length === 0}>
              <SelectValue placeholder="Select a product" />
            </SelectTrigger>
            <SelectContent>
              {products.map((product) => (
                <SelectItem key={product.id} value={product.id}>
                  {product.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {selectedProduct && (
            <p className="text-sm text-muted-foreground">
              Viewing history for <span className="font-medium text-foreground">{selectedProduct.name}</span>
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Add Price Point</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
          <Input type="number" placeholder="Price" value={newHistoryPrice} onChange={(event) => setNewHistoryPrice(event.target.value)} />
          <Input type="datetime-local" value={newHistoryDate} onChange={(event) => setNewHistoryDate(event.target.value)} />
          <Button onClick={addPriceHistory} disabled={!selectedProductId}>
            <Plus className="h-4 w-4" />
            Add Row
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recorded Prices</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {priceHistory.map((row) => {
            const draft = priceHistoryDrafts[row.id];
            if (!draft) return null;

            return (
              <div key={row.id} className="grid gap-2 rounded-md border p-3 sm:grid-cols-[1fr_1fr_auto_auto]">
                <Input
                  type="number"
                  value={draft.price}
                  onChange={(event) => updatePriceHistoryDraft(row.id, { price: event.target.value })}
                />
                <Input
                  type="datetime-local"
                  value={draft.recordedAt}
                  onChange={(event) => updatePriceHistoryDraft(row.id, { recordedAt: event.target.value })}
                />
                <Button size="sm" onClick={() => savePriceHistory(row.id)}>
                  <Save className="h-4 w-4" />
                  Save
                </Button>
                <Button size="sm" variant="destructive" onClick={() => deletePriceHistory(row.id)}>
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Button>
              </div>
            );
          })}
          {selectedProductId && priceHistory.length === 0 && (
            <p className="text-center text-muted-foreground">No price history yet.</p>
          )}
          {!selectedProductId && (
            <p className="text-center text-muted-foreground">Select a product to manage price history.</p>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
