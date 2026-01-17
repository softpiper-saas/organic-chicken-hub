import { NextResponse } from "next/server";
import { scrapeProducts } from "@/lib/scraper";

export async function POST() {
  try {
    const results = await scrapeProducts();
    return NextResponse.json({ success: true, data: results });
  } catch (error) {
    console.error("Scraping failed:", error);
    return NextResponse.json({ error: "Scraping failed" }, { status: 500 });
  }
}
