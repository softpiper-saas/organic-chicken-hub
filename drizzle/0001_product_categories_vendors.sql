CREATE TABLE "product_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "product_categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "vendors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"url" text NOT NULL,
	"category" text,
	"delivery_area" text,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "vendors_url_unique" UNIQUE("url")
);
--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "vendor_id" uuid;
--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "category_id" uuid;
--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "category" text DEFAULT 'chicken';
--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "food_type" text;
--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "package_size" integer;
--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "package_unit" text;
--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "normalized_price_per_kg" integer;
--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "normalized_price_per_unit" integer;
--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "in_stock" boolean DEFAULT true;
--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "nutrition_verified" boolean DEFAULT false;
--> statement-breakpoint
ALTER TABLE "scraping_configs" ADD COLUMN "vendor_name" text;
--> statement-breakpoint
ALTER TABLE "scraping_configs" ADD COLUMN "category" text DEFAULT 'chicken';
--> statement-breakpoint
ALTER TABLE "scraping_configs" ADD COLUMN "source_type" text DEFAULT 'product_page';
--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_category_id_product_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."product_categories"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
INSERT INTO "product_categories" ("name", "slug", "description") VALUES
	('Chicken', 'chicken', 'Chicken and poultry products'),
	('Egg', 'egg', 'Egg products'),
	('Fish', 'fish', 'Fish and seafood products'),
	('Lentil', 'lentil', 'Dal, lentils, and pulses'),
	('Nuts', 'nuts', 'Nuts and nut products'),
	('Seeds', 'seeds', 'Seeds and seed mixes'),
	('Dairy', 'dairy', 'Milk, yogurt, and other dairy products'),
	('Beef', 'beef', 'Beef products')
ON CONFLICT ("slug") DO NOTHING;
