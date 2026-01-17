import { db } from "@/lib/db";
import { products } from "@/db/schema";
import { eq } from "drizzle-orm";

// Mock data to simulate scraping results if Firecrawl is not configured
const MOCK_SCRAPED_DATA = [
  {
    name: "Premium Organic Sonali Chicken",
    price: 480,
    vendor: "Khaas Food",
    url: "https://khaasfood.com/product/organic-sonali-chicken",
    imageUrl: "https://images.unsplash.com/photo-1587593810167-a84920ea0781?w=800&q=80",
    isOrganic: true,
  },
  {
    name: "Nature's Best Deshi Chicken",
    price: 560,
    vendor: "Safe Foods",
    url: "https://safefoods.com/product/deshi-chicken",
    imageUrl: "https://images.unsplash.com/photo-1612151855475-877969f4a6cc?w=800&q=80",
    isOrganic: true,
  },
  {
    name: "Fresh Organic Broiler (Antibiotic Free)",
    price: 310,
    vendor: "Eon Bazar",
    url: "https://eonbazar.com/product/antibiotic-free-broiler",
    imageUrl: "https://images.unsplash.com/photo-1548567117-023157207642?w=800&q=80",
    isOrganic: false,
  },
   {
    name: "Village Free Range Chicken",
    price: 600,
    vendor: "Organic Chicken BD",
    url: "https://organicchickenbd.com/product/village-chicken",
    imageUrl: "https://images.unsplash.com/photo-1587593810167-a84920ea0781?w=800&q=80",
    isOrganic: true,
  },
];

export async function scrapeProducts() {
  console.log("Starting scrape job...");
  
  // TODO: Integrate Firecrawl here
  // const firecrawl = new FirecrawlApp({ apiKey: process.env.FIRECRAWL_API_KEY });
  // const data = await firecrawl.scrape(...)

  // For now, we simulate scraping by updating/inserting mock data
  // In a real app, we would loop through a list of target URLs and scrape them.

  const results = [];

  for (const item of MOCK_SCRAPED_DATA) {
    // Check if product exists (simple check by URL or Name+Vendor)
    // Here we use URL as unique identifier mostly, but for mock let's just insert if empty or update
    
    // Simple upsert logic (Drizzle doesn't have a simple high-level upsert for all drivers yet, 
    // but we can check existence)
    
    // For this demo, let's just add them if the DB is empty or update prices randomly to simulate change
    
    // Simulate price fluctuation
    const currentPrice = item.price + Math.floor(Math.random() * 20 - 10); 

    // Try to find existing
    // Note: In a real app, we'd probably have a unique constraint on URL
    // Let's assume we just want to seed/update.
    
    // Since we didn't add unique constraint on URL in schema, let's just insert for now 
    // or clear and insert to keep it simple for the demo, OR check by name.
    
    // Let's check by name for simplicity in this demo
    const existing = await db.select().from(products).where(eq(products.name, item.name));
    
    if (existing.length > 0) {
      // Update
      await db.update(products)
        .set({ 
          price: currentPrice, 
          lastScrapedAt: new Date() 
        })
        .where(eq(products.id, existing[0].id));
      results.push({ ...item, status: "updated", price: currentPrice });
    } else {
      // Insert
      await db.insert(products).values({
        name: item.name,
        price: currentPrice,
        vendor: item.vendor,
        url: item.url,
        imageUrl: item.imageUrl,
        isOrganic: item.isOrganic,
      });
      results.push({ ...item, status: "inserted", price: currentPrice });
    }
  }

  return results;
}
