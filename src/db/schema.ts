import { pgTable, uuid, text, integer, boolean, timestamp } from "drizzle-orm/pg-core";

export const products = pgTable("products", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  price: integer("price").notNull(), // Price in cents or smallest unit, or just raw integer
  vendor: text("vendor").notNull(),
  url: text("url").notNull(),
  imageUrl: text("image_url"),
  isOrganic: boolean("is_organic").default(true),
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
