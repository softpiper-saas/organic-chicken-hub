import { NextResponse } from "next/server";
import { productCategories, products } from "@/db/schema";
import { db } from "@/lib/db";
import { eq } from "drizzle-orm";

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

export async function GET() {
  try {
    const categories = await db.select().from(productCategories);
    return NextResponse.json(categories);
  } catch (error) {
    console.error("Error fetching admin categories:", error);
    return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { name, slug, description } = await req.json();
    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const normalizedSlug = slugify(slug || name);
    if (!normalizedSlug) {
      return NextResponse.json({ error: "Valid slug is required" }, { status: 400 });
    }

    const inserted = await db
      .insert(productCategories)
      .values({
        name,
        slug: normalizedSlug,
        description,
      })
      .returning();

    return NextResponse.json(inserted[0]);
  } catch (error) {
    console.error("Error creating category:", error);
    return NextResponse.json({ error: "Failed to create category" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const { id, name, slug, description } = await req.json();
    if (!id) {
      return NextResponse.json({ error: "Category ID is required" }, { status: 400 });
    }

    const existing = await db
      .select()
      .from(productCategories)
      .where(eq(productCategories.id, id));

    if (existing.length === 0) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    const normalizedSlug = slug ? slugify(slug) : existing[0].slug;
    const updated = await db
      .update(productCategories)
      .set({
        name: name || existing[0].name,
        slug: normalizedSlug,
        description,
      })
      .where(eq(productCategories.id, id))
      .returning();

    if (existing[0].slug !== normalizedSlug) {
      await db
        .update(products)
        .set({ category: normalizedSlug })
        .where(eq(products.categoryId, id));
    }

    return NextResponse.json(updated[0]);
  } catch (error) {
    console.error("Error updating category:", error);
    return NextResponse.json({ error: "Failed to update category" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { id } = await req.json();
    if (!id) {
      return NextResponse.json({ error: "Category ID is required" }, { status: 400 });
    }

    const existing = await db
      .select()
      .from(productCategories)
      .where(eq(productCategories.id, id));

    if (existing.length === 0) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    await db
      .update(products)
      .set({ categoryId: null, category: null })
      .where(eq(products.categoryId, id));

    await db.delete(productCategories).where(eq(productCategories.id, id));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting category:", error);
    return NextResponse.json({ error: "Failed to delete category" }, { status: 500 });
  }
}
