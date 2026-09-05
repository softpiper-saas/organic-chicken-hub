import { NextResponse } from "next/server";
import { priceHistory, products } from "@/db/schema";
import { db } from "@/lib/db";
import { desc, eq } from "drizzle-orm";

function nullableDate(value: unknown) {
  if (!value || typeof value !== "string") return new Date();
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? new Date() : date;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get("productId");

    if (!productId) {
      return NextResponse.json({ error: "Product ID is required" }, { status: 400 });
    }

    const history = await db
      .select()
      .from(priceHistory)
      .where(eq(priceHistory.productId, productId))
      .orderBy(desc(priceHistory.recordedAt));

    return NextResponse.json(history);
  } catch (error) {
    console.error("Error fetching admin price history:", error);
    return NextResponse.json({ error: "Failed to fetch price history" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { productId, price, recordedAt } = await req.json();

    if (!productId || price === undefined || price === null) {
      return NextResponse.json({ error: "Product ID and price are required" }, { status: 400 });
    }

    const parsedPrice = Number(price);
    if (!Number.isFinite(parsedPrice)) {
      return NextResponse.json({ error: "Valid price is required" }, { status: 400 });
    }

    const existingProduct = await db.select().from(products).where(eq(products.id, productId));
    if (existingProduct.length === 0) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const inserted = await db
      .insert(priceHistory)
      .values({
        productId,
        price: Math.round(parsedPrice),
        recordedAt: nullableDate(recordedAt),
      })
      .returning();

    return NextResponse.json(inserted[0]);
  } catch (error) {
    console.error("Error creating price history row:", error);
    return NextResponse.json({ error: "Failed to create price history row" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const { id, price, recordedAt } = await req.json();

    if (!id) {
      return NextResponse.json({ error: "Price history ID is required" }, { status: 400 });
    }

    const parsedPrice = Number(price);
    if (!Number.isFinite(parsedPrice)) {
      return NextResponse.json({ error: "Valid price is required" }, { status: 400 });
    }

    const existing = await db.select().from(priceHistory).where(eq(priceHistory.id, id));
    if (existing.length === 0) {
      return NextResponse.json({ error: "Price history row not found" }, { status: 404 });
    }

    const updated = await db
      .update(priceHistory)
      .set({
        price: Math.round(parsedPrice),
        recordedAt: nullableDate(recordedAt),
      })
      .where(eq(priceHistory.id, id))
      .returning();

    return NextResponse.json(updated[0]);
  } catch (error) {
    console.error("Error updating price history row:", error);
    return NextResponse.json({ error: "Failed to update price history row" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { id } = await req.json();
    if (!id) {
      return NextResponse.json({ error: "Price history ID is required" }, { status: 400 });
    }

    await db.delete(priceHistory).where(eq(priceHistory.id, id));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting price history row:", error);
    return NextResponse.json({ error: "Failed to delete price history row" }, { status: 500 });
  }
}
