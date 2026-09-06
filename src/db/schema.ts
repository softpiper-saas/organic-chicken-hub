import { pgTable, uuid, text, integer, boolean, timestamp } from "drizzle-orm/pg-core";

export const productCategories = pgTable("product_categories", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const vendors = pgTable("vendors", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  url: text("url").notNull().unique(),
  category: text("category"),
  deliveryArea: text("delivery_area"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const scrapingConfigs = pgTable("scraping_configs", {
  id: uuid("id").defaultRandom().primaryKey(),
  url: text("url").notNull().unique(),
  vendorName: text("vendor_name"),
  category: text("category").default("chicken"),
  sourceType: text("source_type").default("product_page"),
  isActive: boolean("is_active").default(true),
  lastScrapedAt: timestamp("last_scraped_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const products = pgTable("products", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  price: integer("price").notNull(), // Price in cents or smallest unit, or just raw integer
  vendor: text("vendor").notNull(),
  vendorId: uuid("vendor_id").references(() => vendors.id),
  sourceConfigId: uuid("source_config_id").references(() => scrapingConfigs.id),
  url: text("url").notNull().unique(),
  categoryId: uuid("category_id").references(() => productCategories.id),
  category: text("category").default("chicken"),
  foodType: text("food_type"),
  packageSize: integer("package_size"),
  packageUnit: text("package_unit"),
  normalizedPricePerKg: integer("normalized_price_per_kg"),
  normalizedPricePerUnit: integer("normalized_price_per_unit"),
  imageUrl: text("image_url"),
  isOrganic: boolean("is_organic").default(true),
  inStock: boolean("in_stock").default(true),
  nutritionVerified: boolean("nutrition_verified").default(false),
  lastScrapedAt: timestamp("last_scraped_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const priceHistory = pgTable("price_history", {
  id: uuid("id").defaultRandom().primaryKey(),
  productId: uuid("product_id").references(() => products.id).notNull(),
  price: integer("price").notNull(),
  recordedAt: timestamp("recorded_at").defaultNow(),
});

export const reviews = pgTable("reviews", {
  id: uuid("id").defaultRandom().primaryKey(),
  vendor: text("vendor").notNull(),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  createdAt: timestamp("created_at").defaultNow(),
});
