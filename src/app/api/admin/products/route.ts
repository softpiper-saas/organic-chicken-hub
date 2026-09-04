import { NextResponse } from "next/server";
import { productCategories, products } from "@/db/schema";
import { db } from "@/lib/db";
import { desc, eq } from "drizzle-orm";

export async function GET() {
  try {
    const allProducts = await db.select().from(products).orderBy(desc(products.lastScrapedAt));
    return NextResponse.json(allProducts);
  } catch (error) {
    console.error("Error fetching admin products:", error);
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const {
      id,
      category,
      foodType,
      normalizedPricePerKg,
      normalizedPricePerUnit,
      nutritionVerified,
    } = await req.json();

    if (!id) {
      return NextResponse.json({ error: "Product ID is required" }, { status: 400 });
    }

    let categoryId: string | null = null;
    if (category) {
      const categoryRows = await db
        .select()
        .from(productCategories)
        .where(eq(productCategories.slug, category));
      categoryId = categoryRows[0]?.id ?? null;
    }

    const updated = await db
      .update(products)
      .set({
        category,
        categoryId,
        foodType,
        normalizedPricePerKg,
        normalizedPricePerUnit,
        nutritionVerified,
      })
      .where(eq(products.id, id))
      .returning();

    return NextResponse.json(updated[0]);
  } catch (error) {
    console.error("Error updating product nutrition mapping:", error);
    return NextResponse.json({ error: "Failed to update product" }, { status: 500 });
  }
}
