import { db } from "@/lib/db";
import {
  priceHistory,
  productCategories,
  products,
  scrapingConfigs,
  vendors,
} from "@/db/schema";
import { profileForCategory } from "@/lib/nutrition";
import { normalizeProductUrl } from "@/lib/product-url";
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

const organicPositivePatterns = [
  /\bcertified\s+organic\b/i,
  /\borganic\b/i,
  /\borganically\s+(raised|grown|fed|produced)\b/i,
  /\bchemical[-\s]?free\b/i,
  /অর্গানিক/u,
  /জৈব/u,
];

const organicNegativePatterns = [
  /\bbroiler\b/i,
  /\bsafe\s+broiler\b/i,
  /\bregular\b/i,
  /\bconventional\b/i,
  /\bfarm[-\s]?raised\b/i,
  /\bsonali\b/i,
  /ব্রয়লার/u,
  /ব্রয়লার/u,
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

function decodeHtmlEntities(value: string) {
  const namedEntities: Record<string, string> = {
    amp: "&",
    quot: "\"",
    apos: "'",
    lt: "<",
    gt: ">",
    nbsp: " ",
  };

  return value.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (match, entity: string) => {
    const normalizedEntity = entity.toLowerCase();

    if (normalizedEntity.startsWith("#x")) {
      return String.fromCodePoint(Number.parseInt(normalizedEntity.slice(2), 16));
    }

    if (normalizedEntity.startsWith("#")) {
      return String.fromCodePoint(Number.parseInt(normalizedEntity.slice(1), 10));
    }

    return namedEntities[normalizedEntity] ?? match;
  });
}

function cleanText(value?: string | null) {
  if (!value) return undefined;

  const withoutHiddenContent = value
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ");
  const withoutTags = withoutHiddenContent.replace(/<[^>]+>/g, " ");
  const normalized = decodeHtmlEntities(withoutTags).replace(/\s+/g, " ").trim();

  return normalized || undefined;
}

function escapedRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function extractMetaContent(html: string, name: string) {
  const escapedName = escapedRegExp(name);
  const propertyFirst = new RegExp(
    `<meta[^>]+(?:property|name)=["']${escapedName}["'][^>]+content=["']([^"']+)["'][^>]*>`,
    "i"
  );
  const contentFirst = new RegExp(
    `<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${escapedName}["'][^>]*>`,
    "i"
  );

  return cleanText(html.match(propertyFirst)?.[1] ?? html.match(contentFirst)?.[1]);
}

function extractFirstHtmlMatch(html: string, pattern: RegExp) {
  return cleanText(html.match(pattern)?.[1]);
}

function parsePriceValue(value?: string | null) {
  if (!value) return null;

  const parsed = Number(value.replace(/,/g, ""));
  return Number.isFinite(parsed) ? Math.round(parsed) : null;
}

function extractPriceFromHtml(html: string) {
  const metaPrice =
    parsePriceValue(extractMetaContent(html, "product:price:amount")) ??
    parsePriceValue(extractMetaContent(html, "og:price:amount"));

  if (metaPrice) return metaPrice;

  const visiblePrice =
    html.match(/(?:৳|Tk\.?|BDT)\s*([0-9][0-9,]*(?:\.\d{1,2})?)/i)?.[1] ??
    html.match(/([0-9][0-9,]*(?:\.\d{1,2})?)\s*(?:৳|Tk\.?|BDT)/i)?.[1];

  const parsedVisiblePrice = parsePriceValue(visiblePrice);
  if (parsedVisiblePrice) return parsedVisiblePrice;

  return parsePriceValue(html.match(/"price"\s*:\s*"?([0-9][0-9,.]*)"?/i)?.[1]);
}

function extractPackageFromText(text: string) {
  const match = text.match(/(\d+(?:\.\d+)?)\s*(kg|kilogram|kilograms|g|gm|gram|grams|pcs?|pieces?|eggs?)/i);
  if (!match) return {};

  return {
    packageSize: Number(match[1]),
    packageUnit: normalizePackageUnit(match[2]) ?? undefined,
  };
}

function inferCategoryFromText(text: string, fallback?: string | null): FoodCategory {
  const configuredCategory = fallback?.toLowerCase().replace(/[^a-z]+/g, "_").replace(/^_|_$/g, "");
  if (knownCategories.includes(configuredCategory as FoodCategory)) {
    return configuredCategory as FoodCategory;
  }

  const categorySignals: Array<[FoodCategory, RegExp]> = [
    ["fish", /\b(fish|rui|ilish|hilsa|pabda|katla|tilapia|salmon|tuna|shrimp|prawn)\b|মাছ/iu],
    ["nuts", /\b(nut|nuts|almond|cashew|pistachio|walnut|peanut)\b|বাদাম/iu],
    ["seeds", /\b(seed|seeds|chia|flax|pumpkin|sunflower)\b/iu],
    ["egg", /\b(egg|eggs)\b|ডিম/iu],
    ["lentil", /\b(lentil|dal|daal)\b|ডাল/iu],
    ["dairy", /\b(milk|yogurt|curd|paneer|cheese)\b|দুধ/iu],
    ["beef", /\b(beef|meat)\b|গরু/iu],
    ["chicken", /\b(chicken|broiler|sonali)\b|মুরগি/iu],
  ];

  return categorySignals.find(([, pattern]) => pattern.test(text))?.[0] ?? "chicken";
}

function productSearchText(
  product: ExtractedProduct,
  config: ScrapeTarget,
  productUrl: string,
  vendorName: string
) {
  return [
    product.name,
    product.description,
    product.category,
    product.foodType,
    productUrl,
    vendorName,
    config.vendorName,
    config.category,
  ]
    .filter(Boolean)
    .join(" ");
}

function inferOrganicStatus(
  product: ExtractedProduct,
  config: ScrapeTarget,
  productUrl: string,
  vendorName: string
) {
  const searchText = productSearchText(product, config, productUrl, vendorName);
  const hasPositiveSignal = organicPositivePatterns.some((pattern) => pattern.test(searchText));
  const hasNegativeSignal = organicNegativePatterns.some((pattern) => pattern.test(searchText));

  if (hasPositiveSignal) return true;
  if (hasNegativeSignal) return false;

  return product.isOrganic === true;
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

async function scrapeProductPageFallback(config: ScrapeTarget): Promise<ExtractedProduct | null> {
  try {
    const response = await fetch(config.url, {
      headers: {
        accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "accept-language": "en-US,en;q=0.9,bn;q=0.8",
        "user-agent":
          "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
      },
    });

    if (!response.ok) {
      console.error(`HTML fallback failed for ${config.url}. Status code: ${response.status}`);
      return null;
    }

    const html = await response.text();
    const title = extractFirstHtmlMatch(html, /<title[^>]*>([\s\S]*?)<\/title>/i);
    const heading = extractFirstHtmlMatch(html, /<h1[^>]*>([\s\S]*?)<\/h1>/i);
    const metaTitle = extractMetaContent(html, "og:title");
    const name = heading ?? metaTitle ?? title?.replace(/\s*[-|].*$/, "");
    const price = extractPriceFromHtml(html);

    if (!name || !price) {
      console.error(`HTML fallback could not identify a product name and price for ${config.url}`);
      return null;
    }

    const description =
      extractMetaContent(html, "description") ??
      extractMetaContent(html, "og:description") ??
      extractFirstHtmlMatch(html, /<div[^>]+class=["'][^"']*(?:description|product__description)[^"']*["'][^>]*>([\s\S]*?)<\/div>/i);
    const imageUrl =
      extractMetaContent(html, "og:image") ??
      extractMetaContent(html, "twitter:image");
    const category = inferCategoryFromText(`${name} ${description ?? ""}`, config.category);
    const packageInfo = extractPackageFromText(name);

    return {
      name,
      description,
      price,
      vendor: config.vendorName || new URL(config.url).hostname,
      url: config.url,
      category,
      packageSize: packageInfo.packageSize,
      packageUnit: packageInfo.packageUnit,
      imageUrl,
      inStock: !/(sold\s*out|out\s+of\s+stock|stock\s+out)/i.test(cleanText(html) ?? ""),
    };
  } catch (error) {
    console.error(`HTML fallback failed for ${config.url}:`, error);
    return null;
  }
}

function extractedProductsFromResult(extract: ProductScrapeResponse["extract"]) {
  if (!extract) return [];
  if ("products" in extract) return extract.products;
  return [extract];
}

async function upsertProduct(data: ExtractedProduct, config: ScrapeTarget) {
  const productUrl = normalizeProductUrl(data.url || config.url, config.url);
  const category = normalizeCategorySlug(data.category || config.category);
  const categoryRecord = await findOrCreateCategory(category);
  const vendorName = data.vendor || config.vendorName || new URL(config.url).hostname;
  const vendorRecord = await findOrCreateVendor(vendorName, productUrl, category);
  const profile = profileForCategory(category, data.name);
  const normalizedPrices = normalizePrices(data, category);
  const isOrganic = inferOrganicStatus(data, config, productUrl, vendorName);

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
        sourceConfigId: config.id ?? existing[0].sourceConfigId,
        categoryId: categoryRecord.id,
        category,
        foodType: data.foodType || profile?.foodType,
        packageSize: normalizedPrices.packageSize,
        packageUnit: normalizedPrices.packageUnit,
        normalizedPricePerKg: normalizedPrices.normalizedPricePerKg,
        normalizedPricePerUnit: normalizedPrices.normalizedPricePerUnit,
        imageUrl: data.imageUrl,
        isOrganic,
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

    return { ...data, url: productUrl, category, foodType: data.foodType || profile?.foodType, isOrganic, status: "updated" };
  }

  const inserted = await db.insert(products).values({
    name: data.name,
    description: data.description,
    price: data.price,
    vendor: vendorName,
    vendorId: vendorRecord.id,
    sourceConfigId: config.id ?? null,
    categoryId: categoryRecord.id,
    category,
    foodType: data.foodType || profile?.foodType,
    url: productUrl,
    packageSize: normalizedPrices.packageSize,
    packageUnit: normalizedPrices.packageUnit,
    normalizedPricePerKg: normalizedPrices.normalizedPricePerKg,
    normalizedPricePerUnit: normalizedPrices.normalizedPricePerUnit,
    imageUrl: data.imageUrl,
    isOrganic,
    inStock: data.inStock ?? true,
    nutritionVerified: Boolean(profile),
  }).returning();

  await db.insert(priceHistory).values({
    productId: inserted[0].id,
    price: data.price,
  });

  return { ...data, url: productUrl, category, foodType: data.foodType || profile?.foodType, isOrganic, status: "inserted" };
}

async function scrapeTargets(configs: ScrapeTarget[], updateConfigTimestamps: boolean) {
  const results = [];

  for (const config of configs) {
    console.log(`Scraping URL: ${config.url}`);
    try {
      const isCollectionPage = config.sourceType === "collection_page";
      let scrapeResult: ProductScrapeResponse | null = null;

      try {
        scrapeResult = await firecrawl.scrapeUrl(config.url, {
          formats: ["extract"],
          extract: {
            prompt: isCollectionPage
              ? `Extract product cards from this collection page. For each product, return name, brief description when available, price as an integer in Tk, vendor name, product URL, image URL, category, foodType, packageSize, packageUnit, stock status, and whether the product is explicitly labeled organic. Default category is ${config.category || "chicken"} and default vendor is ${config.vendorName || "the source website"}.`
              : `Extract the product name, description, price as an integer in Tk, vendor name, product URL, image URL, category, foodType, packageSize, packageUnit, stock status, and whether the product is explicitly labeled organic from this product page. Default category is ${config.category || "chicken"} and default vendor is ${config.vendorName || "the source website"}.`,
            schema: isCollectionPage ? productCollectionExtractSchema : productExtractSchema,
          }
        });
      } catch (error) {
        console.error(`Firecrawl failed for ${config.url}:`, error);
      }

      let extractedProducts = scrapeResult?.success
        ? extractedProductsFromResult(scrapeResult.extract)
        : [];

      if (extractedProducts.length === 0 && !isCollectionPage) {
        const fallbackProduct = await scrapeProductPageFallback(config);
        if (fallbackProduct) {
          extractedProducts = [fallbackProduct];
        }
      }

      if (extractedProducts.length === 0) {
        if (scrapeResult && !scrapeResult.success) {
          console.error(`Failed to scrape ${config.url}:`, scrapeResult.error);
        }
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
