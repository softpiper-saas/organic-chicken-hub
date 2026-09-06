import { NextResponse } from "next/server";
import { scrapeProducts } from "@/lib/scraper";

export async function POST(req: Request) {
  try {
    let body: { sourceId?: string; productId?: string } = {};

    try {
      body = await req.json();
    } catch {
      body = {};
    }

    const results = await scrapeProducts({
      sourceId: body.sourceId,
      productId: body.productId,
    });

    if (results.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "No products were scraped. Check the source URL, page type, or vendor access rules.",
          data: [],
        },
        { status: 502 }
      );
    }

    return NextResponse.json({ success: true, data: results });
  } catch (error) {
    console.error("Scraping failed:", error);
    return NextResponse.json({ error: "Scraping failed" }, { status: 500 });
  }
}
