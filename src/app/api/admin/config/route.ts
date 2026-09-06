import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { scrapingConfigs } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const configs = await db.select().from(scrapingConfigs);
    return NextResponse.json(configs);
  } catch {
    return NextResponse.json({ error: "Failed to fetch configs" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { url, vendorName, category, sourceType } = await req.json();
    if (!url) return NextResponse.json({ error: "URL is required" }, { status: 400 });

    const newConfig = await db.insert(scrapingConfigs).values({
      url,
      vendorName,
      category: category || "chicken",
      sourceType: sourceType || "product_page",
    }).returning();
    return NextResponse.json(newConfig[0]);
  } catch {
    return NextResponse.json({ error: "Failed to add URL" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const { id, url, vendorName, category, sourceType, isActive } = await req.json();
    if (!id) return NextResponse.json({ error: "ID is required" }, { status: 400 });

    const existing = await db
      .select()
      .from(scrapingConfigs)
      .where(eq(scrapingConfigs.id, id));

    if (existing.length === 0) {
      return NextResponse.json({ error: "Source not found" }, { status: 404 });
    }

    const updated = await db
      .update(scrapingConfigs)
      .set({
        url: url ?? existing[0].url,
        vendorName: vendorName ?? existing[0].vendorName,
        category: category ?? existing[0].category,
        sourceType: sourceType ?? existing[0].sourceType,
        isActive: isActive ?? existing[0].isActive,
      })
      .where(eq(scrapingConfigs.id, id))
      .returning();

    return NextResponse.json(updated[0]);
  } catch {
    return NextResponse.json({ error: "Failed to update URL" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
    try {
        const { id } = await req.json();
        if (!id) return NextResponse.json({ error: "ID is required" }, { status: 400 });

        await db.delete(scrapingConfigs).where(eq(scrapingConfigs.id, id));
        return NextResponse.json({ success: true });
    } catch {
        return NextResponse.json({ error: "Failed to delete URL" }, { status: 500 });
    }
}
