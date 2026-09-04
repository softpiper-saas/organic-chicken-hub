import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { productCategories } from "@/db/schema";
import { defaultProductCategories } from "@/lib/product-categories";

export async function GET() {
  try {
    const categories = await db.select().from(productCategories);
    return NextResponse.json(categories.length > 0 ? categories : defaultProductCategories);
  } catch (error) {
    console.error("Error fetching product categories:", error);
    return NextResponse.json(defaultProductCategories);
  }
}
