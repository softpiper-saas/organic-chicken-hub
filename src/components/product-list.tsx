"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LayoutGrid, List } from "lucide-react";

type Product = {
  id: string;
  name: string;
  description: string | null;
  vendor: string;
  price: number;
  category: string | null;
  foodType: string | null;
  normalizedPricePerKg: number | null;
  normalizedPricePerUnit: number | null;
  imageUrl: string | null;
  url: string;
  isOrganic: boolean;
  inStock: boolean | null;
};

type ProductCategory = {
  id: string;
  name: string;
  slug: string;
};

type SortOption = "price-asc" | "price-desc" | "name";
type ViewMode = "grid" | "table";
type CategoryFilter = "all" | string;

export function ProductList() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortOption>("price-asc");
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");

  useEffect(() => {
    async function fetchProducts() {
      try {
        const res = await fetch("/api/products");
        if (res.ok) {
          const data = await res.json();
          setProducts(data);
        }
        const categoryRes = await fetch("/api/categories");
        if (categoryRes.ok) {
          setCategories(await categoryRes.json());
        }
      } catch (error) {
        console.error("Failed to fetch products", error);
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, []);

  const productCategories = Array.from(
    new Set(products.map((product) => product.category).filter(Boolean))
  ) as string[];
  const categoryOptions = categories.length > 0
    ? categories.map((category) => category.slug)
    : productCategories;

  const filteredProducts = products.filter((product) =>
    categoryFilter === "all" ? true : product.category === categoryFilter
  );

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    const aPrice = normalizedComparablePrice(a);
    const bPrice = normalizedComparablePrice(b);
    if (sortBy === "price-asc") return aPrice - bPrice;
    if (sortBy === "price-desc") return bPrice - aPrice;
    if (sortBy === "name") return a.name.localeCompare(b.name);
    return 0;
  });

  const bestValueProductId = products
    .filter((p) => p.isOrganic)
    .sort((a, b) => a.price - b.price)[0]?.id;

  if (loading) {
    return <div className="text-center py-10">Loading organic goodness...</div>;
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-muted-foreground mb-4">No products found yet.</p>
        <Button onClick={async () => {
            setLoading(true);
            await fetch("/api/scrape", { method: "POST" });
            window.location.reload();
        }}>
          Refresh / Scrape Data
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-muted/30 p-4 rounded-lg">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Category:</span>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {categoryOptions.map((category) => (
                  <SelectItem key={category} value={category}>
                    {categoryLabel(category)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Sort by:</span>
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="price-asc">Price: Low to High</SelectItem>
              <SelectItem value="price-desc">Price: High to Low</SelectItem>
              <SelectItem value="name">Name</SelectItem>
            </SelectContent>
          </Select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === "grid" ? "default" : "outline"}
            size="icon"
            onClick={() => setViewMode("grid")}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "table" ? "default" : "outline"}
            size="icon"
            onClick={() => setViewMode("table")}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Grid View */}
      {viewMode === "grid" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedProducts.map((product) => (
            <Card key={product.id} className={`overflow-hidden hover:shadow-lg transition-shadow flex flex-col ${product.id === bestValueProductId ? 'ring-2 ring-primary' : ''}`}>
              <div className="relative h-48 w-full shrink-0">
                <Image
                  src={product.imageUrl || "https://placehold.co/600x400?text=No+Image"}
                  alt={product.name}
                  fill
                  className="object-cover"
                />
                <div className="absolute top-2 right-2 flex flex-col gap-2 items-end">
                    {product.isOrganic && (
                    <Badge className="bg-green-600 hover:bg-green-700">Organic</Badge>
                    )}
                    {product.category && (
                        <Badge variant="secondary">{categoryLabel(product.category)}</Badge>
                    )}
                    {product.id === bestValueProductId && (
                        <Badge className="bg-yellow-500 hover:bg-yellow-600 text-black">Best Value</Badge>
                    )}
                </div>
              </div>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm text-muted-foreground">{product.vendor}</p>
                    <CardTitle className="text-lg line-clamp-2">{product.name}</CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-grow">
                <p className="text-2xl font-bold text-primary mb-2">{priceLabel(product)}</p>
                {product.description && (
                  <p className="text-sm text-muted-foreground line-clamp-3">{product.description}</p>
                )}
              </CardContent>
              <CardFooter className="mt-auto">
                <Button className="w-full" asChild>
                  <a href={product.url} target="_blank" rel="noopener noreferrer">Buy Now</a>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Table View */}
      {viewMode === "table" && (
        <div className="border rounded-md overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Image</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead>Price</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedProducts.map((product) => (
                <TableRow key={product.id} className={product.id === bestValueProductId ? "bg-muted/50" : ""}>
                  <TableCell>
                    <div className="relative h-16 w-16 rounded overflow-hidden">
                        <Image
                        src={product.imageUrl || "https://placehold.co/600x400?text=No+Image"}
                        alt={product.name}
                        fill
                        className="object-cover"
                        />
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{product.name}</div>
                    {product.category && <Badge variant="secondary" className="mr-2 mt-1">{categoryLabel(product.category)}</Badge>}
                    {product.isOrganic && <Badge variant="outline" className="text-green-600 border-green-600 mt-1">Organic</Badge>}
                    {product.id === bestValueProductId && <Badge variant="secondary" className="ml-2 bg-yellow-100 text-yellow-800 hover:bg-yellow-200">Best Value</Badge>}
                    {product.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{product.description}</p>}
                  </TableCell>
                  <TableCell>{product.vendor}</TableCell>
                  <TableCell className="font-bold text-lg">{priceLabel(product)}</TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" asChild>
                      <a href={product.url} target="_blank" rel="noopener noreferrer">Buy</a>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

function normalizedComparablePrice(product: Product) {
  return product.normalizedPricePerKg ?? product.normalizedPricePerUnit ?? product.price;
}

function priceLabel(product: Product) {
  if (product.normalizedPricePerKg) return `${product.normalizedPricePerKg} Tk/kg`;
  if (product.normalizedPricePerUnit) return `${product.normalizedPricePerUnit} Tk/pc`;
  return `${product.price} Tk`;
}

function categoryLabel(category: string) {
  return category.charAt(0).toUpperCase() + category.slice(1);
}
