import { db } from "@/lib/db";
import { priceHistory, products, scrapingConfigs } from "@/db/schema";
import { eq } from "drizzle-orm";
import FirecrawlApp from '@mendable/firecrawl-js';
import { z } from "zod/v3";

const productExtractSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  price: z.number(),
  vendor: z.string(),
  imageUrl: z.string().optional(),
  isOrganic: z.boolean().optional(),
});

type ExtractedProduct = z.infer<typeof productExtractSchema>;

type ProductScrapeResponse = {
  success: boolean;
  extract?: ExtractedProduct;
  error?: string;
};

// Initialize Firecrawl
const firecrawl = new FirecrawlApp({ apiKey: process.env.FIRECRAWL_API_KEY });

export async function scrapeProducts() {
  console.log("Starting scrape job...");
  
  // Fetch active URLs from config
  const configs = await db.select().from(scrapingConfigs).where(eq(scrapingConfigs.isActive, true));
  
  if (configs.length === 0) {
    console.log("No active scraping configs found.");
    return [];
  }

  const results = [];

  for (const config of configs) {
    console.log(`Scraping URL: ${config.url}`);
    try {
      const scrapeResult = await firecrawl.scrapeUrl(config.url, {
        formats: ["extract"],
        extract: {
          prompt: "Extract the product name, description (brief summary), price (as integer, remove currency symbol), vendor name, and image URL from this product page. Also determine if it is organic based on keywords.",
          schema: productExtractSchema,
        }
      }) as ProductScrapeResponse;

      if (!scrapeResult.success) {
        console.error(`Failed to scrape ${config.url}:`, scrapeResult.error);
        continue;
      }

      const data = scrapeResult.extract;
      
      if (!data) {
         console.error(`No data extracted for ${config.url}`);
         continue;
      }

      // Upsert product
      // Check if product exists by URL (assuming 1 product per URL for now)
      const existing = await db.select().from(products).where(eq(products.url, config.url));

      if (existing.length > 0) {
        const previousPrice = existing[0].price;
        await db.update(products)
          .set({
            name: data.name,
            description: data.description,
            price: data.price,
            vendor: data.vendor,
            imageUrl: data.imageUrl,
            isOrganic: data.isOrganic,
            lastScrapedAt: new Date()
          })
          .where(eq(products.id, existing[0].id));
        if (previousPrice !== data.price) {
          await db.insert(priceHistory).values({
            productId: existing[0].id,
            price: data.price,
          });
        }
        results.push({ ...data, url: config.url, status: "updated" });
      } else {
        const inserted = await db.insert(products).values({
          name: data.name,
          description: data.description,
          price: data.price,
          vendor: data.vendor,
          url: config.url,
          imageUrl: data.imageUrl,
          isOrganic: data.isOrganic,
        }).returning();
        await db.insert(priceHistory).values({
          productId: inserted[0].id,
          price: data.price,
        });
        results.push({ ...data, url: config.url, status: "inserted" });
      }
      
      // Update last scraped time for config
      await db.update(scrapingConfigs)
        .set({ lastScrapedAt: new Date() })
        .where(eq(scrapingConfigs.id, config.id));

    } catch (error) {
      console.error(`Error scraping ${config.url}:`, error);
    }
  }

  return results;
}
