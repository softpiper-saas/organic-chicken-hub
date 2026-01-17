"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";

type Product = {
  id: string;
  name: string;
  vendor: string;
  price: number;
  imageUrl: string | null;
  url: string;
  isOrganic: boolean;
};

export function ProductList() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProducts() {
      try {
        const res = await fetch("/api/products");
        if (res.ok) {
          const data = await res.json();
          setProducts(data);
        }
      } catch (error) {
        console.error("Failed to fetch products", error);
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, []);

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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {products.map((product) => (
        <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow">
          <div className="relative h-48 w-full">
            <Image
              src={product.imageUrl || "https://placehold.co/600x400?text=No+Image"}
              alt={product.name}
              fill
              className="object-cover"
            />
            {product.isOrganic && (
              <Badge className="absolute top-2 right-2 bg-green-600">Organic</Badge>
            )}
          </div>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-muted-foreground">{product.vendor}</p>
                <CardTitle className="text-lg">{product.name}</CardTitle>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-primary">{product.price} Tk <span className="text-sm font-normal text-muted-foreground">/kg</span></p>
          </CardContent>
          <CardFooter>
            <Button className="w-full" asChild>
              <a href={product.url} target="_blank" rel="noopener noreferrer">Buy Now</a>
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
