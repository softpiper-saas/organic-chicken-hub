"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Product = {
  id: string;
  name: string;
  vendor: string;
  price: number;
  isOrganic: boolean;
};

export function CostCalculator() {
  const [broilerPrice, setBroilerPrice] = useState(170);
  const [broilerConsumption, setBroilerConsumption] = useState(6);
  const [organicPrice, setOrganicPrice] = useState(390);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProviderId, setSelectedProviderId] = useState<string>("custom");

  useEffect(() => {
    async function fetchProducts() {
      try {
        const res = await fetch("/api/products");
        if (res.ok) {
          const data = await res.json();
          // Filter for organic products and maybe unique vendors? 
          // For now, let's just list all organic options.
          const organicProducts = data.filter((p: Product) => p.isOrganic);
          setProducts(organicProducts);
          
          // Optional: Select the first one by default if available? 
          // Let's keep default as custom/390 for now to match previous behavior, 
          // or switch to the first provider if we want to be aggressive.
          // Keeping 'custom' is safer.
        }
      } catch (error) {
        console.error("Failed to fetch products", error);
      }
    }
    fetchProducts();
  }, []);

  const handleProviderChange = (value: string) => {
    setSelectedProviderId(value);
    if (value !== "custom") {
      const product = products.find((p) => p.id === value);
      if (product) {
        setOrganicPrice(product.price);
      }
    }
  };

  // Constants
  const BROILER_WASTAGE_PERCENTAGE = 0.30; // 30% wastage
  const ORGANIC_WASTAGE_PERCENTAGE = 0.25; // Assuming slightly less wastage or similar? Let's keep it simple or make it configurable. 
  // Actually user said: "After removing the wastage, I do get 70% off solid meat." -> 30% wastage.
  
  const solidMeatRatio = 1 - BROILER_WASTAGE_PERCENTAGE;

  // Calculations
  const monthlyBroilerCost = broilerPrice * broilerConsumption;
  const solidMeatKg = broilerConsumption * solidMeatRatio;
  const broilerRealCostPerKg = monthlyBroilerCost / solidMeatKg;

  // Organic Comparison
  // User Logic: Calculate cost based on the "Solid Meat" weight, not the raw broiler weight.
  // This assumes the user switches to buying the *equivalent weight* of the meat they actually consume.
  const organicCostForSameAmount = solidMeatKg * organicPrice;
  
  const extraCost = organicCostForSameAmount - monthlyBroilerCost;

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Broiler vs. Organic: The Real Cost</CardTitle>
        <CardDescription>
          Calculate how much you are really paying for solid meat and the cost to switch to organic.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="broiler-price">Broiler Price (Tk/kg)</Label>
            <Input
              id="broiler-price"
              type="number"
              value={broilerPrice}
              onChange={(e) => setBroilerPrice(Number(e.target.value))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="consumption">Monthly Consumption (kg)</Label>
            <Input
              id="consumption"
              type="number"
              value={broilerConsumption}
              onChange={(e) => setBroilerConsumption(Number(e.target.value))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="organic-provider">Organic Provider</Label>
            <Select value={selectedProviderId} onValueChange={handleProviderChange}>
              <SelectTrigger id="organic-provider">
                <SelectValue placeholder="Select a provider" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="custom">Custom Price</SelectItem>
                {products.map((product) => (
                  <SelectItem key={product.id} value={product.id}>
                    {product.vendor} - {product.name} ({product.price} Tk/kg)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {selectedProviderId === "custom" && (
            <div className="space-y-2">
              <Label htmlFor="organic-price">Organic Price (Tk/kg)</Label>
              <Input
                id="organic-price"
                type="number"
                value={organicPrice}
                onChange={(e) => setOrganicPrice(Number(e.target.value))}
              />
            </div>
          )}
          
          {selectedProviderId !== "custom" && (
             <div className="space-y-2">
              <Label>Selected Price</Label>
              <div className="p-2 border rounded-md bg-muted text-muted-foreground">
                {organicPrice} Tk/kg
              </div>
            </div>
          )}
        </div>

        <div className="bg-muted p-4 rounded-lg space-y-2">
          <h3 className="font-semibold text-lg">Analysis</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Solid Meat You Get</p>
              <p className="text-xl font-bold">{solidMeatKg.toFixed(2)} kg</p>
              <p className="text-xs text-muted-foreground">(70% of broiler weight)</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Real Cost of Broiler (Solid Meat)</p>
              <p className="text-xl font-bold text-orange-600">{broilerRealCostPerKg.toFixed(2)} Tk/kg</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Monthly Broiler Cost</p>
              <p className="text-xl font-bold">{monthlyBroilerCost.toFixed(0)} Tk</p>
            </div>
             <div>
              <p className="text-sm text-muted-foreground">Est. Monthly Organic Cost</p>
              <p className="text-xl font-bold text-green-600">{organicCostForSameAmount.toFixed(0)} Tk</p>
              <p className="text-xs text-muted-foreground">
                (Calculated on {solidMeatKg.toFixed(2)} kg solid meat)
              </p>
            </div>
          </div>
        </div>

        <div className="text-center">
          <p className="text-lg">
            Extra cost to switch to Organic: <span className="font-bold text-red-500">{extraCost.toFixed(0)} Tk/month</span>
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Is your health worth less than {(extraCost / 30).toFixed(0)} Tk per day?
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
