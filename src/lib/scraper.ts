import { db } from "@/lib/db";
import {
  priceHistory,
  productCategories,
  products,
  scrapingConfigs,
  vendors,
} from "@/db/schema";
import { profileForCategory } from "@/lib/nutrition";
import { FoodCategory } from "@/types/protein-planner";
import { eq } from "drizzle-orm";
import FirecrawlApp from '@mendable/firecrawl-js';
import { z } from "zod/v3";

const productExtractSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  price: z.number(),
  vendor: z.string(),
  url: z.string().optional(),
  category: z.string().optional(),
  foodType: z.string().optional(),
  packageSize: z.number().optional(),
  packageUnit: z.string().optional(),
  imageUrl: z.string().optional(),
  isOrganic: z.boolean().optional(),
  inStock: z.boolean().optional(),
});

type ExtractedProduct = z.infer<typeof productExtractSchema>;

const productCollectionExtractSchema = z.object({
  products: z.array(productExtractSchema),
});

type ProductScrapeResponse = {
  success: boolean;
  extract?: ExtractedProduct | { products: ExtractedProduct[] };
  error?: string;
};

type FirecrawlScrapeClient = {
  scrapeUrl: (url: string, params: unknown) => Promise<ProductScrapeResponse>;
};

type ScrapeTarget = {
  id?: string;
  url: string;
  vendorName: string | null;
  category: string | null;
  sourceType: string | null;
};

// Initialize Firecrawl
const firecrawl = new FirecrawlApp({
  apiKey: process.env.FIRECRAWL_API_KEY,
}) as unknown as FirecrawlScrapeClient;

const knownCategories: FoodCategory[] = [
  "chicken",
  "egg",
  "fish",
  "lentil",
  "nuts",
  "seeds",
  "dairy",
  "beef",
];

function normalizeCategorySlug(value?: string | null): FoodCategory {
  const normalized = value?.toLowerCase().replace(/[^a-z]+/g, "_").replace(/^_|_$/g, "");
  if (knownCategories.includes(normalized as FoodCategory)) {
    return normalized as FoodCategory;
  }

  return "chicken";
}

function normalizePackageUnit(value?: string) {
  const normalized = value?.toLowerCase().trim();
  if (!normalized) return null;

  if (["kg", "kilogram", "kilograms"].includes(normalized)) return "kg";
  if (["g", "gm", "gram", "grams"].includes(normalized)) return "g";
  if (["pc", "pcs", "piece", "pieces", "egg", "eggs"].includes(normalized)) return "pc";
  if (["serving", "servings"].includes(normalized)) return "serving";

  return normalized;
}

function normalizePrices(product: ExtractedProduct, category: FoodCategory) {
  const unit = normalizePackageUnit(product.packageUnit);
  const size = product.packageSize;

  if (unit === "kg" && size && size > 0) {
    return {
      packageSize: Math.round(size * 1000),
      packageUnit: "g",
      normalizedPricePerKg: Math.round(product.price / size),
      normalizedPricePerUnit: null,
    };
  }

  if (unit === "g" && size && size > 0) {
    return {
      packageSize: Math.round(size),
      packageUnit: "g",
      normalizedPricePerKg: Math.round(product.price / (size / 1000)),
      normalizedPricePerUnit: null,
    };
  }

  if (unit === "pc" && size && size > 0) {
    return {
      packageSize: Math.round(size),
      packageUnit: "pc",
      normalizedPricePerKg: null,
      normalizedPricePerUnit: Math.round(product.price / size),
    };
  }

  if (unit === "pc") {
    return {
      packageSize: 1,
      packageUnit: "pc",
      normalizedPricePerKg: null,
      normalizedPricePerUnit: Math.round(product.price),
    };
  }

  if (category === "egg") {
    return {
      packageSize: size ? Math.round(size) : 1,
      packageUnit: "pc",
      normalizedPricePerKg: null,
      normalizedPricePerUnit: size && size > 0 ? Math.round(product.price / size) : Math.round(product.price),
    };
  }

  return {
    packageSize: size ? Math.round(size) : null,
    packageUnit: unit,
    normalizedPricePerKg: Math.round(product.price),
    normalizedPricePerUnit: null,
  };
}

async function findOrCreateCategory(category: FoodCategory) {
  const existing = await db
    .select()
    .from(productCategories)
    .where(eq(productCategories.slug, category));

  if (existing.length > 0) return existing[0];

  const inserted = await db
    .insert(productCategories)
    .values({
      name: category.charAt(0).toUpperCase() + category.slice(1),
      slug: category,
    })
    .returning();

  return inserted[0];
}

async function findOrCreateVendor(name: string, url: string, category: FoodCategory) {
  const vendorUrl = new URL(url).origin;
  const existing = await db.select().from(vendors).where(eq(vendors.url, vendorUrl));

  if (existing.length > 0) return existing[0];

  const inserted = await db
    .insert(vendors)
    .values({
      name,
      url: vendorUrl,
      category,
      deliveryArea: "Bangladesh",
    })
    .returning();

  return inserted[0];
}

function extractedProductsFromResult(extract: ProductScrapeResponse["extract"]) {
  if (!extract) return [];
  if ("products" in extract) return extract.products;
  return [extract];
}

async function upsertProduct(data: ExtractedProduct, config: ScrapeTarget) {
  const productUrl = data.url || config.url;
  const category = normalizeCategorySlug(data.category || config.category);
  const categoryRecord = await findOrCreateCategory(category);
  const vendorName = data.vendor || config.vendorName || new URL(config.url).hostname;
  const vendorRecord = await findOrCreateVendor(vendorName, productUrl, category);
  const profile = profileForCategory(category, data.name);
  const normalizedPrices = normalizePrices(data, category);

  const existing = await db.select().from(products).where(eq(products.url, productUrl));

  if (existing.length > 0) {
    const previousPrice = existing[0].price;
    await db.update(products)
      .set({
        name: data.name,
        description: data.description,
        price: data.price,
        vendor: vendorName,
        vendorId: vendorRecord.id,
        categoryId: categoryRecord.id,
        category,
        foodType: data.foodType || profile?.foodType,
        packageSize: normalizedPrices.packageSize,
        packageUnit: normalizedPrices.packageUnit,
        normalizedPricePerKg: normalizedPrices.normalizedPricePerKg,
        normalizedPricePerUnit: normalizedPrices.normalizedPricePerUnit,
        imageUrl: data.imageUrl,
        isOrganic: data.isOrganic,
        inStock: data.inStock ?? true,
        nutritionVerified: Boolean(profile),
        lastScrapedAt: new Date()
      })
      .where(eq(products.id, existing[0].id));

    if (previousPrice !== data.price) {
      await db.insert(priceHistory).values({
        productId: existing[0].id,
        price: data.price,
      });
    }

    return { ...data, url: productUrl, category, foodType: data.foodType || profile?.foodType, status: "updated" };
  }

  const inserted = await db.insert(products).values({
    name: data.name,
    description: data.description,
    price: data.price,
    vendor: vendorName,
    vendorId: vendorRecord.id,
    categoryId: categoryRecord.id,
    category,
    foodType: data.foodType || profile?.foodType,
    url: productUrl,
    packageSize: normalizedPrices.packageSize,
    packageUnit: normalizedPrices.packageUnit,
    normalizedPricePerKg: normalizedPrices.normalizedPricePerKg,
    normalizedPricePerUnit: normalizedPrices.normalizedPricePerUnit,
    imageUrl: data.imageUrl,
    isOrganic: data.isOrganic,
    inStock: data.inStock ?? true,
    nutritionVerified: Boolean(profile),
  }).returning();

  await db.insert(priceHistory).values({
    productId: inserted[0].id,
    price: data.price,
  });

  return { ...data, url: productUrl, category, foodType: data.foodType || profile?.foodType, status: "inserted" };
}

async function scrapeTargets(configs: ScrapeTarget[], updateConfigTimestamps: boolean) {
  const results = [];

  for (const config of configs) {
    console.log(`Scraping URL: ${config.url}`);
    try {
      const isCollectionPage = config.sourceType === "collection_page";
      const scrapeResult = await firecrawl.scrapeUrl(config.url, {
        formats: ["extract"],
        extract: {
          prompt: isCollectionPage
            ? `Extract product cards from this collection page. For each product, return name, brief description when available, price as an integer in Tk, vendor name, product URL, image URL, category, foodType, packageSize, packageUnit, stock status, and whether it appears organic. Default category is ${config.category || "chicken"} and default vendor is ${config.vendorName || "the source website"}.`
            : `Extract the product name, description, price as an integer in Tk, vendor name, product URL, image URL, category, foodType, packageSize, packageUnit, stock status, and whether it appears organic from this product page. Default category is ${config.category || "chicken"} and default vendor is ${config.vendorName || "the source website"}.`,
          schema: isCollectionPage ? productCollectionExtractSchema : productExtractSchema,
        }
      });

      if (!scrapeResult.success) {
        console.error(`Failed to scrape ${config.url}:`, scrapeResult.error);
        continue;
      }

      const extractedProducts = extractedProductsFromResult(scrapeResult.extract);

      if (extractedProducts.length === 0) {
         console.error(`No data extracted for ${config.url}`);
         continue;
      }

      for (const data of extractedProducts) {
        results.push(await upsertProduct(data, config));
      }
      
      // Update last scraped time for config
      if (updateConfigTimestamps && config.id) {
        await db.update(scrapingConfigs)
          .set({ lastScrapedAt: new Date() })
          .where(eq(scrapingConfigs.id, config.id));
      }

    } catch (error) {
      console.error(`Error scraping ${config.url}:`, error);
    }
  }

  return results;
}

export async function scrapeProducts(options: { sourceId?: string; productId?: string } = {}) {
  console.log("Starting scrape job...");

  if (options.sourceId) {
    const configs = await db
      .select()
      .from(scrapingConfigs)
      .where(eq(scrapingConfigs.id, options.sourceId));

    if (configs.length === 0) {
      console.log("No scraping config found for requested source.");
      return [];
    }

    return scrapeTargets(configs, true);
  }

  if (options.productId) {
    const productRows = await db
      .select()
      .from(products)
      .where(eq(products.id, options.productId));

    if (productRows.length === 0) {
      console.log("No product found for requested scrape.");
      return [];
    }

    const product = productRows[0];
    return scrapeTargets([
      {
        url: product.url,
        vendorName: product.vendor,
        category: product.category,
        sourceType: "product_page",
      },
    ], false);
  }

  const configs = await db.select().from(scrapingConfigs).where(eq(scrapingConfigs.isActive, true));

  if (configs.length === 0) {
    console.log("No active scraping configs found.");
    return [];
  }

  return scrapeTargets(configs, true);
}
