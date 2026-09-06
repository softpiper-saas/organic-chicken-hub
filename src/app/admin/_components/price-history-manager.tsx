"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Edit, Plus, Search, Trash2 } from "lucide-react";
import type { PriceHistoryDraft, PriceHistoryRow, Product } from "./admin-types";
import { dateTimeLocalValue } from "./admin-types";
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

const emptyHistoryDraft: PriceHistoryDraft = {
  price: "",
  recordedAt: "",
};

export function PriceHistoryManager({ initialProductId }: { initialProductId: string }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProductId, setSelectedProductId] = useState(initialProductId);
  const [priceHistory, setPriceHistory] = useState<PriceHistoryRow[]>([]);
  const [createDraft, setCreateDraft] = useState<PriceHistoryDraft>(emptyHistoryDraft);
  const [editRow, setEditRow] = useState<PriceHistoryRow | null>(null);
  const [editDraft, setEditDraft] = useState<PriceHistoryDraft>(emptyHistoryDraft);
  const [deleteRow, setDeleteRow] = useState<PriceHistoryRow | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");

  const selectedProduct = products.find((product) => product.id === selectedProductId);

  const filteredHistory = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return priceHistory;

    return priceHistory.filter((row) =>
      row.price.toString().includes(query) ||
      (row.recordedAt ? new Date(row.recordedAt).toLocaleString().toLowerCase().includes(query) : false)
    );
  }, [priceHistory, search]);

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
      return;
    }

    const res = await fetch(`/api/admin/price-history?productId=${productId}`);
    if (res.ok) setPriceHistory(await res.json());
  }, []);

  useEffect(() => {
    void Promise.resolve().then(fetchProducts);
  }, [fetchProducts]);

  useEffect(() => {
    void Promise.resolve().then(() => fetchPriceHistory(selectedProductId));
  }, [fetchPriceHistory, selectedProductId]);

  const createPriceHistory = async () => {
    if (!selectedProductId || !createDraft.price) return;

    setSaving(true);
    await fetch("/api/admin/price-history", {
      method: "POST",
      body: JSON.stringify({
        productId: selectedProductId,
        price: Number(createDraft.price),
        recordedAt: createDraft.recordedAt,
      }),
    });
    setCreateDraft(emptyHistoryDraft);
    setCreateOpen(false);
    setSaving(false);
    fetchPriceHistory(selectedProductId);
  };

  const openEditModal = (row: PriceHistoryRow) => {
    setEditRow(row);
    setEditDraft({
      price: row.price.toString(),
      recordedAt: dateTimeLocalValue(row.recordedAt),
    });
  };

  const savePriceHistory = async () => {
    if (!editRow || !editDraft.price) return;

    setSaving(true);
    await fetch("/api/admin/price-history", {
      method: "PATCH",
      body: JSON.stringify({
        id: editRow.id,
        price: Number(editDraft.price),
        recordedAt: editDraft.recordedAt,
      }),
    });
    setEditRow(null);
    setSaving(false);
    fetchPriceHistory(selectedProductId);
  };

  const confirmDeletePriceHistory = async () => {
    if (!deleteRow) return;

    setSaving(true);
    await fetch("/api/admin/price-history", {
      method: "DELETE",
      body: JSON.stringify({ id: deleteRow.id }),
    });
    setDeleteRow(null);
    setSaving(false);
    fetchPriceHistory(selectedProductId);
  };

  return (
    <main className="container mx-auto space-y-8 py-10">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Price History</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Review, add, edit, and delete recorded product price points.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)} disabled={!selectedProductId}>
          <Plus className="h-4 w-4" />
          Add Price Point
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 lg:grid-cols-[minmax(220px,1fr)_minmax(220px,1fr)_auto]">
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
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search price or date"
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
          <CardTitle>Price Table</CardTitle>
          <p className="text-sm text-muted-foreground">
            {filteredHistory.length} of {priceHistory.length}
          </p>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead>Recorded At</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredHistory.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium">{selectedProduct?.name || row.productId}</TableCell>
                  <TableCell className="text-right">{row.price} Tk</TableCell>
                  <TableCell>{row.recordedAt ? new Date(row.recordedAt).toLocaleString() : "No date"}</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <Button size="icon" variant="outline" aria-label="Edit price row" onClick={() => openEditModal(row)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="destructive" aria-label="Delete price row" onClick={() => setDeleteRow(row)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredHistory.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                    {selectedProductId ? "No price history matches the current filters." : "Select a product to manage price history."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <PriceHistoryDialog
        title="Add Price Point"
        description="Create a recorded price for the selected product."
        open={createOpen}
        draft={createDraft}
        saving={saving}
        actionLabel="Create Price Point"
        onOpenChange={setCreateOpen}
        onDraftChange={(patch) => setCreateDraft({ ...createDraft, ...patch })}
        onSubmit={createPriceHistory}
      />

      <PriceHistoryDialog
        title="Edit Price Point"
        description="Update the recorded price or timestamp."
        open={Boolean(editRow)}
        draft={editDraft}
        saving={saving}
        actionLabel="Save Price Point"
        onOpenChange={(open) => !open && setEditRow(null)}
        onDraftChange={(patch) => setEditDraft({ ...editDraft, ...patch })}
        onSubmit={savePriceHistory}
      />

      <Dialog open={Boolean(deleteRow)} onOpenChange={(open) => !open && setDeleteRow(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Price Point</DialogTitle>
            <DialogDescription>This removes the selected recorded price.</DialogDescription>
          </DialogHeader>
          <div className="rounded-md border p-3 text-sm">
            <p className="font-medium">{deleteRow?.price} Tk</p>
            <p className="text-muted-foreground">
              {deleteRow?.recordedAt ? new Date(deleteRow.recordedAt).toLocaleString() : "No date"}
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteRow(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDeletePriceHistory} disabled={saving}>
              Delete Price Point
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}

function PriceHistoryDialog({
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
  draft: PriceHistoryDraft;
  saving: boolean;
  actionLabel: string;
  onOpenChange: (open: boolean) => void;
  onDraftChange: (patch: Partial<PriceHistoryDraft>) => void;
  onSubmit: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          <Input type="number" placeholder="Price" value={draft.price} onChange={(event) => onDraftChange({ price: event.target.value })} />
          <Input type="datetime-local" value={draft.recordedAt} onChange={(event) => onDraftChange({ recordedAt: event.target.value })} />
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
