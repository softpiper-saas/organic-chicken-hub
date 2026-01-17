"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export function CostCalculator() {
  const [broilerPrice, setBroilerPrice] = useState(170);
  const [broilerConsumption, setBroilerConsumption] = useState(6);
  const [organicPrice, setOrganicPrice] = useState(390);

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
  // Assuming organic has similar wastage? Or user implies organic is "solid meat"? 
  // User said: "Side by side I will also show the cost the customer have to pay to buy 1 kg organic chicken."
  // Usually organic chicken also has wastage (bones, skin). 
  // But let's assume we compare "Live Weight" price vs "Live Weight" price, OR "Solid Meat" cost.
  // The user's example: "From this numbers I can easily calculate how much I have to pay for 1 kg of solid meat."
  // Let's calculate the cost difference for the SAME AMOUNT of solid meat.
  
  const organicCostForSameAmount = (solidMeatKg / solidMeatRatio) * organicPrice; 
  // If we assume organic has same wastage. 
  // If organic is sold as processed meat, the calculation differs. 
  // Let's assume both are live weight for now as is common in BD, or allow user to toggle.
  // For simplicity, I will assume the user buys Live Weight for both.
  
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
            <Label htmlFor="organic-price">Organic Price (Tk/kg)</Label>
            <Input
              id="organic-price"
              type="number"
              value={organicPrice}
              onChange={(e) => setOrganicPrice(Number(e.target.value))}
            />
          </div>
        </div>

        <div className="bg-muted p-4 rounded-lg space-y-2">
          <h3 className="font-semibold text-lg">Analysis</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Solid Meat You Get</p>
              <p className="text-xl font-bold">{solidMeatKg.toFixed(2)} kg</p>
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
