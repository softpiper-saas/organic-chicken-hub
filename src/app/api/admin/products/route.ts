import { NextResponse } from "next/server";
import { priceHistory, productCategories, products } from "@/db/schema";
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

async function categoryIdForSlug(category?: string | null) {
  if (!category) return null;

  const categoryRows = await db
    .select()
    .from(productCategories)
    .where(eq(productCategories.slug, category));

  return categoryRows[0]?.id ?? null;
}

function nullableNumber(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.round(parsed) : null;
}

function nextString(value: unknown, fallback: string | null) {
  if (value === undefined) return fallback;
  if (value === null) return null;
  return String(value);
}

function nextBoolean(value: unknown, fallback: boolean | null) {
  if (value === undefined) return fallback;
  return Boolean(value);
}

function nextNumber(value: unknown, fallback: number | null) {
  if (value === undefined) return fallback;
  return nullableNumber(value);
}

export async function POST(req: Request) {
  try {
    const {
      name,
      description,
      price,
      vendor,
      url,
      category,
      foodType,
      packageSize,
      packageUnit,
      normalizedPricePerKg,
      normalizedPricePerUnit,
      imageUrl,
      isOrganic,
      inStock,
      nutritionVerified,
    } = await req.json();

    if (!name || !vendor || !url || price === undefined || price === null) {
      return NextResponse.json({ error: "Name, vendor, URL, and price are required" }, { status: 400 });
    }

    const categoryId = await categoryIdForSlug(category);
    const inserted = await db
      .insert(products)
      .values({
        name,
        description,
        price: nullableNumber(price) ?? 0,
        vendor,
        url,
        category,
        categoryId,
        foodType,
        packageSize: nullableNumber(packageSize),
        packageUnit,
        normalizedPricePerKg: nullableNumber(normalizedPricePerKg),
        normalizedPricePerUnit: nullableNumber(normalizedPricePerUnit),
        imageUrl,
        isOrganic: Boolean(isOrganic),
        inStock: inStock ?? true,
        nutritionVerified: Boolean(nutritionVerified),
      })
      .returning();

    await db.insert(priceHistory).values({
      productId: inserted[0].id,
      price: inserted[0].price,
    });

    return NextResponse.json(inserted[0]);
  } catch (error) {
    console.error("Error creating admin product:", error);
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const {
      id,
      name,
      description,
      price,
      vendor,
      url,
      category,
      foodType,
      packageSize,
      packageUnit,
      normalizedPricePerKg,
      normalizedPricePerUnit,
      imageUrl,
      isOrganic,
      inStock,
      nutritionVerified,
    } = await req.json();

    if (!id) {
      return NextResponse.json({ error: "Product ID is required" }, { status: 400 });
    }

    const existing = await db.select().from(products).where(eq(products.id, id));
    if (existing.length === 0) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const nextPrice = nextNumber(price, existing[0].price) ?? existing[0].price;
    const nextCategory = nextString(category, existing[0].category);
    const categoryId = await categoryIdForSlug(nextCategory);
    const updated = await db
      .update(products)
      .set({
        name: nextString(name, existing[0].name) ?? existing[0].name,
        description: nextString(description, existing[0].description),
        price: nextPrice,
        vendor: nextString(vendor, existing[0].vendor) ?? existing[0].vendor,
        url: nextString(url, existing[0].url) ?? existing[0].url,
        category: nextCategory,
        categoryId,
        foodType: nextString(foodType, existing[0].foodType),
        packageSize: nextNumber(packageSize, existing[0].packageSize),
        packageUnit: nextString(packageUnit, existing[0].packageUnit),
        normalizedPricePerKg: nextNumber(normalizedPricePerKg, existing[0].normalizedPricePerKg),
        normalizedPricePerUnit: nextNumber(normalizedPricePerUnit, existing[0].normalizedPricePerUnit),
        imageUrl: nextString(imageUrl, existing[0].imageUrl),
        isOrganic: nextBoolean(isOrganic, existing[0].isOrganic),
        inStock: nextBoolean(inStock, existing[0].inStock),
        nutritionVerified: nextBoolean(nutritionVerified, existing[0].nutritionVerified),
      })
      .where(eq(products.id, id))
      .returning();

    if (nextPrice !== existing[0].price) {
      await db.insert(priceHistory).values({
        productId: id,
        price: nextPrice,
      });
    }

    return NextResponse.json(updated[0]);
  } catch (error) {
    console.error("Error updating product nutrition mapping:", error);
    return NextResponse.json({ error: "Failed to update product" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { id } = await req.json();
    if (!id) {
      return NextResponse.json({ error: "Product ID is required" }, { status: 400 });
    }

    await db.delete(priceHistory).where(eq(priceHistory.productId, id));
    await db.delete(products).where(eq(products.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting product:", error);
    return NextResponse.json({ error: "Failed to delete product" }, { status: 500 });
  }
}
