"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Edit, History, Plus, RefreshCw, Search, Trash2 } from "lucide-react";
import {
  draftFromProduct,
  emptyProductDraft,
  productPayload,
  type Product,
  type ProductCategory,
  type ProductDraft,
} from "../_components/admin-types";
import { ProductDraftFields } from "../_components/product-draft-fields";
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

const stockOptions = [
  { value: "all", label: "All stock" },
  { value: "in-stock", label: "In stock" },
  { value: "out-of-stock", label: "Out of stock" },
];

const verificationOptions = [
  { value: "all", label: "All verification" },
  { value: "verified", label: "Verified" },
  { value: "unverified", label: "Unverified" },
];

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [newProduct, setNewProduct] = useState<ProductDraft>(emptyProductDraft);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [editDraft, setEditDraft] = useState<ProductDraft>(emptyProductDraft);
  const [deleteProduct, setDeleteProduct] = useState<Product | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [scrapingProductId, setScrapingProductId] = useState("");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [vendorFilter, setVendorFilter] = useState("all");
  const [stockFilter, setStockFilter] = useState("all");
  const [verificationFilter, setVerificationFilter] = useState("all");

  const categoryOptions = useMemo(
    () => categories.map((category) => category.slug),
    [categories]
  );

  const vendorOptions = useMemo(
    () => Array.from(new Set(products.map((product) => product.vendor))).sort(),
    [products]
  );

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();

    return products.filter((product) => {
      const matchesSearch = !query ||
        product.name.toLowerCase().includes(query) ||
        product.vendor.toLowerCase().includes(query) ||
        product.url.toLowerCase().includes(query) ||
        (product.foodType || "").toLowerCase().includes(query);
      const matchesCategory = categoryFilter === "all" || product.category === categoryFilter;
      const matchesVendor = vendorFilter === "all" || product.vendor === vendorFilter;
      const matchesStock =
        stockFilter === "all" ||
        (stockFilter === "in-stock" && product.inStock !== false) ||
        (stockFilter === "out-of-stock" && product.inStock === false);
      const matchesVerification =
        verificationFilter === "all" ||
        (verificationFilter === "verified" && product.nutritionVerified === true) ||
        (verificationFilter === "unverified" && product.nutritionVerified !== true);

      return matchesSearch && matchesCategory && matchesVendor && matchesStock && matchesVerification;
    });
  }, [categoryFilter, products, search, stockFilter, vendorFilter, verificationFilter]);

  const fetchProducts = useCallback(async () => {
    const res = await fetch("/api/admin/products");
    if (!res.ok) return;

    setProducts(await res.json());
  }, []);

  const fetchCategories = useCallback(async () => {
    const res = await fetch("/api/admin/categories");
    if (res.ok) setCategories(await res.json());
  }, []);

  useEffect(() => {
    void Promise.resolve().then(() => {
      fetchProducts();
      fetchCategories();
    });
  }, [fetchCategories, fetchProducts]);

  const createProduct = async () => {
    if (!newProduct.name || !newProduct.vendor || !newProduct.url || !newProduct.price) return;

    setSaving(true);
    await fetch("/api/admin/products", {
      method: "POST",
      body: JSON.stringify(productPayload(newProduct)),
    });
    setNewProduct(emptyProductDraft);
    setCreateOpen(false);
    setSaving(false);
    fetchProducts();
  };

  const openEditModal = (product: Product) => {
    setEditProduct(product);
    setEditDraft(draftFromProduct(product));
  };

  const saveProduct = async () => {
    if (!editProduct) return;

    setSaving(true);
    await fetch("/api/admin/products", {
      method: "PATCH",
      body: JSON.stringify({ id: editProduct.id, ...productPayload(editDraft) }),
    });
    setEditProduct(null);
    setSaving(false);
    fetchProducts();
  };

  const confirmDeleteProduct = async () => {
    if (!deleteProduct) return;

    setSaving(true);
    await fetch("/api/admin/products", {
      method: "DELETE",
      body: JSON.stringify({ id: deleteProduct.id }),
    });
    setDeleteProduct(null);
    setSaving(false);
    fetchProducts();
  };

  const scrapeProduct = async (product: Product) => {
    setScrapingProductId(product.id);
    try {
      const res = await fetch("/api/scrape", {
        method: "POST",
        body: JSON.stringify({ productId: product.id }),
      });
      const data = await res.json();
      alert(`Scrape completed. Processed ${data.data.length} items.`);
      fetchProducts();
    } catch {
      alert("Scrape failed");
    } finally {
      setScrapingProductId("");
    }
  };

  const resetFilters = () => {
    setSearch("");
    setCategoryFilter("all");
    setVendorFilter("all");
    setStockFilter("all");
    setVerificationFilter("all");
  };

  return (
    <main className="container mx-auto space-y-8 py-10">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Products</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage product records, nutrition mapping, source URLs, categories, and planner price fields.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)} disabled={categoryOptions.length === 0}>
          <Plus className="h-4 w-4" />
          Add Product
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 lg:grid-cols-[minmax(220px,1.5fr)_repeat(4,minmax(150px,1fr))_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search products"
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
          <Select value={vendorFilter} onValueChange={setVendorFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Vendor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All vendors</SelectItem>
              {vendorOptions.map((vendor) => (
                <SelectItem key={vendor} value={vendor}>
                  {vendor}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={stockFilter} onValueChange={setStockFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Stock" />
            </SelectTrigger>
            <SelectContent>
              {stockOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={verificationFilter} onValueChange={setVerificationFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Verification" />
            </SelectTrigger>
            <SelectContent>
              {verificationOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={resetFilters}>
            Reset
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle>Product Table</CardTitle>
          <p className="text-sm text-muted-foreground">
            {filteredProducts.length} of {products.length}
          </p>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-64">Product</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">Comparison</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <div className="min-w-0">
                      <p className="truncate font-medium">{product.name}</p>
                      <p className="truncate text-xs text-muted-foreground">{product.foodType || product.url}</p>
                    </div>
                  </TableCell>
                  <TableCell>{product.category || "uncategorized"}</TableCell>
                  <TableCell>{product.vendor}</TableCell>
                  <TableCell className="text-right">
                    <p className="font-medium">{packagePriceLabel(product)}</p>
                  </TableCell>
                  <TableCell className="text-right">
                    {comparisonPriceLabel(product)}
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1 text-xs">
                      <p>{product.inStock === false ? "Out of stock" : "In stock"}</p>
                      <p className={product.nutritionVerified ? "text-green-700" : "text-muted-foreground"}>
                        {product.nutritionVerified ? "Verified" : "Unverified"}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <Button size="icon" variant="outline" asChild>
                        <Link href={`/admin/price-history?productId=${product.id}`} aria-label="View price history">
                          <History className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button
                        size="icon"
                        variant="outline"
                        aria-label="Scrape product"
                        onClick={() => scrapeProduct(product)}
                        disabled={scrapingProductId === product.id}
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="outline" aria-label="Edit product" onClick={() => openEditModal(product)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="destructive" aria-label="Delete product" onClick={() => setDeleteProduct(product)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredProducts.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                    No products match the current filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Product</DialogTitle>
            <DialogDescription>Create a product record for planner recommendations and price tracking.</DialogDescription>
          </DialogHeader>
          <ProductDraftFields
            draft={newProduct}
            categories={categoryOptions}
            onChange={(patch) => setNewProduct({ ...newProduct, ...patch })}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={createProduct} disabled={saving}>
              Create Product
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(editProduct)} onOpenChange={(open) => !open && setEditProduct(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
            <DialogDescription>Update product data used by the storefront and protein planner.</DialogDescription>
          </DialogHeader>
          <ProductDraftFields
            draft={editDraft}
            categories={categoryOptions}
            onChange={(patch) => setEditDraft({ ...editDraft, ...patch })}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditProduct(null)}>
              Cancel
            </Button>
            <Button onClick={saveProduct} disabled={saving}>
              Save Product
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(deleteProduct)} onOpenChange={(open) => !open && setDeleteProduct(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Product</DialogTitle>
            <DialogDescription>
              This will delete the product and its price history.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-md border p-3 text-sm">
            <p className="font-medium">{deleteProduct?.name}</p>
            <p className="text-muted-foreground">{deleteProduct?.vendor}</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteProduct(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDeleteProduct} disabled={saving}>
              Delete Product
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}

function packageUnitLabel(unit: string) {
  if (unit === "pc") return "pc";
  return unit;
}

function packageLabel(product: Product) {
  if (!product.packageSize || !product.packageUnit) return null;
  return `${product.packageSize} ${packageUnitLabel(product.packageUnit)}`;
}

function packagePriceLabel(product: Product) {
  const productPackage = packageLabel(product);
  return productPackage ? `${product.price} Tk / ${productPackage}` : `${product.price} Tk`;
}

function comparisonPriceLabel(product: Product) {
  if (product.normalizedPricePerKg) return `${product.normalizedPricePerKg} Tk/kg`;
  if (product.normalizedPricePerUnit) return `${product.normalizedPricePerUnit} Tk/pc`;
  return "-";
}
