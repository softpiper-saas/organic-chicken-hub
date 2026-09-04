import { NextResponse } from "next/server";
import { priceHistory } from "@/db/schema";
import { db } from "@/lib/db";
import { desc, eq } from "drizzle-orm";

type PriceHistoryRouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_req: Request, context: PriceHistoryRouteContext) {
  try {
    const { id } = await context.params;
    const history = await db
      .select()
      .from(priceHistory)
      .where(eq(priceHistory.productId, id))
      .orderBy(desc(priceHistory.recordedAt));

    return NextResponse.json(history);
  } catch (error) {
    console.error("Error fetching price history:", error);
    return NextResponse.json({ error: "Failed to fetch price history" }, { status: 500 });
  }
}
