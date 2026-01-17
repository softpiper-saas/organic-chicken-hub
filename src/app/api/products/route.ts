import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { products } from "@/db/schema";
import { desc } from "drizzle-orm";

export async function GET() {
  try {
    const allProducts = await db.select().from(products).orderBy(desc(products.lastScrapedAt));
    return NextResponse.json(allProducts);
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}
