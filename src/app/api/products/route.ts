import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { products } from "@/db/schema";
import { and, desc, eq, isNull, ne, or } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const availableOnly = searchParams.get("available") !== "false";
    const filters = [
      category ? eq(products.category, category) : undefined,
      availableOnly ? or(isNull(products.inStock), ne(products.inStock, false)) : undefined,
    ].filter((filter): filter is NonNullable<typeof filter> => Boolean(filter));

    const allProducts = category
      ? await db
          .select()
          .from(products)
          .where(and(...filters))
          .orderBy(desc(products.lastScrapedAt))
      : filters.length > 0
        ? await db
            .select()
            .from(products)
            .where(and(...filters))
            .orderBy(desc(products.lastScrapedAt))
        : await db.select().from(products).orderBy(desc(products.lastScrapedAt));

    return NextResponse.json(allProducts);
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}
