import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { products } from "@/db/schema";
import { desc, eq } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const allProducts = category
      ? await db
          .select()
          .from(products)
          .where(eq(products.category, category))
          .orderBy(desc(products.lastScrapedAt))
      : await db.select().from(products).orderBy(desc(products.lastScrapedAt));

    return NextResponse.json(allProducts);
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}
