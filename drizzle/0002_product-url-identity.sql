ALTER TABLE "products" ADD COLUMN "source_config_id" uuid;
--> statement-breakpoint
UPDATE "products"
SET "url" = regexp_replace(split_part(split_part(trim("url"), '#', 1), '?', 1), '/$', '')
WHERE "url" IS NOT NULL;
--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_source_config_id_scraping_configs_id_fk" FOREIGN KEY ("source_config_id") REFERENCES "public"."scraping_configs"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_url_unique" UNIQUE("url");
